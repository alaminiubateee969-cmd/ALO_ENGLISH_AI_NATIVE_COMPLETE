# Deployment

> ## ⚠️ This is NOT the production deployment path
>
> **Production runs on Hostinger and is deployed automatically from the `main`
> branch.** The authoritative guide is
> **[`HOSTINGER_DEPLOYMENT.md`](./HOSTINGER_DEPLOYMENT.md)**.
>
> Everything below describes an *optional* self-managed deployment on
> infrastructure you control yourself — a VPS with systemd, Caddy and Bun. It is
> kept working and CI still validates its scripts and config files, but:
>
> - it is **not** what `english.aloeducation.com` runs on;
> - GitHub Actions **never** deploys anywhere (`.github/workflows/deploy.yml` is
>   CI and release-record only, and `scripts/check-manifest.mjs` fails the build
>   if an SSH/PM2/rsync directive is added to any workflow);
> - running both paths against the same domain at once produces two
>   authoritative deployments, which is how configuration drift and data loss
>   happen.
>
> If you are deploying this project, read `HOSTINGER_DEPLOYMENT.md` first and
> only continue here if you deliberately chose to self-host.

## Two paths, one artifact

Both paths build the same artifact and start it the same way:

```bash
npm install          # or: bun install
npm run build        # prebuild → prisma generate; next build --webpack; finalize-standalone
node server.js       # → .next/standalone/server.js
```

They differ only in who runs those commands, where the data directory lives,
and what terminates TLS.

| | Hostinger (production) | Self-managed VPS (optional) |
| --- | --- | --- |
| Triggered by | push to `main`, automatic Git deployment | `scripts/install.sh` |
| Package manager | npm (`package-lock.json`) | Bun (`bun.lock`) |
| Process supervision | Hostinger Node.js Web App | systemd (`alo-english.service`) |
| TLS / proxy | Hostinger | Caddy or nginx (`server-config/`) |
| Data directory | panel env: `APP_DATA_DIR`, absolute `DATABASE_URL` | `/opt/alo-english/shared` |
| Guide | `HOSTINGER_DEPLOYMENT.md` | this file |

Two consequences that apply to **both** paths, because both run the standalone
server, which calls `process.chdir(__dirname)`:

1. `DATABASE_URL` must be an **absolute** path. A relative `file:./db/*.db`
   resolves inside `.next/standalone` — a directory every deploy replaces.
2. Uploads and backups must live under `APP_DATA_DIR`, not under the release
   directory or `/tmp`.

`src/lib/paths.ts` enforces both and logs the paths it resolved, so a
misconfiguration is visible in the very first line of the deploy log.

---

## Optional self-managed VPS reference

### Architecture

| Component | Value |
|---|---|
| Operating System | Ubuntu 24.04 LTS |
| Runtime | Node.js 22 LTS |
| Package Manager | Bun (lockfile: `bun.lock`) |
| Framework | Next.js 16 standalone |
| Database | SQLite via Prisma |
| Reverse Proxy | Caddy |
| Process Manager | systemd |
| Application User | `aloenglish` |
| Source Directory | `/opt/alo-english-source` |
| Runtime Directory | `/opt/alo-english` |
| Application Port | 3000 |
| Backups | `/var/backups/alo-english` |
| Logs | systemd journal + `/opt/alo-english/shared/logs` |
| Build Output | `.next/standalone/server.js` |
| Service Name | `alo-english.service` |

## Prerequisites

WHY: The server must have the correct runtime and tools before deployment.

COMMAND:
```bash
node --version && bun --version && caddy version
```

EXPECTED RESULT:
```
v22.x.x
1.3.x
v2.x.x
```

FAILURE ACTION: Install Node.js 22 LTS, Bun, and Caddy before proceeding.

## Staged Deployment (12 Steps)

### Step 1: Create the application user

WHY: The app should not run as root.

COMMAND:
```bash
sudo useradd -r -m -d /opt/alo-english -s /bin/bash aloenglish
```

EXPECTED RESULT: User `aloenglish` created.

### Step 2: Create directory structure

WHY: Staged releases with symlink swap enable zero-downtime + rollback.

