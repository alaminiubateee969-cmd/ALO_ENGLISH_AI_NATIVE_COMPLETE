# ALO Education English Test Platform

> Production-ready English proficiency exam platform with real-time AI voice examiner, daily learning loop, and self-building agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo.svg)](https://www.prisma.io/)
[![CI](https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE/actions/workflows/ci.yml/badge.svg)](https://github.com/alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-4%20suites-brightgreen.svg)](#tests)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Live URL:** `https://english.aloeducation.com`

---

## Overview

A comprehensive English proficiency exam platform serving 12,500+ students. Features 20 exam types (IELTS, TOEFL, PTE, Duolingo, OET, Cambridge, GRE, GMAT, SAT, ACT, LSAT, MCAT, and more) with 510+ real exam-aligned questions, a real-time AI voice examiner, daily learning loop, and self-building specialist agents.

### Key Features

- **20 Exam Types** — IELTS, TOEFL, PTE, Duolingo, OET, Cambridge, GRE, GMAT, SAT, ACT, LSAT, MCAT, Visa Interview, and more
- **510+ Real Questions** — Every question follows the official exam format
- **Real-Time Voice AI Examiner** — 5 Bengali AI examiner personas with STT + TTS + LLM
- **Daily Learning Loop** — System learns from every exam and improves daily
- **Self-Building Agents** — AI creates new specialist agents based on performance gaps
- **RBAC + Multi-Tenancy** — 9 system roles, 44 permissions, team isolation
- **RAG Handbook** — Free AI study chat (no signup required)
- **CRM** — 18 entities, full CRUD, audit logging

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies (bun for development and CI, npm on the host)
bun install          # or: npm install

# 2. Environment
#    `.env` is already in the repository with NON-SECRET defaults, so this
#    boots as-is. For anything real, copy the template and use .env.local —
#    it is git-ignored and takes precedence over .env.
cp .env.example .env.local
#    then set AUTH_SECRET:  openssl rand -base64 48

# 3. Database (development only — production uses `migrate deploy`)
bun run db:migrate:dev
bun run prisma:seed

# 4. Dev server (Turbopack)
bun run dev
# → http://localhost:3000
```

### Before you push

```bash
npm run verify        # every pre-deployment gate: files, schema, lint, types,
                      # build artifact, and a live boot of the built server
```

---

## Deployment

**Production is Hostinger, and `main` is the only branch that deploys.**

```
push to main
   → Hostinger automatic Git deployment
   → npm install
   → npm run build
        prebuild  scripts/ensure-prisma-client.mjs  → prisma generate
        build     next build --webpack
        finalize  scripts/finalize-standalone.mjs   → .next/static + public/ + prisma/
   → npx prisma migrate deploy      (first deploy / after a schema change)
   → node server.js                 (or: npm start)
   → https://english.aloeducation.com
```

Full step-by-step panel setup, environment variables and verification:
**[`HOSTINGER_DEPLOYMENT.md`](./HOSTINGER_DEPLOYMENT.md)** — that file is the
authoritative deployment guide.

Three things about this pipeline that are easy to undo by accident:

| | |
| --- | --- |
| `next build --webpack` is mandatory | Turbopack runs PostCSS in a `node` worker that must connect back over `127.0.0.1`. The host's build container blocks that, so the deploy panics on `src/app/globals.css`. `scripts/check-manifest.mjs` fails CI if the flag is removed. See [`docs/ADR-0001-build-with-webpack.md`](./docs/ADR-0001-build-with-webpack.md). |
| `DATABASE_URL` must be absolute | The generated standalone server calls `process.chdir(__dirname)`, so at runtime the working directory is `.next/standalone`. A relative `file:./db/*.db` resolves inside the build output — a directory every deploy replaces — and the site comes back with an empty database. `src/lib/paths.ts` resolves and logs the path it used, and warns when it lands there. |
| GitHub Actions never deploys | `ci.yml` is the quality gate; `deploy.yml` verifies readiness and records the release. Deployment is Hostinger's. Do not add an SSH/PM2 workflow — two competing pipelines means neither is authoritative. |

### Repository layout for deployment

```
src/                 the application (App Router under src/app)
prisma/              schema.prisma + migrations (the only way to provision prod)
public/              static assets, copied into .next/standalone by the build
scripts/             build, verification, backup and seeding tooling
server.js            stable production entry point → .next/standalone/server.js
hostinger.json       checked-in record of the panel settings this commit expects
docs/                architecture decisions and audits
tests/               bun test suites run by CI
cpanel-production/   legacy PHP deliverables, served to SUPER_ADMIN by /api/deliverable*
```

Everything else that used to sit in the repository root — release archives,
agent scratch output, an archived sibling Next.js project, a 1.4 MB development
database, runtime uploads — is git-ignored and no longer tracked, so the host
clones 10 MB instead of 32 MB per deploy. `git ls-files -i -c --exclude-standard`
returns empty: nothing tracked is also ignored.

### Optional: self-managed VPS

`server-config/` holds a systemd unit, a Caddyfile, an nginx config and a
sudoers policy, and `DEPLOYMENT.md` describes that path. It is **not** used by
production and is kept only for running the platform on infrastructure you
control yourself. See the warning at the top of `DEPLOYMENT.md`.

---

## Features

### Real Exam Engine
- 9 exam types: IELTS, TOEFL, PTE, Duolingo, GRE, GMAT, SAT, ACT, ALO Placement
- 395 real questions in the database
- Timer, question palette, section navigation
- Free quota (3 ALO students / 1 public)

### Real-Time Voice AI Examiner
- 5 Bengali AI examiner personas (AI-generated avatars)
- Real microphone recording (MediaRecorder API)
- Speech-to-Text (z-ai-web-dev-sdk ASR)
- Context-aware LLM responses (z-ai-web-dev-sdk chat completions)
- Text-to-Speech voice synthesis (z-ai-web-dev-sdk TTS)
- IELTS Part 1/2/3 state machine
- Bengali-accent-aware evaluation

### Daily Learning Loop
- Analyzes all exams from the last 24 hours
- Extracts insights per agent (weaknesses, strengths, confidence)
- Stores learnings in `AgentLearning` table
- Updates student learning memory
- Generates recommendations

### Self-Building Agents
- Creates new specialist agents based on performance gaps
- Speaking Coach, Writing Coach, Listening Coach, Reading Coach
- Tracks all agent evolutions in `AgentEvolution` table
- Updates specialist performance after each exam

### Exam Orchestrator
- Verifies all 9 exam types have questions
- Ensures daily question sets are generated
- Post-exam hook triggers learning loop automatically
- Recommends exams based on student weaknesses

### CRM
- 18 entities, 36 API routes, full CRUD
- Leads, students, partners, applications, universities, courses, scholarships

---

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Database:** Prisma 6 ORM over SQLite (MySQL supported via `DATABASE_URL`)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **AI:** z-ai-web-dev-sdk (ASR, TTS, LLM, image generation)
- **Auth:** Session-based with bcrypt
- **Production build:** `next build --webpack` → `.next/standalone` (see ADR-0001)
- **Hosting:** Hostinger Node.js Web App, automatic Git deployment from `main`

---

## API Routes (73 total)

### Auth
- `POST /api/auth/register` — Create student account
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user
- `POST /api/auth/forgot-password` — Request reset
- `POST /api/auth/reset-password` — Reset with token

### Exam
- `GET /api/exam-types` — List all exam types
- `GET /api/practice-sets` — List practice sets
- `GET /api/questions?practiceSetId=X` — Get questions
- `POST /api/attempts/start` — Start exam
- `POST /api/attempts/save` — Autosave
- `POST /api/attempts/submit` — Submit + AI evaluation

### Live Voice Examiner
- `POST /api/speaking/transcribe` — STT (speech to text)
- `POST /api/speaking/examiner-respond` — LLM + TTS response
- `POST /api/speaking/examiner-voice` — TTS only

### AI Learning
- `GET /api/learning/dashboard` — Learning dashboard data
- `GET /api/learning/orchestrator` — Exam status report
- `POST /api/learning/orchestrator` — Generate daily question sets
- `GET /api/learning/daily` — Recent learnings
- `POST /api/learning/daily` — Run daily learning loop (admin)

### CRM (18 entities × CRUD)
- `/api/crm/leads`, `/api/crm/students`, `/api/crm/partners`, etc.

---

## Pages (31 total)

### Public
- `/` — Homepage
- `/destinations`, `/course-finder`, `/universities`, `/scholarships`
- `/services`, `/language-prep`, `/resources`, `/events`, `/exam-prep`
- `/contact`, `/book-consultation`, `/ask-handbook`, `/portals`
- `/privacy-policy`, `/terms`, `/cookie-policy`

### Auth
- `/login`, `/register`, `/forgot-password`, `/reset-password`

### Dashboards
- `/student/dashboard` — Student portal with exam history
- `/partner/dashboard` — Partner portal
- `/employee/dashboard` — Employee portal
- `/admin/dashboard` — Admin overview
- `/admin/exam-center` — Exam management
- `/admin/learning` — AI Learning Center
- `/super-admin/dashboard` — Super admin

### Exam
- `/practice-test` — Written exam interface
- `/live-exam` — Real-time voice AI examiner
- `/student/exam-history` — Past results

---

## Database Models (44 total)

### Auth & RBAC
User, PasswordReset, Branch, Department

### CRM
Lead, Student, Partner, Commission, Country, University, Course, Scholarship, Application, Document, Message, Notification, Task, Appointment, TimelineEntry, AuditLog, Setting

### Exam
ExamType, PracticeSet, Question, Attempt, AttemptQuestion, AttemptAnswer, Score, FreeQuota, Payment, DailyQuestionSet

### Collaboration & Sessions
ChatSession, StudyMaterial, Team, TeamMember, Role, Permission, RolePermission, Session

### AI Learning
LearningMemory, AgentLearning, AgentEvolution, ExamAnalytics, AgentSpecialist

---

## License

MIT — see [`LICENSE`](./LICENSE). Copyright (c) 2026 ALO Education.
