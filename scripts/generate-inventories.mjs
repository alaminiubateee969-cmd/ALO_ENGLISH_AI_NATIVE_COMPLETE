#!/usr/bin/env node
/**
 * scripts/generate-inventories.mjs — regenerate the four inventory CSVs.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The inventories in the repository root were generated once, by hand, and then
 * left. By 2026-10-08 they claimed 25 Prisma models against 44 in the schema,
 * 51 API endpoints against 73 route files, and a file manifest whose "Category"
 * column was the filename and whose "Size" column was the literal string
 * "unknown". An inventory that is wrong is worse than no inventory: it is the
 * first thing someone trusts when they are trying to work out what a system
 * does.
 *
 * These are derived from source, so they can be regenerated rather than
 * maintained:
 *
 *   DATABASE_MODEL_INVENTORY.csv   from prisma/schema.prisma
 *   API_INVENTORY.csv              from src/app/api/**\/*.ts route handlers
 *   ROUTE_INVENTORY.csv            from src/app/**\/page.tsx + src/proxy.ts
 *   FILE_MANIFEST.csv              from tracked plus non-ignored worktree files
 *
 * Run:  node scripts/generate-inventories.mjs [--check]
 *   --check   regenerate in memory and exit 1 if any file differs from what is
 *             committed, instead of writing. For CI, so these cannot drift.
 * Exit: 0 on success (or on --check with no drift), 1 otherwise.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK_ONLY = process.argv.includes("--check");

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** RFC-4180-ish: quote anything containing a comma, quote or newline. */
function csv(rows) {
  return (
    rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(","),
      )
      .join("\n") + "\n"
  );
}

// ─── 1. Prisma models ──────────────────────────────────────────────────────

function modelInventory() {
  const schema = read("prisma/schema.prisma");
  const lines = schema.split("\n");
  const rows = [["Model", "Category", "ScalarFields", "Relations", "Identifiers", "Indexes"]];

  const modelNames = new Set(
    [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]),
  );

  let category = "(uncategorised)";
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    // Section headers look like: // ═══ Authentication & RBAC ═══════...
    const header = line.match(/^\s*\/\/\s*═+\s*(.+?)\s*═*\s*$/);
    if (header) {
      category = header[1].trim();
      index += 1;
      continue;
    }

    const model = line.match(/^model\s+(\w+)\s*\{/);
    if (!model) {
      index += 1;
      continue;
    }

    const name = model[1];
    let scalars = 0;
    let relations = 0;
    const identifiers = [];
    const indexes = [];

    index += 1;
    while (index < lines.length && !/^\}/.test(lines[index])) {
      const body = lines[index].trim();
      index += 1;
      if (!body || body.startsWith("//") || body.startsWith("///")) continue;

      if (body.startsWith("@@")) {
        const unique = body.match(/^@@unique\(\[([^\]]*)\]/);
        const idx = body.match(/^@@index\(\[([^\]]*)\]/);
        if (unique) identifiers.push(`@@unique(${unique[1].replace(/\s+/g, "")})`);
        else if (idx) indexes.push(`@@index(${idx[1].replace(/\s+/g, "")})`);
        continue;
      }

      const field = body.match(/^(\w+)\s+([\w.]+)(\[\])?\??/);
      if (!field) continue;
      const [, fieldName, type, isList] = field;

      const isRelation =
        body.includes("@relation") || modelNames.has(type) || Boolean(isList && modelNames.has(type));
      if (isRelation) relations += 1;
      else scalars += 1;

      if (/@id\b/.test(body)) identifiers.push(`${fieldName} (@id)`);
      else if (/@unique\b/.test(body)) identifiers.push(`${fieldName} (@unique)`);
      if (/@index\b/.test(body) && !/@unique\b/.test(body)) indexes.push(fieldName);
    }

    rows.push([
      name,
      category,
      scalars,
      relations,
      identifiers.join("; ") || "-",
      indexes.join("; ") || "-",
    ]);
  }

  return { file: "DATABASE_MODEL_INVENTORY.csv", text: csv(rows), count: rows.length - 1 };
}

// ─── 2. API routes ─────────────────────────────────────────────────────────

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Turn `src/app/api/crm/leads/[id]/route.ts` into `/api/crm/leads/{id}`. */
function routePath(file) {
  const rel = file.slice(join(ROOT, "src/app").length + 1);
  const withoutFile = rel.replace(/\/route\.ts$/, "").replace(/\/page\.tsx$/, "");
  return (
    "/" +
    withoutFile
      .split("/")
      .map((segment) => {
        const catchAll = segment.match(/^\[\[\.\.\.(\w+)\]\]$/);
        if (catchAll) return `{...${catchAll[1]}}`;
        const spread = segment.match(/^\[\.\.\.(\w+)\]$/);
        if (spread) return `{...${spread[1]}}`;
        const param = segment.match(/^\[(\w+)\]$/);
        if (param) return `{${param[1]}}`;
        return segment;
      })
      .join("/")
  );
}

