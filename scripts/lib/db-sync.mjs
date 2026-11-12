/**
 * scripts/lib/db-sync.mjs — cross-runtime SQLite DatabaseSync (ESM variant).
 *
 * WHY THIS EXISTS
 * ───────────────
 * The .mjs scripts under `scripts/` (e.g. `import-question-bank.mjs`) run under
 * Node in production, where `node:sqlite` ships `DatabaseSync`. The test suite
 * imports those scripts to exercise them under `bun test`, and Bun does not
 * resolve `node:sqlite` — it ships its own `bun:sqlite` module whose `Database`
 * class exposes the same `exec` / `prepare` / `run` / `get` / `close` surface
 * the scripts rely on.
 *
 * Importing `node:sqlite` directly therefore breaks `bun test` at module
 * resolution time. This helper mirrors `src/lib/db-sync.ts`: it resolves the
 * right native class for the current runtime, normalises the read-only option
 * spelling (Node accepts `readOnly`, Bun requires `readonly`), and exposes a
 * `DatabaseSync` class the scripts can use unchanged.
 *
 * Usage:
 *   import { DatabaseSync } from "./lib/db-sync.mjs";
 *   const db = new DatabaseSync(path, { readOnly: true });
 *   db.exec("CREATE TABLE t (x INTEGER)");
 *   db.prepare("INSERT INTO t VALUES (?)").run(1);
 *   const row = db.prepare("SELECT COUNT(*) AS n FROM t").get();
 *   db.close();
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let NativeCtor = null;
let runtime = "none";

try {
  // Preferred: Node's built-in node:sqlite (DatabaseSync). Production runtime.
  NativeCtor = require("node:sqlite").DatabaseSync;
  runtime = "node";
} catch {
  try {
    // Fallback: Bun's built-in bun:sqlite, used when tests run under `bun test`.
    NativeCtor = require("bun:sqlite").Database;
    runtime = "bun";
  } catch {
    NativeCtor = null;
    runtime = "none";
  }
}

if (!NativeCtor) {
  throw new Error(
    "No native SQLite module available: scripts/lib/db-sync.mjs requires Node 22.5+ (node:sqlite) or Bun (bun:sqlite).",
  );
}

const NATIVE_CTOR = NativeCtor;
export const databaseSyncRuntime = runtime;

/**
 * Cross-runtime SQLite database handle. Wraps the native class picked above
 * and normalises option names so callers can use the Node-style `readOnly`
 * flag in both runtimes.
 */
export class DatabaseSync {
  constructor(path, options) {
    const normalized = {};
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
    this._impl = Object.keys(normalized).length > 0
      ? new NATIVE_CTOR(path, normalized)
      : new NATIVE_CTOR(path);
  }

  exec(sql) {
    return this._impl.exec(sql);
  }

  prepare(sql) {
    return this._impl.prepare(sql);
  }

  close() {
    return this._impl.close();
  }
}
