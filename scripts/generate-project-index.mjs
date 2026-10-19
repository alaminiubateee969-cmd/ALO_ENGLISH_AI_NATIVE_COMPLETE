#!/usr/bin/env node
/**
 * scripts/generate-project-index.mjs — regenerate PROJECT-INDEX.md from source.
 *
 * WHY THIS EXISTS
 * ───────────────
 * PROJECT-INDEX.md was written by hand and then left. By 2026-10-19 it claimed
 * 21 files under `src/components/ai-os/` (there are 20), 25 under
 * `src/components/alo/` (26), 42 under `src/components/ui/` (48), 7 Prisma
 * models (there are 46), 1 test file (14), 1 CI workflow (2) and 189+ files in
 * the repository (661). It also pointed at `src/middleware.ts`, which does not
 * exist — Next 16 renamed it to `src/proxy.ts`.
 *
 * An index that is wrong is worse than no index: it is the first thing
 * someone trusts when they are trying to work out what a system does. This
 * script derives the index from the same source the inventory CSVs use, so it
 * can be regenerated rather than maintained.
 *
 * Run:  node scripts/generate-project-index.mjs [--check]
 *   --check   regenerate in memory and exit 1 if the file differs from what is
 *             committed, instead of writing. For CI, so it cannot drift.
 * Exit: 0 on success (or on --check with no drift), 1 otherwise.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK_ONLY = process.argv.includes("--check");
const OUTPUT = join(ROOT, "PROJECT-INDEX.md");

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** Directories that are not part of the application source. */
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".arena",
  "cpanel-production",
  "docs/archive",
  "vendor",
  "mini-services",
  "examples",
]);

function walk(dir, out = [], filter = () => true) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".zscripts") continue;
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out, filter);
    else if (filter(full)) out.push(full);
  }
  return out;
}

function countFiles(dir, filter = () => true) {
  if (!existsSync(dir)) return 0;
  return walk(dir, [], filter).length;
}

function listNames(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => filter(join(dir, name)))
    .sort();
}

/** Count tracked files in the repository, ignoring the worktree noise. */
function trackedFileCount() {
  try {
    const out = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" });
    return out.split("\n").filter(Boolean).length;
  } catch {
    return 0;
  }
}

// ─── Source facts ─────────────────────────────────────────────────────────

