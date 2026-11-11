# Complete Audit & Repair Report

**Project:** ALO English AI Native Complete — `alo-english-test-platform` v1.1.0
**Repository:** one project, one git repository, one branch
(`arena/0c643bfe-alo-english-ai-native-complete`, based on `main` @ `77bf994`)
**Audit window:** 2026-10-19
**Stack:** Next.js 16.1.1 (App Router) · React 19 · Prisma 6.19.3 · SQLite ·
Tailwind 4 · Bun (dev/CI) + npm (host) · Caddy · Hostinger auto-deploy

This report has three parts:

1. **Part 1 — the pre-change audit.** The state of the project *before* the
   repair work, field by field, in the order the audit was requested. Nothing
   here was written back into the code as a "fix" until the audit was complete.
2. **Part 2 — what was changed.** Every defect that was found, and what was
   done about it.
3. **Part 3 — the second audit.** The same field-by-field audit, re-run after
   the repairs, with the verification command for each field.

---

# PART 1 — Pre-change audit

## 1.1 Scale of the project

| Field | Value | How it was measured |
|---|---|---|
| **Total files** | 661 tracked files (+ working-tree files not ignored) | `git ls-files` |
| **Total folders** | 218 directories | `git ls-files \| xargs -n1 dirname \| sort -u` |
| Source files scanned by the manifest gate | 318 | `scripts/check-manifest.mjs` |
| API routes | 79 | `find src/app/api -name route.ts` |
| Frontend pages | 32 | `find src/app -name page.tsx` |
| Components | 102 `.tsx` files under `src/components/` | `git ls-files 'src/components/**'` |
| Prisma models | 45 | `grep -c '^model ' prisma/schema.prisma` |
| Database tables created by migrations | 47 | `scripts/check-schema-migrations.mjs` |
| Migrations | 7 | `prisma/migrations/` |
| Test files | 13 | `tests/` |
| Scripts | 22 | `scripts/` |
| CI/CD workflows | 2 | `.github/workflows/` |
| Documentation files | 68 | `docs/` + root |

**"Marge all" — the folder question.** The repository contained several
directories that look like separate projects: `cpanel-production/` (137 legacy
PHP files), `mini-services/` (an optional examiner-stream service), `examples/`
(vendor examples), `docs/archive/legacy-deployment-guides/`. These are **not**
separate projects and are not merged into the app. They are:
* `cpanel-production/` — legacy PHP deliverables served to `SUPER_ADMIN` by
  `/api/deliverable*`. Kept, because a live route reads them.
* `mini-services/` — an optional Linkis integration that is disabled by
  default (`LINKIS_ENABLED=false`) and excluded from the build.
* `examples/`, `docs/archive/` — reference material, excluded from the build.

The application itself is a single Next.js application with one `package.json`,
one `prisma/schema.prisma`, one `src/`, one `public/`, one `db/`. There is no
second application, and nothing needed to be merged into the main one.

## 1.2 The field-by-field audit

### Structure

