#!/usr/bin/env node
/**
 * Production-safe, SQLite-only content staging/publication tool.
 *
 * Dry-run is the default. Apply requires an explicit reviewed bundle, a valid
 * provenance manifest, and --apply. Publication additionally requires
 * --publish. Every write is preceded by a VACUUM INTO backup that is opened
 * and integrity-checked. Existing rows are never updated except activating a
 * set previously created inactive by this same bundle on an explicit publish.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { validateProvenance } from "./validate-question-provenance.mjs";
import {
  normalizePrompt,
  questionRowHash,
  stableHash,
  validateCanonicalQuestion,
} from "./lib/question-bank-tools.mjs";

const CORE_COUNTS = ["User", "Session", "Student", "Attempt", "Score", "ExamType", "PracticeSet", "Question", "AgentJob"];
const nowIso = () => new Date().toISOString();
const json = (value) => JSON.stringify(value);
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

function parseArgs(argv) {
  const result = { apply: false, publish: false, rollback: null, bundle: null, provenance: null, receipt: null, backupDir: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") result.apply = true;
    else if (arg === "--publish") result.publish = true;
    else if (["--bundle", "--provenance", "--receipt", "--backup-dir", "--rollback"].includes(arg)) {
      const key = { "--bundle": "bundle", "--provenance": "provenance", "--receipt": "receipt", "--backup-dir": "backupDir", "--rollback": "rollback" }[arg];
      result[key] = argv[++i];
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return result;
}

function databasePath() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url?.startsWith("file:")) throw new Error("DATABASE_URL must explicitly name a SQLite file (file:/absolute/path.db)");
  const specifier = url.slice(5).split("?")[0];
  if (!specifier || specifier.startsWith(":")) throw new Error("A durable SQLite file is required; in-memory databases are not accepted");
  return resolve(specifier);
}

export function openDb(path, readOnly = false) {
  const db = new DatabaseSync(path, { readOnly });
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 10000;");
  return db;
}

export function integrity(db) {
  const result = db.prepare("PRAGMA integrity_check").get();
  const value = Object.values(result ?? {})[0];
  if (value !== "ok") throw new Error(`SQLite integrity_check failed: ${value}`);
}

export function counts(db) {
  return Object.fromEntries(CORE_COUNTS.map((table) => [table, db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n]));
}

function shaFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function createBackup(db, path, directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stamp = nowIso().replaceAll(":", "-").replaceAll(".", "-");
  const destination = resolve(directory, `alo-content-pre-write-${stamp}.db`);
  if (existsSync(destination)) throw new Error(`Backup already exists: ${destination}`);
  // SQLite's own online backup operation gives a consistent database image;
  // copying a live DB/WAL with cp is not a safe fallback.
  db.exec(`VACUUM INTO ${sqlString(destination)}`);
  const check = openDb(destination, true);
  try {
    integrity(check);
    return {
      path: destination,
      sha256: shaFile(destination),
      byteSize: statSync(destination).size,
      integrityCheck: "ok",
      counts: counts(check),
      sourcePath: path,
      createdAt: nowIso(),
    };
  } finally {
    check.close();
  }
}

function requiredText(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} is required`);
}

function normalizeBundle(bundle, provenance) {
  const errors = [];
  if (bundle?.schemaVersion !== 1) errors.push("bundle.schemaVersion must be 1");
  requiredText(bundle?.bundleId, "bundle.bundleId", errors);
  const approval = bundle?.approval ?? {};
  if (approval.status !== "APPROVED") errors.push("bundle.approval.status must be APPROVED");
  requiredText(approval.reference, "bundle.approval.reference", errors);
  requiredText(approval.decidedBy, "bundle.approval.decidedBy", errors);
  requiredText(approval.decidedAt, "bundle.approval.decidedAt", errors);
  if (approval.formatApproved !== true) errors.push("bundle.approval.formatApproved must be true");
  if (approval.originalityApproved !== true) errors.push("bundle.approval.originalityApproved must be true");
  const approvedIds = new Set(Array.isArray(approval.approvedQuestionIds) ? approval.approvedQuestionIds : []);
  const sets = Array.isArray(bundle?.practiceSets) ? bundle.practiceSets : [];
  if (sets.length === 0) errors.push("bundle.practiceSets must not be empty");

  const normalizedSets = [];
  const bundleIds = new Set();
  const bundlePrompts = new Set();
  const examCounts = {};
  let listeningCount = 0;
  for (const [setIndex, set] of sets.entries()) {
    requiredText(set?.id, `practiceSets[${setIndex}].id`, errors);
    requiredText(set?.title, `practiceSets[${setIndex}].title`, errors);
    requiredText(set?.examType?.code, `practiceSets[${setIndex}].examType.code`, errors);
    requiredText(set?.examType?.name, `practiceSets[${setIndex}].examType.name`, errors);
    requiredText(set?.examType?.category, `practiceSets[${setIndex}].examType.category`, errors);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(set?.id ?? "")) errors.push(`practice set ${set?.id} has an unsafe id`);
    if (!Number.isInteger(set?.durationMin) || set.durationMin < 1 || set.durationMin > 1440) errors.push(`practice set ${set?.id} has invalid durationMin`);
    const questions = Array.isArray(set?.questions) ? set.questions : [];
    if (questions.length === 0) errors.push(`practice set ${set?.id} has no questions`);
    const normalizedQuestions = [];
    for (const [questionIndex, raw] of questions.entries()) {
      const q = {
        id: raw?.id,
        practiceSetId: set.id,
        section: String(raw?.section ?? "").trim().toUpperCase(),
        type: String(raw?.type ?? "").trim().toUpperCase(),
        prompt: raw?.prompt,
        passage: raw?.passage ?? null,
        audioUrl: raw?.audioUrl ?? null,
        imageUrl: raw?.imageUrl ?? null,
        options: raw?.options ?? null,
        correctAnswer: raw?.correctAnswer ?? null,
        correctIndex: raw?.correctIndex ?? null,
        correctIndices: raw?.correctIndices ?? null,
        wordLimit: raw?.wordLimit ?? null,
        points: raw?.points ?? 1,
        order: raw?.order ?? questionIndex,
        audio: raw?.audio ?? null,
      };
      const issues = validateCanonicalQuestion(q);
      if (!approvedIds.has(q.id)) issues.push("question id is absent from approval.approvedQuestionIds");
      if (bundleIds.has(q.id)) issues.push("duplicate question id in bundle");
      bundleIds.add(q.id);
      const promptKey = `${set.examType?.code}:${normalizePrompt(q.prompt)}`;
      if (bundlePrompts.has(promptKey)) issues.push("duplicate normalized prompt for this exam in bundle");
      bundlePrompts.add(promptKey);
      if (q.audio?.audioFile) {
        const audioPath = resolve(q.audio.audioFile);
        if (!existsSync(audioPath)) issues.push(`audioFile does not exist: ${audioPath}`);
        else if (shaFile(audioPath).toLowerCase() !== String(q.audio.sha256).toLowerCase()) issues.push("audioFile SHA-256 does not match approval evidence");
      }
      if (q.section === "LISTENING") listeningCount += 1;
      examCounts[set.examType?.code] = (examCounts[set.examType?.code] ?? 0) + 1;
      for (const issue of issues) errors.push(`question ${q.id ?? `${set.id}[${questionIndex}]`}: ${issue}`);
      normalizedQuestions.push(q);
    }
    normalizedSets.push({ ...set, questions: normalizedQuestions });
  }

  for (const id of approvedIds) if (!bundleIds.has(id)) errors.push(`approval lists question ${id}, but the bundle does not contain it`);
  const provenanceResult = validateProvenance(provenance);
  for (const error of provenanceResult.errors) errors.push(`provenance: ${error}`);
  const entries = Array.isArray(provenance?.examTypes) ? provenance.examTypes : [];
  for (const entry of entries) {
    if (examCounts[entry.code] !== entry.declaredCounts?.questionCount) {
      errors.push(`provenance count mismatch for ${entry.code}: bundle ${examCounts[entry.code] ?? 0}, manifest ${entry.declaredCounts?.questionCount}`);
    }
  }
  for (const code of Object.keys(examCounts)) if (!entries.some((entry) => entry.code === code)) errors.push(`provenance has no entry for ${code}`);
  if (provenanceResult.summary.declaredListeningWithAudio !== listeningCount) {
    errors.push(`provenance listening-audio count mismatch: bundle ${listeningCount}, manifest ${provenanceResult.summary.declaredListeningWithAudio}`);
  }
  if (errors.length > 0) throw new Error(`Bundle validation failed:\n - ${errors.join("\n - ")}`);
  return { sets: normalizedSets, examCounts, questionCount: bundleIds.size };
}

function storedQuestion(row) {
  // Hashes compare the exact persisted representation, including JSON text.
  return { ...row };
}

function dbQuestion(q) {
  return {
    ...q,
    options: q.options == null ? null : json(q.options),
    correctIndices: q.correctIndices == null ? null : json(q.correctIndices),
  };
}

function planImport(db, bundle, publish) {
  const plan = { examTypes: [], practiceSets: [], questions: [], audioAssets: [], activateSets: [], skippedQuestions: 0, skippedSets: 0, skippedExamTypes: 0 };
  const plannedExams = new Map();
  for (const set of bundle.sets) {
    const exam = set.examType;
    let examRow = db.prepare("SELECT * FROM ExamType WHERE code = ?").get(exam.code) ?? plannedExams.get(exam.code);
    if (examRow) plan.skippedExamTypes += 1;
    else {
      examRow = { id: `exam-${exam.code.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, ...exam, isActive: 1 };
      const idConflict = db.prepare("SELECT code FROM ExamType WHERE id = ?").get(examRow.id);
      if (idConflict) throw new Error(`ExamType id collision: ${examRow.id}`);
      plan.examTypes.push(examRow);
      plannedExams.set(exam.code, examRow);
    }
    const setRow = db.prepare("SELECT * FROM PracticeSet WHERE id = ?").get(set.id);
    if (setRow) {
      const expected = { examTypeId: examRow.id, title: set.title, description: set.description ?? null, durationMin: set.durationMin };
      for (const [key, value] of Object.entries(expected)) {
        if (setRow[key] !== value) throw new Error(`PracticeSet ${set.id} already exists with different ${key}; refusing to overwrite`);
      }
      plan.skippedSets += 1;
      if (publish && !setRow.isActive) plan.activateSets.push(set.id);
    } else {
      plan.practiceSets.push({ id: set.id, examTypeId: examRow.id, title: set.title, description: set.description ?? null, durationMin: set.durationMin, isActive: publish ? 1 : 0 });
    }

    for (const q of set.questions) {
      const existing = db.prepare("SELECT * FROM Question WHERE id = ?").get(q.id);
      const row = dbQuestion(q);
      if (existing) {
        if (questionRowHash(storedQuestion(existing)) !== questionRowHash(row)) throw new Error(`Question ${q.id} already exists with different content; refusing to overwrite`);
        plan.skippedQuestions += 1;
      } else {
        const duplicate = db.prepare(`SELECT q.id FROM Question q JOIN PracticeSet p ON p.id = q.practiceSetId JOIN ExamType e ON e.id = p.examTypeId WHERE e.code = ? AND LOWER(TRIM(q.prompt)) = ?`).get(exam.code, normalizePrompt(q.prompt));
        if (duplicate) throw new Error(`Question ${q.id} duplicates normalized prompt in existing question ${duplicate.id}`);
        plan.questions.push(row);
      }
      if (q.audio) plan.audioAssets.push({ questionId: q.id, ...q.audio, audioUrl: q.audioUrl });
    }
  }
  return plan;
}

function applyPlan(db, plan, approval) {
  const timestamp = Date.now();
  db.exec("BEGIN IMMEDIATE");
  try {
    const examInsert = db.prepare("INSERT INTO ExamType (id, code, name, category, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const row of plan.examTypes) examInsert.run(row.id, row.code, row.name, row.category, row.isActive, timestamp, timestamp);
    const setInsert = db.prepare("INSERT INTO PracticeSet (id, examTypeId, title, description, durationMin, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const row of plan.practiceSets) setInsert.run(row.id, row.examTypeId, row.title, row.description, row.durationMin, row.isActive, timestamp, timestamp);
    for (const id of plan.activateSets) db.prepare("UPDATE PracticeSet SET isActive = 1, updatedAt = ? WHERE id = ? AND isActive = 0").run(timestamp, id);
    const qInsert = db.prepare(`INSERT INTO Question (id, practiceSetId, section, type, prompt, passage, audioUrl, options, correctAnswer, correctIndex, correctIndices, wordLimit, imageUrl, points, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const row of plan.questions) qInsert.run(row.id, row.practiceSetId, row.section, row.type, row.prompt, row.passage, row.audioUrl, row.options, row.correctAnswer, row.correctIndex, row.correctIndices, row.wordLimit, row.imageUrl, row.points, row.order, timestamp);
    const audioInsert = db.prepare(`INSERT INTO QuestionAudioAsset (id, questionId, status, location, mimeType, byteSize, sha256, voice, attempts, generatedAt, verifiedAt, createdAt, updatedAt) VALUES (?, ?, 'READY', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`);
    for (const asset of plan.audioAssets) {
      // Skip only if the matching question already had the identical asset.
      const existing = db.prepare("SELECT * FROM QuestionAudioAsset WHERE questionId = ?").get(asset.questionId);
      if (existing) {
        if (existing.location !== asset.audioUrl || existing.sha256?.toLowerCase() !== asset.sha256.toLowerCase() || existing.status !== "READY" || !existing.verifiedAt) {
          throw new Error(`Existing audio asset differs for ${asset.questionId}`);
        }
        continue;
      }
      audioInsert.run(`audio-${asset.questionId}`, asset.questionId, asset.audioUrl, asset.mimeType ?? "audio/mpeg", asset.byteSize ?? null, asset.sha256, asset.voice ?? null, timestamp, new Date(asset.verifiedAt).getTime(), timestamp, timestamp);
    }
    db.prepare("INSERT INTO AuditLog (id, userId, action, resource, ipAddress, metadata, createdAt) VALUES (?, NULL, 'CONTENT_IMPORT', ?, NULL, ?, ?)").run(
      `content-import-${timestamp}`, `bundle:${approval.reference}`, json({ approval, created: { examTypes: plan.examTypes.length, practiceSets: plan.practiceSets.length, questions: plan.questions.length }, activated: plan.activateSets }), timestamp,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function writeReceipt(path, receipt) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${json(receipt)}\n`, { mode: 0o600, flag: "wx" });
}

export async function importQuestionBank(options) {
  const path = databasePath();
  if (!existsSync(path)) throw new Error(`Database does not exist: ${path}. Run migrations first; the importer never creates a production schema.`);
  if (options.apply && !isAbsolute(process.env.DATABASE_URL.slice(5).split("?")[0])) throw new Error("Apply requires an absolute DATABASE_URL");
  if (options.publish && !options.apply) throw new Error("--publish requires --apply");
  const bundle = JSON.parse(readFileSync(resolve(options.bundle), "utf8"));
  const provenance = JSON.parse(readFileSync(resolve(options.provenance), "utf8"));
  const normalized = normalizeBundle(bundle, provenance);
  const db = openDb(path, !options.apply);
  let backup = null;
  try {
    integrity(db);
    const before = counts(db);
    const plan = planImport(db, normalized, options.publish);
    const summary = { mode: options.apply ? (options.publish ? "PUBLISH" : "STAGE") : "DRY_RUN", database: path, questionsInBundle: normalized.questionCount, ...plan };
    // Never print prompts or answer keys to host/CI logs.
    const displaySummary = {
      mode: summary.mode,
      database: summary.database,
      questionsInBundle: summary.questionsInBundle,
      create: {
        examTypeIds: plan.examTypes.map((row) => row.id),
        practiceSetIds: plan.practiceSets.map((row) => row.id),
        questionIds: plan.questions.map((row) => row.id),
        audioQuestionIds: plan.audioAssets.map((row) => row.questionId),
      },
      activateSetIds: plan.activateSets,
      skipped: { examTypes: plan.skippedExamTypes, practiceSets: plan.skippedSets, questions: plan.skippedQuestions },
    };
    if (!options.apply) {
      console.log(json(displaySummary, null, 2));
      return { summary, receipt: null };
    }
    const hasWrites = plan.examTypes.length + plan.practiceSets.length + plan.questions.length + plan.activateSets.length > 0;
    if (!hasWrites) {
      console.log(json({ ...displaySummary, result: "NO_CHANGES", counts: before }, null, 2));
      return { summary, receipt: null };
    }
    backup = createBackup(db, path, resolve(options.backupDir ?? dirname(path)));
    applyPlan(db, plan, bundle.approval);
    integrity(db);
    const after = counts(db);
    for (const table of ["User", "Session", "Student", "Attempt", "Score", "AgentJob"]) {
      if (before[table] !== after[table]) throw new Error(`Safety check failed: ${table} count changed during content import`);
    }
    const receipt = {
      receiptVersion: 1,
      kind: "CONTENT_IMPORT",
      bundleId: bundle.bundleId,
      approvalReference: bundle.approval.reference,
      createdAt: nowIso(),
      databasePath: path,
      backup,
      before,
      after,
      created: {
        examTypeIds: plan.examTypes.map((row) => row.id),
        practiceSetIds: plan.practiceSets.map((row) => row.id),
        questions: plan.questions.map((row) => ({ id: row.id, practiceSetId: row.practiceSetId, sha256: questionRowHash(row) })),
      },
    };
    const receiptPath = resolve(options.receipt ?? `${backup.path}.rollback.json`);
    writeReceipt(receiptPath, receipt);
    console.log(json({ ...displaySummary, result: "APPLIED", backup, receipt: receiptPath, before, after }, null, 2));
    return { summary, receipt };
  } finally {
    db.close();
  }
}

export async function rollbackQuestionBank(receiptPath, options) {
  const receipt = JSON.parse(readFileSync(resolve(receiptPath), "utf8"));
  if (receipt.receiptVersion !== 1 || receipt.kind !== "CONTENT_IMPORT") throw new Error("Unsupported rollback receipt");
  const path = databasePath();
  if (resolve(path) !== resolve(receipt.databasePath)) throw new Error("DATABASE_URL does not match the receipt database; rollback refused");
  const db = openDb(path, false);
  try {
    integrity(db);
    const before = counts(db);
    for (const item of receipt.created.questions) {
      const row = db.prepare("SELECT * FROM Question WHERE id = ?").get(item.id);
      if (!row) throw new Error(`Rollback refused: imported question ${item.id} is missing`);
      if (questionRowHash(storedQuestion(row)) !== item.sha256) throw new Error(`Rollback refused: question ${item.id} changed after import`);
      if (db.prepare("SELECT COUNT(*) AS n FROM AttemptQuestion WHERE questionId = ?").get(item.id).n > 0) throw new Error(`Rollback refused: question ${item.id} is used by an attempt`);
    }
    for (const id of receipt.created.practiceSetIds) {
      if (db.prepare("SELECT COUNT(*) AS n FROM Attempt WHERE practiceSetId = ?").get(id).n > 0) throw new Error(`Rollback refused: practice set ${id} has attempts`);
      const extra = db.prepare("SELECT COUNT(*) AS n FROM Question WHERE practiceSetId = ?").get(id).n;
      if (extra !== receipt.created.questions.filter((q) => q.practiceSetId === id).length) throw new Error(`Rollback refused: practice set ${id} gained other questions`);
    }
    const backup = createBackup(db, path, resolve(options.backupDir ?? dirname(path)));
    const timestamp = Date.now();
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const item of receipt.created.questions) db.prepare("DELETE FROM Question WHERE id = ?").run(item.id);
      for (const id of receipt.created.practiceSetIds) db.prepare("DELETE FROM PracticeSet WHERE id = ?").run(id);
      for (const id of receipt.created.examTypeIds) db.prepare("DELETE FROM ExamType WHERE id = ?").run(id);
      db.prepare("INSERT INTO AuditLog (id, userId, action, resource, ipAddress, metadata, createdAt) VALUES (?, NULL, 'CONTENT_IMPORT_ROLLBACK', ?, NULL, ?, ?)").run(
        `content-rollback-${timestamp}`, `bundle:${receipt.bundleId}`, json({ approvalReference: receipt.approvalReference, receipt: basename(receiptPath) }), timestamp,
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    integrity(db);
    const after = counts(db);
    for (const table of ["User", "Session", "Student", "Attempt", "Score", "AgentJob"]) {
      if (before[table] !== after[table]) throw new Error(`Safety check failed: ${table} count changed during rollback`);
    }
    const result = { result: "ROLLED_BACK", backup, before, after };
    console.log(json(result, null, 2));
    return result;
  } finally {
    db.close();
  }
}

const direct = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (direct) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.rollback) await rollbackQuestionBank(options.rollback, options);
    else {
      if (!options.bundle || !options.provenance) throw new Error("Usage: --bundle reviewed.json --provenance provenance.json [--apply] [--publish] [--backup-dir DIR] [--receipt FILE]");
      await importQuestionBank(options);
    }
  } catch (error) {
    console.error(`CONTENT IMPORT FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}
