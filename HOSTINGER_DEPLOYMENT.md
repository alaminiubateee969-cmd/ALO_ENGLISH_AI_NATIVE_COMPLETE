# ALO English — Hostinger Production Deployment

**This is the authoritative production deployment guide.**

Production is `https://english.aloeducation.com`, deployed automatically by
Hostinger from the `main` branch of
`alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE`. Nothing in GitHub
Actions deploys; Actions only gates and records (see
`.github/workflows/deploy.yml`).

---

## Production pipeline

```
push to main
   ↓
Hostinger automatic Git deployment
   ↓
npm install
npm run build
   ├─ prebuild   node scripts/ensure-prisma-client.mjs   → prisma generate
   ├─ build      next build --webpack                    → .next + .next/standalone
   ├─ finalize   node scripts/finalize-standalone.mjs    → copies .next/static,
   │                                                       public/ and prisma/
   │                                                       into .next/standalone
   └─ postbuild  content validation (non-blocking; CI enforces it)
   ↓
npx prisma migrate deploy        (first deploy, and after any schema change)
   ↓
node server.js                   → .next/standalone/server.js
   ↓
https://english.aloeducation.com
```

The host runs only `npm install` and `npm run build`. npm runs `prebuild`,
`build` and `postbuild` automatically, so **nothing else has to be added to the
panel's build command**.

---

## Panel settings

hPanel → Hosting → `english.aloeducation.com` → Advanced → Node.js

| Setting | Value |
| --- | --- |
| Node.js version | **22.x** |
| Package manager | **npm** |
| Application root | `/` (repository root) |
| Application entry file | **`server.js`** |
| Application URL | `https://english.aloeducation.com` |

hPanel → Website → Git → Configure

| Setting | Value |
| --- | --- |
| Repository | `alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE` |
| Branch | **`main`** |
| Auto Deployment | **enabled** |
| Deploy path | `/` |

`server.js` at the repository root is a stable entry point that never moves
between builds; it checks that a build exists, applies sane defaults for
`NODE_ENV` / `HOSTNAME` / `PORT`, and hands over to
`.next/standalone/server.js`. Pointing the panel directly at
`.next/standalone/server.js` also works, but that path is a build output and is
easy to leave blank — which is how an app ends up deployed and never started.

`hostinger.json` in the repository root is the checked-in record of these
values. Hostinger reads the panel, not that file; if the two ever disagree, the
panel wins at runtime and `hostinger.json` is wrong — fix it in the same commit
as the panel change.

---

## Environment variables

hPanel → Node.js → Configuration → Environment Variables

| Variable | Value | Required |
| --- | --- | --- |
| `NODE_ENV` | `production` | Yes |
| `HOSTNAME` | `0.0.0.0` | Yes — anything else and the proxy cannot reach the app |
| `PORT` / `APP_PORT` | `3000` | Yes |
| `APP_URL` | `https://english.aloeducation.com` | Yes |
| `DATABASE_URL` | `file:/ABSOLUTE/PATH/db/production.db` | Yes — **must be absolute** |
| `APP_DATA_DIR` | `/ABSOLUTE/PATH` outside the release directory | Strongly recommended |
| `AUTH_SECRET` | `openssl rand -base64 48` (32+ characters) | Yes |
| `AI_ENABLED` | `false` | No — the local rule engine works without it |
| `GROQ_API_KEY` | (optional) | No |
| `UPLOAD_DIR` | (optional; defaults to `<APP_DATA_DIR>/upload`) | No |
| `BACKUP_DIR` | (optional; defaults to `<APP_DATA_DIR>/db/backup`) | No |

### Why `DATABASE_URL` must be absolute