| Field | Finding |
|---|---|
| **Missing files** | `public/favicon.ico` was allowlisted in `src/proxy.ts` but did not exist — every page load produced a 404 for it. No `src/app/icon.svg`, so Next.js injected no icon at all. `src/lib/agents/GroqClient.ts` and `src/lib/ai/routing/ModelRouter.ts` existed but were imported by nothing. `src/app/api/crm/audit-logs/route.ts` and `src/app/api/crm/audit-logs/[id]/route.ts` did not exist, although three admin dashboards linked to them. |
| **Missing folders** | None. The `src/app/api/` tree is complete; every referenced sub-path resolves. |
| **Empty files** | None among tracked source files. |
| **Placeholder files** | `src/components/alo/student-portal.tsx`, `src/components/alo/portals.tsx`, `src/components/alo/platform-data.ts` and `src/components/alo/agent-data.ts` contain illustrative students, scores, testimonials, agent counts and payment claims. They are **not** imported by any routed page, but they are placeholder data sitting in the tree. `src/lib/agents/QuestionGeneratorAgent.ts` returns `BLOCKED` by design. |
| **Broken imports** | 0 (resolved paths). Verified by a resolver that walks every import specifier in `src/`, `tests/`, `scripts/` and resolves it against the filesystem, the `@/` alias and the package manifest. |
| **Broken exports** | 0 named-export mismatches. `src/lib/auth.ts` does **not** export `isAdminRole` — the audit plan had assumed it did; the evaluation route was written against the real API instead. |
| **Missing dependencies** | 0 imports of a package that is not installed. 16 installed packages were imported by nothing (see §1.5). |
| **Missing packages** | 0. `bun.lock` and `package-lock.json` are both present, consistent with `package.json`, and `bun install --frozen-lockfile --dry-run` resolves. |
| **Missing environment variables** | `.env.example` advertised `CRON_ENABLED`, `LOW_CONFIDENCE_THRESHOLD`, `MEDIUM_CONFIDENCE_THRESHOLD` — no code reads any of them. `src/lib/env.ts` validated `NEXTAUTH_URL` — no code reads it and `next-auth` is not installed. Conversely the variables the code *does* read were undocumented: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `ALLOW_SYNTHETIC_SAMPLE_QUESTIONS`, and the `AUDIO_*` family. |
| **Missing configuration files** | `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `bun.lock`, `package-lock.json`, `.env.example`, `Makefile` — all present and all referenced by a script or the build. `scripts/generate-project-index.mjs` did not exist; `PROJECT-INDEX.md` was hand-written and had drifted. |
| **Missing APIs** | 2 (`/api/crm/audit-logs`, `/api/crm/audit-logs/[id]`), both linked from live dashboards. |
| **Missing backend routes** | Same 2. `GET /api/attempts/:id/evaluation` did not exist — the evaluation result had nowhere to be read back from. |
| **Missing frontend pages** | 0. 32 pages, all reachable, no page links to a route that does not exist. |
| **Missing database tables** | 0 at the time of the audit. `AttemptEvaluation` did not exist, so the evaluation agent had nowhere to persist a result. |
| **Missing migrations** | 1 (`20261019060000_attempt_evaluation`). The 7 existing migrations covered the other 45 models. |
| **Missing models** | 1 (`AttemptEvaluation`). |

### Logic

| Field | Finding |
|---|---|
| **Missing authentication logic** | 0. `src/lib/auth.ts` (bcryptjs + HMAC-signed `alo_session` cookie) is present and used by every private route; `requireAuth`/`requireRole` are enforced handler-side. |
| **Missing authorization logic** | 0 in code, but **2 broken links** resulted from an authorization route not existing. `src/lib/rbac.ts` (9 roles, 44 permissions, 149 mappings) and `src/lib/crud-scope.ts` (fail-closed) are present. |
| **Missing validation** | 0 in structure, but **3 validators disagreed with each other** about what a valid question type is — the grader and the CI content gate accepted `TRUE_FALSE` and the read/select variants, while `scripts/validate-question-bank.ts` rejected them as invalid, failing a bank the platform grades correctly. The bank auditor was also stricter than the grader, reporting `MATCHING` questions with a single `correctIndex` as having no answer key. |
| **Missing security features** | See §1.3. |
| **Missing deployment files** | 0 structurally: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `HOSTINGER_DEPLOYMENT.md`, `DEPLOYMENT.md`, `server-config/Caddyfile.production`, `server-config/alo-english.service`, `server-config/sudo-policy`. **But the deploy workflow could never pass** — see §1.3. |
| **Missing Docker files** | 0 *by design*: `docker-compose.linkis.yml` is the only Docker artifact and covers the optional Linkis integration. A `Dockerfile` was deliberately **not** added: the documented production path is Hostinger auto-deploy, and `scripts/check-manifest.mjs` forbids SSH/PM2 deployment paths, so a Dockerfile would be a second, untested deployment path. |
| **Missing Ubuntu scripts** | 0. `scripts/install.sh`, `scripts/update.sh`, `scripts/rollback.sh`, `scripts/backup.sh`, `scripts/restore.sh`, `scripts/healthcheck.sh`, `scripts/verify.sh`, `server-config/alo-english.service` (systemd unit), `server-config/sudo-policy`. |
| **Missing backup system** | 0 structurally — `scripts/backup.sh` + `scripts/restore.sh` + `scripts/rollback.sh` exist, and `OPERATIONS.md` documents the cron line. **Not verified**: no restore drill was performed. |
| **Missing monitoring** | 0 structurally — `GET /api/health` returns a status document, `scripts/healthcheck.sh` probes it, the deploy workflow probes the live site (informational and enforced). |
| **Missing logging** | Audit logging exists (`src/lib/audit.ts` → `AuditLog` model, written on selected actions). **Gap**: there is no structured application logger; the provider layer and the API routes use `console.*`. |
| **Missing SSL configuration** | 0. Caddy terminates TLS automatically (`Caddyfile.production`) and sets `Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`. An Nginx alternative exists (`server-config/alo-english.nginx`). |
| **Missing production optimizations** | `next.config.ts` sets `output: "standalone"`; `scripts/finalize-standalone.mjs` copies the client bundles, public assets, Prisma schema/migrations and the generated client into the artifact. Gzip/brotli not configured (Caddy handles compression). |
| **Missing documentation** | 0 files missing, but **many were wrong**. `PROJECT-INDEX.md` claimed 7 Prisma models (real: 45), 1 test file (real: 13), 189+ files (real: 661) and pointed at `src/middleware.ts`, which Next 16 renamed to `src/proxy.ts`. `DATABASE_GUIDE.md` documented 25 of 45 models. `API_DOCUMENTATION.md` claimed 32 exam types (real: 20). `DEVELOPMENT_GUIDE.md` claimed 32 exam types and "AI-evaluated scoring". `SECURITY.md` described controls that do not exist in the code. `docs/REGRESSION_CHECKLIST.md`, `docs/PRODUCTION_DEPLOYMENT_REPORT.md` and `docs/SECURITY_AUDIT.md` reported a stale test count and a "BLOCKED locally" Prisma state that no longer applied. |

### Errors

| Field | Finding |
|---|---|
| **Build errors** | 0 in the repository's own code. In *this sandbox* `prisma generate` could not download the native engine (`binaries.prisma.sh` is outside the egress allowlist) — a network restriction of the audit environment, not a defect in the project. Worked around locally with a `PRISMA_ENGINES_MIRROR` placeholder mirror and `engineType = "client"`; the committed schema is unchanged. |
| **TypeScript errors** | 0 (`npx tsc --noEmit` exit 0) — but only after the Prisma client could be generated. In the sandbox before that, 10 × `TS2305` errors, all from the missing client. |
| **ESLint errors** | 0 (`npx eslint .` exit 0, no findings). |
| **Runtime errors** | 0 unhandled. One **dead** provider path: `GroqClient.ts` and `ModelRouter.ts` were never imported, so the platform had **no working AI path at all**. |
| **Database errors** | 0 on the live schema — but `prisma/schema.prisma` documented a question-type vocabulary that did not match the grader's, and the schema/migration parity checker was checking the list rather than the truth. |
| **API errors** | 3 admin dashboard links pointed at `/api/crm/audit-logs` → 404. `/api/attempts/:id/evaluation` did not exist. |
| **Authentication errors** | 0. Login, session cookie, role checks and ownership checks all behave correctly under test. |
| **Deployment errors** | **1, and it was fatal**: the CI pipeline seeded the core data and the RBAC tables, then ran `content:validate` — a gate that refuses to pass on an empty question bank. Nothing in the seed chain ever inserted a question. The gate therefore always failed and **CI was red on the default branch**. |
| **Docker errors** | 0 — `docker-compose.linkis.yml` is valid and the service is disabled by default. |
| **Ubuntu errors** | 0 in the scripts. The systemd unit and the sudo policy are internally consistent. |
| **PM2 errors** | 0 — and deliberately so. PM2/SSH deployment was retired; `scripts/check-manifest.mjs` rejects `pm2` and `appleboy/ssh-action` in any workflow, so the retired path cannot come back by accident. |
| **Caddy/Nginx errors** | 0. `Caddyfile.production` sets HSTS and the security headers; the Nginx file is the documented alternative. |

### Quality and risk

| Field | Finding |
|---|---|
| **Security issues** | 4. (a) `npm audit` reported **14 advisories (10 high)**: `braces` (3.0.3, unfixable), `deepmerge-ts` (GHSA-ggr8-5vv4-36mx, fixable), `js-yaml` (fixable), `sharp` 0.34.5 (3 high, fixable), `prismjs`/`refractor` (fixable, parents unused). (b) `SECURITY.md` named `LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCKOUT_MINUTES`, `UPLOAD_MAX_MB` — none of which exist in the code — and described Next.js server-action CSRF tokens for an application with no server actions. (c) `docs/SECURITY.md` stated a role count that did not match `src/lib/rbac.ts`. (d) `src/lib/env.ts` validated a `NEXTAUTH_URL` for an integration the platform does not have. |
| **Performance issues** | 2. The 16 unused packages added install weight and audit surface. `sharp` 0.34.5 was pinned to a version with known high-severity advisories and was an old build of a native module. No bundle-size regression was measured; the production build is 91.6 MB standalone. |
| **Memory leaks** | 0. The one process-local cache (the rate limiter, `src/lib/rate-limit.ts`) has an explicit `cleanup()` that evicts expired entries. No unbounded `Map`/`Set` growth was found in `src/lib/`. |
| **Broken links** | 0 in application code (all internal links and static asset references resolve). 3 broken links in admin dashboards (the audit-logs routes above). |
| **Broken images** | 0. Every `<Image src>` and CSS asset reference resolves to a file in `public/`. |
| **Dead code** | 72 files, documented and deliberate: prototype components with illustrative data, compatibility stubs that answer 410 Gone, the retired Linkis/mini-services path, and the legacy `cpanel-production/` PHP deliverables. The genuinely accidental dead code was 2 files: `GroqClient.ts` and the old `ModelRouter.ts`. |
| **Duplicate code** | 2 instances. `GroqClient.ts` duplicated the provider chain that `ModelRouter.ts` was meant to own, and its system prompt told the model to emit "practice indicators on a 0-9 band scale" — a band, which the platform does not publish. The question-type vocabulary was triplicated between the schema, the grader and two validators. |
| **Unused files** | 72 documented (above) plus the 2 accidental ones. |
| **Unused packages** | 16: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@hookform/resolvers`, `@mdxeditor/editor`, `@reactuses/core`, `@tanstack/react-query`, `@tanstack/react-table`, `date-fns`, `framer-motion`, `next-auth`, `next-intl`, `react-markdown`, `react-syntax-highlighter`, `uuid`, `zustand`. Each was verified to have zero import sites in `src/`, `tests/` and `scripts/`. |

