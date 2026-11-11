/**
 * scripts/generate-listening-audio.ts
 *
 * Generates real TTS audio files for all listening questions in the database.
 * Uses z-ai-web-dev-sdk TTS to create WAV audio from the question passage text.
 */

import { PrismaClient } from "@prisma/client";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const db = new PrismaClient();
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "listening");

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log(`Audio directory: ${AUDIO_DIR}\n`);

  const zai = await ZAI.create();

  const listeningQuestions = await db.question.findMany({
    where: {
      section: "LISTENING",
      passage: { not: null },
    },
    include: {
      practiceSet: { include: { examType: true } },
    },
  });

  console.log(`Found ${listeningQuestions.length} listening questions needing audio\n`);

  let generated = 0;
  let failed = 0;
  let skipped = 0;

  for (const q of listeningQuestions) {
    if (!q.passage || q.passage.length < 20) {
      skipped++;
      continue;
    }

    const examCode = q.practiceSet.examType?.code || "GENERIC";
    const filename = `${examCode}-${q.id}.wav`;
    const filepath = path.join(AUDIO_DIR, filename);
    const audioUrl = `/audio/listening/${filename}`;

    if (fs.existsSync(filepath)) {
      skipped++;
      // Update DB if audioUrl not set
      if (!q.audioUrl) {
        await db.question.update({ where: { id: q.id }, data: { audioUrl } });
      }
      continue;
    }

    try {
      const text = q.passage.substring(0, 1000);
      const response = await zai.audio.tts.create({
        input: text,
        voice: "xiaochen",
        speed: 0.95,
        response_format: "wav",
        stream: false,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      if (buffer.length === 0) throw new Error("Empty audio buffer");

      fs.writeFileSync(filepath, buffer);
      await db.question.update({ where: { id: q.id }, data: { audioUrl } });

      generated++;
      if (generated % 10 === 0) console.log(`✅ ${generated} generated, ${failed} failed, ${skipped} skipped`);
    } catch (err) {
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`  AUDIO GENERATION COMPLETE`);
  console.log(`  Generated: ${generated}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Total:     ${listeningQuestions.length}`);
  console.log(`════════════════════════════════════════`);

  const withAudio = await db.question.count({ where: { section: "LISTENING", audioUrl: { not: null } } });
  console.log(`\nListening questions with audio: ${withAudio}/${listeningQuestions.length}`);
}

main().then(() => db.$disconnect()).catch((e) => {
  console.error("Fatal:", e);
  db.$disconnect();
  process.exit(1);
});
