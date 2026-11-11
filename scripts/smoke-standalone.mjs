#!/usr/bin/env node
/**
 * scripts/smoke-standalone.mjs — boot the built artifact and prove it serves.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Every gate in CI used to stop at "the build produced a file". That is not the
 * same as "the deployed app works", and the gap is where this project's worst
 * incidents lived: a build that succeeds and a server that cannot answer a
 * request, because the client bundles were never copied into the standalone
 * output, the Prisma engine was never traced, or the CSS pipeline silently
 * produced an empty stylesheet.
 *
 * This starts the real production server — `node server.js`, the same entry
 * point the host uses — against a throwaway data directory, and asserts:
 *
 *   1. the process boots and binds its port;
 *   2. `/` answers 200;
 *   3. the HTML links a Tailwind stylesheet AND that stylesheet is served with
 *      `content-type: text/css` and real bytes — this is the regression guard
 *      for the PostCSS/Turbopack failure that broke deploys, which presents as
 *      an unstyled site rather than a build error;
 *   4. a second public page answers 200 (routing, not just one prerender);
 *   5. `/api/health` answers with a JSON health document (the API layer and a
 *      Prisma client instantiation both work).
 *
 * A disconnected database is reported, not failed: health returns 503 by design
 * when it cannot reach the database, and this script may run before migrations.
 * What must never happen is a response that is not a health document at all.
 *
 * Run:  node scripts/smoke-standalone.mjs [--port 3111] [--timeout 90]
 * Exit: 0 when every assertion passes, 1 otherwise.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const argv = process.argv.slice(2);
function argValue(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  return index !== -1 && argv[index + 1] ? argv[index + 1] : fallback;
}

const PORT = Number(argValue("port", "3111"));
const TIMEOUT_SECONDS = Number(argValue("timeout", "90"));
const BASE = `http://127.0.0.1:${PORT}`;

const checks = [];
function record(name, passed, detail) {
  checks.push({ name, passed, detail });
  console.log(`  ${passed ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const dataDir = mkdtempSync(join(tmpdir(), "alo-standalone-smoke-"));

const child = spawn(process.execPath, [join(ROOT, "server.js")], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: String(PORT),
    APP_PORT: String(PORT),
    // Absolute, outside the build output — the configuration production should use.
    APP_DATA_DIR: dataDir,
    DATABASE_URL: process.env.DATABASE_URL || `file:${join(dataDir, "smoke.db")}`,
    AUTH_SECRET: process.env.AUTH_SECRET || "smoke-test-secret-not-used-in-production-000000",
  },
});

let serverOutput = "";
let exitedEarly = null;
child.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
child.on("exit", (code, signal) => {
  exitedEarly = { code, signal };
});

function tail(text, lines = 25) {
  return text.split("\n").slice(-lines).join("\n");
}

async function waitForServer() {
  const deadline = Date.now() + TIMEOUT_SECONDS * 1000;
  let lastError = "no attempt made";
  while (Date.now() < deadline) {
    if (exitedEarly) {
      throw new Error(
        `server exited during startup (code ${exitedEarly.code}, signal ${exitedEarly.signal})\n` +
          `--- server output ---\n${tail(serverOutput, 40)}`,
      );
    }
    try {
      await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(
    `server did not answer on ${BASE} within ${TIMEOUT_SECONDS}s (last error: ${lastError})\n` +
      `--- server output ---\n${tail(serverOutput, 40)}`,
  );
}

async function main() {
  console.log(`Booting production artifact: node server.js (port ${PORT}, data ${dataDir})`);
  await waitForServer();
  record("server boots and binds its port", true, `${BASE}`);

  // ─── 2 + 3: the home page and its stylesheet ───────────────────────────
  const home = await fetch(`${BASE}/`, { redirect: "manual" });
  record("GET / answers 200", home.status === 200, `status ${home.status}`);

  const html = home.status === 200 ? await home.text() : "";
  const cssHref = [...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1])[0];
  record("home page links a compiled stylesheet", Boolean(cssHref), cssHref ?? "no /_next/static/*.css link found");

  if (cssHref) {
    const css = await fetch(`${BASE}${cssHref}`);
    const body = await css.text();
    const type = css.headers.get("content-type") ?? "";
    // An empty or near-empty stylesheet is what a broken PostCSS/Tailwind pass
    // looks like once the build itself has been made to pass. Assert real bytes.
    const passed = css.status === 200 && type.includes("text/css") && body.length > 1000;
    record(
      "stylesheet is served as real CSS",
      passed,
      `status ${css.status}, ${type || "no content-type"}, ${(body.length / 1024).toFixed(1)} KB`,
    );
    if (passed) {
      const hasUtilities = /\.flex\b|--tw-|\.text-|\.bg-/.test(body);
      record("stylesheet contains Tailwind output", hasUtilities, hasUtilities ? "utilities present" : "no Tailwind utilities found");
    }
  }

  // ─── 4: a second public page ───────────────────────────────────────────
  const login = await fetch(`${BASE}/login`, { redirect: "manual" });
  record("GET /login answers 200", login.status === 200, `status ${login.status}`);

  // ─── 5: the API layer ──────────────────────────────────────────────────
  const health = await fetch(`${BASE}/api/health`);
  let healthBody = null;
  try {
    healthBody = await health.json();
  } catch {
    healthBody = null;
  }
  const isHealthDocument =
    healthBody !== null &&
    typeof healthBody === "object" &&
    ["healthy", "unhealthy"].includes(healthBody.status) &&
    healthBody.checks !== undefined;
  record(
    "GET /api/health returns a health document",
    isHealthDocument,
    isHealthDocument
      ? `status=${healthBody.status} database=${healthBody.checks.database} examTypes=${healthBody.checks.examTypes}`
      : `HTTP ${health.status}, body was not a health document`,
  );
  if (isHealthDocument && healthBody.status === "unhealthy") {
    console.log(
      "  · note: the database is not reachable from this smoke run. That is expected when\n" +
        "    migrations have not been applied; it is reported, not failed.",
    );
  }

  // ─── 6: static assets copied by finalize-standalone ────────────────────
  const logo = await fetch(`${BASE}/logo.svg`);
  record("GET /logo.svg (public/ copied into the artifact)", logo.status === 200, `status ${logo.status}`);
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  record("smoke run", false, error instanceof Error ? error.message : String(error));
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (!exitedEarly) child.kill("SIGKILL");
  rmSync(dataDir, { recursive: true, force: true });
}

const failed = checks.filter((check) => !check.passed);
console.log("");
if (failed.length > 0) {
  console.log(`Standalone smoke test FAILED: ${failed.length}/${checks.length} check(s) did not pass.`);
  console.log("--- last server output ---");
  console.log(tail(serverOutput, 40));
  exitCode = 1;
} else {
  console.log(`Standalone smoke test passed: ${checks.length}/${checks.length} checks green.`);
}
process.exit(exitCode);