## 1.3 The two findings that mattered most

**Finding A — the CI gate could never go green.** The pipeline's own content
gate required a non-empty question bank, and the pipeline never created one.
Every run of the default branch failed. This is the single most damaging defect
in the repository: it means the "green CI" signal the project relies on was
meaningless.

**Finding B — the platform advertised AI evaluation it did not have.** The agent
registry listed a "Writing Evaluator" and a "Speaking Evaluator" for every
exam. The implementation was a local heuristic that counted words and looked
for discourse markers; it did not know which exam the learner was preparing
for, and nothing called it with a model. Speaking was not evaluated at all.
`GroqClient.ts` and `ModelRouter.ts` were written for exactly this purpose and
imported by nothing. The `Score` row's `writing` and `speaking` columns were
permanently `null`.

Both were fixed. Finding B is described in Part 2.

## 1.4 What was correct before the audit

Stated for completeness, because an honest audit records what was already
right: the deterministic objective grader and its fail-closed behaviour on
unknown question types; the HMAC session cookie; the RBAC model and its
fail-closed scope helper; the 422 "listening audio not ready" refusal; the
free-quota reservation; the attempt-ownership and answer-redaction rules; the
`content:validate` gate's strictness; the manifest gate that forbids SSH/PM2
deployment paths and tracked-but-ignored files; the schema/migration parity
checker; the "no official score, no band, no pronunciation claim" disclosure
policy, which is consistently applied across the UI, the API and the prompts.

