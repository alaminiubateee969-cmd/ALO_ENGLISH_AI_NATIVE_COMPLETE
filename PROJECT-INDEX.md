# Project File Index

> **Generated file.** Do not edit it by hand.
>
> Regenerate with `node scripts/generate-project-index.mjs`; verify with
> `node scripts/generate-project-index.mjs --check` (wired into CI and
> `make preflight`). It was hand-written once and then drifted — it claimed
> 7 Prisma models against the real number, 1 test file against the real
> number, and pointed at `src/middleware.ts`, which Next 16 replaced with
> `src/proxy.ts`.
>
> The index describes the **repository**, not the working tree: every list
> comes from `git ls-files --cached --others --exclude-standard`, so a
> generated file that is gitignored cannot change the result.

A complete map of every file in this project, organized by purpose.

## Root Configuration (13 files)

| File | Purpose |
|---|---|
| `package.json` | Package manifest, scripts, dependencies, engines |
| `bun.lock` | Lockfile |
| `package-lock.json` | Lockfile (npm, used by the host pipeline) |
| `tsconfig.json` | Configuration |
| `next.config.ts` | Configuration |
| `eslint.config.mjs` | Configuration |
| `tailwind.config.ts` | Configuration |
| `postcss.config.mjs` | Configuration |
| `components.json` | Configuration |
| `.env.example` | Environment template (30 variables, no secrets) |
| `.gitignore` | Configuration |
| `Makefile` | Workflow shortcuts (`make help` for all commands) |
| `server.js` | Production entry point for the standalone build |

## Documentation (91 files)

| File | Purpose |
|---|---|
| `README.md` | Project overview + quick start |
| `DEPLOYMENT.md` | Documentation |
| `HOSTINGER_DEPLOYMENT.md` | Documentation |
| `OPERATIONS.md` | Documentation |
| `TROUBLESHOOTING.md` | Documentation |
| `SECURITY.md` | Security controls + policies |
| `CHANGELOG.md` | Version history |
| `API.md` | API documentation |
| `API_DOCUMENTATION.md` | API documentation |
| `VALIDATION-REPORT.md` | Production readiness report |
| `PROJECT-INDEX.md` | This file |
| `docs/` | 80 documents (including the archived guides) |

## Source — App Router (107 API routes, 48 pages, 3 layout)

API route groups: `admin`, `agents`, `analytics`, `attempts`, `audio`, `auth`, `blog`, `crm`, `deliverable`, `deliverables`, `exam`, `exam-types`, `examiners`, `grammar`, `health`, `lead`, `learning`, `learning-memory`, `linkis`, `partner`, `payment`, `practice-sets`, `questions`, `rag`, `rbac`, `speaking`, `teacher`, `teachers`, `webhooks`.

Each API route is a folder under `src/app/api/` containing a `route.ts`.

## Source — API Routes

| Group | Route files |
|---|---|
| `api/admin` | 5 |
| `api/agents` | 5 |
| `api/analytics` | 1 |
| `api/attempts` | 7 |
| `api/audio` | 1 |
| `api/auth` | 6 |
| `api/blog` | 2 |
| `api/crm` | 46 |
| `api/deliverable` | 1 |
| `api/deliverables` | 1 |
| `api/exam` | 1 |
| `api/exam-types` | 1 |
| `api/examiners` | 1 |
| `api/grammar` | 1 |
| `api/health` | 1 |
| `api/lead` | 1 |
| `api/learning` | 3 |
| `api/learning-memory` | 1 |
| `api/linkis` | 2 |
| `api/partner` | 2 |
| `api/payment` | 1 |
| `api/practice-sets` | 1 |
| `api/questions` | 1 |
| `api/rag` | 3 |
| `api/rbac` | 4 |
| `api/speaking` | 3 |
| `api/teacher` | 1 |
| `api/teachers` | 2 |
| `api/webhooks` | 1 |
| **total** | **107** |

## Source — Libraries

| Path | Purpose |
|---|---|
| `src/lib/` (37 modules) | `QuestionExposure.ts`, `agent-data.ts`, `agents`, `ai`, `alo-data.ts`, `analytics`, `audio`, `audit.ts`, `auth.ts`, `content`, `copy`, `crm`, `crud-scope.ts`, `crud.ts`, `db.ts`, `env.ts`, `exam`, `exam-catalog.ts`, `http`, `integrations`, `linkis`, `marketing-content.ts`, `marketing-kit.ts`, `paths.ts`, `platform-data.ts`, `public-routes.ts`, `question-bank.ts`, `rate-limit.ts`, `rbac.ts`, `referral-code.ts`, `responses.ts`, `sanitize.ts`, `seo`, `speech`, `utils.ts`, `validation.ts`, `writing` |

