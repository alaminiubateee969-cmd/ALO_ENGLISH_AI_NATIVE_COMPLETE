# deploy/ — production deployment on alo-server-lap

Target host: **Ubuntu 22.04 LTS @ 103.231.239.79** · PM2 7.1.1 · Nginx 1.18.0 ·
Node 22/24 (NVM) · Cloudflare (proxied) · Domain `english.aloeducation.com`,
port **3055**.

## Files

| File | Purpose |
|---|---|
| `ecosystem.config.cjs` | PM2 process definition (name `english.aloeducation`, port 3055, graceful shutdown, log paths per host convention) |
| `nginx-english.aloeducation.com.conf` | Nginx reverse-proxy site for the domain |
| `deploy-new-site.sh` | The host's generic deploy helper, kept here so the repository documents the exact host pipeline |

## First deployment

```bash
# 1. Code
cd ~/projects && git clone <this-repository> alo-english && cd alo-english

# 2. Secrets — NEVER in the repo. Create a private env file and source it:
cat > ~/.alo-english.env <<'EOF'
export DATABASE_URL="file:/home/alamin/projects/alo-english-data/production.db"
export AUTH_SECRET="$(openssl rand -base64 48)"
export ADMIN_SEED_PASSWORD="<a strong password>"
EOF
chmod 600 ~/.alo-english.env

# 3. Install, migrate, seed — with the private env loaded
source ~/.alo-english.env
npm ci
npm run db:generate
npm run db:migrate          # prisma migrate deploy — never resets, only additive
npm run prisma:seed         # creates the admin account + exam types + settings

# 4. Build and run
npm run build
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save && pm2 startup

# 5. Nginx
sudo cp deploy/nginx-english.aloeducation.com.conf /etc/nginx/sites-available/english.aloeducation.com
sudo ln -sf /etc/nginx/sites-available/english.aloeducation.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Cloudflare DNS: A record english.aloeducation.com → 103.231.239.79 (Proxied)
```

## Database location — read this before the first deploy

`DATABASE_URL` above points **outside** the checkout
(`~/projects/alo-english-data/production.db`). This is deliberate: the app's
own `src/lib/paths.ts` warns when the database resolves inside the build
output, because a redeploy replaces that directory and the site would come
back "empty". Keep the data directory outside the code directory, and back it
up with the repo's own script:

```bash
npm run backup     # scripts/backup.sh — verify + checksum into db/backup/
```

SQLite is a single-writer database: keep PM2 `instances: 1` on this host.
PostgreSQL 14 is available on the server if the platform later needs
concurrent writers — change `DATABASE_URL` and run `npm run db:migrate`
against it; the schema is provider-portable except for SQLite-specific
default syntax already handled by the migrations.

## Updating an existing deployment

```bash
source ~/.alo-english.env
cd ~/projects/alo-english
git pull
npm ci
npm run db:migrate      # additive migrations only — existing data is preserved
npm run build
pm2 reload english.aloeducation   # zero-downtime reload (fork mode restarts once)
curl -s localhost:3055/api/health | head -c 200
```

## Rollback

```bash
git checkout <previous-tag>
npm ci && npm run build && pm2 reload english.aloeducation
```
Migrations are append-only; rolling the code back never rolls the schema back.
If a migration itself must be reverted, use the documented restore drill
(`npm run drill:restore`) against a backup, on the host, with the app stopped.

## The host's generic helper

`deploy-new-site.sh <app> <domain> <port>` is the server-wide convention for
new sites. This app is already registered per that convention:

| Domain | PM2 app | Port |
|---|---|---|
| english.aloeducation.com | english.aloeducation | 3055 |

## Security notes

- Cloudflare SSL is currently **Flexible**; upgrade to **Full/Strict** with a
  Let's Encrypt certificate (the nginx file contains the ready 443 block).
- Set `AUTH_SECRET` once and keep it stable — rotating it invalidates every
  session cookie.
- The admin seed password is only needed for the first `prisma:seed`; change
  the admin password in the UI afterwards.