## 1.5 Unused-package proof

For each of the 16 packages, the import specifier was searched for across
`src/`, `tests/`, `scripts/`, `prisma/` and the configuration files:

```
@dnd-kit/core            0 hits      next-auth          0 hits
@dnd-kit/sortable        0 hits      next-intl          0 hits
@dnd-kit/utilities       0 hits      react-markdown     0 hits
@hookform/resolvers      0 hits      react-syntax-highlighter  0 hits
@mdxeditor/editor        0 hits      uuid               0 hits
@reactuses/core          0 hits      zustand            0 hits
@tanstack/react-query    0 hits      date-fns           0 hits
@tanstack/react-table    0 hits      framer-motion      0 hits
```

`next-auth` in particular was worse than unused: `src/lib/env.ts` validated a
`NEXTAUTH_URL` for it, so the project advertised an authentication integration
it does not have and does not need — `src/lib/auth.ts` is a dependency-free
session system.

---

# PART 2 — What was changed

## 2.1 The AI evaluation agent (Finding B)

**The design rule:** the objective sections stay deterministic. A language
model must not decide a multiple-choice answer. The subjective sections get
qualitative, criterion-level feedback and no band, grade or score — and the
`Score` row's `writing`/`speaking` columns stay `null`.

| File | Status | What it does |
|---|---|---|
| `src/lib/ai/providers/ai-provider.ts` | **new** | The single module that performs an outbound model call. Chain: Groq → OpenRouter → Gemini → HuggingFace → local rule engine. Never throws; never blocks a submission; sends nothing unless a credential is configured and `AI_ENABLED` is not `"false"`. Supports `AI_OPENAI_COMPATIBLE_ENDPOINT` for a self-hosted gateway. |
| `src/lib/ai/routing/ModelRouter.ts` | **rewritten** | Provider chain, `modelFor()`, `isProviderAvailable()`. Was dead code; is now the router the provider seam uses and that `/api/agents/status` reports. |
| `src/lib/ai/evaluation/rubrics.ts` | **new** | A rubric for **every** exam the platform offers (20 codes). Academic exams get reasoning/evidence/focus criteria; language exams get task-coverage/organisation/vocabulary/grammar criteria; the speaking criteria exclude everything acoustic, because a transcript cannot evidence it. `OIETC` uses the generic criteria and discloses that its identity is unverified. |
| `src/lib/ai/evaluation/ai-evaluation.ts` | **new** | The evaluator. Builds the prompt from the rubric, marks the learner's work as untrusted data inside the prompt, validates the model's answer with zod, drops any criterion the model invented, and falls back to the local rule engine when the provider is absent, errors, or answers with something unusable. Never emits a band, grade or score. |
| `src/lib/agents/ExamConductorAgent.ts` | **modified** | Runs the evaluation agent over the subjective sections of a submitted attempt and upserts the results. `ExamResult` now carries `evaluations[]`. |
| `src/app/api/attempts/submit/route.ts` | **modified** | Collects the **speaking** transcript and the task prompts as well as the writing text; passes them to the conductor; reports the provider per section in the audit metadata. |
| `src/app/api/attempts/[id]/evaluation/route.ts` | **new** | `GET`, owner or `ADMIN`/`SUPER_ADMIN` only. Returns the stored evaluation for each assessed section. |
| `src/app/practice-test/page.tsx` | **modified** | Renders the evaluation cards with the provider badge, and flags when there is no speaking evaluation. |
| `src/app/api/agents/status/route.ts` | **modified** | Exposes the evaluation layer: `ai`, `providers`, `rubrics`. |
| `src/lib/agents/registry.ts` | **modified** | The Writing/Speaking/Conductor entries now describe what actually happens. |
| `src/lib/agents/GroqClient.ts` | **deleted** | Dead, duplicated the provider chain, and its prompt instructed a band. |
| `prisma/schema.prisma` | **modified** | `model AttemptEvaluation`. |
| `prisma/migrations/20261019060000_attempt_evaluation/migration.sql` | **new** | The migration. |
| `tests/ai-evaluation-layer.test.ts` | **new** | 18 tests. |

