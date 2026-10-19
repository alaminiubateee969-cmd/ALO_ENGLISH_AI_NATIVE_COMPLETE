# Project File Index

> **Generated file.** Do not edit it by hand.
>
> Regenerate with `node scripts/generate-project-index.mjs`; verify with
> `node scripts/generate-project-index.mjs --check` (wired into CI and
> `make preflight`). It was hand-written once and then drifted — it claimed
> 7 Prisma models against the real number, 1 test file against the real
> number, and pointed at `src/middleware.ts`, which Next 16 replaced with
> `src/proxy.ts`.

A complete map of every file in this project, organized by purpose.

## Root Configuration (14 files)

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
| `.env.example` | Environment template (29 variables, no secrets) |
| `.gitignore` | Configuration |
| `Makefile` | Workflow shortcuts (`make help` for all commands) |
| `next-env.d.ts` | Configuration |
| `server.js` | Production entry point for the standalone build |

## Documentation (38 files)

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
| `docs/` | 27 documents |

## Source — App Router (86 API routes, 33 pages, 1 layout)

API route groups: `admin`, `agents`, `attempts`, `audio`, `auth`, `crm`, `deliverable`, `deliverables`, `exam`, `exam-types`, `examiners`, `health`, `lead`, `learning`, `learning-memory`, `linkis`, `partner`, `payment`, `practice-sets`, `questions`, `rag`, `rbac`, `speaking`.

Each API route is a folder under `src/app/api/` containing a `route.ts`.

## Source — API Routes

| Group | Route files |
|---|---|
| `api/admin` | 2 |
| `api/agents` | 5 |
| `api/attempts` | 7 |
| `api/audio` | 1 |
| `api/auth` | 6 |
| `api/crm` | 37 |
| `api/deliverable` | 1 |
| `api/deliverables` | 1 |
| `api/exam` | 1 |
| `api/exam-types` | 1 |
| `api/examiners` | 1 |
| `api/health` | 1 |
| `api/lead` | 1 |
| `api/learning` | 3 |
| `api/learning-memory` | 1 |
| `api/linkis` | 2 |
| `api/partner` | 2 |
| `api/payment` | 1 |
| `api/practice-sets` | 1 |
| `api/questions` | 1 |
| `api/rag` | 2 |
| `api/rbac` | 4 |
| `api/speaking` | 3 |
| **total** | **86** |

## Source — Libraries

| Path | Purpose |
|---|---|
| `src/lib/` (7 modules) | `agents`, `ai`, `audio`, `exam`, `http`, `linkis`, `speech` |

## Source — Middleware

| File | Purpose |
|---|---|
| `src/proxy.ts` | Security headers on every response (Next 16 renamed `middleware.ts` to `proxy.ts`) |

## Source — Components

| Group | Files |
|---|---|
| `src/components/ai-os` | 20 — Hidden admin modules. |
| `src/components/alo` | 26 — Public platform components. |
| `src/components/site` | 7 — Public site sections. |
| `src/components/exam` | 1 — Exam-taking components. |
| `src/components/speaking` | 1 — Speaking practice components. |
| `src/components/ui` | 48 — Component library. |

## Source — Hooks

| Path | Purpose |
|---|---|
| `src/hooks/` | Shared React hooks |

## Database (54 models, 0 enums, 9 migrations)

| Path | Purpose |
|---|---|
| `prisma/schema.prisma` | 54 models |
| `prisma/migrations/` | 9 migration folders |
| `prisma/seed.mjs`, `prisma/seed-rbac.ts` | Core data + RBAC seeds |
| `prisma/seed-sample-bank.mjs` | Guarded synthetic sample bank (disposable databases only) |

## Scripts (26 files)

| Path | Purpose |
|---|---|
| `scripts/` | `agent-worker.mjs`, `audit-with-rea.sh`, `backup.sh`, `bootstrap-admin.ts`, `check-manifest.mjs`, `check-schema-migrations.mjs`, `daily-question-pipeline.mjs`, `ensure-prisma-client.mjs`, `finalize-standalone.mjs`, `generate-daily-questions.ts`, `generate-favicon.mjs`, `generate-inventories.mjs`, `generate-listening-audio.mjs`, `generate-missing-migration.sh`, `generate-project-index.mjs`, `healthcheck.sh`, `install.sh`, `listening-audio-utils.mjs`, `restore.sh`, `rollback.sh`, `smoke-standalone.mjs`, `update.sh`, `validate-content.mjs`, `validate-question-bank.ts`, `verify-listening-audio.mjs`, `verify.sh` |

## Server Configuration (5 files)

| Path | Purpose |
|---|---|
| `server-config/` | `Caddyfile.production`, `README.md`, `alo-english.nginx`, `alo-english.service`, `sudo-policy` |

## Tests (15 files)

| Path | Purpose |
|---|---|
| `tests/` | `agent-workforce.test.ts`, `ai-evaluation-layer.test.ts`, `ai-evaluation.test.ts`, `attempt-quota.test.ts`, `audio-assets.test.ts`, `audio-input.test.ts`, `audio-path.test.ts`, `crud-scope.test.ts`, `exam-attempt.test.ts`, `exam-engine.test.ts`, `rbac.test.ts`, `referral-marketing.test.ts`, `seed-sample-guard.test.ts`, `smoke.test.ts`, `speaking-recorder.test.ts` |

## CI/CD (2 workflows)

| Path | Purpose |
|---|---|
| `.github/workflows/` | `ci.yml`, `deploy.yml` |

## Public Assets (33 files)

| Path | Purpose |
|---|---|
| `public/logo.svg` | Platform logo |
| `public/robots.txt` | SEO robots |
| `public/images/` | 25 platform images |
| `public/examiners/` | Examiner portraits |

## Totals

| Measure | Value |
|---|---|
| Tracked files | 675 |
| Prisma models | 54 |
| API routes | 86 |
| Pages | 33 |
| Migrations | 9 |
| Test files | 15 |
| Scripts | 26 |
| Environment variables (template) | 29 |
