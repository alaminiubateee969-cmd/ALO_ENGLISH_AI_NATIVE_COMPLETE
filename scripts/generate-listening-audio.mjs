/**
 * scripts/generate-listening-audio.mjs
 *
 * Generate original listening audio assets at BUILD TIME using edge-tts
 * (free, open-source Microsoft Edge TTS — no paid API key).
 *
 * For every LISTENING question in the database that has a passage (audio script)
 * but no audioUrl, this script generates an MP3 file under public/audio/listening/
 * and updates the question's audioUrl field.
 *
 * The scripts are 100% original exam-aligned content authored for ALO English.
 * No copyrighted material is reproduced.
 *
 * Usage:
 *   node scripts/generate-listening-audio.mjs
 *
 * Requires:
 *   - DATABASE_URL set
 *   - edge-tts installed (npm run audio:install-deps handles this)
 *   - Internet access (edge-tts calls Microsoft's free TTS endpoint)
 *
 * Idempotent: existing audio files are not regenerated.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AUDIO_DIR = join(ROOT, 'public', 'audio', 'listening');
const SCRIPT_DIR = join(ROOT, '.audio-scripts');

const VOICES = [
  'en-US-GuyNeural',
  'en-US-JennyNeural',
  'en-GB-RyanNeural',
  'en-GB-SoniaNeural',
  'en-AU-NatashaNeural',
];

function pickVoice(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return VOICES[h % VOICES.length];
}

async function generateAudio(id, script, outPath) {
  const voice = pickVoice(id);
  const scriptPath = join(SCRIPT_DIR, `${id}.txt`);
  mkdirSync(SCRIPT_DIR, { recursive: true });
  writeFileSync(scriptPath, script, 'utf8');

  try {
    execSync(
      `edge-tts --voice "${voice}" --file "${scriptPath}" --write-media "${outPath}"`,
      { stdio: 'pipe', timeout: 60000 }
    );
    return true;
  } catch (err) {
    console.error(`  ✗ Failed to generate audio for ${id}:`, err.message?.slice(0, 200));
    return false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  // Check edge-tts
  try {
    execSync('which edge-tts', { stdio: 'pipe' });
  } catch {
    console.log('edge-tts not found, installing...');
    try {
      execSync('pip install --break-system-packages edge-tts 2>&1 || pip install edge-tts 2>&1', { stdio: 'inherit' });
    } catch (err) {
      console.error('Could not install edge-tts:', err.message);
      process.exit(1);
    }
  }

  mkdirSync(AUDIO_DIR, { recursive: true });

  // Dynamically import Prisma client
  const { PrismaClient } = await import('../node_modules/@prisma/client/index.js');
  const prisma = new PrismaClient();

  try {
    const listeningQuestions = await prisma.question.findMany({
      where: {
        section: 'LISTENING',
        passage: { not: null },
      },
      select: { id: true, passage: true, audioUrl: true },
    });

    console.log(`Found ${listeningQuestions.length} listening questions with scripts`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const q of listeningQuestions) {
      const fileName = `${q.id}.mp3`;
      const relPath = `/audio/listening/${fileName}`;
      const outPath = join(AUDIO_DIR, fileName);

      if (q.audioUrl && existsSync(join(ROOT, q.audioUrl))) {
        skipped++;
        continue;
      }

      if (existsSync(outPath)) {
        // File exists but DB not updated
        await prisma.question.update({
          where: { id: q.id },
          data: { audioUrl: relPath },
        });
        skipped++;
        continue;
      }

      const ok = await generateAudio(q.id, q.passage || '', outPath);
      if (ok && existsSync(outPath)) {
        const stat = existsSync(outPath);
        const size = stat ? (await import('node:fs/promises')).stat(outPath).then(s => s.size).catch(() => 0) : 0;
        if (size > 1000) {
          await prisma.question.update({
            where: { id: q.id },
            data: { audioUrl: relPath },
          });
          generated++;
          console.log(`  ✓ ${q.id}`);
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    console.log(`\nAudio generation complete: ${generated} generated, ${skipped} skipped, ${failed} failed`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