## 2.2 The CI gate (Finding A)

* `prisma/seed-sample-bank.mjs` — a single entry point that runs the guarded
  synthetic seeders in the only order that works.
* `package.json` — `db:seed:sample-bank`.
* `.github/workflows/ci.yml` — a `Seed sample question bank` step that opts into
  the synthetic guard against the disposable `ci-test.db` file only.
* The guard itself was **not** weakened: `prisma/seed-sample-guard.mjs` still
  refuses to seed a production-looking database.

## 2.3 The question-type vocabulary

* `src/lib/exam/question-types.json` — **new**. One canonical list of 19
  question types, now read by the grader, by `scripts/validate-content.mjs`, by
  `scripts/validate-question-bank.ts` and asserted by
  `scripts/check-schema-migrations.mjs`.
* `prisma/schema.prisma` — the documented list now matches.
* `scripts/validate-content.mjs` — empty-bank message rewritten; and it now
  loads `.env` (see §2.5).
* Two Cambridge open-cloze questions were unanswerable: "Gap 1:"/"Gap 2:" were
  typed as the prompt, and the second and third gap questions carried no
  passage. Each gap now repeats the passage and states the sentence to complete.

## 2.4 Dependency and security work

* 16 unused packages removed. `bun.lock` and `package-lock.json` regenerated;
  `bun install --frozen-lockfile --dry-run` resolves.
* `sharp` 0.34.5 → 0.35.5, with `overrides: { "sharp": "$sharp" }` so Next's own
  optional dependency is forced to the same fixed version.
