/**
 * Deprecated daily question-generation entry point.
 *
 * Automatic generation was disabled because the previous script wrote
 * hard-coded template content into live practice sets without a review gate.
 * It intentionally performs no database writes.
 */

console.error(
  'BLOCKED: automatic daily question generation is disabled. No content was created. ' +
  'Use authorized source material and the reviewed admin content workflow.',
);
process.exitCode = 1;
