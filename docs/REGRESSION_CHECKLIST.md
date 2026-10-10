# Regression Checklist

**Audit date:** 2026-10-10  
**Report status:** BLOCKED for release. A check is `PASS` only when its command/test completed successfully in this workspace; source presence or a check on another branch is not sufficient.

| Area / regression | Status | Evidence / result | Next action |
| --- | --- | --- | --- |
| Schema/migration parity | PASS | Static checker reported 45 models, 7 migrations, 47 tables and parity. | Repeat in CI and rehearse migrations on disposable DB. |
| Source inventories | PASS | Generated/check mode reported 77 API rows and 32 page rows up to date. | Repeat after final code edits. |
| Package manifest JSON | PASS | Parsed successfully after seed-script changes. | Repeat with the final diff. |
| Whitespace / patch hygiene | PASS | `git diff --check` passed; the branch is committed and pushed as PR #11. | Keep. |
| CRM scope pure tests | PASS | Six `tests/crud-scope.test.ts` tests passed in the latest all-tests run. | Add DB route tests for counselor/student/admin cross-record isolation. |
| Objective grading, timers, answer redaction | PASS for pure tests | Latest Bun run passed the pure exam-engine suite, including stored answer keys, generic indicators, server timer, transcript redaction, and unknown-type fail-closed behavior. | Add persisted API integration tests. |
| New READY listening-asset selection gate | PARTIAL | Both new pure tests passed: matching READY metadata is accepted and a gradeable Listening item without READY media fails selection. Database-backed route behavior and the 422/no-quota side effect remain unverified. | Run generated-client route tests against a migrated disposable DB; verify 422 response does not reserve quota. |
| Sample-seed safety guard | PASS | Four pure guard tests passed; the earlier separate Node probe allowed named test/sample SQLite targets and blocked production-looking DB paths. | Keep seed scripts out of production command chain; validate manifest checks. |
| AI disclosure tests | PASS | Writing/speaking/interview pure disclosure tests passed in the latest all-tests run; no numeric subjective scores emitted. | Add provider failure/prompt-injection evaluation. |
| Audio utility tests | PASS for local fixtures | MP3 structure/path checks passed in the latest run; a deliberate missing-file case logged `FAIL q-missing` as expected and its test passed. | Run safe DB/audio validation, target-host HTTP checks, and browser playback; do not treat fixture test as asset coverage. |
| Full Bun test suite | PASS in CI, BLOCKED locally | CI job `114205904736` on PR #11 (commit `d66a246`) ran every `tests/*.test.ts` file against a generated client and migrated SQLite DB: "Tests — all suites" and "Verify every suite passed" both succeeded. Locally the same command reports 98 pass and `exam-attempt`/`rbac` erroring with `Cannot find module '.prisma/client/default'` because the client cannot be generated in this sandbox. | Keep the aggregate CI gate; add DB-backed route tests for remaining areas. |
| ESLint | PASS | `npm ci --ignore-scripts` installed 856 packages; `npm run lint` then exited 0 with no findings, after restoring the missing `Badge` import in `src/app/ask-handbook/page.tsx`. | Keep lint in the required CI gate. |
| TypeScript | PASS in CI, BLOCKED locally | CI job `114205904736` on PR #11 (commit `d66a246`) passed the Typecheck step with the client generated. Locally `npx tsc --noEmit` returns 10 errors, all `TS2305 … '"@prisma/client"' has no exported member 'PrismaClient'` — the same missing-client cause, and no other type errors. | None for this branch; keep typecheck required. |
| Prisma generation/build | PASS in CI, BLOCKED locally | CI job `114205904736` on PR #11 (commit `d66a246`) passed "Generate Prisma client", "Build", and "Verify build output" (`.next/standalone/server.js` present). Locally `npx prisma generate --no-engine` fails fetching `binaries.prisma.sh/…/schema-engine.gz.sha256`, a host outside this sandbox's egress allowlist. | Boot the standalone artifact on staging and verify a live health check. |
| Official format and question provenance | NOT VERIFIED — measured as empty | CI job `114205904736` on PR #11 (commit `d66a246`) seeded a fresh migrated DB with the repository's own seed chain and reported "The question bank is EMPTY" with "0 total questions, 0 active objective questions, 0 ungradeable, 0 unsupported types". Licensing remains undocumented. | Obtain authorized content, then record provenance/license and per-product counts. |
| Listening coverage and browser playback | NOT VERIFIED | Local listening asset count is 0; DB rows and production HTTP responses were not queried. | Generate/verify authorized media on staging and test in browsers/mobile. |
| Authentication/role/ownership DB tests | PARTIAL — first real DB run passed | CI job `114205904736` on PR #11 (commit `d66a246`) executed `tests/rbac.test.ts` and `tests/exam-attempt.test.ts` against a migrated SQLite DB and both suites passed, including attempt ownership and answer-key redaction. Session revocation and concurrent-attempt cases are still absent. | Add session/revocation, concurrent-start, and cross-tenant route tests. |
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
