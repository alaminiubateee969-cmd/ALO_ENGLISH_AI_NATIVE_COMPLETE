/**
 * scripts/generate-daily-questions.ts — Cron job for daily question generation.
 *
 * Run this script daily to generate fresh questions for each exam type.
 * Uses the QuestionGeneratorAgent (AGENT-QGEN-01).
 *
 * Usage:
 *   bun run scripts/generate-daily-questions.ts
 *
 * Cron (run at 2 AM daily):
 *   0 2 * * * cd /opt/alo-english/current && bun run scripts/generate-daily-questions.ts >> shared/logs/daily-questions.log 2>&1
 */

import { generateAllDailyQuestions } from '../src/lib/agents/QuestionGeneratorAgent';

async function main() {
  await generateAllDailyQuestions();
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Daily question generation failed:', e);
  process.exit(1);
});
