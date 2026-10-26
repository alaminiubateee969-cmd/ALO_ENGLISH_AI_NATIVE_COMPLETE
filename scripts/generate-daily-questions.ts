/**
 * scripts/generate-daily-questions.ts
 *
 * The original daily question-generation entry point.
 *
 * It used to write hard-coded template content straight into live practice
 * sets with no review gate, which is why it was disabled. It now refuses to
 * do that, and points at the pipeline that replaced it.
 *
 * THE REPLACEMENT
 * ───────────────
 * The daily pipeline is `scripts/daily-question-pipeline.mjs`, driven by the
 * Question Generation and Question Quality Gate agents. It produces original,
 * blueprint-aligned drafts, checks them, and raises them for human approval.
 * It never publishes anything by itself.
 *
 * Run:  npm run agents:daily
 *
 * This file remains as the named entry point because CI, the Makefile and
 * existing operator runbooks refer to it. It performs no database writes.
 */

console.error(
  "BLOCKED: this script no longer generates content. Automatic generation into live " +
    "practice sets without a review gate is not permitted, and the hard-coded templates it " +
    "used to write have been removed.\n" +
    "Use the reviewed pipeline instead:\n" +
    "  npm run agents:daily\n" +
    "It drives the Question Generation and Question Quality Gate agents, which produce " +
    "original drafts, check them, and raise them for a human approval. Nothing is published " +
    "until an administrator approves it.",
);
process.exitCode = 1;
