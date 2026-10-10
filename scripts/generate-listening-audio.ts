/**
 * scripts/generate-listening-audio.ts
 *
 * Generates REAL audio files for every listening question using TTS.
 *
 * alfaielts.com plays actual audio recordings — we were faking it with
 * text transcripts. This script fixes that by generating real WAV audio
 * for every listening passage and storing the audioUrl in the database.
 *
 * Usage: bun run scripts/generate-listening-audio.ts
 */

import { PrismaClient } from "@prisma/client";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const db = new PrismaClient();
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "listening");

async function main() {
  // Ensure audio directory exists
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log(`Audio directory: ${AUDIO_DIR}\n`);

  // Initialize ZAI SDK
  const zai = await ZAI.create();

  // Fetch all listening questions that have a passage (transcript) but no audioUrl
  const listeningQuestions = await db.question.findMany({
    where: {
      section: "LISTENING",
      passage: { not: null },
      audioUrl: null,
    },
    include: {
      practiceSet: { include: { examType: true } },
    },
  });

  console.log(`Found ${listeningQuestions.length} listening questions needing audio\n`);

  let generated = 0;
  let failed = 0;

  for (const q of listeningQuestions) {
    if (!q.passage || q.passage.length < 20) {
      console.log(`⏭️  Skipping ${q.id} — passage too short`);
      continue;
    }

    const examCode = q.practiceSet.examType?.code || "GENERIC";
    const filename = `${examCode}-${q.id}.wav`;
    const filepath = path.join(AUDIO_DIR, filename);
    const audioUrl = `/audio/listening/${filename}`;

    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Audio exists: ${filename}`);
      await db.question.update({
        where: { id: q.id },
        data: { audioUrl },
      });
      continue;
    }

    try {
      // Truncate text to TTS limit (1024 chars)
      const text = q.passage.substring(0, 1000);

      // Generate audio via TTS
      const response = await zai.audio.tts.create({
        input: text,
        voice: "xiaochen", // professional female voice
        speed: 0.95, // slightly slower for listening practice
        response_format: "wav",
        stream: false,
      });

      // Convert to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      if (buffer.length === 0) {
        throw new Error("Empty audio buffer");
      }

      // Save file
      fs.writeFileSync(filepath, buffer);

      // Update database with audioUrl
      await db.question.update({
        where: { id: q.id },
        data: { audioUrl },
      });

      generated++;
      console.log(`✅ ${examCode} | ${q.id} | ${buffer.length} bytes | ${text.substring(0, 50)}...`);
    } catch (err) {
      failed++;
      console.error(`❌ ${examCode} | ${q.id} | ${err instanceof Error ? err.message : "Unknown error"}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`  AUDIO GENERATION COMPLETE`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${listeningQuestions.length}`);
  console.log(`════════════════════════════════════════`);

  // Verify
  const withAudio = await db.question.count({
    where: { section: "LISTENING", audioUrl: { not: null } },
  });
  const totalListening = await db.question.count({
    where: { section: "LISTENING" },
  });
  console.log(`\nListening questions with audio: ${withAudio}/${totalListening}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error("Fatal error:", e);
    db.$disconnect();
    process.exit(1);
  });
