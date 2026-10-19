# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The platform now has a real AI agent workforce: fourteen agents, each
  with an execution handler, running on a durable job queue.** The registry
  used to be a hand-written list of twenty aspirational entries that all said
  "not verified". It listed agents that did not exist, described agents that
  did something else, and omitted the ones that did.

  - A **SQLite-backed durable job queue** (`src/lib/agents/runtime/queue.ts`).
    BullMQ needs Redis; the production deployment is a single Hostinger node
    with SQLite and no Redis, and adding Redis would mean a second thing that
    can be down. The queue keeps the properties that matter: jobs are leased
    so a crashed worker cannot lose them, failures are retried with
    exponential backoff and jitter and then dead-lettered, an enqueue can be
    made idempotent so a retried request does not do the work twice, and every
    transition is a row. The interface is deliberately close to BullMQ's, so
    swapping in Redis later is a contained change.
  - **Fourteen agents** (`src/lib/agents/runtime/agents/`): Exam Orchestrator,
    Question Generation, Question Quality Gate, Speaking Examiner, Writing
    Examiner, Listening & Media, Personal AI Teacher, Adaptive Learning,
    Daily Learning, Analytics, CRM Synchronization, Security & Audit, AI Model
    Router, and Agent Quality Improvement. Each one does real work against the
    real database.
  - **Every agent has a contract and a budget**: a JSON Schema for its input
    and its output, an explicit permission list, a time budget, a retry budget,
    a concurrency limit and an input-size limit. The runtime enforces them; a
    payload that does not match the input schema is rejected rather than
    retried, and a result that does not match the output schema is refused.
  - **An approval gate.** No agent can publish content, change a rubric or
    change the code. The quality gate raises an `AgentApproval`; a human
    decides; the publish job re-checks the approval's status, so approving
    twice cannot publish twice. Verified end to end: three drafts were
    generated, gated, left the live set untouched until an approval was
    recorded, and were then published with their answer keys intact — and a
    re-run of the same seed was correctly rejected as a duplicate.
  - **A self-hosted model endpoint** (`src/lib/ai/local/endpoint.ts`) with a
    health probe, a circuit breaker, a concurrency-limited queue, a bounded
    response cache and token accounting. It is tried **first**, before any
    external provider, because the platform must not depend on a paid API and
    must not send learner work to a third party by default.
  - **Versioned exam blueprints** (`src/lib/agents/runtime/blueprints.ts`) for
    all twenty exams the platform offers, each with its sections, timings,
    item types, score scale, the public provider specification it was taken
    from, and the date it was checked. The code asserts that every type a
    blueprint names is one the grader can score.
  - **A deterministic item generator** whose answer key is correct by
    construction, because the question and the passage are built from the same
    fact. It is what makes the daily pipeline work without a paid model.
  - **Admin monitoring**: `/admin/agents`, `/api/agents/status`,
    `/api/agents/metrics`, `/api/agents/jobs`, `/api/agents/approvals` and
    `/api/agents/worker/run`. An agent's status is measured from completed
    jobs, never typed by hand.
  - `scripts/agent-worker.mjs` and `scripts/daily-question-pipeline.mjs` for
    the host's cron, plus `npm run agents:work` and `npm run agents:daily`.
  - `tests/agent-workforce.test.ts`: 45 tests that run the real handlers
    against the real database. If a handler were a stub, they would fail.

- **`docs/AGENT_WORKFORCE.md` and `docs/EXAM_BLUEPRINTS.md`.**


### Added

- **The platform now has its own working evaluation agent, for every exam it
  offers.** The registry listed a "Writing Evaluator" and a "Speaking
  Evaluator" for all exams, but the only implementation was a local heuristic
  that counted words and looked for discourse markers — it did not know which
  exam the learner was preparing for, and nothing called it with a model.
  `src/lib/agents/GroqClient.ts` and `src/lib/ai/routing/ModelRouter.ts`
  existed but were imported by nothing at all.
  - `src/lib/ai/evaluation/rubrics.ts` — a rubric for **every** exam code the
    platform ships (20): the tasks that exam contains and the criteria that
    matter for it. Academic writing exams get reasoning/evidence/focus
    criteria, language exams get task-coverage/organisation/vocabulary/grammar
    criteria, and the speaking criteria deliberately exclude everything
    acoustic, because a transcript cannot evidence it. `OIETC` uses the
    generic criteria and says why: that product's identity is unverified.
  - `src/lib/ai/evaluation/ai-evaluation.ts` — the evaluator. It builds the
    prompt from the rubric, marks the learner's work as untrusted data inside
    the prompt, validates the model's answer against a strict schema, drops
    any criterion the model invented, and falls back to the local rule engine
    when the provider is absent, errors, or answers with something unusable.
    It never produces a band, a grade or a score, and every result carries a
    disclosure saying so.
  - `src/lib/ai/providers/ai-provider.ts` — the single module that performs an
    outbound model call. Chain: Groq → OpenRouter → Gemini → HuggingFace →
    local rule engine. It never throws, never blocks a submission, and sends
    nothing when no credential is configured or `AI_ENABLED=false`.
  - `AttemptEvaluation` (new model + migration
    `20261019060000_attempt_evaluation`) — one row per attempt and section,
    recording which engine produced the result and whether the local rule
    engine was used as a fallback.
  - `GET /api/attempts/:id/evaluation` — owner or administrator only.
  - The attempt submission path now collects the **speaking** transcript and
    the task prompts as well as the writing text, runs the evaluation agent
    over both, and returns the result on the result screen.
  - `tests/ai-evaluation-layer.test.ts` — 18 tests covering rubric coverage
    for all 20 exam codes, the absence of any acoustic claim, the generic
    fallback, the provider being unavailable without a credential, the schema
    rejection path, and the absence of any band/grade/score field.

  The objective sections are still graded by the deterministic rule engine.
  That is deliberate: a language model must not decide a multiple-choice
  answer. The numeric result remains `deterministic_objective`, and the
  `Score` row's `writing` and `speaking` columns stay null.

