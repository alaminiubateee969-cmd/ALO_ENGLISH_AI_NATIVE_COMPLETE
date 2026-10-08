# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-10-08

Deployment reliability release. No user-facing feature changes; every entry
below is about the pipeline between a push to `main` and a working site.

### Fixed

- **Every deploy panicked at the first stylesheet.** `next build` runs Turbopack
  by default, and Turbopack runs PostCSS — therefore Tailwind v4 — in a pool of
  `node` workers that must connect back to the build over `127.0.0.1` TCP. The
  host's build container does not permit that connection, so the worker exited
  before it could report anything: `TurbopackInternalError:
  [project]/src/app/globals.css … node process exited before we could connect to
  it with exit status: 0`. The same source and lockfile built cleanly in CI and
  locally. `build` now runs `next build --webpack`, Next 16's documented opt-out;
  webpack runs `postcss-loader` in-process and Next's workers use IPC pipes, so
  no loopback connection is needed. `next dev` keeps Turbopack.
- **The Prisma client was never generated on the host.** Generation was left to
  `@prisma/client`'s `postinstall` hook, which fails silently — npm swallows the
  output and continues — so `next build` died much later, during page-data
  collection, with `@prisma/client did not initialize yet`. CI never caught it
  because CI ran `db:generate` as its own explicit step. `prebuild` now runs
  `scripts/ensure-prisma-client.mjs`.
- **The build did not produce a runnable artifact.** `cp -r .next/static
  .next/standalone/.next/ && cp -r public .next/standalone/` renames the source
  when the destination is absent and nests directories on a second run.
  `scripts/finalize-standalone.mjs` replaces it: idempotent, verifying, and it
  self-heals the Prisma query engine when file tracing leaves it behind — a gap
  that otherwise surfaces only at first query, after the deploy has been
  reported healthy.
- **The standalone server relocated the database.** `.next/standalone/server.js`
  runs `process.chdir(__dirname)`, so `process.cwd()` at runtime is
  `<app>/.next/standalone`. The documented `DATABASE_URL="file:./db/production.db"`
  therefore opened a database inside the build output — replaced on every deploy
  — while `prisma migrate deploy` from the repository root wrote to a different
  file. The site booted healthy and then reported an empty database.
  `src/lib/paths.ts` now derives an app root that survives a redeploy, resolves
  relative SQLite paths against it, rewrites `process.env.DATABASE_URL` to the
  absolute value Prisma will use, creates the directory, logs what it resolved
  and warns when it lands inside `.next/`.
- Uploads no longer default to `/tmp/alo-english-uploads`, which a container
  restart discards; they resolve under `APP_DATA_DIR`.
- `/api/deliverables` returned 500 when the optional legacy bundle was absent,
  which reads as a server fault. It now returns 404 with an explanation.
- **The four root inventory CSVs described a different application.** They were
  hand-written once and never regenerated: 25 models against 44 in the schema
  (every field literally `see schema`), 51 API endpoints against 73 route files
  (every description `API endpoint`), a `ROUTE_INVENTORY.csv` that duplicated
  `API_INVENTORY.csv` instead of listing the 31 pages, and a 265-row
  `FILE_MANIFEST.csv` whose `Size` column read `unknown` on every line. All four
  are now generated and accurate. The auth column in `API_INVENTORY.csv` is read
  out of the `PUBLIC_API_PATTERNS` regexes in `src/proxy.ts` rather than copied,
  so it cannot disagree with the middleware that actually enforces it.
- **`git-push.sh` was a deployment bootstrap, not a verification script.** It ran
  `git add -A`, committed with a canned message and pushed to `main` — the branch
  that auto-deploys to production — then told the operator to run
  `./deploy-vps.sh`, which does not exist on `main`. Its secret guard tested the
  exit status of the second `grep` in a pipe that always received empty input, so
  it could never fire, and every run appended `.env` to `.gitignore`. It is now a
  pre-push gate: it verifies, scans only the lines being *added* for private keys,
  platform tokens and credential-bearing connection strings (allowlisting the
  documented placeholders in `.env.example`), and requires typed confirmation to
  push to `main`. It never stages, commits, force-pushes or switches branches.

