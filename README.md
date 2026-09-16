# ALO Education English Test Platform

> Production-ready English proficiency exam platform with real-time AI voice examiner, daily learning loop, and self-building agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-indigo.svg)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/tests-60%2F60%20pass-brightgreen.svg)](#tests)
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
# 1. Install dependencies
bun install

# 2. Set up environment
cp .env.example .env
# Edit .env — set AUTH_SECRET (run: openssl rand -base64 48)

# 3. Set up database
bun run db:push
bun run prisma:seed

# 4. Start dev server
bun run dev
# → http://localhost:3000
```

---

## Deploy to VPS (server.aloeducation.com)

### Option A: PM2 + Nginx (Recommended)

```bash
# 1. SSH into your VPS
ssh root@115.187.18.239

# 2. Install Node.js + Bun + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
curl -fsSL https://bun.sh/install | bash
npm install -g pm2

# 3. Clone the repo
cd /var/www
git clone https://github.com/YOUR_USERNAME/alo-education-english.git
cd alo-education-english

# 4. Install + build
bun install
cp .env.example .env
# Edit .env — set AUTH_SECRET and DATABASE_URL
bun run db:push
bun run prisma:seed

# 5. Build for production
bun run build

# 6. Start with PM2
pm2 start ecosystem.config.js --name alo-english
pm2 save
pm2 startup

# 7. Set up Nginx reverse proxy
cp server-config/alo-english.nginx /etc/nginx/sites-available/alo-english
ln -s /etc/nginx/sites-available/alo-english /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 8. SSL certificate (free via Let's Encrypt)
certbot --nginx -d english.aloeducation.com -d www.english.aloeducation.com
```

### Option B: cPanel (WHM Panel)

1. Log in to WHM: `http://115.187.18.239:2087`
2. Create a Node.js app in cPanel
3. Set the app root to `/home/username/alo-english`
4. Set the startup file to `server.js`
5. Upload the project files (from the zip)
6. Install dependencies: `bun install`
7. Run database setup: `bun run db:push && bun run prisma:seed`
8. Set environment variables in cPanel → "Environment Variables"
9. Start the app

---

## Push to GitHub

```bash
# 1. Initialize git (if not already)
git init
git add .
git commit -m "ALO Education English Test Platform — production ready"

# 2. Create a repo on GitHub: https://github.com/new
#    Name: alo-education-english
#    Private: recommended

# 3. Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/alo-education-english.git
git branch -M main
git push -u origin main
```

### Auto-deploy on push (GitHub Actions)

The included `.github/workflows/deploy.yml` automatically deploys to your VPS when you push to `main`.

**Setup:**
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VPS_HOST` = `115.187.18.239`
   - `VPS_USER` = `root`
   - `VPS_SSH_KEY` = your SSH private key (for the VPS)
   - `VPS_PATH` = `/var/www/alo-education-english`
3. Push to `main` → the workflow deploys automatically

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
- **Database:** Prisma ORM (SQLite for dev, MySQL for production)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **AI:** z-ai-web-dev-sdk (ASR, TTS, LLM, image generation)
- **Auth:** Session-based with bcrypt
- **Process Manager:** PM2 (production)
- **Reverse Proxy:** Nginx

---

## API Routes (69 total)

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

## Pages (28 total)

### Public
- `/` — Homepage
- `/destinations`, `/course-finder`, `/universities`, `/scholarships`
- `/services`, `/language-prep`, `/resources`, `/events`
- `/contact`, `/book-consultation`
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

## Database Models (34 total)

### Auth & RBAC
User, PasswordReset, Branch, Department

### CRM
Lead, Student, Partner, Commission, Country, University, Course, Scholarship, Application, Document, Message, Notification, Task, Appointment, TimelineEntry, AuditLog, Setting

### Exam
ExamType, PracticeSet, Question, Attempt, Score, FreeQuota, Payment, DailyQuestionSet

### AI Learning
LearningMemory, AgentLearning, AgentEvolution, ExamAnalytics, AgentSpecialist

---

## License

Proprietary — ALO Education. All rights reserved.
# ALO_ENGLISH_AI_NATIVE_COMPLETE
