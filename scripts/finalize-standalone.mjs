#!/usr/bin/env node
/**
 * scripts/finalize-standalone.mjs — assemble the deployable artifact.
 *
 * `next build` with `output: "standalone"` emits a minimal Node server plus a
 * traced subset of node_modules in `.next/standalone`. Next deliberately does
 * NOT copy three things into it, and the app does not work without them:
 *
 *   1. `.next/static`      — the client bundles. Without it every page renders
 *                             unstyled and unhydrated.
 *   2. `public`            — logo, robots.txt, images, listening audio.
 *   3. `prisma`            — schema.prisma + migrations, so
 *                             `prisma migrate deploy` can run against the
 *                             published artifact.
 *
 * This replaces the `cp -r ... && cp -r ...` chain that used to be inlined in
 * the build script. That chain failed silently in two ways: `cp -r src dst`
 * renames src when dst does not exist, and a second run nested the directories
 * (`.next/standalone/public/public`). This is idempotent, verifies what it
 * copied, and reports what the artifact contains.
 *
 * It also self-heals the one tracing gap that reliably breaks a Prisma deploy:
 * if the generated client (or its query engine) did not make it into the
 * standalone node_modules, it is copied across explicitly.
 *
 * Run:  node scripts/finalize-standalone.mjs
 * Exit: 0 when the artifact is complete, 1 otherwise.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const NEXT_DIR = join(ROOT, ".next");
const STANDALONE = join(NEXT_DIR, "standalone");

const failures = [];

function fail(message) {
  failures.push(message);
  console.error(`  ✗ ${message}`);
}

function ok(message) {
  console.log(`  ✓ ${message}`);
}

function entryCount(dir) {
  let count = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else count += 1;
    }
  }
  return count;
}

function sizeMb(dir) {
  let bytes = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else {
        try {
          bytes += statSync(full).size;
        } catch {
          /* a file that vanished mid-walk is not worth failing a build over */
        }
      }
    }
  }
  return (bytes / (1024 * 1024)).toFixed(1);
}

/**
 * Replace `destination` with a fresh copy of `source`.
 * Idempotent: safe to run repeatedly against the same build output.
 */
function copyTree(source, destination, label, { required = true } = {}) {
  if (!existsSync(source)) {
    if (required) fail(`${label}: source ${source} does not exist`);
    else console.log(`  · ${label}: nothing to copy (${source} absent)`);
    return false;
  }

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, dereference: true, errorOnExist: false });

  const copied = entryCount(destination);
  if (copied === 0) {
    fail(`${label}: copied ${source} but the destination is empty`);
    return false;
  }
  ok(`${label}: ${copied} file(s) → ${destination.replace(ROOT + "/", "")}`);
  return true;
}

console.log("Finalizing standalone deployment artifact");

// ─── 0: the build must have produced a standalone server ────────────────────

const server = join(STANDALONE, "server.js");
if (!existsSync(server)) {
  fail(
    `${server} is missing. \`output: "standalone"\` must be set in next.config.ts, ` +
      `and \`next build\` must have completed successfully.`,
  );
  console.error(`\nStandalone finalization failed with ${failures.length} problem(s).`);
  process.exit(1);
}
ok(`standalone server present: .next/standalone/server.js`);

// ─── 1: client bundles ──────────────────────────────────────────────────────

copyTree(join(NEXT_DIR, "static"), join(STANDALONE, ".next", "static"), "client bundles");

// ─── 2: public assets ───────────────────────────────────────────────────────

copyTree(join(ROOT, "public"), join(STANDALONE, "public"), "public assets");

// ─── 3: prisma schema + migrations ─────────────────────────────────────────

copyTree(join(ROOT, "prisma"), join(STANDALONE, "prisma"), "prisma schema/migrations");

// ─── 4: self-heal Prisma client tracing ────────────────────────────────────
//
// The query engine is downloaded into node_modules/.prisma/client at generate
// time and is not reachable by static analysis, so file tracing occasionally
// leaves it behind. A standalone bundle without it boots and then throws
// "PrismaClient is unable to run in this browser environment" on the first
// query — i.e. after the deploy has already been reported as successful.
// Copy it across explicitly; this is a no-op when tracing already did its job.

const generatedClient = join(ROOT, "node_modules", ".prisma", "client");
const tracedClient = join(STANDALONE, "node_modules", ".prisma", "client");

if (existsSync(join(generatedClient, "schema.prisma"))) {
  const tracedIsComplete =
    existsSync(join(tracedClient, "schema.prisma")) &&
    readdirSync(tracedClient).some(
      (name) => name.startsWith("libquery_engine") || name.startsWith("query_engine"),
    );

  if (tracedIsComplete) {
    ok("prisma client + query engine traced into the standalone bundle");
  } else {
    copyTree(generatedClient, tracedClient, "prisma client (tracing gap repaired)");
    const runtime = join(ROOT, "node_modules", "@prisma", "client");
    const tracedRuntime = join(STANDALONE, "node_modules", "@prisma", "client");
    if (existsSync(runtime) && !existsSync(join(tracedRuntime, "package.json"))) {
      copyTree(runtime, tracedRuntime, "@prisma/client runtime (tracing gap repaired)");
    }
  }
} else {
  fail(
    `node_modules/.prisma/client has no schema.prisma — the Prisma client was never generated. ` +
      `Run \`npm run db:generate\` (npm run build does this automatically via prebuild).`,
  );
}

// ─── Report ────────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`\nStandalone finalization failed with ${failures.length} problem(s).`);
  process.exit(1);
}

console.log(
  `\nArtifact ready: .next/standalone (${sizeMb(STANDALONE)} MB)\n` +
    `  start it with:  NODE_ENV=production node .next/standalone/server.js\n` +
    `  or from the repo root:  npm start`,
);