## Source — Middleware

| File | Purpose |
|---|---|
| `src/proxy.ts` | Security headers on every response (Next 16 renamed `middleware.ts` to `proxy.ts`) |

## Source — Components

| Group | Files |
|---|---|
| `src/components/ai-os` | 20 — Hidden admin modules. |
| `src/components/alo` | 27 — Public platform components. |
| `src/components/site` | 10 — Public site sections. |
| `src/components/exam` | 1 — Exam-taking components. |
| `src/components/speaking` | 1 — Speaking practice components. |
| `src/components/ui` | 48 — Component library. |

## Source — Hooks

| Path | Purpose |
|---|---|
| `src/hooks/` | Shared React hooks |

## Database (64 models, 0 enums, 15 migrations)

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | 64 models |
| `prisma/migrations/` | 15 migration folders |
| `prisma/seed.mjs`, `prisma/seed-rbac.ts` | Core data + RBAC seeds |
| `prisma/seed-sample-bank.mjs` | Guarded synthetic sample bank (disposable databases only) |

## Scripts (28 files)

| Path | Purpose |
|---|---|
| `scripts/` | `agent-worker.mjs`, `audit-with-rea.sh`, `backup.sh`, `bootstrap-admin.ts`, `check-manifest.mjs`, `check-schema-migrations.mjs`, `daily-question-pipeline.mjs`, `ensure-prisma-client.mjs`, `finalize-standalone.mjs`, `generate-daily-questions.ts`, `generate-favicon.mjs`, `generate-inventories.mjs`, `generate-listening-audio.mjs`, `generate-missing-migration.sh`, `generate-project-index.mjs`, `healthcheck.sh`, `install.sh`, `listening-audio-utils.mjs`, `restore-drill.sh`, `restore.sh`, `rollback.sh`, `smoke-standalone.mjs`, `update.sh`, `validate-content.mjs`, `validate-question-bank.ts`, `validate-question-provenance.mjs`, `verify-listening-audio.mjs`, `verify.sh` |

## Server Configuration (5 files)

| Path | Purpose |
|---|---|
| `server-config/` | `Caddyfile.production`, `README.md`, `alo-english.nginx`, `alo-english.service`, `sudo-policy` |

## Tests (40 files)

| Path | Purpose |
|---|---|
| `tests/` | `agent-workforce.test.ts`, `ai-evaluation-layer.test.ts`, `ai-evaluation.test.ts`, `ai-teachers.test.ts`, `analytics.test.ts`, `assistant.test.ts`, `attempt-quota.test.ts`, `audio-assets.test.ts`, `audio-input.test.ts`, `audio-path.test.ts`, `blog.test.ts`, `communication-hub.test.ts`, `consent.test.ts`, `copy-style.test.ts`, `crud-scope.test.ts`, `diagram-catalogue.test.ts`, `document-storage.test.ts`, `exam-attempt.test.ts`, `exam-engine.test.ts`, `grammar.test.ts`, `integrations.test.ts`, `lead-score.test.ts`, `marketing-skills.test.ts`, `media-fetcher.test.ts`, `outbound.test.ts`, `paths.test.ts`, `pipeline.test.ts`, `provider-payload.test.ts`, `question-provenance.test.ts`, `rbac.test.ts`, `referral-marketing.test.ts`, `review-queue.test.ts`, `seed-sample-guard.test.ts`, `seo-audit.test.ts`, `seo-routes.test.ts`, `sitemap.test.ts`, `smoke.test.ts`, `speaking-recorder.test.ts`, `webhook-ingest.test.ts`, `webhook-signature.test.ts` |

## CI/CD (2 workflows)

| Path | Purpose |
|---|---|
| `.github/workflows/` | `ci.yml`, `deploy.yml` |

## Public Assets (32 files)

| Path | Purpose |
|---|---|
| `public/logo.svg` | Platform logo |
| `public/robots.txt` | SEO robots |
| `public/favicon.ico` | Browser icon (generated by `scripts/generate-favicon.mjs`) |
| `public/images/` | 25 platform images |
| `public/examiners/` | Examiner portraits |

## Totals

| Measure | Value |
|---|---|
| Tracked files | 835 |
| Prisma models | 64 |
| API routes | 107 |
| Pages | 48 |
| Migrations | 15 |
| Test files | 40 |
| Scripts | 28 |
| Environment variables (template) | 30 |
