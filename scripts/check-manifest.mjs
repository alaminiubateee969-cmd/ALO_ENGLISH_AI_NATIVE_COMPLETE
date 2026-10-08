#!/usr/bin/env node
/**
 * scripts/check-manifest.mjs — CI preflight for the package manifest.
 *
 * `bun install --frozen-lockfile` fails with a bare "exit code 1" for three
 * distinct and very common mistakes. This script names the one you made:
 *
 *   1. package.json is not valid JSON (a stray or missing comma),
 *   2. package.json has duplicate keys (JSON.parse silently keeps the last),
 *   3. bun.lock is missing, so installs are not reproducible.
 *
 * Run:  node scripts/check-manifest.mjs
 * Exit: 0 when the manifest is usable, 1 otherwise.
 */

import { readFileSync, existsSync } from "node:fs";

/** True when running inside GitHub Actions. */
const inActions = Boolean(process.env.GITHUB_ACTIONS);

/** Emit a message as a CI annotation when possible, plain text otherwise. */
function fail(message) {
  console.log(inActions ? `::error ::${message}` : `error: ${message}`);
}

/**
 * Report duplicate keys anywhere in a JSON document.
 *
 * JSON.parse accepts duplicates and keeps the last value, which hides a real
 * mistake: an edited script entry silently replaces the original. This is a
 * small stack-based scanner rather than a regex so braces and escaped quotes
 * inside strings cannot throw off the depth count.
 *
 * @param {string} text raw JSON source
 * @returns {string[]} human-readable "path.key" offenders
 */
function findDuplicateKeys(text) {
  const duplicates = [];
  /** Stack of { keys: Set<string>, path: string } per open object. */
  const stack = [];
  let path = "$";
  let inString = false;
  let escaped = false;
  /** Key currently being read, or null when not inside a key string. */
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
      // A quote is a key only when the enclosing object expects one, i.e.
      // right after '{' or after a ',' that followed a value.
      if (stack.length > 0 && stack[stack.length - 1].expectKey) {
        currentKey = "";
      }
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
      path = closed ? closed.name : path;
      continue;
    }

    if (char === ":" && stack.length > 0 && pendingKey !== null) {
      const frame = stack[stack.length - 1];
      if (frame.keys) {
        if (frame.keys.has(pendingKey)) {
          duplicates.push(`${frame.name}.${pendingKey}`);
        }
        frame.keys.add(pendingKey);
      }
      path = `${frame.name}.${pendingKey}`;
      pendingKey = null;
      frame.expectKey = false;
      continue;
    }

    if (char === "," && stack.length > 0) {
      const frame = stack[stack.length - 1];
      // Objects expect a key after a comma; arrays do not.
      frame.expectKey = frame.keys !== null;
      pendingKey = null;
    }
  }

  return duplicates;
}

function main() {
  let raw;
  try {
    raw = readFileSync("package.json", "utf8");
  } catch (error) {
    fail(`package.json could not be read: ${error.message}`);
    return 1;
  }

  let failures = 0;

  try {
    JSON.parse(raw);
  } catch (error) {
    fail(`package.json is not valid JSON: ${error.message}`);
    failures += 1;
  }

  const duplicates = findDuplicateKeys(raw);
  if (duplicates.length > 0) {
    fail(
      `package.json has duplicate key${duplicates.length > 1 ? "s" : ""}: ${duplicates.join(", ")} — JSON.parse keeps only the last value`,
    );
    failures += 1;
  }

  if (!existsSync("bun.lock")) {
    fail("bun.lock is missing — commit the lockfile so installs are reproducible");
    failures += 1;
  }

  // This repo carries two lockfiles: bun.lock for CI and package-lock.json for
  // Hostinger's `npm install`. Either one can drift from package.json when a
  // dependency is edited without re-running the installer, and the failure
  // surfaces much later as an opaque install error. Compare them here.
  if (existsSync("package-lock.json")) {
    let manifest;
    let lock;
    try {
      manifest = JSON.parse(raw);
      lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
    } catch (error) {
      fail(`package-lock.json could not be parsed: ${error.message}`);
      failures += 1;
    }

    if (manifest && lock) {
      const lockRoot = lock.packages?.[""] ?? {};
      const sections = ["dependencies", "devDependencies", "optionalDependencies"];
      const drifted = [];
      for (const section of sections) {
        const wanted = manifest[section] ?? {};
        const recorded = lockRoot[section] ?? {};
        for (const [name, range] of Object.entries(wanted)) {
          if (recorded[name] !== range) {
            drifted.push(`${name} (${section}): package.json says "${range}", lockfile says "${recorded[name] ?? "absent"}"`);
          }
        }
        for (const name of Object.keys(recorded)) {
          if (!(name in wanted)) {
            drifted.push(`${name} (${section}): in lockfile but no longer in package.json`);
          }
        }
      }
      if (drifted.length > 0) {
        fail(
          `package-lock.json is out of sync with package.json — re-run \`npm install\` and commit it:\n  ${drifted.join("\n  ")}`,
        );
        failures += 1;
      }
    }
  }

  if (failures > 0) {
    console.log(`Manifest preflight failed with ${failures} problem(s).`);
    return 1;
  }

  console.log(
    "Manifest preflight passed: package.json parses, no duplicate keys, lockfiles in sync.",
  );
  return 0;
}

process.exit(main());