const schema = read("prisma/schema.prisma");
const modelCount = (schema.match(/^model\s+\w+\s*\{/gm) || []).length;
const enumCount = (schema.match(/^enum\s+\w+\s*\{/gm) || []).length;

const migrationDirs = readdirSync(join(ROOT, "prisma", "migrations"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const routeFiles = countFiles(join(ROOT, "src", "app"), (f) => f.endsWith("route.ts"));
const pageFiles = countFiles(join(ROOT, "src", "app"), (f) => f.endsWith("page.tsx"));
const layoutFiles = countFiles(join(ROOT, "src", "app"), (f) => f.endsWith("layout.tsx"));
const apiDirs = readdirSync(join(ROOT, "src", "app", "api"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const componentGroups = [
  ["AI OS", "src/components/ai-os", "Hidden admin modules."],
  ["ALO Platform", "src/components/alo", "Public platform components."],
  ["Site", "src/components/site", "Public site sections."],
  ["Exam", "src/components/exam", "Exam-taking components."],
  ["Speaking", "src/components/speaking", "Speaking practice components."],
  ["shadcn/ui", "src/components/ui", "Component library."],
];

const libFiles = listNames(join(ROOT, "src", "lib"), (f) => statSync(f).isDirectory());
const testFiles = listNames(join(ROOT, "tests"), (f) => f.endsWith(".ts"));
const scriptFiles = listNames(join(ROOT, "scripts"), (f) => statSync(f).isFile());
const workflowFiles = listNames(join(ROOT, ".github", "workflows"), (f) => f.endsWith(".yml"));
const serverConfigFiles = listNames(join(ROOT, "server-config"), (f) => statSync(f).isFile());
const publicFiles = walk(join(ROOT, "public"), []).map((f) => relative(ROOT, f));
const publicImages = publicFiles.filter((f) => f.startsWith("public/images/"));
const docFiles = listNames(join(ROOT, "docs"), (f) => f.endsWith(".md"));
const rootDocs = [
  "README.md",
  "DEPLOYMENT.md",
  "HOSTINGER_DEPLOYMENT.md",
  "OPERATIONS.md",
  "TROUBLESHOOTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "API.md",
  "API_DOCUMENTATION.md",
  "VALIDATION-REPORT.md",
  "PROJECT-INDEX.md",
].filter((name) => existsSync(join(ROOT, name)));

const rootConfig = [
  "package.json",
  "bun.lock",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "eslint.config.mjs",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "components.json",
  ".env.example",
  ".gitignore",
  "Makefile",
  "next-env.d.ts",
  "server.js",
].filter((name) => existsSync(join(ROOT, name)));

const envExample = read(".env.example");
const envVarCount = (envExample.match(/^[A-Z_][A-Z0-9_]*=/gm) || []).length;

const totalTracked = trackedFileCount();

// ─── Render ───────────────────────────────────────────────────────────────

const lines = [];
const push = (...parts) => lines.push(...parts);

push(
  "# Project File Index",
  "",
  "> **Generated file.** Do not edit it by hand.",
  ">",
  "> Regenerate with `node scripts/generate-project-index.mjs`; verify with",
  "> `node scripts/generate-project-index.mjs --check` (wired into CI and",
  "> `make preflight`). It was hand-written once and then drifted — it claimed",
  "> 7 Prisma models against the real number, 1 test file against the real",
  "> number, and pointed at `src/middleware.ts`, which Next 16 replaced with",
  "> `src/proxy.ts`.",
  "",
  "A complete map of every file in this project, organized by purpose.",
  "",
);

push(`## Root Configuration (${rootConfig.length} files)`, "", "| File | Purpose |", "|---|---|");
for (const name of rootConfig) {
  const purpose =
    name === "package.json"
      ? "Package manifest, scripts, dependencies, engines"
      : name.endsWith(".lock")
        ? "Lockfile"
        : name === "package-lock.json"
          ? "Lockfile (npm, used by the host pipeline)"
        : name === "Makefile"
          ? "Workflow shortcuts (`make help` for all commands)"
          : name === ".env.example"
            ? `Environment template (${envVarCount} variables, no secrets)`
            : name === "server.js"
              ? "Production entry point for the standalone build"
              : "Configuration";
  push(`| \`${name}\` | ${purpose} |`);
}
push("");

push(`## Documentation (${rootDocs.length + docFiles.length} files)`, "", "| File | Purpose |", "|---|---|");
for (const name of rootDocs) {
  const purpose =
    name === "PROJECT-INDEX.md"
      ? "This file"
      : name === "README.md"
        ? "Project overview + quick start"
        : name === "CHANGELOG.md"
          ? "Version history"
          : name === "SECURITY.md"
            ? "Security controls + policies"
            : name === "API.md" || name === "API_DOCUMENTATION.md"
              ? "API documentation"
              : name === "VALIDATION-REPORT.md"
                ? "Production readiness report"
                : "Documentation";
  push(`| \`${name}\` | ${purpose} |`);
}
push(`| \`docs/\` | ${docFiles.length} documents |`);
push("");

push(
  `## Source — App Router (${routeFiles} API routes, ${pageFiles} pages, ${layoutFiles} layout)`,
  "",
  `API route groups: ${apiDirs.map((d) => `\`${d}\``).join(", ")}.`,
  "",
  "Each API route is a folder under `src/app/api/` containing a `route.ts`.",
  "",
);

push("## Source — API Routes", "", "| Group | Route files |", "|---|---|");
for (const dir of apiDirs) {
  const count = countFiles(join(ROOT, "src", "app", "api", dir), (f) => f.endsWith("route.ts"));
  push(`| \`api/${dir}\` | ${count} |`);
}
push(`| **total** | **${routeFiles}** |`, "");

push("## Source — Libraries", "", "| Path | Purpose |", "|---|---|");
push(`| \`src/lib/\` (${libFiles.length} modules) | ${libFiles.map((d) => `\`${d}\``).join(", ")} |`);
push("");

push("## Source — Middleware", "", "| File | Purpose |", "|---|---|");
push("| `src/proxy.ts` | Security headers on every response (Next 16 renamed `middleware.ts` to `proxy.ts`) |");
push("");

push("## Source — Components", "", "| Group | Files |", "|---|---|");
for (const [label, dir, purpose] of componentGroups) {
  push(`| \`${dir}\` | ${countFiles(join(ROOT, dir))} — ${purpose} |`);
}
push("");