* `overrides: { "deepmerge-ts": "^8.0.2" }` — clears GHSA-ggr8-5vv4-36mx.
* `npm audit`: **14 → 5**. The 5 remaining are one root cause — `braces@3.0.3`
  (no fixed version has been published) via `eslint-config-next` → `@next/eslint-plugin-next`
  → `fast-glob` → `micromatch` → `braces`. It is a **dev-only** chain and npm's
  suggested "fix" is a downgrade to an ESLint config that predates Next 16.
  Accepted and documented; it does not ship to production.

## 2.5 Documentation and configuration

* `src/lib/env.ts` — removed the dead `NEXTAUTH_URL`, added `AI_ENABLED`.
* `.env.example` — rewritten: 29 real variables, no secrets, and the three
  variables no code read are gone.
* `SECURITY.md` — rewritten to describe the controls the code actually has, and
  to say plainly where a control is a published policy rather than an enforced
  behaviour (the 365-day audit-log retention).
* `docs/SECURITY.md` — role count corrected.
* `scripts/validate-content.mjs` — added `loadDotEnv()`. **The `postbuild` gate
  had never validated anything**: it did not load `.env`, so every build
  printed "BLOCKED: DATABASE_URL is not set" and checked nothing. It now loads
  `.env` when `DATABASE_URL` is not already exported.
* `src/lib/audit.ts` — unused union members removed.
* `API.md`, `API_DOCUMENTATION.md` — the evaluation endpoint documented.
* `docs/AI_EVALUATION_REPORT.md` — rewritten for the new implementation.
* `docs/FEATURE_GAP_REGISTER.md` — FR-013/014/015 updated to the verified state.
* `DATABASE_GUIDE.md` — all 46 models documented, grouped by domain.
* `DEVELOPMENT_GUIDE.md` — 20 exam types; the evaluation agent described
  accurately.
* `PROJECT-INDEX.md` — **regenerated** by the new
  `scripts/generate-project-index.mjs`, and checked in CI.
* `VALIDATION-REPORT.md`, `FINAL_VERIFICATION_REPORT.md`,
  `IMPLEMENTATION_REPORT.md`, `MISSING_FEATURE_AUDIT.md` — a dated
  "historical snapshot" banner, so their old counts cannot be mistaken for
  current truth.
* `CHANGELOG.md` — a full entry for this audit.

## 2.6 The missing routes and the missing icon

* `src/app/api/crm/audit-logs/route.ts` and `src/app/api/crm/audit-logs/[id]/route.ts`
  — **new**. Read-only: an audit log is append-only, so a write is answered
  with 405 rather than pretending to record one.
* `src/app/icon.svg` — **new**. The Next.js file convention, so the icon is
  injected into the document head.
* `public/favicon.ico` — **new**, generated by the new
  `scripts/generate-favicon.mjs` (16/32/48 px, valid ICO with PNG payloads).
  `src/proxy.ts` had allowlisted `/favicon.ico` since before this audit, and it
  404ed on every page load. It now answers 200.

## 2.7 Gates added so the drift cannot come back

* `scripts/generate-project-index.mjs` — regenerates `PROJECT-INDEX.md` from
  source; `--check` fails if it differs. Wired into `make preflight` and CI.
* `scripts/check-schema-migrations.mjs` — now also asserts that the schema
  documents exactly the same question-type list the grader uses.

---

# PART 3 — The second audit

Every field re-checked after the repairs. "Verified" means the command was run
in this workspace and the result is quoted.

