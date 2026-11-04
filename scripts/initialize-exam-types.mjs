#!/usr/bin/env node
/** Insert only missing ExamType metadata. Never touches users or credentials. */
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { counts, createBackup, integrity, openDb } from "./import-question-bank.mjs";

const apply = process.argv.includes("--apply");
const unknown = process.argv.slice(2).filter((arg) => arg !== "--apply");
if (unknown.length) throw new Error(`Unknown arguments: ${unknown.join(", ")}`);
const url = process.env.DATABASE_URL?.trim();
if (!url?.startsWith("file:")) throw new Error("DATABASE_URL must name a SQLite file");
const specifier = url.slice(5).split("?")[0];
if (apply && !isAbsolute(specifier)) throw new Error("--apply requires an absolute DATABASE_URL");
const path = resolve(specifier);
if (!existsSync(path)) throw new Error(`Database does not exist: ${path}`);

const seed = readFileSync(resolve(fileURLToPath(new URL("../prisma/seed.mjs", import.meta.url))), "utf8");
const array = seed.match(/const EXAM_TYPES = \[([\s\S]*?)\];/);
if (!array) throw new Error("Could not locate EXAM_TYPES in prisma/seed.mjs");
const examTypes = [...array[1].matchAll(/\{\s*code:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'\s*\}/g)]
  .map((match) => ({ code: match[1], name: match[2], category: match[3] }));
if (examTypes.length < 20 || new Set(examTypes.map((exam) => exam.code)).size !== examTypes.length) {
  throw new Error("Exam metadata parse did not produce the expected unique definitions; no writes performed");
}

const db = openDb(path, !apply);
try {
  integrity(db);
  const before = counts(db);
  const missing = examTypes.filter((exam) => !db.prepare("SELECT 1 FROM ExamType WHERE code = ?").get(exam.code));
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", existing: examTypes.length - missing.length, missing: missing.map((exam) => exam.code) }, null, 2));
  if (!apply || missing.length === 0) process.exitCode = 0;
  else {
    const backup = createBackup(db, path, resolve(process.env.BACKUP_DIR ?? dirname(path)));
    const timestamp = Date.now();
    db.exec("BEGIN IMMEDIATE");
    try {
      const insert = db.prepare("INSERT INTO ExamType (id, code, name, category, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?)");
      for (const exam of missing) insert.run(`exam-${exam.code.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, exam.code, exam.name, exam.category, timestamp, timestamp);
      db.prepare("INSERT INTO AuditLog (id, userId, action, resource, ipAddress, metadata, createdAt) VALUES (?, NULL, 'EXAM_TYPES_INITIALIZED', NULL, NULL, ?, ?)")
        .run(`exam-init-${timestamp}`, JSON.stringify({ inserted: missing.map((exam) => exam.code), usersModified: 0 }), timestamp);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    integrity(db);
    const after = counts(db);
    for (const table of ["User", "Session", "Student", "Attempt", "Score", "PracticeSet", "Question", "AgentJob"]) {
      if (before[table] !== after[table]) throw new Error(`Safety check failed: ${table} count changed`);
    }
    console.log(JSON.stringify({ result: "APPLIED", inserted: missing.length, backup, before, after }, null, 2));
  }
} finally {
  db.close();
}
