import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { inspectMp3Buffer, MAX_MP3_BYTES, MIN_MP3_BYTES, resolvePublicListeningFile, safeAudioError } from './listening-audio-utils.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const MAX_REMOTE_SAMPLE_BYTES = 512 * 1024;

function allowedHosts(baseUrl) {
  const base = new URL(baseUrl);
  return new Set([
    base.hostname.toLowerCase(),
    ...(process.env.AUDIO_ALLOWED_HOSTS || '').split(',').map((host) => host.trim().toLowerCase()).filter(Boolean),
  ]);
}

function ensureAllowedRemoteUrl(value, hosts) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Audio delivery URL must use HTTPS');
  if (url.username || url.password) throw new Error('Audio URL must not include credentials');
  if (!hosts.has(url.hostname.toLowerCase())) throw new Error(`Host ${url.hostname} is not in AUDIO_ALLOWED_HOSTS`);
  return url;
}

async function readBoundedPrefix(response, maxBytes) {
  if (!response.body) throw new Error('Audio response has no body');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      const remaining = maxBytes - total;
      const selected = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
      chunks.push(selected);
      total += selected.length;
      if (selected.length < chunk.length) break;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks, total);
}

async function verifyPublicUrl(value, hosts) {
  const url = ensureAllowedRemoteUrl(value, hosts);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Range: `bytes=0-${MAX_REMOTE_SAMPLE_BYTES - 1}` },
      redirect: 'manual',
      signal: controller.signal,
    });
    if (response.status !== 200 && response.status !== 206) {
      await response.body?.cancel().catch(() => {});
      throw new Error(`HTTP ${response.status} while fetching audio`);
    }
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!['audio/mpeg', 'audio/mp3'].includes(contentType)) {
      await response.body?.cancel().catch(() => {});
      throw new Error(`Unexpected Content-Type: ${contentType || '(missing)'}`);
    }

    let totalBytes;
    if (response.status === 206) {
      const contentRange = response.headers.get('content-range') || '';
      const match = contentRange.match(/^bytes\s+0-\d+\/(\d+)$/i);
      if (!match) {
        await response.body?.cancel().catch(() => {});
        throw new Error('Partial response omitted a valid Content-Range total');
      }
      totalBytes = Number(match[1]);
    } else {
      totalBytes = Number(response.headers.get('content-length'));
    }
    if (!Number.isSafeInteger(totalBytes) || totalBytes < MIN_MP3_BYTES || totalBytes > MAX_MP3_BYTES) {
      await response.body?.cancel().catch(() => {});
      throw new Error(`Invalid or unavailable remote file size: ${Number.isFinite(totalBytes) ? totalBytes : 'unknown'} bytes`);
    }

    const prefix = await readBoundedPrefix(response, MAX_REMOTE_SAMPLE_BYTES);
    const sample = inspectMp3Buffer(prefix, { minBytes: MIN_MP3_BYTES, maxBytes: MAX_REMOTE_SAMPLE_BYTES });
    if (!sample.valid) throw new Error(`Remote bytes are not a valid MP3 prefix: ${sample.reason}`);
    return { valid: true, mimeType: contentType, byteSize: totalBytes };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyQuestionAudio(question, baseUrl, hosts, publicDir = PUBLIC_DIR) {
  if (!question.audioUrl) throw new Error('audioUrl is NULL');
  let targetUrl;
  try {
    targetUrl = new URL(question.audioUrl, baseUrl).href;
  } catch {
    throw new Error('audioUrl is not a valid URL or public path');
  }

  const localPath = resolvePublicListeningFile(question.audioUrl, publicDir, baseUrl);
  let localMetadata = null;
  if (localPath) {
    const fileInfo = await stat(localPath).catch((error) => {
      if (error?.code === 'ENOENT') throw new Error(`Public asset is missing: ${localPath}`);
      throw error;
    });
    if (!fileInfo.isFile()) throw new Error('Public asset path is not a regular file');
    if (fileInfo.size < MIN_MP3_BYTES || fileInfo.size > MAX_MP3_BYTES) {
      throw new Error(`Local file size outside accepted range: ${fileInfo.size} bytes`);
    }
    const buffer = await readFile(localPath);
    if (buffer.length !== fileInfo.size) throw new Error('Local file changed while being read');
    localMetadata = inspectMp3Buffer(buffer);
    if (!localMetadata.valid) throw new Error(`Local file failed MP3 validation: ${localMetadata.reason}`);
  }

  const remoteMetadata = await verifyPublicUrl(targetUrl, hosts);
  if (localMetadata && localMetadata.byteSize !== remoteMetadata.byteSize) {
    throw new Error(`Public delivery size (${remoteMetadata.byteSize}) differs from local asset size (${localMetadata.byteSize})`);
  }
  return {
    mimeType: remoteMetadata.mimeType,
    byteSize: remoteMetadata.byteSize,
    sha256: localMetadata?.sha256 ?? null,
    location: question.audioUrl,
  };
}

