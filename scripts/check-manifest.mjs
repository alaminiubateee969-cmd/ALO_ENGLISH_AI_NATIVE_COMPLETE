#!/usr/bin/env node
/**
 * scripts/check-manifest.mjs — repository integrity preflight for CI.
 *
 * Every check here corresponds to a defect that has actually broken this
 * repository. Each one is deterministic, needs no network, and exits non-zero
 * so CI cannot go green past it.
 *
 *   1. package.json must parse (a missing comma once failed `bun install`
 *      with a bare "exit code 1" and skipped every later step).
 *   2. package.json must not repeat a key (JSON.parse silently keeps the last,
 *      so an edited script can silently replace the original).
 *   3. bun.lock must exist, and package-lock.json must agree with
 *      package.json. This repo carries both lockfiles — bun for CI, npm for
 *      Hostinger — and drift in either one breaks a deploy.
 *   4. Every file an npm script points at must exist. Stale `node x.mjs`
 *      references once pointed at seed files that were never created.
 *   5. No source file may contain merge-conflict markers. A botched merge
 *      once left five syntax errors in a page component.
 *   6. No GitHub workflow may contain VPS/SSH deployment directives. Hostinger
 *      is the only production deployment path.
 *   7. Required production files must be present.
 *
 * Run:  node scripts/check-manifest.mjs
 * Exit: 0 when every check passes, 1 otherwise.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const inActions = Boolean(process.env.GITHUB_ACTIONS);

const failures = [];

/** Record a failure as a CI annotation when running in Actions. */
function fail(message) {
  failures.push(message);
  console.log(inActions ? `::error ::${message}` : `error: ${message}`);
}

/** Read a file relative to the repo root, or null when absent. */
function read(rel) {
  try {
    return readFileSync(join(ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

/**
 * Report duplicate keys anywhere in a JSON document.
 *
 * A small stack-based scanner rather than a regex, so braces and escaped
 * quotes inside string values cannot throw off the depth count.
 *
 * @param {string} text raw JSON source
 * @returns {string[]} human-readable "path.key" offenders
 */
function findDuplicateKeys(text) {
  const duplicates = [];
  /** Stack of { keys: Set<string>|null, expectKey: boolean, name: string }. */
  const stack = [];
  let path = "$";
  let inString = false;
  let escaped = false;
  let currentKey = null;
  let pendingKey = null;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        if (currentKey !== null) currentKey += char;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
        if (currentKey !== null) {
          pendingKey = currentKey;
          currentKey = null;
        }
      } else if (currentKey !== null) {
        currentKey += char;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      if (stack.length > 0 && stack[stack.length - 1].expectKey) currentKey = "";
      continue;
    }
    if (char === "{") {
      stack.push({ keys: new Set(), expectKey: true, name: pendingKey ?? path });
      pendingKey = null;
      continue;
    }
    if (char === "[") {
      stack.push({ keys: null, expectKey: false, name: path });
      continue;
    }
    if (char === "}" || char === "]") {
      const closed = stack.pop();
      if (closed) path = closed.name;
      continue;
    }
    if (char === ":" && stack.length > 0 && pendingKey !== null) {
      const frame = stack[stack.length - 1];
      if (frame.keys) {
        if (frame.keys.has(pendingKey)) duplicates.push(`${frame.name}.${pendingKey}`);
        frame.keys.add(pendingKey);
      }
      path = `${frame.name}.${pendingKey}`;
      pendingKey = null;
      frame.expectKey = false;
      continue;
    }
    if (char === "," && stack.length > 0) {
      const frame = stack[stack.length - 1];
      frame.expectKey = frame.keys !== null;
      pendingKey = null;
    }
  }

  return duplicates;
}

/** Walk a directory tree, skipping build output and dependencies. */
function walk(rel, out = []) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) return out;
  for (const entry of readdirSync(abs)) {
    if (["node_modules", ".next", ".git", "dist", "out", ".turbo"].includes(entry)) continue;
    const child = join(rel, entry);
    if (statSync(join(ROOT, child)).isDirectory()) walk(child, out);
    else out.push(child);
  }
  return out;
}

// ─── 1–3: package.json and lockfiles ──────────────────────────────────────

const raw = read("package.json");
let manifest = null;

if (raw === null) {
  fail("package.json is missing");
} else {
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    fail(`package.json is not valid JSON: ${error.message}`);
  }

  const duplicates = findDuplicateKeys(raw);
  if (duplicates.length > 0) {
    fail(
      `package.json has duplicate key${duplicates.length > 1 ? "s" : ""}: ${duplicates.join(", ")} — JSON.parse keeps only the last value`,
    );
  }
}

if (!existsSync(join(ROOT, "bun.lock"))) {
  fail("bun.lock is missing — commit the lockfile so installs are reproducible");
}