- **`check-manifest.mjs` gained check 9: no tracked file may match `.gitignore`.**
  `git ls-files -i -c --exclude-standard` must be empty. This class of defect has
  now occurred twice — 273 files / 25.7 MB committed before the ignore rules
  existed, and three `cpanel-production/dist/` archives re-added afterwards by a
  commit made on a stale base. A tracked-and-ignored file is invisible to
  `git status`, so it survives every cleanup and ships to the host on every
  clone. The check skips itself when there is no git repository, so an extracted
  source archive still passes the other eight.

- **`GET /api/crm/audit-logs` and `/api/crm/audit-logs/[id]` now exist.**
  Three admin dashboards linked to `/api/crm/audit-logs`, which was never
  registered, so the link was a 404. The new routes are read-only — an audit
  log is append-only, so a write is answered with 405 rather than pretending
  to record one.

- **`npm run db:seed:sample-bank`** runs the guarded synthetic question
  seeders in the one order that works, for a disposable CI/test database.

### Fixed

- **CI could never go green.** The pipeline seeded the administrator, the
  exam types, the settings and the RBAC tables, then ran `content:validate` —
  a gate that refuses to pass on an empty question bank. Nothing in the chain
  ever inserted a question, so the gate always failed and CI was red on the
  default branch. The question seeders are deliberately guarded so that
  synthetic fixtures can never reach a production database, so the fix was to
  add an explicit step that opts into that guard against the disposable
  `ci-test.db` file, not to weaken the gate.

- **Three validators disagreed about what a valid question type is.** The
  grader and the CI content gate accepted `TRUE_FALSE` and the read/select
  variants; the bank auditor rejected them as "invalid question type" and
  failed a bank the platform grades correctly. The vocabulary now lives in
  `src/lib/exam/question-types.json` and is read by the grader and by both
  scripts, and `scripts/check-schema-migrations.mjs` asserts that the schema
  documents exactly the same list.

- **The bank auditor was stricter than the grader.** It reported MATCHING
  questions with a single `correctIndex` as having no answer key, although
  the grader grades exactly that form.

- **Two Cambridge open-cloze questions could not be answered.** "Gap 1:" and
  "Gap 2:" were typed as prompts, and the second and third gap questions
  carried no passage at all, so the learner was asked to answer a question
  with no context. Each gap now repeats the passage and states the sentence
  to complete.

- **`postbuild` never actually validated anything.** `scripts/validate-content.mjs`
  did not load the project's `.env`, so every local build printed "BLOCKED:
  DATABASE_URL is not set" and checked nothing. It now loads `.env` when
  `DATABASE_URL` is not already exported, so an exported value still wins.