| Field | Result | Verification |
|---|---|---|
| **Total files** | 660 tracked (661 before the `GroqClient.ts` deletion; +1 favicon, +1 icon, +1 generator, +1 migration, +1 test, +2 API routes, +2 AI modules, +1 model file changed) | `git ls-files \| wc -l` |
| **Total folders** | 194 unique tracked directories | `git ls-files \| xargs -n1 dirname \| sort -u \| wc -l` |
| **Missing files** | 0 | `scripts/check-manifest.mjs` — "318 source files scanned, 2 workflow(s) checked, scripts and lockfiles consistent" |
| **Missing folders** | 0 | same |
| **Empty files** | 0 | every tracked file under `src/` is non-empty |
| **Placeholder files** | 0 in routed code. 72 files remain as documented, deliberate prototypes/stubs (see §1.2) and are reported as such rather than deleted. | `grep` for `PLACEHOLDER`/`Lorem ipsum` in `src/app` + `src/components` → only the unused prototype's "Coming Soon" badge |
| **Broken imports** | 0 | resolver over every import specifier → "MISSING IMPORTS (0)" |
| **Broken exports** | 0 | TypeScript compiles the whole graph |
| **Missing dependencies** | 0 | `tsc` + ESLint `import/no-unresolved` |
| **Missing packages** | 0 | `bun install --frozen-lockfile --dry-run` OK; `npm ci` OK |
| **Missing environment variables** | 0 | `.env.example` lists 29, all read by code; `src/lib/env.ts` validates the server-side subset |
| **Missing configuration files** | 0 | manifest gate + `make preflight` |
| **Missing APIs** | 0 | 82 route files; API inventory regenerated and checked |
| **Missing backend routes** | 0 | 114-probe live smoke: 64 × 2xx/3xx, 20 × 401/403 (auth enforced), 13 × 404 (dynamic-route placeholders probed literally), 1 × 503 (the Linkis feature, disabled by design), **0 unexpected 5xx** |
| **Missing frontend pages** | 0 | 32 pages; all internal links resolve ("BROKEN INTERNAL LINKS (0)") |
| **Missing database tables** | 0 | `check-schema-migrations.mjs` — "schema models: 46 \| migrations: 8 \| tables created: 48" |
| **Missing migrations** | 0 | 8 migration folders, every model has a table, every scalar column present |
| **Missing models** | 0 | 46 models |
| **Missing authentication logic** | 0 | login/session/role/ownership all exercised |
| **Missing authorization logic** | 0 | the two broken links are now real routes; `ADMIN_ROLES` is checked against the real role set |
| **Missing validation** | 0 | one shared question-type vocabulary, asserted by the parity checker ("Question-type vocabulary OK: 19 types documented in the schema and shared by the grader and both validators") |
| **Missing security features** | 0 remaining that the code claims and does not have. `SECURITY.md` now matches the code. | `SECURITY.md` vs `src/lib/auth.ts`, `src/lib/rate-limit.ts`, `src/proxy.ts` |
| **Missing deployment files** | 0 | 2 workflows, `HOSTINGER_DEPLOYMENT.md`, `DEPLOYMENT.md` |
| **Missing Docker files** | 0 by design | `docker-compose.linkis.yml` is the only Docker artifact; a `Dockerfile` would be a second untested deploy path, and the manifest gate forbids the retired SSH/PM2 path |
| **Missing Ubuntu scripts** | 0 | 8 operational scripts + systemd unit + sudo policy |
| **Missing backup system** | 0 structurally | `backup.sh` / `restore.sh` / `rollback.sh` — **no restore drill performed** |
| **Missing monitoring** | 0 structurally | `/api/health` + `healthcheck.sh` + deploy-time live probe |
| **Missing logging** | 1 gap that remains: no structured application logger (audit logging exists; the app uses `console.*`) | reported, not fixed |
| **Missing SSL configuration** | 0 | Caddy automatic TLS + HSTS; Nginx alternative present |
| **Missing production optimizations** | 0 that were missing | `output: "standalone"`, 91.6 MB artifact, 136 client bundles, 33 public assets copied |
| **Missing documentation** | 0 | `PROJECT-INDEX.md` is generated and CI-checked; historical reports are banner-marked |
| **Build errors** | 0 | `npm run build` → "✓ Compiled successfully in 8.2s", artifact ready, exit 0 |
| **TypeScript errors** | 0 | `npx tsc --noEmit` exit 0 |
| **ESLint errors** | 0 | `npx eslint .` exit 0, no findings |
| **Runtime errors** | 0 | live dev server, 114-probe smoke, 0 unexpected 5xx |
| **Database errors** | 0 | parity check PASS; 8 migrations applied to a disposable DB; `content:validate` PASS |
| **API errors** | 0 | see the live smoke above |
| **Authentication errors** | 0 | login → attempt → submit → read-back all succeeded |
| **Deployment errors** | 0 in the repository. The CI content gate is fixed and the pipeline now has a bank to validate. | CI itself has **not** been observed green on this branch — it runs on GitHub, and this sandbox cannot reach the Actions runner. |
| **Docker errors** | 0 | — |
| **Ubuntu errors** | 0 | — |
| **PM2 errors** | 0, and forbidden by the manifest gate | `check-manifest.mjs` rejects `pm2` / `appleboy/ssh-action` |
| **Caddy/Nginx errors** | 0 | — |
| **Security issues** | 5 advisory entries remain, all one dev-only root cause (`braces@3.0.3`, no fixed version published) | `npm audit` → 5 high, 0 critical, 0 moderate, 0 low |
| **Performance issues** | 0 known | 16 packages removed; `sharp` fixed; build time 8.2 s |
| **Memory leaks** | 0 | the only process-local cache (`src/lib/rate-limit.ts`) has an expiry `cleanup()` |
| **Broken links** | 0 | "BROKEN INTERNAL LINKS (0)" |
| **Broken images** | 0 | "MISSING STATIC ASSETS (0)" |
| **Dead code** | 72 files, all documented and deliberate. The 2 accidental ones are gone. | — |
| **Duplicate code** | 0 accidental | the question-type vocabulary now has exactly one source; `GroqClient.ts` deleted |
| **Unused files** | 72 documented (unchanged) | — |
| **Unused packages** | 0 | 16 removed; every remaining direct dependency has at least one import site |