COMMAND:
```bash
sudo mkdir -p /opt/alo-english/releases /opt/alo-english/shared/db /opt/alo-english/shared/uploads /opt/alo-english/shared/logs
sudo chown -R aloenglish:aloenglish /opt/alo-english
```

### Step 3: Upload source

WHY: The source must be on the server before building.

COMMAND:
```bash
scp alo-english-source.tar.gz aloenglish@your-server:/opt/alo-english-source/
ssh aloenglish@your-server
cd /opt/alo-english-source
tar -xzf alo-english-source.tar.gz
```

### Step 4: Create the production .env

WHY: Secrets must be generated on the server, never in the archive.

COMMAND:
```bash
cd /opt/alo-english-source
cp .env.example /opt/alo-english/shared/.env
# Generate AUTH_SECRET:
openssl rand -base64 48
# Edit /opt/alo-english/shared/.env with the generated secret + real values
nano /opt/alo-english/shared/.env
chmod 600 /opt/alo-english/shared/.env
```

### Step 5: Verify the archive checksum

WHY: Detect corruption or tampering.

COMMAND:
```bash
cd /opt/alo-english-source
sha256sum -c alo-english-source.tar.gz.sha256
```

EXPECTED RESULT: `alo-english-source.tar.gz: OK`

FAILURE ACTION: Re-upload the archive. Do not proceed with a corrupted archive.

### Step 6: Install dependencies

WHY: Lockfile-accurate installation for reproducible builds.

COMMAND:
```bash
cd /opt/alo-english-source
bun install --frozen-lockfile
```

FAILURE ACTION: If this fails, the lockfile is out of sync. Do NOT run `bun install` without `--frozen-lockfile` in production.

### Step 7: Generate Prisma client

COMMAND:
```bash
bun run db:generate
```

### Step 8: Lint, typecheck, smoke test

COMMAND:
```bash
bun run lint && bun run typecheck && bun test tests/
```

FAILURE ACTION: Fix lint/type errors before proceeding. Do NOT bypass with `|| true`.

### Step 9: Build

COMMAND:
```bash
bun run build
```

EXPECTED RESULT: `.next/standalone/server.js` exists.

FAILURE ACTION: Check build output for errors. Do not proceed if the build fails.

### Step 10: Apply database migrations

WHY: Production uses `migrate deploy` (non-interactive, safe).

COMMAND:
```bash
export DATABASE_URL="file:/opt/alo-english/shared/db/app.db"
bun prisma migrate deploy
```

FAILURE ACTION: Do NOT use `migrate dev` in production. If migration fails, inspect the SQL and fix forward.

### Step 11: Seed (first deploy only)

COMMAND:
```bash
export DATABASE_URL="file:/opt/alo-english/shared/db/app.db"
ADMIN_SEED_PASSWORD="your-strong-password" bun run db:seed
```

EXPECTED RESULT: Admin user created. Password printed once (or set via env).

### Step 12: Deploy the release

WHY: The install script handles the staged symlink swap + service restart.

COMMAND:
```bash
sudo bash scripts/install.sh
```

EXPECTED RESULT: Service starts, health endpoint responds.

### Step 13: Verify

COMMAND:
```bash
sudo systemctl status alo-english
curl -s http://localhost:3000/api/health | jq .
```

EXPECTED RESULT:
```json
{ "status": "healthy", "version": "1.0.0", "timestamp": "...", "checks": { "database": "connected", "examTypes": 20 } }
```

### Step 14: Configure Caddy

WHY: Caddy provides HTTPS + reverse proxy.

COMMAND:
```bash
sudo cp server-config/Caddyfile.production /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Step 15: Install sudo policy

WHY: The app user needs restricted sudo for service management only.

COMMAND:
```bash
sudo cp server-config/sudo-policy /etc/sudoers.d/alo-english
sudo chmod 0440 /etc/sudoers.d/alo-english
sudo visudo -c -f /etc/sudoers.d/alo-english
sudo visudo -c
```

FAILURE ACTION: If `visudo -c` fails, do NOT reload sudo. Fix the policy file first.

## Rollback

See [scripts/rollback.sh](./scripts/rollback.sh):

```bash
bash scripts/rollback.sh --list     # list available releases
bash scripts/rollback.sh            # roll back to previous release
```

## Update

```bash
bash scripts/update.sh
```

This creates a new release and preserves the previous one for rollback.