if (existsSync(join(ROOT, "package-lock.json")) && manifest) {
  let lock = null;
  try {
    lock = JSON.parse(read("package-lock.json"));
  } catch (error) {
    fail(`package-lock.json could not be parsed: ${error.message}`);
  }
  if (lock) {
    const lockRoot = lock.packages?.[""] ?? {};
    const drifted = [];
    for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
      const wanted = manifest[section] ?? {};
      const recorded = lockRoot[section] ?? {};
      for (const [name, range] of Object.entries(wanted)) {
        if (recorded[name] !== range) {
          drifted.push(
            `${name} (${section}): package.json says "${range}", lockfile says "${recorded[name] ?? "absent"}"`,
          );
        }
      }
      for (const name of Object.keys(recorded)) {
        if (!(name in wanted)) drifted.push(`${name} (${section}): in lockfile but not in package.json`);
      }
    }
    if (drifted.length > 0) {
      fail(`package-lock.json is out of sync with package.json — re-run \`npm install\` and commit it:\n  ${drifted.join("\n  ")}`);
    }
  }
}

// ─── 4: every file an npm script points at must exist ─────────────────────

if (manifest) {
  const targets = [];
  const commands = { ...(manifest.scripts ?? {}) };
  if (manifest.prisma?.seed) commands["prisma.seed"] = manifest.prisma.seed;

  for (const [name, command] of Object.entries(commands)) {
    if (typeof command !== "string") continue;
    // Split compound commands so `a && b || c` is checked piece by piece.
    for (const segment of command.split(/&&|\|\||;|\|/)) {
      const tokens = segment.trim().split(/\s+/);
      for (let i = 0; i < tokens.length - 1; i += 1) {
        const runner = tokens[i];
        const arg = tokens[i + 1];
        if (!["node", "bun", "bash", "sh", "npx"].includes(runner)) continue;
        if (arg === "run") continue; // `bun run script-name`
        if (!arg.includes("/")) continue; // a flag or a package name, not a path
        if (!/\.(ts|tsx|mjs|cjs|js|sh)$/.test(arg)) continue;
        // Build outputs are produced by `npm run build`, not checked in.
        if (/^(?:\.next|dist|out|build|\.turbo)\//.test(arg)) continue;
        targets.push({ script: name, file: arg });
      }
    }
  }

  for (const { script, file } of targets) {
    if (!existsSync(join(ROOT, file))) {
      fail(`npm script "${script}" points at ${file}, which does not exist`);
    }
  }
}

// ─── 5: merge-conflict markers ────────────────────────────────────────────

const sourceFiles = [
  ...walk("src"),
  ...walk("prisma"),
  ...walk("scripts"),
  ...walk(".github"),
].filter((f) => /\.(ts|tsx|js|mjs|cjs|sh|yml|yaml|prisma)$/.test(f));

const markerRe = /^(<{7}|>{7})(\s|$)/;
for (const file of sourceFiles) {
  const text = read(file);
  if (text === null) continue;
  const line = text.split("\n").findIndex((l) => markerRe.test(l));
  if (line !== -1) fail(`${file}:${line + 1} contains a merge-conflict marker`);
}

// ─── 6: no VPS/SSH deployment in GitHub Actions ───────────────────────────

const workflowFiles = walk(".github/workflows").filter((f) => /\.ya?ml$/.test(f));
const forbidden = [
  [/VPS_HOST/, "VPS_HOST"],
  [/VPS_USER/, "VPS_USER"],
  [/VPS_SSH_KEY/, "VPS_SSH_KEY"],
  [/\brsync\b/, "rsync"],
  [/\bscp\b/, "scp"],
  [/\bpm2\b/i, "pm2"],
  [/appleboy\/ssh-action/, "ssh-action"],
];
for (const file of workflowFiles) {
  // Comment lines document the retired VPS pipeline on purpose; only actual
  // workflow directives count.
  const text = (read(file) ?? "")
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  for (const [pattern, label] of forbidden) {
    if (pattern.test(text)) {
      fail(`${file} contains "${label}" — Hostinger is the only production deployment path; Actions is CI only`);
    }
  }
}

// ─── 7: required production files ─────────────────────────────────────────

const required = [
  "package.json",
  "next.config.ts",
  "prisma/schema.prisma",
  "hostinger.json",
  ".env.example",
  "src/app/api/health/route.ts",
  "src/app/layout.tsx",
  "src/lib/db.ts",
];
for (const file of required) {
  if (!existsSync(join(ROOT, file))) fail(`required production file missing: ${file}`);
}

// ─── Report ───────────────────────────────────────────────────────────────

if (failures.length > 0) {
  console.log(`\nManifest preflight failed with ${failures.length} problem(s).`);
  process.exit(1);
}

console.log(
  `Manifest preflight passed: ${sourceFiles.length} source files scanned, ` +
    `${workflowFiles.length} workflow(s) checked, scripts and lockfiles consistent.`,
);