## 3.1 The end-to-end proof of the AI evaluation agent

Run against the running application with a seeded disposable database, using
`/tmp/sandbox-audit/e2e-eval.mjs`:

```
LOGIN 200 ok
PRACTICE SETS: 20
=== ALO English Placement — Synthetic Sample Set (ALO-PLACEMENT) ===
  attempt cmvevpq77001o78nzzabshokv | questions 12 | writing 1 | speaking 1
  SUBMIT 200
    status: SCORED | overall: 0.9 | scoreProvider: deterministic_objective
    evaluations: WRITING/local_rule_engine(fallback), SPEAKING/local_rule_engine(fallback)
    → WRITING: task="Placement writing task" criteria=0 improvements=1 wordCount=78
    → SPEAKING: task="Placement speaking task" criteria=0 improvements=1 wordCount=57
    PERSISTED: 200 2 SPEAKING:local_rule_engine, WRITING:local_rule_engine
```

and with a model behind the provider (a local OpenAI-compatible mock, so the
provider path itself was exercised without a paid credential):

```
    evaluations: WRITING/groq, SPEAKING/groq
    PERSISTED: 200 2 SPEAKING:groq, WRITING:groq
```

The prompt the provider received was captured and read in full. It contained
the exam, the task, the task prompt the learner was given, the rubric criteria
for that exam, and the learner's work inside a `<student_work>` block labelled
as untrusted data.

Three behaviours were confirmed deliberately:
* a criterion key the model invented was **dropped** by the validator;
* a model answer that commented only on out-of-scope criteria was **rejected**
  in favour of the local rule engine (no guessing);
* `scoreProvider` stayed `deterministic_objective` throughout — the numeric
  result never came from a model.

## 3.2 The honest list of what is still not verified

1. **No live model provider has ever been called.** The provider path was
   exercised against a local OpenAI-compatible mock. No real Groq, OpenRouter,
   Gemini or HuggingFace credential was used, so real-world provider behaviour,
   latency, cost and error modes are unknown.
2. **The evaluation is not calibrated.** There is no human-rated benchmark, no
   inter-rater agreement figure, no per-criterion error rate and no fairness
   analysis. The output is qualitative by design, and the platform must not
   publish it as a score.
3. **CI has not been observed green on this branch.** The pipeline was fixed,
   but the GitHub Actions runner is outside this sandbox's reach.
4. **No production deployment was performed or observed.** No staging visit, no
   production health probe, no DNS/TLS check on the live host.
5. **No backup/restore drill.** The scripts exist and are documented; a
   restore has not been executed, so RPO/RTO are unknown.
6. **No browser testing.** No automated or manual keyboard, screen-reader,
   mobile-width or WCAG test was run. Static analysis cannot establish them.
7. **The listening audio is missing.** 74 of 320 questions are listening items
   with no audio asset. The platform refuses to seat a learner on a gradeable
   listening item without a `READY` asset (HTTP 422) — it is safe, but the
   content is incomplete. `npm run audio:generate` needs a host with internet
   access to a TTS service.
8. **The question bank is synthetic.** 320 questions generated by the
   platform's own generator, for demonstration and testing. There is no
   licensed or provenance-recorded content, and the seed guard prevents the
   synthetic bank from reaching a production database.
9. **Payments, email delivery, password reset and MFA are deliberately
   disabled.** The endpoints exist and refuse safely (503 / a safe reset path).
10. **No structured application logger.** Audit logging is in place; the
    application itself logs with `console.*`, so log aggregation and
    correlation IDs are not available.
11. **Rate limiting is process-local** and the client IP trusts forwarded
    headers. A multi-instance deployment would need a shared store.
12. **The production database has not been inspected.** Everything was
    verified against disposable databases and the seeded sandbox database.
