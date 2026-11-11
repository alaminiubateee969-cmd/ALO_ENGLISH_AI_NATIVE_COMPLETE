#!/usr/bin/env node
/**
 * scripts/generate-project-index.mjs — regenerate PROJECT-INDEX.md from source.
 *
 * WHY THIS EXISTS
 * ───────────────
 * PROJECT-INDEX.md was written by hand and then left. By 2026-10-19 it claimed
 * 21 files under `src/components/ai-os/` (there are 20), 25 under
 * `src/components/alo/` (26), 42 under `src/components/ui/` (48), 7 Prisma
 * models (there are 54), 1 test file (14), 1 CI workflow (2) and 189+ files in
 * the repository (675). It also pointed at `src/middleware.ts`, which does not
 * exist — Next 16 renamed it to `src/proxy.ts`.
 *
 * An index that is wrong is worse than no index: it is the first thing
 * someone trusts when they are trying to work out what a system does. This
 * script derives the index from the source, so it can be regenerated rather
 * than maintained.
 *
 * THE ONE RULE: THE INDEX DESCRIBES THE REPOSITORY, NOT THE WORKING TREE
 * ──────────────────────────────────────────────────────────────────────
 * Every list in this file comes from the set of files that belong to the
 * repository:
 *
 *     git ls-files --cached --others --exclude-standard
 *
 * That is the tracked set plus the untracked files that are not ignored. It
 * is deliberately *not* a filesystem walk. Two reasons, both learned the hard
 * way:
 *
 *  1. `git ls-files` alone lists the *index*, so a file that had been
 *     written but not yet staged was invisible, and the committed index
 *     disagreed with what a clean checkout computes. CI rejected it.
 *  2. A filesystem walk includes generated files that are gitignored —
 *     `next-env.d.ts`, which Next.js writes on every build. A clean
 *     checkout does not have it, so the same tree produced two different
 *     indexes depending on whether a build had been run.
 *
 * Both failures were found by CI, and both are why this rule exists.
 *
 * Run:  node scripts/generate-project-index.mjs [--check]
 *   --check   regenerate in memory and exit 1 if the file differs from what is
 *             committed, instead of writing. For CI, so it cannot drift.
 * Exit: 0 on success (or on --check with no drift), 1 otherwise.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK_ONLY = process.argv.includes("--check");
const OUTPUT = join(ROOT, "PROJECT-INDEX.md");

const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/**
 * Every file that belongs to the repository, as repository-relative paths.
 * See the note at the top of this file: this is the only source of truth
 * for every list below.
 */
function repositoryFiles() {
  try {
    const out = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 64e6 },
    );
    return new Set(out.split("\0").filter(Boolean));
  } catch {
    return new Set();
  }
}

const REPO_FILES = repositoryFiles();

/** The repository-relative paths under a directory, sorted. */
function repoFilesUnder(dir) {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  return [...REPO_FILES]
    .filter((file) => file.startsWith(prefix))
    .map((file) => file.slice(prefix.length))
    .sort();
}

/** The number of repository files under a directory. */
function repoCountUnder(dir) {
  return repoFilesUnder(dir).length;
}

/**
 * The direct children of a directory: the files in it and the directories
 * beneath it, by name.
 */
function repoChildren(dir) {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  const children = new Set();
  for (const file of REPO_FILES) {
    if (!file.startsWith(prefix)) continue;
    const rest = file.slice(prefix.length);
    const slash = rest.indexOf("/");
    children.add(slash === -1 ? rest : rest.slice(0, slash));
  }
  return [...children].sort();
}

/**
 * The direct subdirectories of a directory.
 *
 * A directory is only a directory if something lives beneath it, so a file
 * that sits directly in the parent (`src/app/api/route.ts`) is not counted
 * as a group.
 */
function repoDirectories(dir) {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  const directories = new Set();
  for (const file of REPO_FILES) {
    if (!file.startsWith(prefix)) continue;
    const rest = file.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash !== -1) directories.add(rest.slice(0, slash));
  }
  return [...directories].sort();
}

// ─── Source facts ─────────────────────────────────────────────────────────

