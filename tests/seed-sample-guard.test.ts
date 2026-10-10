import { describe, expect, test, afterEach, afterAll } from "bun:test";
import { assertSafeSampleSeedTarget } from "../prisma/seed-sample-guard.mjs";

// `bun test tests/` runs every file in one process, so a suite that mutates
// process.env poisons its neighbours — the DB-backed suites read DATABASE_URL
// through the Prisma client. Snapshot and restore instead of deleting, so the
// runner's real values survive this file.
const GUARDED_KEYS = ["ALLOW_SYNTHETIC_SAMPLE_QUESTIONS", "DATABASE_URL", "NODE_ENV"] as const;
const saved = new Map(GUARDED_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of GUARDED_KEYS) {
    const original = saved.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
}

afterEach(restoreEnv);
afterAll(restoreEnv);

describe("legacy synthetic question seed guard", () => {
  test("refuses seeding without explicit opt-in", () => {
    process.env.DATABASE_URL = "file:./test.db";
    expect(() => assertSafeSampleSeedTarget()).toThrow("Refusing to seed");
  });

  test("refuses production even when explicitly opted in", () => {
    process.env.ALLOW_SYNTHETIC_SAMPLE_QUESTIONS = "1";
    process.env.DATABASE_URL = "file:./sample.db";
    process.env.NODE_ENV = "production";
    expect(() => assertSafeSampleSeedTarget()).toThrow("Refusing to seed");
  });

  test("refuses an unlabelled or production-looking database target", () => {
    process.env.ALLOW_SYNTHETIC_SAMPLE_QUESTIONS = "1";
    process.env.DATABASE_URL = "file:./db/production.db";
    expect(() => assertSafeSampleSeedTarget()).toThrow("Refusing to seed");
  });

  test("allows explicit opt-in only for clearly named test/sample SQLite targets", () => {
    process.env.ALLOW_SYNTHETIC_SAMPLE_QUESTIONS = "1";
    process.env.DATABASE_URL = "file:./test.db";
    process.env.NODE_ENV = "test";
    expect(() => assertSafeSampleSeedTarget()).not.toThrow();
  });
});
