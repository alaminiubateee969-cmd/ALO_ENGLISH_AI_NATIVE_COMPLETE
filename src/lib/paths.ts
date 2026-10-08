/**
 * src/lib/paths.ts — the single place that decides where this app's files live.
 *
 * WHY THIS EXISTS
 * ───────────────
 * `next build` with `output: "standalone"` emits `.next/standalone/server.js`,
 * and that generated server runs `process.chdir(__dirname)` before it starts
 * listening. At runtime `process.cwd()` is therefore `<app>/.next/standalone`,
 * NOT the repository root.
 *
 * Every relative path in the app inherits that shift. The one that hurts most
 * is a `file:./db/production.db` DATABASE_URL: the running app opens
 * `<app>/.next/standalone/db/production.db`, while `prisma migrate deploy` —
 * run from the repository root — writes `<app>/db/production.db`. Two different
 * files. The symptom is a site that boots healthy and then reports an empty
 * database, and a redeploy that appears to wipe all data, because
 * `.next/standalone` is rebuilt from scratch on every push.
 *
 * These helpers resolve an app root that survives a redeploy and turn every
 * relative data path into an absolute one, so Prisma, the migration CLI and
 * the filesystem always agree about which file they are talking about.
 *
 * PRECEDENCE
 * ──────────
 * An absolute path always wins and is returned untouched. Production should
 * therefore set absolute values (DATABASE_URL, APP_DATA_DIR) in the host's
 * environment panel; the derivation below is the safety net for when it does
 * not.
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";

/**
 * True when this process was started from Next's generated standalone server.
 *
 * Two independent signals, because either one alone can be absent:
 *   - `__NEXT_PRIVATE_STANDALONE_CONFIG` is set by `.next/standalone/server.js`
 *     before it requires `next`.
 *   - the working directory ends in `.next/standalone` after the chdir.
 */
export function isStandaloneRuntime(): boolean {
  if (process.env.__NEXT_PRIVATE_STANDALONE_CONFIG) return true;
  const normalized = process.cwd().split(sep).join("/");
  return normalized.endsWith("/.next/standalone");
}

/**
 * The directory the repository was checked out into.
 *
 * In a standalone runtime `process.cwd()` is `<appRoot>/.next/standalone`, so
 * the app root is two levels up. Anywhere else (`next dev`, `next start`,
 * scripts, tests, CI) the working directory already is the app root.
 *
 * `APP_ROOT` overrides the derivation — useful when the build output is
 * published somewhere other than the checkout.
 */
export function getAppRoot(): string {
  const override = process.env.APP_ROOT?.trim();
  if (override) return resolve(override);
  const cwd = process.cwd();
  return isStandaloneRuntime() ? resolve(cwd, "..", "..") : resolve(cwd);
}

/**
 * The directory that persistent, user-owned data lives under.
 *
 * Defaults to the app root. Set `APP_DATA_DIR` in production to point at a
 * directory that the deploy pipeline never replaces — on Hostinger that is
 * anything outside the release directory.
 */
export function getDataRoot(): string {
  const override = process.env.APP_DATA_DIR?.trim();
  return resolve(override || getAppRoot());
}

/** Turn a possibly-relative data path into an absolute one under the data root. */
export function resolveDataPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (isAbsolute(trimmed)) return resolve(trimmed);
  return resolve(getDataRoot(), trimmed);
}

/** Create a directory (and its parents) if it is missing. Never throws. */
export function ensureDir(dir: string): void {
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  } catch (error) {
    console.warn(
      `[paths] could not create ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** True when `target` lives inside the build output, which a redeploy replaces. */
function isInsideBuildOutput(target: string): boolean {
  const normalized = target.split(sep).join("/");
  return normalized.includes("/.next/") || normalized.includes("/node_modules/");
}

/**
 * Normalize a Prisma datasource URL to an absolute path and export it back into
 * `process.env` so the Prisma CLI, the query engine and any code reading
 * `process.env.DATABASE_URL` all see the same value.
 *
 * Only SQLite (`file:`) URLs are rewritten. MySQL/Postgres URLs are returned
 * untouched, and a missing value is returned as-is so Prisma reports the real
 * "environment variable not found" error instead of a misleading path.
 */
export function resolveDatabaseUrl(input?: string): string | undefined {
  const raw = input ?? process.env.DATABASE_URL;
  if (!raw || !raw.trim()) return raw;

  const value = raw.trim();
  if (!value.startsWith("file:")) return value;

  const specifier = value.slice("file:".length);
  if (!specifier) return value;

  // `file::memory:` and other non-path specifiers are left alone.
  if (specifier.startsWith(":")) return value;

  const [pathPart, ...queryParts] = specifier.split("?");
  const absolute = resolveDataPath(pathPart);
  const query = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";
  const resolved = `file:${absolute}${query}`;

  ensureDir(dirname(absolute));

  if (isInsideBuildOutput(absolute)) {
    console.warn(
      `[paths] DATABASE_URL resolves to ${absolute}, which is inside the build output and is ` +
        `replaced on every deploy. Set an absolute DATABASE_URL (or APP_DATA_DIR) in the host's ` +
        `environment panel so the database survives a release.`,
    );
  }

  process.env.DATABASE_URL = resolved;
  return resolved;
}

/**
 * Directory for runtime uploads (speaking recordings and similar).
 *
 * The previous default was `/tmp/alo-english-uploads`, which a container
 * restart discards. It now resolves under the data root unless UPLOAD_DIR says
 * otherwise, and the directory is created on first use.
 */
export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  const dir = configured ? resolveDataPath(configured) : join(getDataRoot(), "upload");
  ensureDir(dir);
  return dir;
}

/** Directory for database backups. Resolved the same way as the upload dir. */
export function getBackupDir(): string {
  const configured = process.env.BACKUP_DIR?.trim();
  return configured ? resolveDataPath(configured) : join(getDataRoot(), "db", "backup");
}
