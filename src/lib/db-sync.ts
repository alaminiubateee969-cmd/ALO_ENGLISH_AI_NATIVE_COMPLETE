/**
 * src/lib/db-sync.ts — cross-runtime SQLite DatabaseSync.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The platform ships against Node's built-in `node:sqlite` (DatabaseSync),
 * available since Node 22.5. Production runs on Node, so that is the preferred
 * implementation. The test suite, however, runs under `bun test`, and Bun does
 * not resolve `node:sqlite` — it ships its own `bun:sqlite` module whose
 * `Database` class exposes the same `exec` / `prepare` / `run` / `get` /
 * `close` surface the platform relies on.
 *
 * Importing `node:sqlite` directly therefore breaks `bun test` at module
 * resolution time, before any test body can run. This helper resolves the
 * right native class for the current runtime and re-exports it under the
 * `DatabaseSync` name the rest of the codebase already uses.
 *
 * The one API difference the wrapper normalises is the read-only option
 * spelling: Node accepts both `readOnly` and `readonly`, Bun only accepts
 * `readonly`. Callers can pass either; the wrapper hands Bun the spelling it
 * requires and hands Node the spelling it requires.
 *
 * Usage:
 *   import { DatabaseSync } from "@/lib/db-sync";
 *   const db = new DatabaseSync(path, { readOnly: true });
 *   db.exec("CREATE TABLE t (x INTEGER)");
 *   db.prepare("INSERT INTO t VALUES (?)").run(1);
 *   const row = db.prepare("SELECT COUNT(*) AS n FROM t").get();
 *   db.close();
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type StatementSync = {
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
  iterate?(...params: unknown[]): Iterable<unknown>;
};

type NativeDatabase = {
  exec(sql: string): unknown;
  prepare(sql: string): StatementSync;
  close(): unknown;
};

type NativeCtor = new (path: string, options?: Record<string, unknown>) => NativeDatabase;

type DatabaseSyncOptions = {
  /** Read-only mode (Node spelling). Normalised to `readonly` for Bun. */
  readOnly?: boolean;
  /** Read-only mode (Bun spelling). Accepted by both runtimes. */
  readonly?: boolean;
  [key: string]: unknown;
};

let NativeCtorRef: NativeCtor | null = null;
let resolvedRuntime: "node" | "bun" | "none" = "none";

try {
  // Preferred: Node's built-in node:sqlite, which is what production runs on.
  NativeCtorRef = require("node:sqlite").DatabaseSync as NativeCtor;
  resolvedRuntime = "node";
} catch {
  try {
    // Fallback: Bun's built-in bun:sqlite, used when tests run under `bun test`.
    NativeCtorRef = require("bun:sqlite").Database as NativeCtor;
    resolvedRuntime = "bun";
  } catch {
    NativeCtorRef = null;
    resolvedRuntime = "none";
  }
}

if (!NativeCtorRef) {
  throw new Error(
    "No native SQLite module available: src/lib/db-sync requires Node 22.5+ (node:sqlite) or Bun (bun:sqlite).",
  );
}

const NATIVE_CTOR = NativeCtorRef;
const RUNTIME = resolvedRuntime;

/**
 * Cross-runtime SQLite database handle. Wraps the native class picked above
 * and normalises option names so callers can use the Node-style `readOnly`
 * flag in both runtimes.
 */
export class DatabaseSync {
  private readonly impl: NativeDatabase;

  constructor(path: string, options?: DatabaseSyncOptions) {
    const normalized: Record<string, unknown> = {};
    if (options) {
      // Bun only accepts `readonly`; Node accepts both. Always emit `readonly`
      // so the same options bag works in either runtime. Bun's `Database`
      // treats `readonly` as a file-open flag: `readonly: true` opens read-only,
      // while `readonly: false` is rejected with SQLITE_MISUSE (the default
      // read-write mode needs no flag). We therefore only set the flag when the
      // caller actually wants read-only mode.
      const wantsReadOnly =
        options.readOnly === true || options.readonly === true;
      if (wantsReadOnly) normalized.readonly = true;
      for (const key of Object.keys(options)) {
        if (key === "readOnly" || key === "readonly") continue;
        normalized[key] = options[key];
      }
    }
    // Bun's Database rejects an empty options object with SQLITE_MISUSE, so
    // only pass the bag when it carries at least one normalised option. Node
    // accepts either form.
    this.impl = Object.keys(normalized).length > 0
      ? new NATIVE_CTOR(path, normalized)
      : new NATIVE_CTOR(path);
  }

  exec(sql: string): unknown {
    return this.impl.exec(sql);
  }

  prepare(sql: string): StatementSync {
    return this.impl.prepare(sql);
  }

  close(): unknown {
    return this.impl.close();
  }
}

/** The runtime this helper resolved to, for diagnostics and tests. */
export const databaseSyncRuntime = RUNTIME;
