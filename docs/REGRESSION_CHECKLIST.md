# Regression Checklist

**Audit date:** 2026-10-10  
**Report status:** BLOCKED for release. A check is `PASS` only when its command/test completed successfully in this workspace; source presence or a check on another branch is not sufficient.

| Area / regression | Status | Evidence / result | Next action |
| --- | --- | --- | --- |
| Schema/migration parity | PASS | Static checker reported 45 models, 7 migrations, 47 tables and parity. | Repeat in CI and rehearse migrations on disposable DB. |
| Source inventories | PASS | Generated/check mode reported 77 API rows and 32 page rows up to date. | Repeat after final code edits. |
| Package manifest JSON | PASS | Parsed successfully after seed-script changes. | Repeat with the final diff. |
| Whitespace / patch hygiene | PASS | `git diff --check` passed after the latest code and report changes. | Repeat before any PR. |
| CRM scope pure tests | PASS | Six `tests/crud-scope.test.ts` tests passed in the latest all-tests run. | Add DB route tests for counselor/student/admin cross-record isolation. |
| Objective grading, timers, answer redaction | PASS for pure tests | Latest Bun run passed the pure exam-engine suite, including stored answer keys, generic indicators, server timer, transcript redaction, and unknown-type fail-closed behavior. | Add persisted API integration tests. |
| New READY listening-asset selection gate | PARTIAL | Both new pure tests passed: matching READY metadata is accepted and a gradeable Listening item without READY media fails selection. Database-backed route behavior and the 422/no-quota side effect remain unverified. | Run generated-client route tests against a migrated disposable DB; verify 422 response does not reserve quota. |
| Sample-seed safety guard | PASS | Four pure guard tests passed; the earlier separate Node probe allowed named test/sample SQLite targets and blocked production-looking DB paths. | Keep seed scripts out of production command chain; validate manifest checks. |
| AI disclosure tests | PASS | Writing/speaking/interview pure disclosure tests passed in the latest all-tests run; no numeric subjective scores emitted. | Add provider failure/prompt-injection evaluation. |
| Audio utility tests | PASS for local fixtures | MP3 structure/path checks passed in the latest run; a deliberate missing-file case logged `FAIL q-missing` as expected and its test passed. | Run safe DB/audio validation, target-host HTTP checks, and browser playback; do not treat fixture test as asset coverage. |
| Full Bun test suite | BLOCKED | Latest `npx --yes bun test tests/` reported 100 tests across 13 files: 98 passed; `exam-attempt` and `rbac` errored before tests ran with `Cannot find module '.prisma/client/default'`. The expected missing-audio fixture emitted a negative-case `FAIL` log but its test passed. | Generate Prisma client, provision a disposable migrated test DB, and require all suites to run/pass. |
| ESLint | PASS | `npm ci --ignore-scripts` installed 856 packages; `npm run lint` then exited 0 with no findings, after restoring the missing `Badge` import in `src/app/ask-handbook/page.tsx`. | Keep lint in the required CI gate. |
| TypeScript | BLOCKED (one cause) | `npx tsc --noEmit` returned 10 errors, all `TS2305 … '"@prisma/client"' has no exported member 'PrismaClient'`; no other type errors. | Generate the client in CI/an engine-enabled environment and rerun. |
| Prisma generation/build | BLOCKED / NOT VERIFIED | `npx prisma generate --no-engine` failed fetching `binaries.prisma.sh/…/schema-engine.gz.sha256` (host outside the egress allowlist); build was not run. | Run in CI/approved environment with engine access; boot the production artifact. |
| Official format and question provenance | NOT VERIFIED | Actual DB counts unavailable; default seed no longer creates sample questions; content licensing is undocumented. | Obtain approved content and record product/version/license/section counts; test full blueprint. |
| Listening coverage and browser playback | NOT VERIFIED | Local listening asset count is 0; DB rows and production HTTP responses were not queried. | Generate/verify authorized media on staging and test in browsers/mobile. |
| Authentication/role/ownership DB tests | BLOCKED | Source and pure helper tests only; Prisma-dependent RBAC/attempt suites could not initialize. | Run cross-user, cross-role, session/revocation, and concurrent-attempt integration tests. |
| Payment and quota integration | BLOCKED | Purchase endpoint returns 503; no provider/webhook; identity verification not tested. | Keep disabled; implement and sandbox provider flow before release. |
| RAG/AI provider runtime | NOT VERIFIED | Bounded request path inspected; no external provider or live DB call. | Test credentials, provider data handling, abuse/cost controls, and adversarial prompts in staging. |
| Accessibility/responsiveness | NOT VERIFIED | No browser automation, keyboard/screen-reader, or device test run. | Run WCAG-oriented automated and manual checks. |
| Backup/restore and production migration | NOT VERIFIED | No production or disposable restore drill; no migration applied. | Rehearse backup/restore and review migration approval process. |
| Live deployment / health endpoint | NOT VERIFIED | No current deployment record or health probe from this branch. | Verify a staged and then production release with auditable evidence. |
| PR creation | BLOCKED | Release gates are unmet; prior decision was “Wait for release gates.” | Do not open or merge until all mandatory gates pass. |

## Run before requesting release review

```bash
node scripts/check-schema-migrations.mjs
node scripts/generate-inventories.mjs --check
git diff --check
npm run lint
npm run typecheck
npm run content:validate   # disposable DB only; no production URL
npm test                   # after Prisma client + safe test DB are provisioned
npm run build
```

After local checks, require green CI for this exact branch/commit, database-backed isolation tests, approved content/audio evidence, staging browser tests, backup/restore evidence, and an operator-approved production plan. A skipped suite, missing database, or passing check from PR #10 is not a pass for this branch.
