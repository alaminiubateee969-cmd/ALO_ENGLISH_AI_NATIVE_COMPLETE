# Project File Index

A complete map of every file in this project, organized by purpose.

## Root Configuration (12 files)

| File | Purpose |
|---|---|
| `package.json` | Package manifest, scripts, dependencies, engines |
| `bun.lock` | Lockfile (single, deterministic) |
| `tsconfig.json` | TypeScript configuration (excludes separate projects) |
| `next.config.ts` | Next.js config (standalone, strict, security headers) |
| `eslint.config.mjs` | ESLint configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `postcss.config.mjs` | PostCSS configuration |
| `components.json` | shadcn/ui configuration |
| `.env.example` | Environment template (22 variables, no secrets) |
| `.gitignore` | Git ignore rules |
| `Makefile` | Workflow shortcuts (`make help` for all commands) |
| `next-env.d.ts` | Next.js TypeScript declarations |

## Documentation (9 files)

| File | Purpose |
|---|---|
| `README.md` | Project overview + quick start |
| `DEPLOYMENT.md` | 12-step staged deployment guide |
| `OPERATIONS.md` | Daily/weekly/monthly operations |
| `TROUBLESHOOTING.md` | Common issues + solutions |
| `SECURITY.md` | Security controls + policies |
| `CHANGELOG.md` | Version history |
| `API.md` | API documentation (all endpoints) |
| `VALIDATION-REPORT.md` | Final production readiness report |
| `PROJECT-INDEX.md` | This file |

## Source — App Router (6 files)

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout |
| `src/app/page.tsx` | Homepage (the only user-visible route) |
| `src/app/globals.css` | Global styles |
| `src/app/api/route.ts` | API index |
| `src/app/api/health/route.ts` | Health endpoint (real DB check) |
| `src/app/api/lead/route.ts` | Lead capture endpoint |

## Source — API Routes (14 files)

### Auth (`src/app/api/auth/`)
| File | Method | Purpose | Auth | Rate Limit |
|---|---|---|---|---|
| `register/route.ts` | POST | Create student account | None | 3/hour |
| `login/route.ts` | POST | Authenticate user | None | 5/15min |
| `logout/route.ts` | POST | Clear session | Required | — |
| `me/route.ts` | GET | Current user | Required | — |

### Exam Catalog (`src/app/api/`)
| File | Method | Purpose | Auth |
|---|---|---|---|
| `exam-types/route.ts` | GET | List exam types | None |
| `practice-sets/route.ts` | GET | List practice sets | None |

### Attempts (`src/app/api/attempts/`)
| File | Method | Purpose | Auth |
|---|---|---|---|
| `route.ts` | GET | List user's attempts | STUDENT |
| `start/route.ts` | POST | Start an attempt | STUDENT |
| `submit/route.ts` | POST | Submit + score an attempt | STUDENT |

### Admin (`src/app/api/admin/`)
| File | Method | Purpose | Auth |
|---|---|---|---|
| `stats/route.ts` | GET | Dashboard statistics | ADMIN |
| `settings/route.ts` | GET/POST | List/update settings | ADMIN |

### Legacy
| File | Method | Purpose |
|---|---|---|
| `deliverable/route.ts` | GET | Deliverable info |
| `deliverables/route.ts` | GET | Deliverables list |

## Source — Libraries (11 files)

### Core (`src/lib/`)
| File | Purpose |
|---|---|
| `db.ts` | Prisma client singleton (prod-safe logging) |
| `env.ts` | Runtime env validation (fail-fast in production) |
| `auth.ts` | Password hashing + session tokens + RBAC helpers |
| `responses.ts` | Consistent API response helpers (success/error) |
| `validation.ts` | Zod schemas for every API input |
| `audit.ts` | Audit logging utility (immutable) |
| `rate-limit.ts` | In-memory rate limiter |
| `sanitize.ts` | Input sanitization (XSS, path traversal) |
| `utils.ts` | General utilities (cn) |
| `agent-data.ts` | AI agent workforce data |
| `alo-data.ts` | Platform content data |
| `exam-catalog.ts` | Exam catalog data |
| `platform-data.ts` | Platform configuration data |
| `question-bank.ts` | Question bank (original practice questions) |

## Source — Middleware (1 file)

| File | Purpose |
|---|---|
| `src/middleware.ts` | Security headers on every response |

## Source — Components (49 files)

### AI OS (`src/components/ai-os/`) — 21 files
Hidden admin modules: admin, agents, analytics, avatar, courses, education, english-test-platform, hidden-admin-login, home, image, marketing, module-registry, parenting, presentation, research, role-context, social, video, voice, workflow.

### ALO Platform (`src/components/alo/`) — 25 files
Public platform components: ai-chatbot, app-shell, auth-modal, cbt-catalog, course-finder, dashboard-preview, destinations, exam-types, footer, free-quota, hero, how-it-works, language-prep, legal-pages, mock-test-demo, mock-test-engine, navbar, portals, pricing-ambassador-crm, production-deliverables, public-sections, services-journey, speaking-writing, student-portal, testimonials-faq-lead.

### shadcn/ui (`src/components/ui/`) — 42 files
Complete component library: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

## Source — Hooks (2 files)

| File | Purpose |
|---|---|
| `src/hooks/use-mobile.ts` | Mobile detection hook |
| `src/hooks/use-toast.ts` | Toast notification hook |

## Database (4 files)

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | 7 models: User, ExamType, PracticeSet, Attempt, Score, AuditLog, Setting |
| `prisma/seed.ts` | Seed: admin user + 20 exam types + 6 settings |
| `prisma/migrations/20260722222653_init/migration.sql` | Initial migration |
| `prisma/migrations/migration_lock.toml` | Migration lock (SQLite) |

## Scripts (7 files)

| File | Purpose |
|---|---|
| `scripts/install.sh` | Staged deployment with symlink swap |
| `scripts/update.sh` | Alias for install.sh (preserves previous release) |
| `scripts/rollback.sh` | Atomic symlink rollback |
| `scripts/backup.sh` | DB + uploads + config backup with checksum |
| `scripts/restore.sh` | Restore from backup (checksum verify + confirm) |
| `scripts/healthcheck.sh` | Local health endpoint check |
| `scripts/verify.sh` | 25-point verification gate |

## Server Configuration (3 files)

| File | Purpose |
|---|---|
| `server-config/alo-english.service` | systemd unit (12 security hardening directives) |
| `server-config/Caddyfile.production` | Reverse proxy (TLS + headers + health + logs) |
| `server-config/sudo-policy` | Restricted sudoers (service management only) |

## Tests (1 file)

| File | Purpose |
|---|---|
| `tests/smoke.test.ts` | 30 assertions: structure, package, schema, config, scripts, docs |

## CI/CD (1 file)

| File | Purpose |
|---|---|
| `.github/workflows/ci.yml` | 3 jobs: verify, scripts, package |

## Public Assets (24 files)

| Path | Purpose |
|---|---|
| `public/logo.svg` | Platform logo |
| `public/robots.txt` | SEO robots |
| `public/images/*.png` | 22 platform images (logos, destinations, exam prep) |

## Total: 189+ files (after enhancements: ~210)