The generated standalone server runs `process.chdir(__dirname)`, so at runtime
the working directory is `<app>/.next/standalone`, **not** the repository root.
A relative `file:./db/production.db` therefore resolves to
`<app>/.next/standalone/db/production.db` — inside the build output, which every
deploy replaces. The symptoms are a site that boots healthy and then reports an
empty database, and a redeploy that appears to delete everything, while
`prisma migrate deploy` run from the repository root writes to a *different*
file.

`src/lib/paths.ts` resolves relative paths against the application root instead
of the working directory, creates the directory, rewrites
`process.env.DATABASE_URL` to the absolute value it will actually use, logs it
at startup, and warns loudly if it lands inside `.next/`. That is a safety net,
not a substitute for configuring the panel correctly.

### Environment files and secret handling

The previously tracked `.env` is removed from the Git index by this change and
kept only in the local workspace; its contents were not read during the audit.
Because it existed in repository history, treat any value that was ever a real
credential as potentially exposed and rotate it through the relevant provider.
Git history has not been rewritten. `.env` and `.env.*` are now ignored, with
`.env.example` exempted for placeholders. Production secrets belong in the
hosting panel, not Git.

---

## First deploy

No production provisioning or deployment has been performed as part of this
audit. Before any production migration, take and verify a restorable backup,
review the exact pending migration set, and obtain operator approval. Never use
`prisma migrate dev`, `db push` or `migrate reset` against production.

The core `npm run prisma:seed` now runs only `prisma/seed.mjs` (admin, exam-type
metadata, settings, and the admin quota). It deliberately does **not** populate
questions. The legacy short-form synthetic question seed scripts are excluded
from the production seed chain and guarded so they refuse to run unless an
explicit opt-in targets a clearly named disposable test/sample SQLite file.
They are not authorized exam content and must not be used in production.

Run `npm run content:validate` only against an explicitly selected disposable
database when validating fixtures. It blocks when `DATABASE_URL` is absent,
checks answer-key shape/non-empty content, and only warns for missing audio;
it does not prove official-format coverage, content rights, or browser playback.
An empty question bank is therefore an explicit release blocker, not something
to fill with synthetic samples.

### Listening audio

Listening questions need MP3s that are generated, not committed:

```bash
npm run audio:install-deps    # pip install edge-tts
npm run audio:generate        # writes public/audio/listening/*.mp3, updates audioUrl
```

`public/` is copied into `.next/standalone` **during the build**, so audio
generated after a build is not served by the running app. Either generate before
building, or re-run the copy step afterwards:

```bash
node scripts/finalize-standalone.mjs
```

Then restart the app from the panel. The generator is idempotent — existing
files are not regenerated.

---

## Verify a release

```bash
curl https://english.aloeducation.com/api/health
```

Expected: `{"status":"healthy","version":"1.0.0","checks":{"database":"connected","examTypes":20}}`

Then check, in this order — each of these has failed silently before:

1. **The home page renders with styles.** An unstyled page means the stylesheet
   never reached `.next/standalone/.next/static`.
2. **`/login` loads** and you can sign in.
3. **A practice test starts** and submits — this exercises the attempt engine,
   not just the marketing pages.
4. **The deploy log shows the resolved data paths.** `src/lib/env.ts` prints
   them on boot:

   ```
   [env] data root: /home/<user>/alo-data
   [env] database:  file:/home/<user>/alo-data/db/production.db
   [env] uploads:   /home/<user>/alo-data/upload
   [env] backups:   /home/<user>/alo-data/db/backup
   ```

   If `database` points anywhere under `.next/`, stop and fix `DATABASE_URL`.

`.github/workflows/deploy.yml` also probes `/api/health` on every push to
`main`. On a push that probe is informational — Hostinger is usually still
building — so it cannot fail the commit. Run it manually
(Actions → *Deployment readiness (Hostinger)* → Run workflow) to assert that
production is healthy right now.

### Verifying a commit before it reaches `main`

```bash
npm install
npm run verify        # files, schema/migration parity, lint, types, artifact,
                      # and a live boot of the built server
```