### Added

- `server.js` — a stable root entry point for the panel's "entry file" setting,
  which was blank. It checks a build exists, defaults `NODE_ENV` / `HOSTNAME` /
  `PORT`, and hands over to `.next/standalone/server.js`.
- `scripts/smoke-standalone.mjs` — boots the built artifact and asserts it binds,
  serves `/` and `/login`, serves `/logo.svg` from the copied `public/`, returns
  a health document, and serves a real Tailwind stylesheet. A broken CSS
  pipeline presents as an unstyled site, not as a build error, so it has to be
  asserted on a running server.
- `src/lib/paths.ts` — the single place that decides where the app's files live.
- `docs/ADR-0001-build-with-webpack.md` — why the build flag is load-bearing, and
  the alternatives rejected (`workerThreads` segfaults on Node 22; downgrading
  `@tailwindcss/postcss` is the wrong fix).
- `docs/BRANCH-CONSOLIDATION.md` and `docs/archive/2026-09-18-ecosystem-audit/`.
- `server-config/README.md` — those four files are validated by CI and used by
  nothing in production; without a note saying so they read as the deployment
  configuration.
- `scripts/generate-inventories.mjs` — regenerates `DATABASE_MODEL_INVENTORY.csv`,
  `API_INVENTORY.csv`, `ROUTE_INVENTORY.csv` and `FILE_MANIFEST.csv` from the
  Prisma schema, the route tree and `git ls-files`. `--check` fails when what is
  committed differs from what the source now says; CI runs it on every push.
  Exposed as `make inventories` / `npm run inventories`.
- `docs/archive/legacy-deployment-guides/` — see Changed below.

### Changed

- **CI now builds the way the host builds.** A new `host-build` job runs
  `npm install` (not bun), deletes `node_modules/.prisma` and runs `npm run
  prebuild` to prove the gate recovers an un-generated client, builds, asserts
  the artifact is complete, provisions the database with `migrate deploy` the way
  production does, and boots it. `package` now needs it, so no release artifact
  is cut from a commit the host cannot build.
- **`deploy.yml` does something.** It still does not deploy — Hostinger does, and
  `check-manifest.mjs` forbids reintroducing an SSH pipeline — but on every push
  to `main` it runs the dependency-free preflight gates, records a GitHub
  deployment against the `production` environment, publishes the panel settings
  and environment variables the commit expects as a job summary, and probes the
  live health endpoint (informational on push, enforced on manual dispatch).
- **`check-manifest.mjs` gained check 8:** the `build` script must contain
  `next build --webpack`. Its required-files list covers the new deployment
  plumbing.
- **`verify.sh`** asserts the assembled artifact, not just that a build happened,
  and runs both preflight scripts and the artifact smoke test.
- **The repository is 22 MB smaller.** 273 files were tracked while also being
  git-ignored — 25.7 MB of the 33.7 MB of tracked content — because they were
  committed before the ignore rules were written. Untracked: 13 MB of runtime
  uploads, 3.1 MB of agent scratch output, an archived sibling Next.js project,
  a 1.4 MB development database holding test accounts and a session row, release
  archives, and two superseded VPS delivery guides that instructed `scp` and
  `db push` against production. Tracked content is now 10.1 MB across 569 files,
  and `git ls-files -i -c --exclude-standard` returns empty.
- `cpanel-production/` was ignored but **is** deployed — `/api/deliverable` and
  `/api/deliverables` serve from it for `SUPER_ADMIN`. Its ignore rule is
  narrowed to `dist/` and `logs/`, which those routes skip anyway.
- `next.config.ts` keeps `@prisma/client` external so its native engine resolves
  at runtime.
- `hostinger.json` records the panel settings the pipeline actually needs, with
  the reasons, instead of a build command the panel does not read.
