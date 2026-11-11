#!/usr/bin/env node
/**
 * server.js — repository-root production entry point.
 *
 * WHY THIS EXISTS
 * ───────────────
 * A Next.js `output: "standalone"` build puts its server at
 * `.next/standalone/server.js`. Hosting panels ask for a single "application
 * entry file", and that path changes shape between builds and is easy to leave
 * blank — which is how an app ends up deployed but never started.
 *
 * This file is a stable entry point that never moves. It applies sane defaults,
 * checks that a build actually exists, and then hands over to the standalone
 * server. Both of these are equivalent and both are supported:
 *
 *   npm start                     (runs this file)
 *   node server.js                (panel entry file: server.js)
 *   node .next/standalone/server.js
 *
 * Note that the standalone server calls `process.chdir(__dirname)`, so
 * `process.cwd()` at runtime is `.next/standalone`. Application code must not
 * assume the working directory is the repository root — src/lib/paths.ts
 * resolves the app root for it.
 */

/* eslint-disable @typescript-eslint/no-require-imports --
   This file is a CommonJS bootstrap, not part of the Next.js module graph. No
   bundler ever sees it: the host runs `node server.js` directly, package.json
   declares no `"type": "module"`, and the thing it has to load —
   `.next/standalone/server.js` — is itself CommonJS. `import` would be wrong
   here, not just different. */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const STANDALONE_SERVER = path.join(ROOT, ".next", "standalone", "server.js");

if (!fs.existsSync(STANDALONE_SERVER)) {
  console.error("");
  console.error("══════════════════════════════════════════════════════════");
  console.error("  No production build found");
  console.error("══════════════════════════════════════════════════════════");
  console.error(`  Expected: ${STANDALONE_SERVER}`);
  console.error("");
  console.error("  Build it first:");
  console.error("    npm install");
  console.error("    npm run build");
  console.error("");
  console.error("══════════════════════════════════════════════════════════");
  console.error("");
  process.exit(1);
}

// Defaults the standalone server would otherwise fall back to anyway, set here
// so a missing panel variable is visible in one place and never silently
// binds to the wrong interface.
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = process.env.PORT || process.env.APP_PORT || "3000";

console.log(
  `[server] starting ALO English — NODE_ENV=${process.env.NODE_ENV} ` +
    `HOSTNAME=${process.env.HOSTNAME} PORT=${process.env.PORT}`,
);

require(STANDALONE_SERVER);