- **`.env.example` advertised three settings that no code reads**
  (`CRON_ENABLED`, `LOW_CONFIDENCE_THRESHOLD`, `MEDIUM_CONFIDENCE_THRESHOLD`).
  The daily-generation script is deliberately disabled and the confidence
  thresholds have no calibrated consumer, so the variables are removed rather
  than left advertising a feature that does not exist. The variables that the
  code *does* read but that were undocumented are now documented:
  `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `ALLOW_SYNTHETIC_SAMPLE_QUESTIONS`
  and the `AUDIO_*` set.

- **`src/lib/env.ts` validated `NEXTAUTH_URL`**, advertising an integration
  the platform does not have. `src/lib/auth.ts` is a dependency-free session
  system; `next-auth` is not installed and never was used.

- **16 unused dependencies were removed** (`@dnd-kit/*`, `@hookform/resolvers`,
  `@mdxeditor/editor`, `@reactuses/core`, `@tanstack/react-query`,
  `@tanstack/react-table`, `date-fns`, `framer-motion`, `next-auth`,
  `next-intl`, `react-markdown`, `react-syntax-highlighter`, `uuid`,
  `zustand`). `npm audit` goes from 14 advisories (10 high) to 5, and the
  remaining 5 are a single dev-only chain — `braces` → `micromatch` →
  `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next` — for which
  no fixed version of `braces` has been published and npm's suggested "fix"
  is a downgrade to an ESLint config that predates Next 16.

- **`sharp` was upgraded to 0.35.5** (forced for Next's own optional
  dependency too), clearing three high-severity libvips/librsvg/libheif
  advisories.

- **`SECURITY.md` described controls the code does not have.** It named
  `LOGIN_MAX_ATTEMPTS`/`LOGIN_LOCKOUT_MINUTES` (no such variables),
  `UPLOAD_MAX_MB` (no such variable, and no general upload endpoint exists),
  Next.js server-action CSRF tokens (the application has no server actions),
  and a role list that did not match the code. It now names the real
  mechanisms, and says plainly where a control is only a published policy
  rather than an enforced behaviour (the 365-day audit-log retention).

- **The `drainQueue` loop orphaned a claimed job.** When a job failed, the
  loop claimed a second job to test whether there was more work, and never
  executed it. The job sat in `RUNNING` until its lease expired, and the
  agent's concurrency slot was blocked meanwhile. The end-to-end run against
  the live application found it. The loop now asks the round whether it
  claimed anything.

- **The approval did not carry a target practice set,** so an approved publish
  had nowhere to go and silently produced no publish job. The quality gate now
  takes the target set, carries it on the approval, and the approval route
  says out loud when a publish cannot be scheduled.

- **The question generator produced an ungrammatical stem** — "did the site
  generated" — because the question used the passage's past participle. The
  generator now carries the base form for the question, and a test asserts
  that no generated stem is ungrammatical.

- **The 1.1.0 branch-consolidation record was wrong about `main`'s history.** It
  said `main` was a single orphan commit and that six of the seven open branches
  shared no ancestor with it. The analysis was run in a **shallow** clone whose
  `.git/shallow` listed `c5ef20d`, so `git merge-base` reported "no common
  ancestor" for branches whose shared history lay below the cut and
  `git rev-list --count` reported 1. After `git fetch --unshallow`: `main` had
  **79** reachable commits from root `8efe9b6`; there were **three** unrelated
  root histories, not seven; `arena/847f6969-…` and `arena/c61b298e-…` were
  **already ancestors of `main`** and their `-s ours` merges were no-op records;
  and `arena/01a0eea6-…` had **one** unique commit, not 56. `main` now has 163
  reachable commits and all eight remote branches are ancestors of it. The
  merges themselves were unaffected — `-s ours` cannot change a tree — and no
  content was lost. `docs/BRANCH-CONSOLIDATION.md` carries the correction and its
  verification snippet now begins with `git rev-parse --is-shallow-repository`,
  because an ancestry test in a shallow clone fails silently rather than loudly.
- **The one unique commit on `arena/01a0eea6-…` was dropped without being
  checked.** `4c7644f` documented 14 environment variables in `.env.example`
  (`SESSION_SECRET`, `ENCRYPTION_KEY`, `BOOTSTRAP_ADMIN_*`, Stripe, SMTP,
  WhatsApp, S3). Each was grepped through `src/`, `prisma/`, `scripts/` and
  `server.js`: **none is read by any code**. The single hit,
  `WHATSAPP_ACCESS_TOKEN` in `src/components/alo/portals.tsx`, is a hardcoded
  display string in a client-component status panel that reads no environment
  variable. Documenting them would advertise integrations that do not exist, so
  they stay out; `git show 4c7644f:.env.example` has the wording if they are ever
  built.

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

All seven open branches are now ancestors of `main`: **163 reachable commits
across three unrelated root histories** (`8efe9b6`, `1bd5c44`, `9e80804`).
`git branch -r --merged origin/main` lists every one.

`arena/21ea772f-…` merged normally. The remaining six were recorded with
`-s ours`, which makes a branch an ancestor of `main` without changing a single
file — the right tool for four of them, and a redundant no-op for
`arena/847f6969-…` and `arena/c61b298e-…`, which were *already* ancestors of
`main`. That mistake, and an earlier claim that `main` was a single orphan
commit, came from analysing a **shallow** clone: `.git/shallow` listed `c5ef20d`,
so `git merge-base` reported "no common ancestor" for branches whose shared
history lay below the cut. `main` in fact had 79 reachable commits. The
correction is recorded at the top of `docs/BRANCH-CONSOLIDATION.md`, along with
the verification commands, which now start with
`git rev-parse --is-shallow-repository`.

The 2026-09-18 ecosystem audit is rescued into `docs/archive/`. Two migrations
dated before ones production has already applied were deliberately not carried:
`prisma migrate deploy` would have replayed them against a live database. The one
unique commit on `arena/01a0eea6-…` documented 14 environment variables in
`.env.example`; none is read by any code in `main`, so documenting them would
have advertised integrations that do not exist. Full reasoning per branch in
`docs/BRANCH-CONSOLIDATION.md`.

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
