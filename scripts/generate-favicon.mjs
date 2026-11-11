#!/usr/bin/env node
/**
 * scripts/generate-favicon.mjs — build `public/favicon.ico` from the platform mark.
 *
 * WHY THIS EXISTS
 * ───────────────
 * `src/proxy.ts` has always listed `/favicon.ico` on the public allowlist, but
 * no favicon file existed anywhere in the repository, so every single page
 * load produced a 404 for it. The site had a logo (`public/logo.svg`) and no
 * icon.
 *
 * `src/app/icon.svg` (the Next.js file convention) covers modern browsers,
 * which read the `<link rel="icon">` tag Next injects. Browsers and tooling
 * that ask for `/favicon.ico` directly still get nothing, so the file is
 * generated here.
 *
 * HOW IT WORKS
 * ────────────
 * The mark is rasterised from SVG with sharp, then wrapped in an ICO
 * container. An ICO entry may carry a PNG payload directly (Vista and later);
 * every browser that still asks for /favicon.ico understands that.
 *
 * Run:  node scripts/generate-favicon.mjs
 * Exit: 0 on success, 1 on failure.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = join(ROOT, "src", "app", "icon.svg");
const OUTPUT = join(ROOT, "public", "favicon.ico");

if (!existsSync(SOURCE)) {
  console.error(`Source mark not found: ${SOURCE}`);
  process.exit(1);
}

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error("sharp is not installed. Run `npm install` first.");
  process.exit(1);
}

const svg = readFileSync(SOURCE, "utf8");

/** Rasterise one square size and return the PNG bytes. */
async function renderPng(size) {
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const SIZES = [16, 32, 48];
const entries = [];
for (const size of SIZES) {
  entries.push({ size, data: await renderPng(size) });
}

// ─── ICO container ─────────────────────────────────────────────────────────
// Header (6 bytes) + one 16-byte directory entry per image + the PNG payloads.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(entries.length, 4);

let offset = 6 + entries.length * 16;
const directory = [];
for (const entry of entries) {
  const dir = Buffer.alloc(16);
  dir.writeUInt8(entry.size === 256 ? 0 : entry.size, 0); // width
  dir.writeUInt8(entry.size === 256 ? 0 : entry.size, 1); // height
  dir.writeUInt8(0, 2); // palette colours (0 = truecolour)
  dir.writeUInt8(0, 3); // reserved
  dir.writeUInt16LE(1, 4); // colour planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(entry.data.length, 8);
  dir.writeUInt32LE(offset, 12);
  offset += entry.data.length;
  directory.push(dir);
}

const icon = Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]);
writeFileSync(OUTPUT, icon);

console.log(
  `Wrote public/favicon.ico (${SIZES.join(", ")} px, ${icon.length} bytes) from src/app/icon.svg`,
);
