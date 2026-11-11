#!/usr/bin/env node
/**
 * scripts/ensure-prisma-client.mjs — the `prebuild` gate.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The host runs exactly two commands per deploy: `npm install` and
 * `npm run build`. Generating the Prisma client used to be left to
 * `@prisma/client`'s `postinstall` hook, which fails silently — npm swallows
 * the output and continues — leaving `node_modules/.prisma/client` as the
 * un-generated stub. `next build` then dies much later, during page-data
 * collection, with:
 *
 *   @prisma/client did not initialize yet. Please run "prisma generate"
 *
 * That is a confusing place to discover a missing install step, and CI never
 * caught it because CI runs `db:generate` as its own explicit step. This makes
 * the generate step part of `npm run build` itself, so the host pipeline and CI
 * exercise the same thing, and so the failure is reported at the point where it
 * can still be acted on.
 *
 * Behaviour:
 *   - client already generated  → do nothing (keeps rebuilds fast)
 *   - client missing or a stub  → run `prisma generate`
 *   - generate fails            → exit 1 with the fix, not a bare stack trace
 *
 * Run:  node scripts/ensure-prisma-client.mjs
 * Exit: 0 when a usable client is present, 1 otherwise.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLIENT_DIR = join(ROOT, "node_modules", ".prisma", "client");

/** The un-generated stub Prisma ships inside @prisma/client. */
const STUB_MARKER = "did not initialize yet";

function read(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/**
 * Classify the installed client.
 * @returns {"missing"|"stub"|"generated"}
 */
function clientState() {
  const entry = read(join(CLIENT_DIR, "index.js"));
  if (entry === null) return "missing";
  if (entry.includes(STUB_MARKER)) return "stub";
  // A generated client always carries a copy of the schema next to it; the
  // query engine reads that file at runtime.
  if (!existsSync(join(CLIENT_DIR, "schema.prisma"))) return "stub";
  return "generated";
}

/** Names of any native/WASM query engine files that landed next to the client. */
function engineFiles() {
  try {
    return readdirSync(CLIENT_DIR).filter(
      (name) =>
        name.startsWith("libquery_engine") ||
        name.startsWith("query_engine") ||
        name.endsWith(".wasm"),
    );
  } catch {
    return [];
  }
}

function runGenerate() {
  const localBin = join(ROOT, "node_modules", ".bin", "prisma");
  const useLocal = existsSync(localBin);
  const command = useLocal ? localBin : "npx";
  const args = useLocal ? ["generate"] : ["--no-install", "prisma", "generate"];

  console.log(`[prebuild] generating Prisma client: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`[prebuild] could not start prisma: ${result.error.message}`);
    return false;
  }
  return result.status === 0;
}

const initial = clientState();

if (initial === "generated") {
  const engines = engineFiles();
  console.log(
    `[prebuild] Prisma client already generated${
      engines.length > 0 ? ` (${engines.length} engine file(s) present)` : ""
    } — skipping \`prisma generate\`.`,
  );
  if (engines.length === 0) {
    console.warn(
      "[prebuild] warning: no query engine file was found next to the generated client.\n" +
        "           The runtime needs it. If the app fails to boot with an engine error,\n" +
        "           delete node_modules/.prisma and re-run `npm install`.",
    );
  }
  process.exit(0);
}

console.log(
  `[prebuild] Prisma client is ${initial === "missing" ? "not installed" : "the un-generated stub"} — running \`prisma generate\`.`,
);

if (!runGenerate()) {
  console.error("");
  console.error("[prebuild] `prisma generate` FAILED. The build cannot continue.");
  console.error("");
  console.error("  Most likely causes, in order:");
  console.error("   1. No network access to https://binaries.prisma.sh — Prisma downloads");
  console.error("      its query engine on first generate. Allow that host, or pre-seed");
  console.error("      node_modules/.prisma/client from a machine that has it.");
  console.error("   2. prisma/schema.prisma has a syntax error. Reproduce with:");
  console.error("        npx prisma validate");
  console.error("   3. Dependencies were installed with --ignore-scripts and the engine");
  console.error("      was never fetched. Re-run:");
  console.error("        npm install");
  console.error("");
  process.exit(1);
}

const after = clientState();
if (after !== "generated") {
  console.error(
    `[prebuild] \`prisma generate\` reported success but ${CLIENT_DIR} is still ${after}.`,
  );
  console.error("           Refusing to build against an un-generated client.");
  process.exit(1);
}

console.log(`[prebuild] Prisma client generated (${engineFiles().length} engine file(s)).`);
