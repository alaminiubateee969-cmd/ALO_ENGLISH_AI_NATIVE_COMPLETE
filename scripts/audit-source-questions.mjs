#!/usr/bin/env node
/** Audit every declaration in src/lib/question-bank.ts without touching a database. */
import { writeFileSync } from "node:fs";
import {
  EXAM_CODE_MAP,
  convertSourceQuestion,
  loadSourceQuestions,
  normalizePrompt,
} from "./lib/question-bank-tools.mjs";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output");
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
const questions = await loadSourceQuestions();
const ids = new Set();
const prompts = new Map();
const byExam = {};
const byType = {};
const items = [];
let eligible = 0;

for (const [index, source] of questions.entries()) {
  const { question, issues } = convertSourceQuestion(source, index);
  const id = String(source.id ?? "");
  if (ids.has(id)) issues.push("duplicate source id");
  ids.add(id);
  const examTypeCode = EXAM_CODE_MAP[source.examType] ?? null;
  if (!examTypeCode) issues.push(`no production ExamType mapping for ${source.examType}`);
  const promptKey = `${examTypeCode}:${normalizePrompt(source.prompt)}`;
  if (prompts.has(promptKey)) issues.push(`duplicate normalized prompt with ${prompts.get(promptKey)}`);
  prompts.set(promptKey, id);
  if (!source.explanation?.trim()) issues.push("missing explanation/review rationale");
  if (!Number.isInteger(source.timeSeconds) || source.timeSeconds <= 0) issues.push("invalid timeSeconds");

  const structurallyEligible = issues.length === 0;
  if (structurallyEligible) eligible += 1;
  byExam[examTypeCode ?? source.examType] = (byExam[examTypeCode ?? source.examType] ?? 0) + 1;
  byType[source.type] = (byType[source.type] ?? 0) + 1;
  items.push({
    id,
    sourceExamType: source.examType,
    examTypeCode,
    sourceType: source.type,
    canonicalType: question.type,
    section: question.section,
    structurallyEligible,
    issues: [...new Set(issues)],
    originality: "UNVERIFIED — source header is an assertion, not independent evidence",
    humanReview: "MISSING — no per-question approval record",
    publishable: false,
  });
}

const report = {
  auditVersion: 1,
  source: "src/lib/question-bank.ts",
  databaseWrites: 0,
  summary: {
    declarations: questions.length,
    uniqueIds: ids.size,
    structurallyEligible: eligible,
    structurallyRejected: questions.length - eligible,
    publishable: 0,
    blockedReason: "No independent originality evidence or named per-question human approval exists.",
  },
  byExam,
  byType,
  items,
};

if (outputPath) writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log("Source question-bank audit (read-only)");
console.log(`  declarations: ${report.summary.declarations}`);
console.log(`  unique IDs: ${report.summary.uniqueIds}`);
console.log(`  structurally eligible after conservative conversion: ${eligible}`);
console.log(`  structurally rejected: ${report.summary.structurallyRejected}`);
console.log("  originality/human review: BLOCKED for every item");
console.log("  publishable now: 0");
console.log("  database writes: 0");
for (const item of items.filter((item) => !item.structurallyEligible)) {
  console.log(`  REJECT ${item.id}: ${item.issues.join("; ")}`);
}
if (outputPath) console.log(`  full per-item report: ${outputPath}`);

// This is a release gate, not an informational command that can pass while
// unsupported or unkeyed source declarations are presented as importable.
process.exitCode = report.summary.structurallyRejected > 0 ? 1 : 0;
