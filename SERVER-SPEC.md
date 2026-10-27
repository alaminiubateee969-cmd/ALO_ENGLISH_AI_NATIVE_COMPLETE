# SERVER-SPEC.md — alo-server-lap Deployment Specification

**Target host:** alo-server-lap · `103.231.239.79` · Ubuntu 22.04 LTS
**App:** `english.aloeducation` — ALO English AI Native (Next.js 16 standalone + Prisma 6 + SQLite)
**Public URL:** https://english.aloeducation.com (Cloudflare proxied)
**Prepared:** 2026-10-27 · matches repo branch `arena/4a47e020-alo-english-ai-native-complete`

---

## 1. Host inventory (as supplied)

| Component | Version | Notes |
|---|---|---|
| OS | Ubuntu 22.04 LTS | `ubuntu` user, `/home/ubuntu/projects/` convention |
| Node.js | v24.22.1 (NVM) | satisfies `package.json` engines `>=20` |
| npm | 11.19.1 | |
| PM2 | 7.1.1 | daemon already running; apps live under it |
| Nginx | 1.18.0 | sites in `/etc/nginx/sites-available/` |
| PostgreSQL 14 / Redis 6 | installed | **not used by this app** (see §3 Data layer) |
| SQLite | 3.37 | the actual database engine |
| Cloudflare | proxied, SSL **Flexible** | origin sees plain HTTP :80 |

## 2. Process layout

| Item | Value |
|---|---|
| PM2 app name | `english.aloeducation` |
| Mode | **fork** (1 instance — SQLite has a single writer; never use cluster mode) |
| Port | **3055** |
| Bind | `127.0.0.1:3055` (Nginx is the only public face) |
| Start command | `node server.js` from the standalone release dir |
| Env file | `~/.alo-english.env` (mode 600, never committed) |
| Logs | `~/.pm2/logs/english.aloeducation-out.*log` / `-err.*log` |
| Graceful stop | `kill_timeout: 10000` — lets in-flight requests + queue runner drain |

Source of truth: **`deploy/ecosystem.config.cjs`** (referenced by path in the PM2 commands below).

## 3. Data layer

- **Engine:** SQLite via Prisma (`better-sqlite3`-compatible file DB; host SQLite 3.37 ✔).
- **Location — outside the checkout:** `~/projects/alo-english-data/alo-english.db` (so `git pull`/redeploys can never touch data; convention matches the host's other apps).
- Migrations: 15 (`npx prisma migrate deploy` on release; all additive — safe on existing data).
- Backups: nightly cron `sqlite3 ... ".backup ..."` + weekly off-host copy (runbook in `deploy/README.md` §Backup).
- PostgreSQL/Redis on the host stay untouched — other apps keep using them.

## 4. Network path

```
Visitor → Cloudflare (proxied, Flexible SSL) → :80 nginx → 127.0.0.1:3055 (PM2 fork)
```

- **Nginx site:** `deploy/nginx-english.aloeducation.com.conf` → symlink into `sites-enabled`, `nginx -t`, reload.
- Real-IP from Cloudflare ranges, gzip, 60s proxy timeout, `/api/health` endpoint exposed for uptime checks.
- **443 block included but commented** — for the planned Cloudflare **Full/Strict** upgrade (certbot cert; strongly recommended before real traffic).
- Firewall: 80/443 open (Cloudflare only, once ranges are allow-listed); 3055 **not** exposed.

## 5. Release directory layout (per host convention)

```
/home/ubuntu/projects/english.aloeducation.com/     ← git checkout (source, scripts, prisma/)
/home/ubuntu/projects/english.aloeducation.com/releases/  ← unpacked standalone artifacts
/home/ubuntu/projects/alo-english-data/alo-english.db     ← the database (outside checkout)
/home/ubuntu/.alo-english.env                          ← secrets (chmod 600)
```

## 6. Environment variables (`~/.alo-english.env`)

Required at runtime:

```bash
DATABASE_URL="file:/home/ubuntu/projects/alo-english-data/alo-english.db"
AUTH_SECRET="$(openssl rand -hex 32)"          # 32+ chars; rotating it logs everyone out
NODE_ENV="production"
PORT="3055"
APP_URL="https://english.aloeducation.com"
```

Optional (all degrade gracefully when unset — see §8):

```bash
GROQ_API_KEY=            # or OPENROUTER_API_KEY= / LOCAL_MODEL_URL=  (any one enables AI)
AI_ENABLED=false         # flip to true once a provider key is set
LANGUAGETOOL_URL=        # e.g. http://127.0.0.1:8010 if you self-host LanguageTool
STRIPE_SECRET_KEY=       # payments stay 503-disabled until this exists
```

Full annotated list: `.env.example` in the repo root.

## 7. First deployment (exact commands)

```bash
# one-time prep
mkdir -p ~/projects/alo-english-data ~/projects/english.aloeducation.com
git clone <repo-url> ~/projects/english.aloeducation.com
cd ~/projects/english.aloeducation.com
git checkout arena/4a47e020-alo-english-ai-native-complete   # or main after merge

# build on the host (Node 24 ✔)
npm ci
DATABASE_URL="file:/home/ubuntu/projects/alo-english-data/alo-english.db" \
  npx prisma migrate deploy
npm run build            # produces .next/standalone

# process
cp deploy/ecosystem.config.cjs .
pm2 start ecosystem.config.cjs
pm2 save

# web tier
sudo cp deploy/nginx-english.aloeducation.com.conf /etc/nginx/sites-available/english.aloeducation.com
sudo ln -s /etc/nginx/sites-available/english.aloeducation.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# verify
curl -s http://127.0.0.1:3055/api/health | jq .
curl -s -o /dev/null -w '%{http_code}\n' https://english.aloeducation.com
```

Ongoing updates, rollback, and backup drills: **`deploy/README.md`** (step-by-step). The host's own helper `deploy-new-site.sh` is kept in `deploy/` untouched.

## 8. Operational notes

- **First boot:** the DB starts empty — register the first admin, then rotate the seed password.
- **AI providers:** leave unconfigured for launch; deterministic fallbacks serve everything. When ready, any of Groq / OpenRouter / self-hosted Ollama·vLLM (set `LOCAL_MODEL_URL`) enables the AI layer — the open-source extension architecture is intentionally untouched (`docs/AI_AGENT_OPERATION.md` §Providers).
- **Audio:** run `npm run audio:generate` once on the host (internet available there) to fill the 74 silent listening items.
- **Cloudflare:** A record `english → 103.231.239.79` proxied; when moving SSL Flexible→Full/Strict, uncomment the 443 block and issue a certbot cert.
- **Log rotation:** PM2's built-in log rotation (`pm2 install pm2-logrotate`) or logrotate(8).
- **Monitoring:** `/api/health` (liveness) and `/super-admin/health` (admin UI: services + agents + integrations at a glance).
- **Never** run the app in cluster mode or point two writers at the SQLite file.

## 9. Rollback

```bash
cd ~/projects/english.aloeducation.com
git checkout <previous-tag-or-commit>
npm ci && npm run build
pm2 restart english.aloeducation --update-env
```

The additive-only migration policy means an old build always runs against the newer schema safely.