push("## Source — Hooks", "", "| Path | Purpose |", "|---|---|");
push("| `src/hooks/` | Shared React hooks |");
push("");

push(
  `## Database (${modelCount} models, ${enumCount} enums, ${migrationDirs.length} migrations)`,
  "",
  "| Path | Purpose |",
  "|---|---|",
  `| \`prisma/schema.prisma\` | ${modelCount} models |`,
  `| \`prisma/migrations/\` | ${migrationDirs.length} migration folders |`,
  "| `prisma/seed.mjs`, `prisma/seed-rbac.ts` | Core data + RBAC seeds |",
  "| `prisma/seed-sample-bank.mjs` | Guarded synthetic sample bank (disposable databases only) |",
  "",
);

push(
  `## Scripts (${scriptFiles.length} files)`,
  "",
  "| Path | Purpose |",
  "|---|---|",
  `| \`scripts/\` | ${scriptFiles.map((f) => `\`${f}\``).join(", ")} |`,
  "",
);

push(
  `## Server Configuration (${serverConfigFiles.length} files)`,
  "",
  "| Path | Purpose |",
  "|---|---|",
  `| \`server-config/\` | ${serverConfigFiles.map((f) => `\`${f}\``).join(", ")} |`,
  "",
);

push(`## Tests (${testFiles.length} files)`, "", "| Path | Purpose |", "|---|---|");
push(`| \`tests/\` | ${testFiles.map((f) => `\`${f}\``).join(", ")} |`);
push("");

push(
  `## CI/CD (${workflowFiles.length} workflows)`,
  "",
  "| Path | Purpose |",
  "|---|---|",
  `| \`.github/workflows/\` | ${workflowFiles.map((f) => `\`${f}\``).join(", ")} |`,
  "",
);

push(
  `## Public Assets (${publicFiles.length} files)`,
  "",
  "| Path | Purpose |",
  "|---|---|",
  `| \`public/logo.svg\` | Platform logo |`,
  `| \`public/robots.txt\` | SEO robots |`,
  `| \`public/images/\` | ${publicImages.length} platform images |`,
  `| \`public/examiners/\` | Examiner portraits |`,
  "",
);

push("## Totals", "", "| Measure | Value |", "|---|---|");
push(`| Tracked files | ${totalTracked} |`);
push(`| Prisma models | ${modelCount} |`);
push(`| API routes | ${routeFiles} |`);
push(`| Pages | ${pageFiles} |`);
push(`| Migrations | ${migrationDirs.length} |`);
push(`| Test files | ${testFiles.length} |`);
push(`| Scripts | ${scriptFiles.length} |`);
push(`| Environment variables (template) | ${envVarCount} |`);
push("");

const generated = lines.join("\n");

if (CHECK_ONLY) {
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
  if (current !== generated) {
    console.error(
      "PROJECT-INDEX.md is out of date. Run: node scripts/generate-project-index.mjs",
    );
    process.exit(1);
  }
  console.log("PROJECT-INDEX.md matches the source.");
  process.exit(0);
}

writeFileSync(OUTPUT, generated);
console.log(
  `Wrote PROJECT-INDEX.md (${totalTracked} tracked files, ${modelCount} models, ${routeFiles} API routes, ${pageFiles} pages).`,
);