async function upsertAsset(prisma, questionId, data) {
  await prisma.questionAudioAsset.upsert({
    where: { questionId },
    create: { questionId, ...data },
    update: data,
  });
}

export async function runAudioVerification(prisma, { baseUrl = process.env.AUDIO_PUBLIC_BASE_URL, publicDir = PUBLIC_DIR } = {}) {
  if (!baseUrl) throw new Error('Set AUDIO_PUBLIC_BASE_URL to the public domain whose media delivery is being verified');
  const parsedBase = new URL(baseUrl);
  if (parsedBase.protocol !== 'https:') throw new Error('AUDIO_PUBLIC_BASE_URL must use HTTPS');
  const hosts = allowedHosts(baseUrl);

  const questions = await prisma.question.findMany({
    where: { section: 'LISTENING', practiceSet: { isActive: true } },
    select: { id: true, audioUrl: true, passage: true, practiceSet: { select: { title: true } } },
    orderBy: [{ practiceSetId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
  });
  const counts = { eligible: questions.length, verified: 0, failed: 0 };
  if (questions.length === 0) {
    console.error('No listening questions found in active practice sets; an empty bank is not a passing result.');
    return counts;
  }

  for (const question of questions) {
    try {
      const audio = await verifyQuestionAudio(question, baseUrl, hosts, publicDir);
      await upsertAsset(prisma, question.id, {
        status: 'READY',
        location: audio.location,
        mimeType: audio.mimeType,
        byteSize: audio.byteSize,
        sha256: audio.sha256,
        lastError: null,
        verifiedAt: new Date(),
      });
      counts.verified += 1;
      console.log(`PASS ${question.id} ${audio.byteSize} bytes ${audio.mimeType} — ${question.practiceSet.title}`);
    } catch (error) {
      const message = safeAudioError(error);
      await upsertAsset(prisma, question.id, {
        status: 'FAILED',
        location: question.audioUrl,
        lastError: message,
        verifiedAt: null,
      });
      counts.failed += 1;
      console.error(`FAIL ${question.id}: ${message}`);
    }
  }
  console.log(`Audio coverage verification: ${counts.verified}/${counts.eligible} verified; ${counts.failed} failed at ${parsedBase.origin}`);
  return counts;
}

export async function main() {
  if (process.env.AUDIO_VERIFY_CONFIRM !== 'YES') {
    throw new Error('Set AUDIO_VERIFY_CONFIRM=YES after confirming DATABASE_URL and AUDIO_PUBLIC_BASE_URL target the intended environment.');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  let prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    const result = await runAudioVerification(prisma);
    if (result.eligible === 0 || result.failed > 0) process.exitCode = 1;
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error('[audio:verify] blocked/failed:', safeAudioError(error));
    process.exitCode = 1;
  });
}
