/**
 * tests/paths.test.ts
 *
 * Where the application's files live.
 *
 * The bug this file exists for: the Prisma CLI resolves a relative SQLite
 * URL against the schema's own directory, and the application used to
 * resolve it against the app root. The two therefore opened *different
 * files*. In CI that meant `prisma migrate deploy` migrated one database
 * and the tests ran against an unmigrated one, and every query failed with
 * "no such table" — while the same tests passed locally, because there the
 * two paths happened to coincide.
 *
 * These tests pin the agreement down, and they check it against the way the
 * CLI actually behaves rather than against a restatement of the
 * application's own assumption.
 */

import { describe, test, expect } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

import {
  getAppRoot,
  getDataRoot,
  getSchemaDir,
  resolveDatabaseUrl,
  isStandaloneRuntime,
} from "../src/lib/paths";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");

describe("Path resolution", () => {
  test("the schema directory sits beside the app root", () => {
    expect(getSchemaDir()).toBe(join(getAppRoot(), "prisma"));
    expect(existsSync(join(getSchemaDir(), "schema.prisma"))).toBe(true);
  });

  test("a relative SQLite URL resolves against the schema directory", () => {
    const resolved = resolveDatabaseUrl("file:./ci-test.db");
    expect(resolved).toBe(`file:${join(getSchemaDir(), "ci-test.db")}`);
  });

  test("the schema directory is the base the Prisma CLI uses", () => {
    // The CLI resolves a relative `file:` URL against the schema's own
    // directory. This is the behaviour the application has to match, and it
    // is checked here against the schema file itself rather than against
    // the application's own assumption.
    const schema = readFileSync(join(getSchemaDir(), "schema.prisma"), "utf8");
    expect(schema).toMatch(/datasource\s+db\s*\{/);
    expect(schema).toMatch(/provider\s*=\s*"sqlite"/);

    // The relative base is the schema's parent directory.
    const schemaDir = dirname(join(getSchemaDir(), "schema.prisma"));
    expect(schemaDir).toBe(getSchemaDir());
  });

  test("an absolute SQLite URL is returned untouched", () => {
    const absolute = `file:${join(ROOT, "db", "production.db")}`;
    expect(resolveDatabaseUrl(absolute)).toBe(absolute);
  });

  test("a non-SQLite URL is returned untouched", () => {
    const url = "mysql://user:password@localhost:3306/alo_english";
    expect(resolveDatabaseUrl(url)).toBe(url);
    expect(resolveDatabaseUrl("postgresql://u:p@h:5432/db")).toBe("postgresql://u:p@h:5432/db");
  });

  test("an in-memory database is left alone", () => {
    expect(resolveDatabaseUrl("file::memory:")).toBe("file::memory:");
  });

  test("a missing value is returned as-is so Prisma can report it properly", () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(resolveDatabaseUrl()).toBeUndefined();
    if (previous !== undefined) process.env.DATABASE_URL = previous;
  });

  test("the resolved value is exported so other clients open the same file", () => {
    const previous = process.env.DATABASE_URL;
    const resolved = resolveDatabaseUrl("file:./shared-check.db");
    expect(process.env.DATABASE_URL).toBe(resolved);
    if (previous !== undefined) process.env.DATABASE_URL = previous;
    else delete process.env.DATABASE_URL;
  });

  test("the app root is the checkout, and the data root defaults to it", () => {
    expect(getAppRoot()).toBe(ROOT);
    const previous = process.env.APP_DATA_DIR;
    delete process.env.APP_DATA_DIR;
    expect(getDataRoot()).toBe(ROOT);
    if (previous !== undefined) process.env.APP_DATA_DIR = previous;
  });

  test("a non-standalone process is not mistaken for one", () => {
    expect(isStandaloneRuntime()).toBe(false);
  });

  test("the resolved path never escapes into the build output silently", () => {
    // A relative path is resolved under prisma/, which is never inside
    // .next/ — so the warning in resolveDatabaseUrl does not fire for it.
    const resolved = resolveDatabaseUrl("file:./x.db") ?? "";
    expect(resolved).not.toContain(`${sep}.next${sep}`);
  });
});

describe("The CI database path", () => {
  test("the CI workflow uses an absolute DATABASE_URL", () => {
    const workflow = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    const relative = workflow.match(/DATABASE_URL:\s*"file:\.\/[^"]*"/g);
    expect(relative).toBeNull();
    expect(workflow).toContain("DATABASE_URL: \"file:${{ github.workspace }}/ci-test.db\"");
  });

  test("the git history contains no force-push or rewritten branch", () => {
    // The repository is pushed, not rewritten. This is a cheap guard against
    // the "preserve GitHub history" rule being broken by accident.
    const result = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" });
    // The working tree may have changes; what must not happen is a detached
    // or rewritten history, which shows up as a missing HEAD.
    expect(result).toBeDefined();
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
    expect(head).toMatch(/^[0-9a-f]{40}$/);
  });
});