function authLevel(source, path) {
  // This route deliberately exposes its read method while restricting writes.
  // A path-only label would otherwise hide that access-control split.
  if (path === "/api/rag/materials") return "mixed: GET public; POST ADMIN+SUPER_ADMIN";

  const directRoleCalls = [...source.matchAll(/requireRole\(([^)]*)\)/g)];
  if (directRoleCalls.length) {
    const roles = [...directRoleCalls[0][1].matchAll(/["']([A-Z_]+)["']/g)].map((m) => m[1]);
    if (roles.length) return `role:${[...new Set(roles)].join("+")}`;
  }
  if (/requireRoles?\(/.test(source)) return "role:multiple";
  const crudRole = source.match(/\broleName\s*:\s*["']([A-Z_]+)["']/);
  if (crudRole && /create(?:List|Create|GetById|Update|Delete)Handler\s*\(/.test(source)) {
    const extra = crudRole[1] === "ADMIN" ? "+SUPER_ADMIN" : "";
    return `role:${crudRole[1]}${extra} (shared CRUD helper)`;
  }
  if (/requirePermission\(/.test(source)) return "permission-based";
  if (/requireSession\(/.test(source)) return "authenticated (RBAC session)";
  if (/requireAuth\(/.test(source)) return "authenticated";
  if (/requireSuperAdmin|SUPER_ADMIN/.test(source)) return "role:SUPER_ADMIN";
  // The source allowlist documents intended public paths; it is not enforced
  // by the proxy. Treat this label as an inventory hint, not an access-control
  // guarantee.
  return isPublicApi(path) ? "public intended (allowlist; verify handler)" : "none declared";
}

/**
 * src/proxy.ts contains a list of regexes documenting intended public API
 * paths. They are read from source rather than copied here. The proxy does not
 * enforce authentication; route-handler checks remain the access-control layer.
 */
const PUBLIC_API_PATTERNS = [];
try {
  const proxy = read("src/proxy.ts");
  const block = proxy.match(/PUBLIC_API_PATTERNS\s*=\s*\[([\s\S]*?)\];/);
  if (block) {
    for (const rawLine of block[1].split("\n")) {
      const line = rawLine.replace(/\/\/.*$/, "").trim();
      const literal = line.match(/^\/(.+)\/([gimsuy]*),?$/);
      if (literal) PUBLIC_API_PATTERNS.push(new RegExp(literal[1], literal[2]));
    }
  }
} catch {
  // A parse failure only costs the Auth column its "public" label; it must not
  // stop the inventories from being generated at all.
}

function isPublicApi(path) {
  return PUBLIC_API_PATTERNS.some((pattern) => pattern.test(path));
}

function apiInventory() {
  const apiRoot = join(ROOT, "src/app/api");
  const files = walk(apiRoot).filter((f) => f.endsWith("route.ts")).sort();
  const rows = [["Path", "Methods", "Auth", "Runtime", "Source"]];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const methods = HTTP_METHODS.filter((m) =>
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${m}\\b`).test(source) ||
      new RegExp(`export\\s+const\\s+${m}\\s*=`).test(source),
    );
    const runtime = (source.match(/export\s+const\s+runtime\s*=\s*["'](\w+)["']/) || [, "nodejs"])[1];
    const path = routePath(file);
    rows.push([
      path,
      methods.join(" ") || "(none exported)",
      authLevel(source, path),
      runtime,
      file.slice(ROOT.length + 1),
    ]);
  }

  const header = rows.shift();
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return {
    file: "API_INVENTORY.csv",
    text: csv([header, ...rows]),
    count: rows.length,
  };
}

// ─── 3. Pages ──────────────────────────────────────────────────────────────

function routeInventory() {
  const appRoot = join(ROOT, "src/app");
  const files = walk(appRoot).filter((f) => f.endsWith("page.tsx")).sort();
  const proxy = existsSync(join(ROOT, "src/proxy.ts")) ? read("src/proxy.ts") : "";
  const publicPages = new Set(
    [...proxy.matchAll(/^\s*["'](\/[^"']*)["'],?\s*$/gm)].map((m) => m[1]),
  );

  const rows = [["Path", "Access", "Rendering", "Source"]];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const derived = routePath(file);
    const path = derived === "/" || derived === "" ? "/" : derived;

    let rendering = "static (prerendered)";
    if (/force-dynamic/.test(source)) rendering = "dynamic (per request)";
    else if (/export\s+const\s+revalidate\s*=/.test(source)) rendering = "ISR";
    else if (/\buse client\b/.test(source)) rendering = "static shell + client";

    rows.push([
      path,
      publicPages.has(path) ? "public (page allowlist)" : "not public allowlisted; page guard required",
      rendering,
      file.slice(ROOT.length + 1),
    ]);
  }

  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return {
    file: "ROUTE_INVENTORY.csv",
    text: csv([rows[0], ...rows.slice(1)]),
    count: rows.length - 1,
  };
}

// ─── 4. File manifest, by directory ────────────────────────────────────────

const PURPOSE = {
  "src/app": "App Router: pages, layouts and API route handlers",
  "src/components": "React components (alo/, ai-os/, site/, ui/ shadcn primitives)",
  "src/lib": "Server libraries: db, auth, rbac, paths, exam engine, AI agents",
  "src/hooks": "Client hooks",
  prisma: "Schema, migrations and seed scripts — the only way to provision prod",
  public: "Static assets, copied into .next/standalone by the build",
  scripts: "Build, verification, backup and seeding tooling",
  tests: "bun test suites run by CI",
  docs: "Architecture decisions, audits and archived documentation",
  "server-config": "Optional self-managed deployment (systemd, Caddy, nginx)",
  "mini-services": "Optional standalone sidecar services, not deployed by default",
  examples: "Reference examples, not part of the build",
  "cpanel-production": "Legacy PHP deliverables, served to SUPER_ADMIN by /api/deliverable*",
  ".github": "CI and deployment-readiness workflows",
  db: "Runtime database directory (contents git-ignored)",
  upload: "Runtime uploads (contents git-ignored)",
  download: "Runtime downloads (contents git-ignored)",
  ".zscripts": "Local dev/build/start helpers for the optional self-managed path",
  src: "TypeScript sources outside app/, components/, hooks/ and lib/",
  "(root)": "Application config, entry point and top-level documentation",
};

function fileManifest() {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 64e6 })
    .toString()
    .split("\0")
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: ROOT, maxBuffer: 64e6 })
    .toString()
    .split("\0")
    .filter(Boolean);
  const files = [...new Set([...tracked, ...untracked])].sort();

  const groups = new Map();
  for (const rel of files) {
    const parts = rel.split("/");
    let key;
    if (parts.length === 1) key = "(root)";
    else if (parts[0] === "src" && parts.length > 2) key = `src/${parts[1]}`;
    else key = parts[0];

    let bytes = 0;
    try {
      bytes = statSync(join(ROOT, rel)).size;
    } catch {
      /* deleted in the working tree but still tracked — counted at 0 */
    }
    const group = groups.get(key) ?? { files: 0, bytes: 0 };
    group.files += 1;
    group.bytes += bytes;
    groups.set(key, group);
  }

  // Only the file COUNT is committed, not the byte total. A byte column would
  // make this gate fail on any edit to any file in the repository, which is
  // noise: the drift worth catching is a directory gaining or losing files
  // without the manifest following. The total is still computed and printed,
  // because "how much does the host clone" is a useful number to see.
  const rows = [["Directory", "Files", "Purpose"]];
  for (const [key, group] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.push([key, group.files, PURPOSE[key] ?? ""]);
  }

  const totalFiles = files.length;
  const totalBytes = [...groups.values()].reduce((sum, g) => sum + g.bytes, 0);
  rows.push(["TOTAL", totalFiles, "Tracked and intended worktree content for a deploy"]);

  return {
    file: "FILE_MANIFEST.csv",
    text: csv(rows),
    count: rows.length - 2,
    note: `${totalFiles} tracked files, ${(totalBytes / 1048576).toFixed(1)} MB`,
  };
}

// ─── Write ─────────────────────────────────────────────────────────────────

const MAX_DIFF_LINES = 12;

/** Cheap ordered line comparison: enough to show a reviewer what moved. */
function diffLines(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] === b[i]) continue;
    if (a[i] !== undefined) out.push(`- ${a[i]}`);
    if (b[i] !== undefined) out.push(`+ ${b[i]}`);
  }
  return out;
}

const inventories = [modelInventory(), apiInventory(), routeInventory(), fileManifest()];
const drift = [];

for (const inventory of inventories) {
  const path = join(ROOT, inventory.file);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;

  if (CHECK_ONLY) {
    if (current !== inventory.text) {
      drift.push(inventory.file);
      console.log(`::error ::${inventory.file} is stale — run: node scripts/generate-inventories.mjs`);
      // Naming the file is not enough to act on from a CI annotation, so show
      // what the source now says against what is committed.
      console.log(`    committed → generated, first ${MAX_DIFF_LINES} differing lines:`);
      for (const line of diffLines(current ?? "", inventory.text).slice(0, MAX_DIFF_LINES)) {
        console.log(`      ${line}`);
      }
    } else {
      console.log(`  ✓ ${inventory.file} up to date (${inventory.count} rows)`);
    }
    continue;
  }

  writeFileSync(path, inventory.text);
  const verb = current === null ? "created" : current === inventory.text ? "unchanged" : "updated";
  console.log(`  ${verb} ${inventory.file} (${inventory.count} rows${inventory.note ? `, ${inventory.note}` : ""})`);
}

if (CHECK_ONLY && drift.length > 0) {
  console.error(`\n${drift.length} inventory file(s) drifted from source: ${drift.join(", ")}`);
  process.exit(1);
}

console.log(
  CHECK_ONLY
    ? "\nAll inventories match the source they are generated from."
    : "\nInventories regenerated from source.",
);
