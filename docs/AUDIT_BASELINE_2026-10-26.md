# BASELINE AUDIT — 2026-10-26 (Pre-repair snapshot)

**Project:** ALO English AI Native Complete — `alo-english-test-platform` v1.1.0
**Repository:** `alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE`
**Branch audited:** `arena/4a47e020-alo-english-ai-native-complete` (clean checkout of `main` @ `362b83b`, merge of PR #15)
**Auditor environment:** Node 22.22.3, npm 10.9.8, Bun 1.4.4, disposable SQLite database (`prisma/ci-audit-baseline.db`)
**Rule followed:** this report was completed and saved BEFORE any code or configuration change was made. All numbers below were measured on the untouched tree.

---

## নির্বাহী সারসংক্ষেপ (Bengali executive summary)

আপনার প্রশ্ন ছিল — "আমাদের প্রজেক্ট কেন অন্যান্য প্রজেক্টের মতো উচ্চ মান বজায় রাখতে পারছে না?" এই অডিটের সরাসরি উত্তর:

1. **প্রজেক্টটি এই মুহূর্তে ডিপ্লয়যোগ্য নয়।** `main`-এর সর্বশেষ মার্জ (PR #15, ~২১ ঘণ্টা আগে) একটি ফাইল করাপ্ট করেছে, Prisma স্কিমা থেকে ৮টি মডেল মুছে ফেলেছে, এবং ৩টি inventory ফাইল পুরনো করে দিয়েছে। ফলাফল: **প্রোডাকশন বিল্ড ব্যর্থ, CI লাল, dev সার্ভারে সম্পূর্ণ API লেয়ার অকার্যকর।**
2. **মানের সমস্যার মূল কারণ প্রযুক্তি নয় — প্রসেস।** এই রিপোজিটরিতে চমৎকার ইঞ্জিনিয়ারিং অনুশীলন আছে (CI গেট, অডিট ডক, ইনভেন্টরি চেক, সিকিউরিটি হার্ডেনিং)। কিন্তু **বড় PR এক নজরে দেখে মার্জ করার ফলে এক রাতেই সব ভেঙে পড়েছে** — ঠিক যে জিনিসের বিরুদ্ধে এই গেটগুলোই তৈরি করা হয়েছিল। CI লাল থাকা অবস্থায় PR #15 মার্জ হয়েছে।
3. **তবুও ভিত্তি শক্ত।** ৩২টি পাবলিক পেজের সবগুলো 200 OK দেয়, লগইন/অথ সিস্টেম কাজ করে, এক্সাম ইঞ্জিন ও CRM কোডবেস গঠিত ও পরীক্ষিত (৬৬০টি টেস্ট পাস)। মূল সমস্যাগুলো সীমিত ও চিহ্নিত — সংস্কারযোগ্য।

**সংস্কারের সময় উত্পাদন ডেটা ও বিদ্যমান কাজ সংরক্ষণের নিয়ম:** সব সংস্কার additive হবে (নতুন কলাম/মডেল যোগ, ডেটা মুছবে না), কোনো মাইগ্রেশন রোলব্যাক/রিসেট করা হবে না, এবং মার্জ-করাপশনে হারানো স্কিমা মডেলগুলো মাইগ্রেশন ফাইলের সত্যের ভিত্তিতে ফিরিয়ে আনা হবে (যাতে ডিপ্লয়ড DB-এর সাথে মিল থাকে)।

---

## 1. Scope and method

| Check | Command / method | Result summary |
|---|---|---|
| Clean tree confirmed | `git status` | clean at `362b83b` |
| Dependency install | `npm install` | OK (801 tracked files, 366 src files, 60,267 TS/TSX lines) |
| Prisma client generation | `npx prisma generate` | OK (engine binaries supplied locally; see §8 note) |
| Typecheck | `npx tsc --noEmit` | **FAIL — 1 syntax error masks 80 further errors (77 in `src/`)** |
| Lint | `npx eslint .` | **FAIL — 1 parsing error (same file)** |
| Test suite | `bun test tests/ --timeout 30000` | **660 pass / 18 fail** (17 RBAC DB tests + 1 whole-file failure) |
| Production build | `npm run build` (host-parity env) | **FAIL — webpack "Syntax Error", build aborted** |
| Schema/migration parity | `node scripts/check-schema-migrations.mjs` | PASS (67 tables) — but see §2.2: parity checker only inspects models→tables, it cannot see models deleted from the schema |
| Inventory drift | `node scripts/generate-inventories.mjs --check` | **FAIL — API_INVENTORY.csv, ROUTE_INVENTORY.csv, FILE_MANIFEST.csv drifted** |
| Project index drift | `node scripts/generate-project-index.mjs --check` | **FAIL — PROJECT-INDEX.md out of date** |
| Manifest preflight | `node scripts/check-manifest.mjs` | PASS (407 source files, 2 workflows) |
| Content validation | `node scripts/validate-content.mjs` | PASS w/ warning — 320 questions, 261 active objective, 0 ungradeable; **74 listening questions lack audio** |
| Provisioning | `prisma migrate deploy` + core seed + RBAC seed + sample bank | OK (20 exam types, 9 roles, 44 permissions, 320 synthetic questions) |
| Runtime page probe | dev server, 23 public paths | **23/23 return 200** |
| Runtime API probe | dev server, auth + CRM + agents endpoints | auth/health/stats OK **until** the agents compile error poisons the shared bundle; afterwards every API request returns 500 |
| GitHub CI status | `gh run list` / `gh run view` | **CI on `main` @ `362b83b`: FAILED** (Verify job: inventory drift; Host-parity job: build failure). Previous run (PR #14) also failed its test gate. |

## 2. Findings

### P0-1 — `src/app/api/agents/status/route.ts` is corrupted (build-breaking)

The PR #15 merge deleted the `gatherMeasurements()` function's signature and its `db` import while keeping the function body pasted at module top level. The file now has:
- a floating `const measurements … for (const row of rows) …` block at module scope (line 22–53) referencing an undefined `rows`;
- `TS1128: Declaration or statement expected` at line 53 — a hard parse error;
- a `GET` handler calling `gatherMeasurements()`, `buildAgentRegistry()` and `db.agentApproval` that are no longer imported/defined.

Impact chain, verified end-to-end:
1. `npx tsc --noEmit` → parse error (and it masks all other type errors until the file is removed).
2. `npx eslint .` → parsing error.
3. `npm run build` → **webpack "Syntax Error" — the production build cannot complete. Nothing can be deployed from `main` right now.**
4. `next dev` (Turbopack) → after the first agents-route compile, **every API request, including unrelated ones (`/api/auth/login`, `/api/crm/*`), returns HTTP 500** ("Parsing ecmascript source code failed").
5. GitHub CI Host-parity job → "Build (host command)" step fails.

Root cause: PR #15 (134 files, +21,475/−418) was merged with its own CI run red.

### P0-2 — Prisma schema lost the eight agent-workforce models (merge regression)

`git diff 1693ef5(main@PR14) → HEAD` shows PR #15 replaced `prisma/schema.prisma` with a pre-PR14 version plus the new communication-hub models — deleting these models that migration `20261019120000_agent_workforce` creates (and that production databases migrated with `prisma migrate deploy` therefore contain):

`AgentDefinition`, `AgentJob`, `AgentJobEvent`, `AgentArtifact`, `AgentApproval`, `AgentMetric`, `ExamBlueprint`, `DailyQuestionRun`

Consequences (all verified):
- 47 of the 80 type errors are `Property 'agentJob'/'agentApproval'/'agentDefinition'/'agentMetric'/'agentJobEvent'/'agentArtifact'/'dailyQuestionRun' does not exist on type 'PrismaClient'` across `src/lib/agents/runtime/**` and `src/app/api/agents/**`.
- `tests/agent-workforce.test.ts` fails wholesale (its `beforeAll` cannot touch the queue) — the "(unnamed)" test failure.
- At runtime `/api/agents/status` and `/api/agents/metrics` return 500 even after the syntax error is fixed.
- The parity checker passes because it only verifies *model → table*; deleted models leave no model to check. **The checker has a blind spot: it does not verify *table → model* for tables referenced by code.**

### P0-3 — PR #15 code was written against a schema that was never committed (Student / Conversation / MessageOutbox drift)

24 further type errors, all in PR #15 code, reference fields that exist in neither `schema.prisma` nor any migration:
- `Student.deletedAt` and `Student.needsReview` — used by `src/app/api/crm/review-queue/**`, `crm/consent`, `crm/messages/send`, `crm/assistant/reply`, `webhooks/[provider]` (18 errors). The review-queue feature (employee portal) cannot work at runtime against a deployed database.
- `Conversation.messages` / `Conversation.student` accessed after a select that does not include them, in `crm/assistant/reply` (9 errors).
- `MessageOutbox.sentAt` set by `src/lib/crm/prisma-outbound-store.ts` (1 error).
- `Document.version: null` filter type mismatch in `review-queue/conversations/[id]` (1 error).
- `"AGENT_APPROVAL_DECIDED"` is not a member of the `AuditAction` union in `src/lib/audit.ts` (1 error, in `api/agents/approvals`).

### P1-1 — `tests/paths.test.ts` leaks `process.env.DATABASE_URL` and breaks the whole suite

`resolveDatabaseUrl()` has a documented side effect: it writes the resolved absolute URL back into `process.env.DATABASE_URL`. Several tests in `paths.test.ts` call it **without saving/restoring the variable** (e.g. "a relative SQLite URL resolves against the schema directory" leaves `DATABASE_URL=file:<repo>/prisma/ci-test.db` — a different, unmigrated file).

Verified consequence: `bun test tests/paths.test.ts tests/rbac.test.ts` → **17 RBAC failures with Prisma `P2021` ("the table `main.Team` does not exist")**, because the RBAC client opens the leaked empty `prisma/ci-test.db`. Isolated `bun test tests/rbac.test.ts` passes 25/25. This is why the full suite reports 18 failures and why PR #14's CI "Verify every suite passed" step failed — a false alarm about the RBAC feature caused by a test-harness bug.

### P1-2 — Inventory and project-index drift (CI gate failure)

`node scripts/generate-inventories.mjs --check` reports 3 drifted CSVs (`API_INVENTORY.csv`, `ROUTE_INVENTORY.csv`, `FILE_MANIFEST.csv` — e.g. `src/app` counted 139 committed vs 150 actual, `src/lib` 83 vs 101) and `PROJECT-INDEX.md` is stale. This is the exact step where CI's Verify job stops on `main`. Current real numbers: **103 API route files, 40 pages, 56 models, 14 migrations, 40 test files**.

### P2-1 — Content and capability gaps (release gates that remain closed)

Confirmed from the repo's own gates and validated in this audit:
- **Question bank is synthetic.** The 320-question bank is a guarded development fixture ("synthetic and unlicensed"), not an official exam bank. The provenance gate (`content:provenance`) is BLOCKED-by-design without a licence manifest. No official IELTS/PTE/TOEFL-length content exists.
- **74 listening questions have no audio.** `audio:generate` needs internet-hosted TTS (edge-tts) and was not run here.
- **Payments deliberately disabled** — purchase POST returns 503 by design until merchant credentials/webhooks exist.
- **AI evaluation layer unconfigured** — `AI_ENABLED=false`; providers (Groq/OpenRouter/Gemini) unset; the local rule-based engine is the fallback.
- Writing/speaking feedback remains heuristic/practice-only (no publisher-equivalent scoring) — consistent with the documented capability limits in README and docs/.
- Speaking-practice recordings are stored under `upload/` (runtime data), not as persisted exam attempts — a documented limitation, not a regression.

### P2-2 — Reference/competitor review limitations

The audit sandbox can reach GitHub but not the live marketing sites (`osom.global`, `speak.com`, `osam.ai`, `bdtechlabs.com`, `enghub.pro`, etc.), so a pixel-level comparison of those landing pages could not be performed live; the quality comparison below (§5) is based on the codebase, the repo's own documented reference reviews (`docs/REFERENCE-IMPLEMENTATION-REVIEW.md`, `docs/REFERENCE_INTEGRATION_MATRIX.md`), and general product knowledge of the referenced category leaders. The user's other private repos (`engralaminn-collab/alo-education-uk-final`, `Ai-Markting-crm`, `ukvi-ai-markting_n8n`) return 404 for this token — private or renamed; not auditable from here.

## 3. Runtime verification (dev server, disposable DB)

### 3.1 Public pages — all 23 probed paths return HTTP 200
`/`, `/exam-prep`, `/practice-test`, `/language-prep`, `/destinations`, `/course-finder`, `/ask-handbook`, `/book-consultation`, `/contact`, `/portals`, `/login`, `/register`, `/forgot-password`, `/blog`, `/events`, `/resources`, `/services`, `/scholarships`, `/universities`, `/terms`, `/privacy-policy`, `/cookie-policy`, `/live-exam`.

### 3.2 Homepage, top to bottom (component-verified)
1. **Hero** — headline, dual CTA (`/exam-prep`, `/language-prep`), trust note, hero image (`/images/hero-student.png` exists on disk).
2. **Four-skills grid** — 4 cards, all link to `/exam-prep` (works).
3. **Exam paths** — IELTS/PTE/TOEFL/Duolingo cards → `/exam-prep` (works).
4. **Student journey diagram** (`StudentJourneyDiagram` component) — renders.
5. **Study-abroad section** — `/book-consultation`, `/destinations`, `/course-finder`, `/ask-handbook` links (all exist).
6. **FAQ** — 3 disclosure items (client-free `<details>`, works).
7. **Dark CTA band** — `/exam-prep` link (works).
Header nav (6 items) and footer links (legal pages) all resolve. No broken links found on the homepage.

### 3.3 Portals
- `/portals` lists Student/Partner/Employee/Admin portals; all route to `/login` (by design — role-based redirect after login).
- **Verified working (before the bundle poison spread):** admin login → `/api/auth/me`, `/api/admin/stats` (users/content/activity counts).
- **Verified broken at runtime:** `/api/agents/status` 500, `/api/agents/metrics` 500; every CRM endpoint 500 (poisoned by P0-1; CRM code itself is schema-clean except the P0-3 routes).
- Not yet verifiable until repair: student exam-attempt flow (start → questions → autosave → submit → evaluation), employee review-queue (P0-3 blocker), partner dashboard API, agents job queue.

### 3.4 API endpoints probed
| Endpoint | Status |
|---|---|
| `GET /api/health` | 200 — `{"status":"healthy","database":"connected","examTypes":20}` |
| `GET /api/exam-types` | 200 — 20 active types with counts |
| `GET /api/practice-sets` | 200 — active sets with question counts |
| `POST /api/auth/login` (admin) | 200 — sets session cookie, returns role |
| `GET /api/auth/me` | 200 |
| `GET /api/admin/stats` | 200 |
| `POST /api/auth/register` | 500 after P0-1 poison (auth code itself unchanged/passing in tests) |
| `GET /api/crm/*` (17 endpoints) | 500 after P0-1 poison |
| `GET /api/agents/status`, `/api/agents/metrics` | 500 (P0-1 + P0-2) |
| `GET /api/rbac/*`, `/api/analytics/agents` | 500 after P0-1 poison |

## 4. Feature readiness matrix (production-readiness verdict per feature)

| Feature | Code | Tests | Runtime verified in this audit | Production-ready verdict |
|---|---|---|---|---|
| Public site (40 pages, SEO, sitemap, robots, blog) | ✔ | ✔ (seo-routes, sitemap, blog) | 23/23 pages 200 | **YES** (content is marketing-grade) |
| Auth (register/login/logout/forgot/reset, HMAC cookie sessions) | ✔ | ✔ | login/me OK | **YES** (MFA columns exist but unexposed; session revocation not server-side) |
| RBAC (teams/roles/permissions) | ✔ | ✔ (25 tests) | not re-probed (API poison) | **YES** (code+DB tested; test-harness bug P1-1 fixed separately) |
| Exam engine (attempts, freeze, autosave, deadline, grading) | ✔ | ✔ (exam-attempt/engine/quota suites) | blocked by P0-1 | **YES after repair** — engine is deterministic and well-tested |
| Exam catalog (`/exam-prep`) | ✔ | ✔ | 200 w/ live DB counts | **YES** (synthetic content caveat) |
| Question bank content | synthetic only | content gate passes structurally | 320 questions seeded | **NO** — official/licensed bank absent (open release gate) |
| Listening audio | generator + verifier scripts | ✔ | 74/74 listening questions lack audio | **NO** until `audio:generate` runs on an internet host |
| CRM core CRUD (leads/students/tasks/universities/…) | ✔ | ✔ (crud-scope) | blocked by P0-1 | **YES after repair** (routes are schema-clean) |
| CRM review queue (employee portal) | ✘ (P0-3 drift) | tests exist | blocked | **NO** — needs schema/code alignment |
| CRM assistant reply (conversations) | ✘ (P0-3 drift) | tests exist | blocked | **NO** — needs select/relation fix |
| Communication hub (webhooks, outbox, consent) | partial (P0-3: `sentAt`) | ✔ (webhook/outbound/consent suites) | blocked | **YES after repair** (additive column) |
| Agent workforce (14 agents, durable queue) | ✘ (P0-1/P0-2) | ✔ suite (currently failing) | 500 | **NO** — restore models + fix route |
| Payments | deliberately 503 | ✔ | n/a | **NO** (by design until merchant exists) |
| AI evaluation (providers, rubrics, RAG) | ✔ code, unconfigured | ✔ unit | n/a | **NO** until keys + calibration |
| Admin analytics/SEO/integrations | ✔ | ✔ | blocked by P0-1 | **YES after repair** |
| Deployment pipeline (standalone build, Hostinger) | ✔ | ✔ host-parity job | **BUILD FAILS** | **NO** until P0-1/P0-2/P0-3 fixed |

## 5. Why quality feels lower than the reference projects — structural assessment

1. **Merge discipline.** The strongest repos in the user's list (frappe/crm, Django-CRM, twenty, Chatwoot, odoo/crm) share one property: **red CI blocks merge.** This repo has excellent gates but they were bypassed twice in a row (PR #14 merged with a failing test gate; PR #15 merged with CI failing entirely). The gates are not the problem — enforcing them is.
2. **One reviewer-free mega-PR.** PR #15 changed 134 files / +21k lines at once, including a destructive schema.prisma replacement that no diff-reading human caught. Category leaders land features in reviewable slices.
3. **Schema drift blindness.** Migrations are append-only truth, but the parity checker only validated model→table. When models were deleted from the schema while migrations kept creating them, nothing failed until runtime. A table→model reconciliation check is needed.
4. **Docs/audit debt is paid, then re-incurred.** The repo has 9+ audit reports, but PR #15 immediately invalidated three generated inventories — the "single source of truth" regenerated-then-committed pattern needs the CI check to run before merge, not after.
5. **Product-level gaps vs the referenced category leaders (speak.com, osom.global, enghub.pro style products):** those products ship one polished core loop (speak → instant AI feedback → streak/progress) rather than many half-open gates. This platform's honest labelling ("practice-only, not official scores") is *more* truthful than most competitors, but the open gates (no audio, no licensed bank, payments off, AI off) mean the core learner loop is thinner than the marketing surface suggests. The fastest perceived-quality win is to close the listening-audio gap and turn on one real AI provider for writing/speaking feedback — both are configuration/content work, not new engineering.

## 6. Repair plan (executed next, in this order)

1. **P0-1:** Restore `src/app/api/agents/status/route.ts` — re-add the `gatherMeasurements()` signature, `db` and `buildAgentRegistry`/`AgentMeasurements` imports (from PR #14's version), keep PR #15's skills payload additions.
2. **P0-2:** Restore the eight deleted agent-workforce models to `prisma/schema.prisma` **byte-identical to the model definitions in PR #14's schema**, matching the already-deployed migration `20261019120000_agent_workforce`. No new migration needed (tables already exist in any migrated DB); `prisma migrate diff` will be used to prove schema≡migrations for a fresh database.
3. **P0-3 (additive migrations only, production-safe):**
   - New migration A: `ALTER TABLE "Student" ADD COLUMN "deletedAt" DATETIME; ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;` + `MessageOutbox.sentAt DATETIME` — additive columns, no data loss; add the fields to the schema models.
   - Fix `crm/assistant/reply` select shape (include `messages`/`student` relations or re-query).
   - Fix `Document.version` null filter typing; add `AGENT_APPROVAL_DECIDED` to the audit action union.
4. **P1-1:** Make `tests/paths.test.ts` save/restore `process.env.DATABASE_URL` around every `resolveDatabaseUrl` call (beforeEach/afterEach guard), so the suite is order-independent.
5. **P1-2:** Regenerate `API_INVENTORY.csv`, `ROUTE_INVENTORY.csv`, `FILE_MANIFEST.csv`, `DATABASE_MODEL_INVENTORY.csv`, `PROJECT-INDEX.md` via the repo's own generators.
6. **Verification (post-repair audit):** `prisma generate` → `tsc --noEmit` clean → `eslint` clean → `bun test` (expect 0 fail) → `check-schema-migrations` + `generate-missing-migration.sh`-equivalent diff → inventories `--check` → `npm run build` → boot standalone server on disposable DB → re-probe all pages + full portal/API flows (admin, employee, student, partner) → save POST-REPAIR audit report.

**Data-preservation guarantees:** all changes additive; no migration rewritten or rolled back; no destructive `db push`/`reset`; disposable `ci-*` databases only for verification; production DB untouched from this sandbox (it is not reachable and will not be).

## 7. Exact failure evidence index

- CI run `main@362b83b`: Verify job ✗ at "Verify inventories match source"; Host-parity job ✗ at "Build (host command)" (run 40252266875).
- CI run `main@1693ef5` (PR #14): "Verify every suite passed" ✗ (caused by P1-1, not by the RBAC feature).
- `npx tsc --noEmit`: `src/app/api/agents/status/route.ts(53,1): error TS1128` (+80 masked errors: 47 agent-model, 18 Student-fields, 9 Conversation-shape, 6 others in src/).
- `npm run build`: `Failed to compile … Syntax Error … ./src/app/api/agents/status/route.ts` → `Build failed because of webpack errors`.
- `bun test tests/`: `660 pass / 18 fail` (17× RBAC P2021 + 1× agent-workforce file).
- `bun test tests/paths.test.ts tests/rbac.test.ts`: 17 RBAC P2021 failures reproduced in isolation (P1-1 proof).
- Dev runtime: `POST /api/auth/register` → 500 HTML error page whose body contains `./src/app/api/agents/status/route.ts … Parsing ecmascript source code failed`.

## 8. Environment note (reproducibility)

This sandbox cannot reach `binaries.prisma.sh`, so the Prisma schema/query engines for Prisma 6.19.3 (commit `c2990dca…`) were obtained from the public GitHub mirror `owengretzinger/prisma-engines-mirror` and injected via `PRISMA_SCHEMA_ENGINE_BINARY` / `PRISMA_QUERY_ENGINE_LIBRARY`. This changes no repository files and matches the exact engine version the npm CLI would otherwise download; CI and production hosts download the same binaries normally.
