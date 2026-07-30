# Development Guide

## Project Overview

**ALO Education Platform** — an integrated study-abroad consultancy CRM with public website, student/partner/employee/admin portals, unified communications, AI agents, and an English exam practice platform.

### Technology Stack
- **Runtime**: Node.js 22 LTS
- **Package Manager**: Bun
- **Framework**: Next.js 16 (App Router, standalone output)
- **Language**: TypeScript 5
- **Database**: SQLite via Prisma ORM
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Auth**: bcrypt + HMAC session tokens (custom, no NextAuth dependency)
- **AI**: Groq (Llama 3.3 70B) — optional, falls back to local rule engine
- **Reverse Proxy**: Caddy
- **Process Manager**: systemd

### Main Portals
1. Public Website (`/`)
2. Student Portal (`/api/auth/register`, `/api/attempts/*`)
3. Partner Portal (`/api/crm/partners/*`)
4. Employee Portal (`/api/crm/leads/*`, `/api/crm/students/*`)
5. Admin Portal (`/api/admin/*`, `/api/crm/*`)
6. AI Agent Status (`/api/agents/status`)

### Main Modules
- CRM: Leads, Students, Partners, Applications, Universities, Courses, Scholarships
- Communications: Messages (multi-channel)
- Documents: Upload + OCR status tracking
- Exam Platform: 32 exam types, practice sets, attempts, AI-evaluated scoring
- AI Agents: 20 registered agents (Writing, Speaking, Interview, Exam Conductor, etc.)
- Security: Auth, RBAC, audit logging, rate limiting

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # register, login, logout, me
│   │   ├── crm/            # 18 CRM entities (CRUD)
│   │   ├── admin/          # stats, settings
│   │   ├── agents/         # AI agent status
│   │   ├── attempts/       # exam attempts
│   │   └── health/         # health check
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # React components
│   ├── alo/                # Platform components
│   ├── ai-os/              # AI OS components
│   └── ui/                 # shadcn/ui library
├── lib/                    # Core libraries
│   ├── agents/             # AI agent services
│   ├── auth.ts             # Authentication
│   ├── audit.ts            # Audit logging
│   ├── crud.ts             # Generic CRUD helpers
│   ├── db.ts               # Prisma client
│   ├── env.ts              # Env validation
│   ├── rate-limit.ts       # Rate limiting
│   ├── responses.ts        # API response helpers
│   ├── sanitize.ts         # Input sanitization
│   └── validation.ts       # Zod schemas
└── proxy.ts                # Security headers middleware

prisma/
├── schema.prisma           # 28 models
├── seed.ts                 # Database seed
└── migrations/             # SQL migrations

scripts/                    # Bash scripts (install, backup, etc.)
server-config/              # systemd, Caddy, sudoers
tests/                      # Smoke tests
```

## Local Development Setup

### Required Software
- Node.js 22+
- Bun 1.3+
- SQLite (bundled with Prisma)

### Setup Commands
```bash
bun install                    # Install dependencies
cp .env.example .env           # Create env file (edit values)
bun run db:generate            # Generate Prisma client
bun run db:migrate:dev         # Apply migrations (dev)
bun run db:seed                # Seed database
bun run dev                    # Start dev server (port 3000)
```

### Environment Variables
See `.env.example` for all 39 variables. Required: `DATABASE_URL`, `AUTH_SECRET`.

## Database Development

### Models (28 total)
- **Auth**: User, Branch, Department, PasswordReset
- **CRM**: Lead, Student, Partner, Commission
- **Education**: Country, University, Course, Scholarship
- **Applications**: Application, Document
- **Communications**: Message, Notification
- **Workflow**: Task, Appointment, TimelineEntry
- **Audit**: AuditLog, Setting
- **Exam**: ExamType, PracticeSet, Attempt, Score

### Safe Migration Rules
1. Always backup before migration: `bash scripts/backup.sh`
2. Use `prisma migrate dev` in development only
3. Use `prisma migrate deploy` in production (non-interactive)
4. Never reset production data
5. Test migrations on a copy first

## Frontend Development
- Use shadcn/ui components from `src/components/ui/`
- All forms use react-hook-form + Zod validation
- API calls use the standard response format (`{success, status, message, data}`)

## Backend Development
- Every API route uses `withErrorHandler` wrapper
- Every protected route calls `requireAuth()` or `requireRole()`
- Every mutating action is audit logged via `audit()`
- Input validation uses Zod schemas
- Rate limiting on auth endpoints

## Build Process
```bash
bun run lint          # ESLint
bun run typecheck     # TypeScript check
bun test tests/       # Run tests
bun run build         # Production build (standalone)
```

## Coding Standards
- TypeScript strict mode
- No `any` types (use `unknown` if needed)
- No hardcoded secrets
- All functions documented with JSDoc
- Consistent response format on all APIs