- `README.md` no longer instructs `ssh root@<vps>`, Node 20, a process manager,
  `bun run db:push` against production, or SSH deployment secrets. Its counts are
  corrected to 44 models / 73 API routes / 31 pages, and its licence footer now
  matches the MIT `LICENSE` file it sits under.
- `DEPLOYMENT.md` opened with "Architecture Lock — exactly ONE production
  architecture" and then described a VPS with Caddy, systemd and Bun. It now says
  plainly that it is the optional self-managed path and compares both against the
  same artifact.
- Root-level screenshots moved to `docs/images/`; `SHA256SUMS.txt` removed (it
  checksummed an artifact not in the repository).
- **Four root deployment guides named four different production targets for the
  same domain.** `DEPLOYMENT_GUIDE.md` and `CPANEL_DEPLOYMENT_GUIDE.md` described
  a cPanel release, `VPS-DEPLOYMENT-GUIDE.md` a WHM server at `115.187.18.239`,
  `SERVER-DEPLOYMENT-103.231.239.79.md` a third host. An operator following any
  of them would deploy somewhere other than `english.aloeducation.com`. All four
  are archived under `docs/archive/legacy-deployment-guides/` with a README
  explaining what each got wrong. `HOSTINGER_DEPLOYMENT.md` is now the only
  production guide at the root, alongside `DEPLOYMENT.md`, which already says it
  is the optional self-managed path.
- **`HOSTINGER_DEPLOYMENT.md` told operators to seed a question bank with a
  command that does not seed questions.** It said `node prisma/seed.mjs` and then
  `npm run prisma:seed:exams  # question bank`. After `prisma:seed:exams` became
  `seed-all-missing-exams` + `seed-expand-exams`, the questions live in the
  `prisma:seed` chain (`seed.mjs` → `seed-questions` → `seed-all-exams` →
  `seed-gre-gmat-sat-act`). A first deploy following the old instructions comes up
  healthy and serves an exam platform with no exams in it. The first-deploy
  sequence and the command table now match `package.json`, and end with
  `npm run content:validate`, which fails on an empty bank.
- `FILE_MANIFEST.csv` records file **counts** per directory, not byte totals. A
  byte column makes the drift gate fail on any edit to any file, which is noise;
  the drift worth catching is a directory gaining or losing files without the
  manifest following. The total is still printed for humans. A stale inventory now
  also prints the differing lines instead of only naming the file, so a CI failure
  is actionable from the annotation alone.
- `PROJECT-INDEX.md` is flagged as partly stale at the top and points at the
  authoritative deployment guide and the generated inventories. Rewriting the
  hand-written index was not attempted; the generated CSVs supersede its counts.
- `.zscripts/dev.pid` — a `dev.sh` runtime PID file — was tracked. Untracked, and
  `*.pid` is now ignored.
- The `Makefile` gained `preflight`, `smoke` and `inventories` targets; `ci:` now
  runs the preflight gates and boots the built artifact; and `deploy:` states on
  the line that it is the optional self-managed path and not production.

### Merged

All seven open branches are now ancestors of `main` — 144 reachable commits, up
from 1. One (`arena/21ea772f-…`) merged normally; the other six share no common
ancestor with `main`, whose tip is an orphan repair commit, and were recorded
with `-s ours` so their history is preserved without reverting those repairs.
The 2026-09-18 ecosystem audit is rescued into `docs/archive/`. Two migrations
dated before ones production has already applied were deliberately not carried:
`prisma migrate deploy` would have replayed them against a live database. Full
reasoning per branch in `docs/BRANCH-CONSOLIDATION.md`.

### Security

- `db/custom.db` no longer ships. It remains in git history; purging it by
  rewriting history and rotating the seeded passwords is recorded as an open
  owner action in the archived audit (finding S-01) and needs a force-push to
  `main`, so it was not done unilaterally.
- `.env` is tracked deliberately and now says so: non-secret defaults only, and
  Next.js never overwrites a value already in `process.env`, so panel values
  always win. `.env.local` remains git-ignored for real local secrets.

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
