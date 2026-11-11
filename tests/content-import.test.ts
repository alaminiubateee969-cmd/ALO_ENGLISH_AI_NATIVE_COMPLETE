import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { importQuestionBank, rollbackQuestionBank } from "../scripts/import-question-bank.mjs";

const roots: string[] = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true });
  delete process.env.DATABASE_URL;
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "alo-content-import-test-"));
  roots.push(root);
  const databasePath = join(root, "production-test.db");
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE User (id TEXT PRIMARY KEY, email TEXT UNIQUE, passwordHash TEXT, role TEXT);
    CREATE TABLE Session (id TEXT PRIMARY KEY, userId TEXT);
    CREATE TABLE Student (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE ExamType (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, category TEXT, isActive INTEGER, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE PracticeSet (id TEXT PRIMARY KEY, examTypeId TEXT, title TEXT, description TEXT, durationMin INTEGER, isActive INTEGER, createdAt INTEGER, updatedAt INTEGER);
    CREATE TABLE Question (id TEXT PRIMARY KEY, practiceSetId TEXT, section TEXT, type TEXT, prompt TEXT, passage TEXT, audioUrl TEXT, options TEXT, correctAnswer TEXT, correctIndex INTEGER, correctIndices TEXT, wordLimit INTEGER, imageUrl TEXT, points INTEGER, "order" INTEGER, createdAt INTEGER, FOREIGN KEY(practiceSetId) REFERENCES PracticeSet(id) ON DELETE CASCADE);
    CREATE TABLE QuestionAudioAsset (id TEXT PRIMARY KEY, questionId TEXT UNIQUE, status TEXT, location TEXT, mimeType TEXT, byteSize INTEGER, sha256 TEXT, voice TEXT, attempts INTEGER, lastError TEXT, generatedAt INTEGER, verifiedAt INTEGER, createdAt INTEGER, updatedAt INTEGER, FOREIGN KEY(questionId) REFERENCES Question(id) ON DELETE CASCADE);
    CREATE TABLE AttemptQuestion (id TEXT PRIMARY KEY, attemptId TEXT, questionId TEXT);
    CREATE TABLE Attempt (id TEXT PRIMARY KEY, userId TEXT, practiceSetId TEXT, status TEXT);
    CREATE TABLE Score (id TEXT PRIMARY KEY, attemptId TEXT);
    CREATE TABLE AgentJob (id TEXT PRIMARY KEY, status TEXT);
    CREATE TABLE AuditLog (id TEXT PRIMARY KEY, userId TEXT, action TEXT, resource TEXT, ipAddress TEXT, metadata TEXT, createdAt INTEGER);
    INSERT INTO User VALUES ('admin-id', 'admin@example.test', 'unchanged-hash', 'SUPER_ADMIN');
    INSERT INTO Session VALUES ('session-id', 'admin-id');
    INSERT INTO Student VALUES ('student-id', 'Existing Student');
  `);
  db.close();
  process.env.DATABASE_URL = `file:${databasePath}`;
  const bundle = {
    schemaVersion: 1,
    bundleId: "reviewed-test-bundle",
    approval: {
      status: "APPROVED",
      reference: "REVIEW-TEST-001",
      decidedBy: "Test Reviewer",
      decidedAt: "2026-11-01",
      formatApproved: true,
      originalityApproved: true,
      approvedQuestionIds: ["reviewed-question-1"],
    },
    practiceSets: [{
      id: "reviewed-set-1",
      title: "Reviewed test fixture",
      description: "Disposable automated-test content",
      durationMin: 10,
      examType: { code: "IELTS-A", name: "IELTS Academic", category: "English Proficiency" },
      questions: [{
        id: "reviewed-question-1",
        section: "READING",
        type: "MULTIPLE_CHOICE",
        prompt: "Which answer is supported by the short fixture passage?",
        passage: "The library opens at nine.",
        options: ["At eight", "At nine"],
        correctIndex: 1,
        points: 1,
        order: 0,
      }],
    }],
  };
  const provenance = {
    manifestVersion: 1,
    updatedAt: "2026-11-01",
    examTypes: [{
      code: "IELTS-A",
      name: "IELTS Academic",
      contentOwner: "ALO test fixture owner",
      licence: { id: "ORIGINAL-ALO-TEST", name: "Original test fixture", attributionRequired: false },
      permission: { evidenceReference: "REVIEW-TEST-001", grantedBy: "Test Owner", grantedOn: "2026-11-01", expiresOn: null },
      officialFormat: { verified: true, sourceUrl: "https://ielts.org/take-a-test/test-types", checkedOn: "2026-11-01", notes: "Fixture manifest" },
      answerKeySource: "Test Reviewer verified the key on 2026-11-01",
      declaredCounts: { questionCount: 1, listeningWithVerifiedAudio: 0 },
      reviewedBy: "Test Reviewer",
      reviewedOn: "2026-11-01",
    }],
  };
  const bundlePath = join(root, "bundle.json");
  const provenancePath = join(root, "provenance.json");
  writeFileSync(bundlePath, JSON.stringify(bundle));
  writeFileSync(provenancePath, JSON.stringify(provenance));
  return { root, databasePath, bundle, bundlePath, provenancePath };
}

function tableCount(path: string, table: string): number {
  const db = new DatabaseSync(path, { readOnly: true });
  const count = db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n as number;
  db.close();
  return count;
}

describe("reviewed content import safety", () => {
  test("dry-run, staging, idempotency, publication and rollback preserve existing data", async () => {
    const f = fixture();
    const dry = await importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: false, publish: false });
    expect(dry.summary.mode).toBe("DRY_RUN");
    expect(tableCount(f.databasePath, "Question")).toBe(0);
    expect(tableCount(f.databasePath, "ExamType")).toBe(0);

    const staged = await importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: true, publish: false, backupDir: join(f.root, "backups") });
    expect(staged.receipt.before.User).toBe(1);
    expect(staged.receipt.after.User).toBe(1);
    expect(staged.receipt.after.Question).toBe(1);
    expect(staged.receipt.backup.integrityCheck).toBe("ok");
    const db = new DatabaseSync(f.databasePath);
    expect(db.prepare("SELECT isActive FROM PracticeSet").get().isActive).toBe(0);
    expect(db.prepare("SELECT passwordHash FROM User").get().passwordHash).toBe("unchanged-hash");
    db.close();

    const repeated = await importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: true, publish: false });
    expect(repeated.receipt).toBeNull();
    expect(repeated.summary.skippedQuestions).toBe(1);
    expect(tableCount(f.databasePath, "Question")).toBe(1);

    await importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: true, publish: true, backupDir: join(f.root, "backups") });
    const published = new DatabaseSync(f.databasePath, { readOnly: true });
    expect(published.prepare("SELECT isActive FROM PracticeSet").get().isActive).toBe(1);
    published.close();

    const rolledBack = await rollbackQuestionBank(`${staged.receipt.backup.path}.rollback.json`, { backupDir: join(f.root, "backups") });
    expect(rolledBack.after.Question).toBe(0);
    expect(rolledBack.after.PracticeSet).toBe(0);
    expect(rolledBack.after.ExamType).toBe(0);
    expect(rolledBack.after.User).toBe(1);
    expect(rolledBack.after.Session).toBe(1);
    expect(rolledBack.after.Student).toBe(1);
  });

  test("unapproved content and changed existing IDs fail without writes", async () => {
    const f = fixture();
    f.bundle.approval.status = "PENDING";
    writeFileSync(f.bundlePath, JSON.stringify(f.bundle));
    await expect(importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: false, publish: false })).rejects.toThrow("APPROVED");
    expect(tableCount(f.databasePath, "Question")).toBe(0);

    f.bundle.approval.status = "APPROVED";
    writeFileSync(f.bundlePath, JSON.stringify(f.bundle));
    await importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: true, publish: false, backupDir: join(f.root, "backups") });
    f.bundle.practiceSets[0].questions[0].prompt = "A changed prompt must not overwrite the existing ID.";
    writeFileSync(f.bundlePath, JSON.stringify(f.bundle));
    await expect(importQuestionBank({ bundle: f.bundlePath, provenance: f.provenancePath, apply: true, publish: false })).rejects.toThrow("refusing to overwrite");
    const db = new DatabaseSync(f.databasePath, { readOnly: true });
    expect(db.prepare("SELECT prompt FROM Question").get().prompt).toContain("short fixture passage");
    expect(db.prepare("SELECT passwordHash FROM User").get().passwordHash).toBe("unchanged-hash");
    db.close();
  });
});
