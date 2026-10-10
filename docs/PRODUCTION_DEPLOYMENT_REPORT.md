# Production Deployment Report

**Audit date:** 2026-10-10  
**Report status:** NOT VERIFIED — no current production deployment evidence was obtained.  
**Branch:** `arena/b8504013-alo-english-ai-native-complete`  
**Base commit:** `fff6ca2380f7ab6ebed584b63c5273f663008050`

## Deployment evidence

- No push, PR, merge, production deployment, migration, seed, or live health probe was performed from this branch.
- The repository contains Hostinger-oriented build/deploy instructions and GitHub Actions workflows. Configuration/source presence is not proof that Hostinger is connected, that the current commit is deployed, or that the hostname is healthy.
- The configured hostname `https://english.aloeducation.com` was not contacted. The production database and environment variables were not accessed.
- `DATABASE_URL` is unset in the process environment. `db/` contains only `.gitkeep`; no local database file was found. A local `.env` exists but was not read.
- No backup, restore, production database count, deployment log, host build artifact, or operator approval record was available.
- No migration was applied. Any production migration remains subject to backup/restore rehearsal, exact SQL review, and operator approval.

## Local checks and blockers

| Check | Result | Evidence |
| --- | --- | --- |
| Schema/migration parity | PASS | `node scripts/check-schema-migrations.mjs`: 45 Prisma models, 7 migrations, 47 created tables; static parity passed. No DB was migrated. |
| Generated inventories | PASS | `node scripts/generate-inventories.mjs --check`: 45 model rows, 77 API rows, 32 page rows, and 20 file-manifest rows matched source; the manifest covers 650 tracked plus non-ignored worktree files, matching the eventual committed tree. These are source inventories, not runtime access proof. |
| `git diff --check` and package manifest | PASS | `git diff --check` and `node scripts/check-manifest.mjs` passed after the latest edits. |
| ESLint | PASS | After `npm ci --ignore-scripts` installed 856 packages, `npm run lint` exited 0 with no findings. It had just caught a real defect: `src/app/ask-handbook/page.tsx` used `Badge` after the import was removed; the import was restored and lint re-ran clean. |
| TypeScript | BLOCKED (10 errors, all one cause) | `npx tsc --noEmit` reported 10 errors, every one `TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'`, in the 8 seed scripts, `scripts/bootstrap-admin.ts`, and `src/lib/db.ts`. Zero non-Prisma type errors. The generated client is absent; no source type error was found. |
| Full tests | BLOCKED | Latest `npx --yes bun test tests/` reported 100 tests across 13 files: 98 passed; `exam-attempt` and `rbac` errored before their tests ran with `Cannot find module '.prisma/client/default'` (client not generated). Both new pure listening-media gate tests passed. The audio-missing fixture logged its expected negative-case `FAIL`; it was not production verification. |
| Prisma client generation | BLOCKED | With dependencies installed, `npx prisma generate --no-engine` still failed fetching `https://binaries.prisma.sh/all_commits/c2990dca…/debian-openssl-3.0.x/schema-engine.gz.sha256` (TLS socket disconnected): that host is outside this sandbox's egress allowlist. `PRISMA_SKIP_DOWNLOAD` / `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING` did not change it. No DB was queried. |
| Production build | NOT VERIFIED | Not run in this workspace; missing dependencies/generated Prisma client block a representative build. |
| Listening media generation/verification | NOT VERIFIED | No generator or remote verifier run; local public listening file count is zero. |
| Production health/deployment | NOT VERIFIED | No live probe or deployment record from this branch. |

PR #10's checks belong to a different branch/commit and say nothing about this one. **This branch now has its own CI evidence.** CI job `114205904736` on PR #11 (commit `d66a246`) reported: package manifest, schema/migration parity, inventory drift, install, `Generate Prisma client`, `Lint`, `Typecheck`, `Provision test database (migrate deploy)`, `Seed core data`, `Seed RBAC`, `Tests — all suites`, `Verify every suite passed`, `Build`, and `Verify build output` all **success**. The only failing step was `Validate question content`, which is the intended fail-closed gate: it reported "The question bank is EMPTY — the seed chain did not populate questions" and "0 total questions, 0 active objective questions, 0 ungradeable, 0 unsupported types". `Host-parity build` and `Script syntax validation` also passed.

An earlier run of this branch (CI job `114204008968` on PR #11 (commit `063db4e`)) failed the test gate and its annotations named two real defects, since fixed: `tests/seed-sample-guard.test.ts` deleted the runner's `DATABASE_URL` in a shared process, and `tests/exam-attempt.test.ts` created LISTENING fixtures the new READY-media gate correctly refused.

A green CI run is still not deployment evidence: no migration was applied to any shared database, no artifact was booted, and no live health check was made.

## Git and secret handling

- The `.env` file was previously tracked. It is removed from the Git index in this working tree and remains locally; contents were not read. `.env` and `.env.*` are ignored, except `.env.example`.
- Git history was not rewritten. Any real secret that may ever have been committed must be rotated by the operator.
- The working tree contains uncommitted changes and a staged deletion of `.env`; no commit or push was made.

## Release checklist before PR/deployment

1. Install dependencies from the committed lockfile and generate Prisma client using an environment that can retrieve the matching engine.
2. Rerun lint, typecheck, all test suites (including DB-backed RBAC/attempt tests), and production build. Fix every failure; do not treat a skipped/errored suite as passing.
3. Create a disposable migrated DB with approved fixtures and record active exam/set/question/audio counts by product and section. Never seed synthetic sample banks into production.
4. Establish content provenance, current blueprint coverage, READY audio metadata, actual target-host HTTP/audio playback, and browser evidence.
5. Complete email verification/recovery, payment-provider/webhook, identity/quota, privacy, accessibility, and security gates before offering those functions.
6. Back up and rehearse restore before any production migration; review the exact migration SQL and obtain operator approval.
7. Verify a staged build and host settings, then verify the actual production release with an auditable deployment record and live health check.

## PR decision

The user previously selected **Wait for release gates**. Those gates remain unmet: local tooling is incomplete, Prisma-dependent tests are blocked, database/content/payment/audio evidence is absent, and no deployment proof exists. **No PR has been opened or pushed.** Do not open or merge a PR until the required gates have evidence.
