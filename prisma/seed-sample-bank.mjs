#!/usr/bin/env node
/**
 * prisma/seed-sample-bank.mjs — run the guarded synthetic sample seeds in order.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The CI pipeline used to seed only the admin account, the exam types, the
 * settings and the RBAC tables, then run `npm run content:validate` — a gate
 * that refuses to pass on an empty question bank. Nothing in the chain ever
 * inserted a question, so the gate could never succeed and CI was red on the
 * default branch.
 *
 * The question seeders themselves are not the problem: they are deliberately
 * guarded (see prisma/seed-sample-guard.mjs) so that synthetic fixtures can
 * never be written into a production database. They are synthetic, unlicensed,
 * short-form development fixtures — not official, full-length exam material —
 * and they must only ever reach a disposable CI/test database.
 *
 * This script is the single place that knows the correct ORDER for them:
 *
 *   1. seed-ielts-questions.ts   wipes the question + practice-set tables and
 *                                 rebuilds the IELTS set. It must run FIRST or
 *                                 it would delete everything the later scripts
 *                                 added.
 *   2. seed-all-exams.ts         TOEFL / PTE / Duolingo fixtures.
 *   3. seed-all-missing-exams.ts the remaining exam types.
 *   4. seed-expand-exams.ts      extends the sets created above.
 *   5. seed-gre-gmat-sat-act.ts  GRE / GMAT / SAT / ACT / ALO placement.
 *
 * `prisma/seed-questions.ts` is deliberately NOT part of this chain: it
 * declares a second, shorter set of fixtures for exams that steps 2 and 3
 * already cover, which produces duplicate prompts for the same content.
 *
 * Run:  node prisma/seed-sample-bank.mjs
 * Requires: ALLOW_SYNTHETIC_SAMPLE_QUESTIONS=1, NODE_ENV != production, and a
 * DATABASE_URL whose SQLite filename contains ci, test or sample. The guard
 * enforces all three and refuses to run otherwise.
 * Exit: 0 when every step succeeded, 1 on the first failure.
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertSafeSampleSeedTarget } from "./seed-sample-guard.mjs";

// Throws (and exits non-zero) unless this is an explicitly opted-in disposable
// database. Every child script re-checks the same guard on its own.
assertSafeSampleSeedTarget();

const HERE = dirname(fileURLToPath(import.meta.url));

/** Ordered list of the guarded sample seeders. */
const SEEDS = [
  "seed-ielts-questions.ts",
  "seed-all-exams.ts",
  "seed-all-missing-exams.ts",
  "seed-expand-exams.ts",
  "seed-gre-gmat-sat-act.ts",
];

console.log(`Seeding the synthetic sample question bank (${SEEDS.length} steps)…\n`);

for (const seed of SEEDS) {
  const file = join(HERE, seed);
  console.log(`── ${seed} ${"─".repeat(Math.max(0, 58 - seed.length))}`);

  const result = spawnSync(process.execPath, [file], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(`\n✗ ${seed} could not be started: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${seed} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n✅ Sample question bank seeded.");
console.log(
  "   Reminder: this content is synthetic and unlicensed. It exists so the CI " +
    "content gate and the exam engine have something to verify against — it is " +
    "not official or full-length exam material.",
);
