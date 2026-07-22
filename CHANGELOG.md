# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2025-07-22

### Added
- Production-ready Next.js 16 standalone application.
- Prisma schema with 7 models: User, ExamType, PracticeSet, Attempt, Score, AuditLog, Setting.
- Database migration system (Prisma Migrate) with initial migration.
- Database seed script: 20 exam types, 6 settings, 1 admin user.
- Real health endpoint (`/api/health`) that checks database connectivity.
- Production deployment infrastructure:
  - `scripts/install.sh` — staged deployment with symlink swap.
  - `scripts/update.sh` — alias for install (preserves previous release).
  - `scripts/rollback.sh` — atomic symlink rollback to previous release.
  - `scripts/backup.sh` — database + uploads + config backup with checksum.
  - `scripts/restore.sh` — restore from backup archive with checksum verification.
  - `scripts/healthcheck.sh` — local health endpoint check.
  - `scripts/verify.sh` — full pre-deployment verification gate.
- Server configuration:
  - `server-config/alo-english.service` — systemd unit with security hardening.
  - `server-config/Caddyfile.production` — reverse proxy with TLS + security headers.
  - `server-config/sudo-policy` — restricted sudoers for service management only.
- Smoke test suite (`tests/smoke.test.ts`) covering project structure, package consistency, schema, config, and docs.
- CI/CD pipeline (`.github/workflows/ci.yml`) with quality gates: lint, typecheck, test, build, script validation, archive checksum.
- Complete documentation: README, DEPLOYMENT, OPERATIONS, TROUBLESHOOTING, SECURITY.
- `.env.example` with all environment variables documented.
- `engines.node` declaration (`>=22.0.0`) in package.json.
- All required npm scripts: dev, build, start, lint, typecheck, test, db:generate, db:migrate, db:seed, verify, backup, restore, healthcheck.

### Changed
- Renamed project from `nextjs_tailwind_shadcn_ts` to `alo-english-test-platform`.
- Version bumped from `0.2.0` to `1.0.0`.
- `next.config.ts`: removed `ignoreBuildErrors: true` (production blocker), enabled `reactStrictMode`, added security headers.
- `src/lib/db.ts`: disabled query logging in production.
- `/api/health`: now performs a real database connectivity check instead of returning static data.
- `package.json` `start` script: uses `node` instead of `bun` for production runtime (wider compatibility).

### Security
- bcryptjs added for password hashing (cost factor 12).
- `.env.example` contains no real secrets — all values are placeholders.
- systemd service runs with `NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, and empty `CapabilityBoundingSet`.
- sudoers policy restricts the application user to service management commands only.
- Caddy config enforces HSTS, X-Frame-Options DENY, and other security headers.

### Removed
- `typescript.ignoreBuildErrors` from next.config.ts (was a production security risk).
- `eslint.ignoreDuringBuilds` from next.config.ts.
- Query logging in production database client.
