# Production Deployment Report

**Audit date:** 2026-10-19  
**Report status:** NOT VERIFIED — the repository builds, tests and boots here,
but no production deployment of this branch was performed or observed.  
**Branch:** `arena/0c643bfe-alo-english-ai-native-complete`  
**Base commit:** `77bf99450eddbfe3d7e633f2689090064f6a50c9` (of `main`)

## The documented production path

**Hostinger auto-deploy from `main` is the only production deployment path.**
SSH/PM2/VPS deployment was retired; `scripts/check-manifest.mjs` rejects `pm2`
and `appleboy/ssh-action` in any workflow, so the retired path cannot return by
accident. Caddy terminates TLS and serves the standalone artifact. The one
Docker artifact, `docker-compose.linkis.yml`, covers the optional Linkis
integration and is disabled by default.

## Deployment evidence

- No push, PR, merge, production deployment, migration, seed or live health
  probe was performed from this branch.
- The production hostname was not contacted. The production database and the
  production environment variables were not accessed.
- Everything below was verified against **disposable** databases
  (`db/ci-test.db`, `db/ci-test2.db`, `db/test-local.db`) and a local dev
  server.
- No backup, restore, production database count, deployment log, host build
  artifact or operator approval record was available.

## Local checks

| Check | Result | Evidence |
| --- | --- | --- |
| Schema/migration parity | PASS | `node scripts/check-schema-migrations.mjs` → 46 models, 8 migrations, 48 created tables, parity OK. |
| Generated inventories | PASS | `node scripts/generate-inventories.mjs --check` → 46 model rows, 82 API rows, 32 page rows, 21 file-manifest rows all up to date. |
| Project index | PASS | `node scripts/generate-project-index.mjs --check` → matches source. |
| Repository manifest | PASS | `node scripts/check-manifest.mjs` → 318 source files scanned, 2 workflows checked, scripts and lockfiles consistent. |
| ESLint | PASS | `npx eslint .` → exit 0, no findings. |
| TypeScript | PASS | `npx tsc --noEmit` → exit 0. |
| Full test suite | PASS | `bun test tests/` → 151 pass, 0 fail, 696 assertions, 14 files. |
| Production build | PASS | `npm run build` → "✓ Compiled successfully in 8.2s"; standalone artifact 91.6 MB with 136 client bundles, 33 public assets, the Prisma schema/migrations and the generated client. |
| Standalone artifact | PASS | `node scripts/smoke-standalone.mjs` → 8/8 checks green. |
| Content gate | PASS | `npm run content:validate` → 320 questions, 261 active objective, 0 ungradeable, 0 unsupported types. 74 listening items have no audio (reported, not hidden). |
| API surface | PASS | 114-probe live smoke → 64 × 2xx/3xx, 20 × 401/403, 13 × 404 (dynamic routes probed literally), 1 × 503 (Linkis disabled by design), 0 unexpected 5xx. |
| Attempt pipeline | PASS | Live login → start → submit → `SCORED` → evaluation persisted and read back. |
| Prisma client generation | PASS in this workspace, with a sandbox-only workaround | `binaries.prisma.sh` is outside this sandbox's egress allowlist, so the native engine cannot be downloaded here. A local placeholder `PRISMA_ENGINES_MIRROR` and `engineType = "client"` were used to generate a client that runs against `@prisma/adapter-libsql`. **The committed schema is unchanged** — it still uses the default `prisma-client-js` generator, which is what the host uses. |
| Listening media generation | NOT VERIFIED | `npm run audio:generate` needs a host with TTS access. |
| Production health / deployment | NOT VERIFIED | No live probe or deployment record from this branch. |
| CI on this branch | NOT OBSERVED | The pipeline's content gate was fixed (it could never pass before: the gate required a question bank that nothing created), but the GitHub Actions runner is outside this sandbox's reach. |

**A green CI run is still not deployment evidence.** No migration was applied to
any shared database, no artifact was booted on the host, and no live health
check was made.

## Git and secret handling

- `.env` is ignored (except `.env.example`) and was not committed by this work.
  Its contents were not read for this report.
- Git history was not rewritten. Any real secret that may ever have been
  committed must be rotated by the operator.
- The working tree contains this audit's changes; no commit was made during the
  audit beyond the file deletions and modifications it made.

## Release checklist before PR/deployment

1. Install dependencies from the committed lockfile and generate the Prisma
   client in an environment that can retrieve the matching engine.
2. Rerun lint, typecheck, every test suite and the production build on the
   exact release commit. Do not treat a skipped or errored suite as passing.
3. Observe **green CI for this exact commit** — in particular the
   `Validate question content` step, which is the fail-closed gate that
   previously could never pass.
4. Create a disposable migrated DB with approved fixtures and record active
   exam/set/question/audio counts by product and section. Never seed the
   synthetic sample bank into production.
5. Establish content provenance, current blueprint coverage, READY audio
   metadata, target-host HTTP/audio playback and browser evidence.
6. Complete the email verification/recovery, payment-provider/webhook,
   identity/quota, privacy and accessibility gates before offering those
   functions.
7. Back up and rehearse a restore before any production migration; review the
   exact migration SQL and obtain operator approval.
8. Verify a staged build and host settings, then verify the actual production
   release with an auditable deployment record and a live health check.
9. Configure an approved model-provider credential outside Git if the
   evaluation agent's model path is wanted in production; the platform works
   without one, using the local rule engine.

## PR decision

The gates above are **not** all met: CI has not been observed on this branch,
there is no staging visit, no restore drill, no browser test, no authorized
content and no listening audio. What *is* met: the build is clean, the tests
pass, the artifact boots, the API surface behaves, the attempt pipeline works
end to end, and the platform's own evaluation agent is now real, wired and
verified against both its fallback path and its model path.

**A pull request may be opened to request review and staging**, on the explicit
basis that it is not a release. Do not merge or deploy until the mandatory
gates above have evidence.