const schema = read("prisma/schema.prisma");
const modelCount = (schema.match(/^model\s+\w+\s*\{/gm) || []).length;
const enumCount = (schema.match(/^enum\s+\w+\s*\{/gm) || []).length;

const migrationDirs = [...REPO_FILES]
  .filter((file) => file.startsWith("prisma/migrations/"))
  .map((file) => file.split("/")[2])
  .filter((name) => name && name !== "migration_lock.toml")
  .filter((name, index, all) => all.indexOf(name) === index)
  .sort();

const routeFiles = repoFilesUnder("src/app").filter((f) => f.endsWith("route.ts")).length;
const pageFiles = repoFilesUnder("src/app").filter((f) => f.endsWith("page.tsx")).length;
const layoutFiles = repoFilesUnder("src/app").filter((f) => f.endsWith("layout.tsx")).length;

const apiDirs = repoDirectories("src/app/api");

const componentGroups = [
  ["AI OS", "src/components/ai-os", "Hidden admin modules."],
  ["ALO Platform", "src/components/alo", "Public platform components."],
  ["Site", "src/components/site", "Public site sections."],
  ["Exam", "src/components/exam", "Exam-taking components."],
  ["Speaking", "src/components/speaking", "Speaking practice components."],
  ["shadcn/ui", "src/components/ui", "Component library."],
];

const libFiles = repoChildren("src/lib");
const testFiles = repoFilesUnder("tests").filter((f) => f.endsWith(".ts"));
const scriptFiles = repoChildren("scripts");
const workflowFiles = repoFilesUnder(".github/workflows").filter((f) => f.endsWith(".yml"));
const serverConfigFiles = repoChildren("server-config");
const publicFiles = repoFilesUnder("public");
const publicImages = publicFiles.filter((f) => f.startsWith("images/"));
// Every document, including the archived deployment guides.
const docFiles = repoFilesUnder("docs").filter((f) => f.endsWith(".md"));

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
].filter((name) => REPO_FILES.has(name));

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
].filter((name) => REPO_FILES.has(name));

const envExample = read(".env.example");
const envVarCount = (envExample.match(/^[A-Z_][A-Z0-9_]*=/gm) || []).length;

const totalTracked = REPO_FILES.size;

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
  ">",
  "> The index describes the **repository**, not the working tree: every list",
  "> comes from `git ls-files --cached --others --exclude-standard`, so a",
  "> generated file that is gitignored cannot change the result.",
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
push(`| \`docs/\` | ${docFiles.length} documents (including the archived guides) |`);
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
  const count = repoFilesUnder(`src/app/api/${dir}`).filter((f) => f.endsWith("route.ts")).length;
  push(`| \`api/${dir}\` | ${count} |`);
}
push(`| **total** | **${routeFiles}** |`, "");

push("## Source — Libraries", "", "| Path | Purpose |", "|---|---|");
push(
  `| \`src/lib/\` (${libFiles.length} modules) | ${libFiles.map((d) => `\`${d}\``).join(", ")} |`,
);
push("");

push("## Source — Middleware", "", "| File | Purpose |", "|---|---|");
push("| `src/proxy.ts` | Security headers on every response (Next 16 renamed `middleware.ts` to `proxy.ts`) |");
push("");

push("## Source — Components", "", "| Group | Files |", "|---|---|");
for (const [label, dir, purpose] of componentGroups) {
  push(`| \`${dir}\` | ${repoCountUnder(dir)} — ${purpose} |`);
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
  "| `public/logo.svg` | Platform logo |",
  "| `public/robots.txt` | SEO robots |",
  "| `public/favicon.ico` | Browser icon (generated by `scripts/generate-favicon.mjs`) |",
  "| `public/images/` | " + publicImages.length + " platform images |",
  "| `public/examiners/` | Examiner portraits |",
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
  let current = "";
  try {
    current = readFileSync(OUTPUT, "utf8");
  } catch {
    current = "";
  }
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
  `Wrote PROJECT-INDEX.md (${totalTracked} repository files, ${modelCount} models, ${routeFiles} API routes, ${pageFiles} pages).`,
);
