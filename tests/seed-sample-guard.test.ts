import { describe, expect, test, afterEach } from "bun:test";
import { assertSafeSampleSeedTarget } from "../prisma/seed-sample-guard.mjs";

afterEach(() => {
  delete process.env.ALLOW_SYNTHETIC_SAMPLE_QUESTIONS;
  delete process.env.DATABASE_URL;
  delete process.env.NODE_ENV;
});

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
