import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const QUESTION_TYPES = JSON.parse(
  readFileSync(join(ROOT, "src/lib/exam/question-types.json"), "utf8"),
);

export const INDEX_TYPES = new Set(QUESTION_TYPES.indexTypes);
export const TEXT_TYPES = new Set(QUESTION_TYPES.textTypes);
export const SET_TYPES = new Set(QUESTION_TYPES.setTypes);
export const SUBJECTIVE_TYPES = new Set(QUESTION_TYPES.subjectiveTypes);
export const ALL_TYPES = new Set([
  ...INDEX_TYPES,
  ...TEXT_TYPES,
  ...SET_TYPES,
  ...SUBJECTIVE_TYPES,
]);

/** Source TypeScript is content only. It is transpiled, never executed as a command. */
export async function loadSourceQuestions() {
  const source = readFileSync(join(ROOT, "src/lib/question-bank.ts"), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  const errors = (output.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length > 0) throw new Error("Question-bank TypeScript could not be transpiled");
  const encoded = Buffer.from(output.outputText).toString("base64");
  const questionModule = await import(`data:text/javascript;base64,${encoded}`);
  return questionModule.QUESTIONS;
}

/**
 * Deliberately conservative. A source type is converted only when the current
 * server-side grader and question UI can represent exactly the same task.
 */
export const SOURCE_TYPE_MAP = Object.freeze({
  "multiple-choice": "MULTIPLE_CHOICE",
  "true-false-not-given": "TRUE_FALSE_NOT_GIVEN",
  "fill-blanks": "FILL_BLANK",
  "short-answer": "SHORT_ANSWER",
  "sentence-completion": "SENTENCE_COMPLETION",
  "reading-mcq": "READING_MCQ",
  "writing-task1": "WRITING_TASK1",
  "writing-task2": "WRITING_TASK2",
  essay: "ESSAY",
  "speaking-part1": "SPEAKING",
  "speaking-part2": "SPEAKING",
  "speaking-part3": "SPEAKING",
  "speaking-sample": "SPEAKING",
  "read-and-select": "READ_AND_SELECT",
  "write-from-dictation": "WRITE_FROM_DICTATION",
  "complete-the-sentence": "COMPLETE_THE_SENTENCE",
  "vocabulary-in-context": "READING_MCQ",
  "standard-english": "READING_MCQ",
  "central-idea": "READING_MCQ",
  "critical-reasoning": "READING_MCQ",
  "sentence-correction": "READING_MCQ",
  "data-sufficiency": "MULTIPLE_CHOICE",
  "quantitative-comparison": "MULTIPLE_CHOICE",
  "data-interpretation": "MULTIPLE_CHOICE",
  "data-insights": "MULTIPLE_CHOICE",
  "logic-game": "MULTIPLE_CHOICE",
  "issue-task": "ESSAY",
});

export const EXAM_CODE_MAP = Object.freeze({
  IELTS: "IELTS-A",
  PTE: "PTE-A",
  TOEFL: "TOEFL-iBT",
  Duolingo: "DUOLINGO",
  OIETC: "OIETC",
  OET: "OET",
  TOEIC: "TOEIC",
  Cambridge: "CAMBRIDGE",
  SAT: "SAT",
  GRE: "GRE",
  GMAT: "GMAT",
  ACT: "ACT",
  LSAT: "LSAT",
  MCAT: "MCAT",
  LanguageCert: "LANGUAGECERT",
  Linguaskill: "LINGUASKILL",
  Placement: "ALO-PLACEMENT",
  VisaInterview: "VISA-INTERVIEW",
  CounselorAssessment: "COUNSELOR-ASSESSMENT",
  DocumentReadiness: "DOCUMENT-READINESS",
});

export function canonicalSection(section) {
  const value = String(section ?? "").trim();
  if (/listening/i.test(value)) return "LISTENING";
  if (/writing/i.test(value)) return "WRITING";
  if (/speaking|interview/i.test(value)) return "SPEAKING";
  // Academic objective sections remain distinct in the UI. The numeric score
  // disclosure currently covers only LISTENING and READING, so callers must
  // not silently relabel Math/Verbal as Reading to obtain a score.
  return value.toUpperCase();
}

function text(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value.map((item) => item.trim())
    : null;
}

function indexArray(value) {
  return Array.isArray(value) && value.every((item) => Number.isInteger(item)) ? value : null;
}

export function normalizePrompt(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Validate a canonical database-bound question. Returns issues, never coerces bad keys. */
export function validateCanonicalQuestion(question) {
  const issues = [];
  const id = text(question.id);
  const type = String(question.type ?? "").trim().toUpperCase();
  const section = text(question.section);
  const prompt = text(question.prompt);
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) issues.push("id must be 1-128 path-safe characters");
  if (!section) issues.push("section is required");
  if (!prompt || prompt.length < 3) issues.push("prompt must be at least 3 characters");
  if (!ALL_TYPES.has(type)) issues.push(`unsupported canonical type: ${type || "missing"}`);
  if (!Number.isInteger(question.points ?? 1) || (question.points ?? 1) < 1 || (question.points ?? 1) > 100) {
    issues.push("points must be an integer from 1 to 100");
  }
  if (!Number.isInteger(question.order ?? 0) || (question.order ?? 0) < 0) issues.push("order must be non-negative");

  const options = question.options == null ? null : stringArray(question.options);
  if (question.options != null && (!options || options.some((option) => !option))) {
    issues.push("options must be an array of non-empty strings");
  }
  const correctIndex = question.correctIndex ?? null;
  if (correctIndex !== null && !Number.isInteger(correctIndex)) issues.push("correctIndex must be an integer");
  const correctIndices = question.correctIndices == null ? null : indexArray(question.correctIndices);
  if (question.correctIndices != null && !correctIndices) issues.push("correctIndices must be an integer array");
  const correctAnswer = text(question.correctAnswer);

  if (INDEX_TYPES.has(type)) {
    if (!options || options.length < 2) issues.push(`${type} requires at least two options`);
    const tfTextKey = ["TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN"].includes(type) && correctAnswer;
    if (correctIndex === null && !tfTextKey) issues.push(`${type} has no usable answer key`);
    if (correctIndex !== null && options && (correctIndex < 0 || correctIndex >= options.length)) {
      issues.push("correctIndex is outside the options range");
    }
  } else if (TEXT_TYPES.has(type)) {
    if (!correctAnswer) issues.push(`${type} has no correctAnswer`);
  } else if (SET_TYPES.has(type)) {
    if (!options || options.length < 2) issues.push(`${type} requires at least two options`);
    if ((!correctIndices || correctIndices.length === 0) && correctIndex === null) issues.push(`${type} has no set key`);
    if (correctIndices && new Set(correctIndices).size !== correctIndices.length) issues.push("correctIndices contains duplicates");
    const keys = correctIndices ?? (correctIndex === null ? [] : [correctIndex]);
    if (options && keys.some((index) => index < 0 || index >= options.length)) issues.push("set key is outside the options range");
  }

  if (section === "LISTENING") {
    if (!text(question.audioUrl)) issues.push("listening item has no audioUrl");
    if (!question.audio || question.audio.verified !== true || !text(question.audio.verifiedBy) || !text(question.audio.verifiedAt)) {
      issues.push("listening item has no human-verified audio evidence");
    }
    if (!/^[A-Fa-f0-9]{64}$/.test(question.audio?.sha256 ?? "")) issues.push("listening audio has no SHA-256");
  }
  return issues;
}

/** Convert one source item for audit. Ineligible items are never importable. */
export function convertSourceQuestion(source, order = 0) {
  const type = SOURCE_TYPE_MAP[source.type] ?? String(source.type ?? "").toUpperCase();
  const converted = {
    id: source.id,
    section: canonicalSection(source.section),
    type,
    prompt: source.prompt,
    passage: source.passage ?? source.audioScript ?? null,
    audioUrl: null,
    imageUrl: null,
    options: source.options ?? (type === "TRUE_FALSE_NOT_GIVEN"
      ? ["True", "False", "Not Given"]
      : type === "TRUE_FALSE" ? ["True", "False"] : null),
    correctAnswer: source.correctAnswer ?? null,
    correctIndex: source.correctIndex ?? null,
    correctIndices: source.correctIndices ?? null,
    wordLimit: null,
    points: 1,
    order,
  };
  const issues = [];
  if (!SOURCE_TYPE_MAP[source.type]) issues.push(`source type ${source.type} is not supported by the canonical grader/UI mapping`);
  if (source.correctOrder || source.matchingPairs || source.dropdownOptions || source.reorderItems) {
    issues.push("source-only answer shape cannot be represented by the production schema");
  }
  if (source.correctIndices && !SET_TYPES.has(type)) issues.push("multi-answer key is incompatible with the mapped single-answer type");
  if (source.numericAnswer !== undefined) issues.push("numericAnswer requires an explicitly reviewed text-key conversion");
  issues.push(...validateCanonicalQuestion(converted));
  return { question: converted, issues: [...new Set(issues)] };
}

export function questionRowHash(row) {
  return stableHash({
    id: row.id,
    practiceSetId: row.practiceSetId,
    section: row.section,
    type: row.type,
    prompt: row.prompt,
    passage: row.passage,
    audioUrl: row.audioUrl,
    options: row.options,
    correctAnswer: row.correctAnswer,
    correctIndex: row.correctIndex,
    correctIndices: row.correctIndices,
    wordLimit: row.wordLimit,
    imageUrl: row.imageUrl,
    points: row.points,
    order: row.order,
  });
}
