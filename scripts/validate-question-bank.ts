#!/usr/bin/env bun
/**
 * scripts/validate-question-bank.ts
 *
 * Validates the complete question bank straight from the database.
 *
 * Checks every question for:
 *   - non-empty prompt
 *   - a real exam / practice set behind it
 *   - a known section and question type
 *   - a usable correct answer (index inside the option range, or text)
 *   - parseable options
 *   - no duplicate ids and no duplicate normalised prompts
 *   - no placeholder / demo / lorem content
 *   - listening questions referencing an audio asset
 *
 * Also reports bank depth per exam so a thin bank is visible instead of
 * being discovered by a student mid-sitting.
 *
 * Usage:  bun run scripts/validate-question-bank.ts [path-to-sqlite-file]
 *         DATABASE_URL=file:./db/custom.db bun run qa:questions
 */

import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const VALID_SECTIONS = ["LISTENING", "READING", "WRITING", "SPEAKING"];

/**
 * The question-type vocabulary is shared with the server-side grader and the
 * CI content gate, so "valid type" means the same thing in all three places.
 * See src/lib/exam/question-types.json.
 */
const QUESTION_TYPES = JSON.parse(
  readFileSync(join(ROOT, "src/lib/exam/question-types.json"), "utf8"),
) as {
  indexTypes: string[];
  textTypes: string[];
  setTypes: string[];
  subjectiveTypes: string[];
};

const VALID_TYPES = [
  ...QUESTION_TYPES.indexTypes,
  ...QUESTION_TYPES.textTypes,
  ...QUESTION_TYPES.setTypes,
  ...QUESTION_TYPES.subjectiveTypes,
];

/** Types that must carry a machine-checkable answer. */
const INDEX_TYPES = new Set(QUESTION_TYPES.indexTypes);
const TEXT_TYPES = new Set(QUESTION_TYPES.textTypes);

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /\bplaceholder\b/i,
  /\bdemo (question|text|content)\b/i,
  /\bsample question\b/i,
  /\btest question\b/i,
  /\bTODO\b/,
  /\bFIXME\b/,
  /\bXXX\b/,
  /\bcoming soon\b/i,
];

type Row = Record<string, unknown>;

type Problem = { questionId: string; exam: string; issue: string };

const problems: Problem[] = [];
const notes: string[] = [];

function resolveDbPath(): string {
  const arg = process.argv[2];
  if (arg) return arg;
  const url = process.env.DATABASE_URL || "file:./db/custom.db";
  return url.replace(/^file:/, "");
}

const dbPath = resolveDbPath();
let db: Database;
try {
  db = new Database(dbPath, { readonly: true });
} catch (err) {
  console.error(`Cannot open database at ${dbPath}:`, err instanceof Error ? err.message : err);
  process.exit(2);
}

const rows = db
  .query(
    `SELECT q.id, q.section, q.type, q.prompt, q.passage, q.audioUrl, q.options,
            q.correctAnswer, q.correctIndex, q.correctIndices, q.points, q."order" AS qorder,
            ps.id AS practiceSetId, ps.title AS setTitle, ps.isActive AS setActive,
            et.code AS examCode, et.name AS examName
     FROM Question q
     LEFT JOIN PracticeSet ps ON ps.id = q.practiceSetId
     LEFT JOIN ExamType et ON et.id = ps.examTypeId`
  )
  .all() as Row[];

console.log(`Question bank validation — ${dbPath}`);
console.log(`Questions found: ${rows.length}\n`);

const seenIds = new Set<string>();
const promptIndex = new Map<string, string>();

function normalisePrompt(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 160);
}

function parseOptions(raw: unknown): string[] | null {
  if (raw === null || raw === undefined || raw === "") return null;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : null;
  } catch {
    return null;
  }
}