`scripts/smoke-standalone.mjs` — which `verify` and CI both run — boots the real
artifact with `node server.js` and asserts it serves a styled page, a second
route, `/logo.svg` and a `/api/health` document. A build that produces files is
not the same as a deploy that works.

---

## Build command reference

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run prebuild` | Generate the Prisma client if it is missing (runs automatically) |
| `npm run build` | Production build + assemble `.next/standalone` |
| `npm start` | Start the production server (`node server.js`) |
| `npm run db:migrate` | `prisma migrate deploy` — apply migrations |
| `npm run db:seed` | Seed admin + exam types only (`prisma/seed.mjs`); **no questions** |
| `npm run prisma:seed` | Same core metadata seed; no synthetic question bank |
| `npm run prisma:seed:rbac` | Seed roles, permissions, teams |
| Legacy question seed scripts | Refuse by default; explicit opt-in allowed only for a named disposable test/sample SQLite target |
| `npm run audio:generate` | Generate candidate listening MP3s; not proof of rights, quality, or browser playback |
| `npm run content:validate` | Check answer-key shape and empty bank; audio absence is a warning, not a full media audit |
| `npm run inventories` | Regenerate the four root inventory CSVs from source |
| `npm run verify` | Every pre-deployment gate, including a live artifact boot |
| `node scripts/finalize-standalone.mjs` | Re-copy `public/` and `.next/static` into the artifact |

---

## Troubleshooting

**`TurbopackInternalError: [project]/src/app/globals.css … node process exited
before we could connect to it with exit status: 0`**

The build ran with Turbopack. Turbopack runs PostCSS in a `node` worker that must
connect back over `127.0.0.1`, which the host's build container blocks. The
`build` script must contain `next build --webpack`; `scripts/check-manifest.mjs`
fails CI if it does not. See
[`docs/ADR-0001-build-with-webpack.md`](./docs/ADR-0001-build-with-webpack.md).
Do **not** downgrade `@tailwindcss/postcss` — the CSS file in the error is where
the failure surfaces, not what causes it.

**`@prisma/client did not initialize yet. Please run "prisma generate"`**

The client was never generated. `npm run build` does this in `prebuild`; if it
still fails, the host could not reach `https://binaries.prisma.sh` to download
the query engine. `scripts/ensure-prisma-client.mjs` prints the cause.

**Site is up but the database is empty / every deploy loses data**

`DATABASE_URL` is relative. See "Why `DATABASE_URL` must be absolute" above.

**Deploy succeeds but the app never starts**

The panel's entry file is blank or points at a path that no longer exists. Set
it to `server.js`, or set the start command to `npm start`.

**Page renders without any styling**

`.next/static` was not copied into the standalone output. `npm run build` does
this via `scripts/finalize-standalone.mjs`; re-run that script and restart.

**`PrismaClient is unable to run in this browser environment`**

The query engine was not traced into `.next/standalone/node_modules`.
`scripts/finalize-standalone.mjs` detects this and repairs it; if it still
happens, check that step's output in the build log.

---

## Rollback

Hostinger Node.js panel → Rollback to the previous deployment, or redeploy a
previous commit from the Git deployment history. Migrations are additive and
`migrate deploy` never re-runs an applied migration, so rolling the code back
does not require rolling the database back.

---

## What NOT to do

- Do **not** set up a VPS, SSH or a Node process manager. Hostinger is the only
  production path; `scripts/check-manifest.mjs` fails CI if a workflow
  reintroduces one.
- Do **not** add a second deployment workflow. Two authoritative pipelines means
  neither is authoritative.
- Do **not** commit real secrets to `.env`.
- Do **not** remove `--webpack` from the build script.
- Do **not** use a relative `DATABASE_URL` in the panel.
- Do **not** reset the production database — `prisma migrate deploy`, never
  `db push` or `migrate reset`.
- Do **not** run seed scripts that delete existing user data.
