/**
 * scripts/generate-listening-audio.mjs
 *
 * Generate original listening assets with edge-tts and persist only audio that
 * passes an MP3 signature/size check. Generation is resumable: existing valid
 * local files are recovered into the database without regeneration, and each
 * question's state/error is stored in QuestionAudioAsset.
 *
 * Usage: DATABASE_URL=<safe database> npm run audio:generate
 * Requires `edge-tts` (`npm run audio:install-deps`) and outbound access to
 * Microsoft's Edge TTS service. This does not verify public-domain playback;
 * run `npm run audio:verify` against an explicit deployment target for that.
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MAX_MP3_BYTES, MIN_MP3_BYTES, inspectMp3Buffer, resolvePublicListeningFile, safeAudioError } from './listening-audio-utils.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = fileURLToPath(new URL('../.audio-scripts/', import.meta.url));
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const AUDIO_DIR = join(PUBLIC_DIR, 'audio', 'listening');
const PUBLIC_ORIGIN = process.env.AUDIO_PUBLIC_ORIGIN || process.env.APP_URL || 'https://english.aloeducation.com';
const VOICES = [
  'en-US-GuyNeural',
  'en-US-JennyNeural',
  'en-GB-RyanNeural',
  'en-GB-SoniaNeural',
  'en-AU-NatashaNeural',
];

function pickVoice(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return VOICES[hash % VOICES.length];
}

function generatedUrl(id) {
  return `/audio/listening/${id}.mp3`;
}

async function inspectFile(filePath) {
  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) return { valid: false, reason: 'NOT_A_FILE', byteSize: fileInfo.size };
    if (fileInfo.size < MIN_MP3_BYTES) return { valid: false, reason: 'TOO_SMALL', byteSize: fileInfo.size };
    if (fileInfo.size > MAX_MP3_BYTES) return { valid: false, reason: 'TOO_LARGE', byteSize: fileInfo.size };
    const buffer = await readFile(filePath);
    if (buffer.length !== fileInfo.size) return { valid: false, reason: 'CHANGED_DURING_READ', byteSize: buffer.length };
    return inspectMp3Buffer(buffer);
  } catch (error) {
    return { valid: false, reason: error?.code === 'ENOENT' ? 'MISSING_FILE' : safeAudioError(error) };
  }
}

async function updateAssetStatus(prisma, questionId, data) {
  return prisma.questionAudioAsset.upsert({
    where: { questionId },
    create: { questionId, ...data },
    update: data,
  });
}

async function markReady(prisma, questionId, audioUrl, metadata, { voice = null, generated = false } = {}) {
  if (!metadata?.valid) throw new Error(`Refusing to persist invalid audio (${metadata?.reason || 'unknown validation error'})`);
  const verifiedAt = new Date();
  const assetData = {
    status: 'READY',
    location: audioUrl,
    mimeType: metadata.mimeType,
    byteSize: metadata.byteSize,
    sha256: metadata.sha256,
    voice,
    lastError: null,
    verifiedAt,
    ...(generated ? { generatedAt: verifiedAt } : {}),
  };
  await prisma.$transaction([
    prisma.question.update({ where: { id: questionId }, data: { audioUrl } }),
    prisma.questionAudioAsset.upsert({
      where: { questionId },
      create: { questionId, ...assetData },
      update: assetData,
    }),
  ]);
}

async function setGenerating(prisma, questionId) {
  const existing = await prisma.questionAudioAsset.findUnique({
    where: { questionId },
    select: { id: true },
  });
  if (existing) {
    await prisma.questionAudioAsset.update({
      where: { questionId },
      data: { status: 'GENERATING', attempts: { increment: 1 }, lastError: null },
    });
  } else {
    await prisma.questionAudioAsset.create({
      data: { questionId, status: 'GENERATING', attempts: 1, lastError: null },
    });
  }
}

async function setFailed(prisma, questionId, message) {
  const existing = await prisma.questionAudioAsset.findUnique({
    where: { questionId },
    select: { id: true },
  });
  const lastError = safeAudioError(message);
  if (existing) {
    await prisma.questionAudioAsset.update({
      where: { questionId },
      data: { status: 'FAILED', lastError, verifiedAt: null },
    });
  } else {
    await prisma.questionAudioAsset.create({
      data: { questionId, status: 'FAILED', lastError },
    });
  }
}

async function generateAudio(id, script, voice) {
  if (!/^[a-z0-9_-]+$/i.test(id)) throw new Error('Question id contains unsupported path characters');
  if (typeof script !== 'string' || script.trim().length < 20) throw new Error('Listening script is missing or too short to synthesize');

  await mkdir(SCRIPT_DIR, { recursive: true });
  await mkdir(AUDIO_DIR, { recursive: true });
  const suffix = `${process.pid}-${Date.now()}`;
  const scriptPath = join(SCRIPT_DIR, `${id}.${suffix}.txt`);
  const tempPath = join(AUDIO_DIR, `.${id}.${suffix}.partial.mp3`);
  await writeFile(scriptPath, script, { encoding: 'utf8', mode: 0o600 });

  try {
    await execFileAsync('edge-tts', [
      '--voice', voice,
      '--file', scriptPath,
      '--write-media', tempPath,
    ], { timeout: 60_000, maxBuffer: 1024 * 1024 });

    // File validation is awaited before either rename or database persistence.
    const metadata = await inspectFile(tempPath);
    if (!metadata.valid) {
      throw new Error(`Generated output failed MP3 validation: ${metadata.reason || 'invalid file'}`);
    }
    const fileInfo = await stat(tempPath);
    if (!fileInfo.isFile() || fileInfo.size !== metadata.byteSize) {
      throw new Error('Generated audio file changed during validation');
    }

    const finalPath = join(AUDIO_DIR, `${id}.mp3`);
    await rename(tempPath, finalPath);
    return { finalPath, metadata };
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    throw error;
  } finally {
    await rm(scriptPath, { force: true }).catch(() => {});
  }
}

async function processQuestion(prisma, question) {
  const { id, passage, audioUrl } = question;
  if (!/^[a-z0-9_-]+$/i.test(id)) {
    await setFailed(prisma, id, 'Question id contains unsupported path characters');
    return 'failed';
  }
  const defaultUrl = generatedUrl(id);
  const existingLocalPath = audioUrl
    ? resolvePublicListeningFile(audioUrl, PUBLIC_DIR, PUBLIC_ORIGIN)
    : null;

  // Do not rewrite an existing same-origin asset if it is structurally valid.
  if (existingLocalPath) {
    const existingMetadata = await inspectFile(existingLocalPath);
    if (existingMetadata.valid) {
      await markReady(prisma, id, audioUrl, existingMetadata);
      return 'skipped';
    }
  } else if (audioUrl && /^https?:\/\//i.test(audioUrl)) {
    // The generator must not guess that a remote URL is valid or replace it.
    // The dedicated verifier performs bounded remote checks from an allowed
    // deployment environment. Until then, this URL stays explicitly PENDING.
    await updateAssetStatus(prisma, id, {
      status: 'PENDING',
      location: audioUrl,
      lastError: 'Remote URL was not verified by the local generator; run npm run audio:verify.',
      verifiedAt: null,
    });
    return 'pending';
  }

  const outPath = join(AUDIO_DIR, `${id}.mp3`);
  const existingGeneratedMetadata = await inspectFile(outPath);
  if (existingGeneratedMetadata.valid) {
    await markReady(prisma, id, defaultUrl, existingGeneratedMetadata);
    return 'recovered';
  }

  if (!passage || passage.trim().length < 20) {
    await setFailed(prisma, id, 'No usable audio script (passage) is available.');
    return 'failed';
  }

  const voice = pickVoice(id);
  await setGenerating(prisma, id);
  try {
    const { metadata } = await generateAudio(id, passage, voice);
    // Question.audioUrl changes only after the final file has been atomically
    // installed and its MP3 signature, byte size and digest have been checked.
    await markReady(prisma, id, defaultUrl, metadata, { voice, generated: true });
    console.log(`  ✓ ${id} (${metadata.byteSize} bytes, ${voice})`);
    return 'generated';
  } catch (error) {
    const message = safeAudioError(error);
    await setFailed(prisma, id, message);
    console.error(`  ✗ ${id}: ${message}`);
    return 'failed';
  }
}

export async function runAudioGeneration(prisma) {
  await mkdir(AUDIO_DIR, { recursive: true });
  const questions = await prisma.question.findMany({
    where: { section: 'LISTENING', practiceSet: { isActive: true } },
    select: { id: true, passage: true, audioUrl: true },
    orderBy: [{ practiceSetId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
  });

  const counts = { eligible: questions.length, generated: 0, recovered: 0, skipped: 0, pending: 0, failed: 0 };
  console.log(`Checking ${questions.length} listening questions in active practice sets`);

  for (const question of questions) {
    const status = await processQuestion(prisma, question);
    counts[status] += 1;
  }

  console.log(
    `Audio generation summary: ${counts.generated} generated, ${counts.recovered} recovered, ` +
    `${counts.skipped} valid local assets retained, ${counts.pending} remote URLs pending verification, ` +
    `${counts.failed} failed (of ${counts.eligible} eligible questions).`,
  );
  return counts;
}

export async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required; point it to an explicitly chosen development or production database.');
  }

  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const counts = await runAudioGeneration(prisma);
    if (counts.failed > 0 || counts.pending > 0) process.exitCode = 1;
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error('[audio:generate] fatal error:', safeAudioError(error));
    process.exitCode = 1;
  });
}