for (const q of rows) {
  const id = String(q.id ?? "");
  const exam = String(q.examCode ?? "<no exam>");
  const add = (issue: string) => problems.push({ questionId: id, exam, issue });

  if (!id) {
    add("missing id");
    continue;
  }
  if (seenIds.has(id)) add("duplicate question id");
  seenIds.add(id);

  // ── references
  if (!q.practiceSetId) add("orphaned: practice set does not exist");
  else if (!q.examCode) add("practice set has no exam type");

  // ── prompt
  const prompt = String(q.prompt ?? "").trim();
  if (prompt.length === 0) add("empty prompt");
  else if (prompt.length < 12) add(`suspiciously short prompt (${prompt.length} chars)`);

  const norm = normalisePrompt(prompt);
  if (norm.length > 0) {
    const first = promptIndex.get(norm);
    if (first && first !== id) add(`duplicate prompt (same as ${first.slice(-8)})`);
    else promptIndex.set(norm, id);
  }

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(prompt) || pattern.test(String(q.passage ?? ""))) {
      add(`placeholder/demo content matched ${pattern}`);
      break;
    }
  }

  // ── section + type
  const section = String(q.section ?? "").toUpperCase();
  if (!VALID_SECTIONS.includes(section)) add(`invalid section "${q.section}"`);

  const type = String(q.type ?? "").toUpperCase();
  if (!VALID_TYPES.includes(type)) add(`invalid question type "${q.type}"`);

  // ── answer validity
  const options = parseOptions(q.options);
  if (q.options !== null && q.options !== undefined && String(q.options) !== "" && options === null) {
    add("options is not a parseable JSON array");
  }

  if (INDEX_TYPES.has(type)) {
    if (q.correctIndex === null || q.correctIndex === undefined) {
      add(`${type} has no correctIndex`);
    } else {
      const idx = Number(q.correctIndex);
      if (!Number.isInteger(idx)) add("correctIndex is not an integer");
      else if (idx < 0) add("correctIndex is negative");
      else if (options && idx >= options.length) {
        add(`correctIndex ${idx} outside options (${options.length})`);
      }
    }
    if (!options) add(`${type} has no options`);
  }

  if (TEXT_TYPES.has(type)) {
    const answer = String(q.correctAnswer ?? "").trim();
    if (answer.length === 0) add(`${type} has no correctAnswer`);
  }

  if (type === "MATCHING" || type === "LABELING") {
    // The grader (src/lib/exam/grading.ts) prefers a correctIndices array but
    // falls back to a single correctIndex for one-to-one matching, so a
    // question carrying only correctIndex IS gradeable and must not be
    // reported as broken.
    const hasIndices = String(q.correctIndices ?? "").trim().length > 0;
    const hasIndex = q.correctIndex !== null && q.correctIndex !== undefined;
    if (!hasIndices && !hasIndex) add(`${type} has no correctIndices and no correctIndex`);
  }

  // ── listening audio
  if (section === "LISTENING" && type !== "SPEAKING") {
    const audio = String(q.audioUrl ?? "").trim();
    if (audio.length === 0) {
      notes.push(`${id.slice(-8)} (${exam}): listening question has no audioUrl`);
    }
  }

  // ── points
  const points = Number(q.points);
  if (!Number.isFinite(points) || points <= 0) add(`invalid points "${q.points}"`);
}

// ─── Bank depth per exam ────────────────────────────────────────────────
const depth = db
  .query(
    `SELECT et.code AS code, COUNT(DISTINCT ps.id) AS sets, COUNT(q.id) AS questions
     FROM ExamType et
     LEFT JOIN PracticeSet ps ON ps.examTypeId = et.id AND ps.isActive = 1
     LEFT JOIN Question q ON q.practiceSetId = ps.id
     GROUP BY et.id ORDER BY questions DESC`
  )
  .all() as Row[];

console.log("── Bank depth per exam ──");
const thin: string[] = [];
for (const row of depth) {
  const count = Number(row.questions);
  const mark = count < 10 ? "  THIN" : "";
  if (count < 10) thin.push(String(row.code));
  console.log(
    `  ${String(row.code).padEnd(16)} sets=${String(row.sets).padEnd(3)} questions=${String(count).padEnd(5)}${mark}`
  );
}

console.log(`\n── Listening questions without an audio asset: ${notes.length} ──`);
for (const n of notes.slice(0, 25)) console.log(`  ${n}`);
if (notes.length > 25) console.log(`  ...and ${notes.length - 25} more`);

console.log(`\n── Problems: ${problems.length} ──`);
const byIssue = new Map<string, number>();
for (const p of problems) byIssue.set(p.issue.replace(/".*"/, '"…"'), (byIssue.get(p.issue.replace(/".*"/, '"…"')) ?? 0) + 1);
for (const [issue, count] of [...byIssue.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${issue}`);
}
for (const p of problems.slice(0, 20)) {
  console.log(`  - ${p.exam} ${p.questionId.slice(-8)}: ${p.issue}`);
}

console.log(`\nDuplicate prompts: ${rows.length - promptIndex.size}`);
console.log(`Thin banks (<10 questions): ${thin.length ? thin.join(", ") : "none"}`);

db.close();

if (problems.length > 0) {
  console.error(`\nFAILED: ${problems.length} invalid question(s).`);
  process.exit(1);
}
console.log("\nAll questions passed validation.");
