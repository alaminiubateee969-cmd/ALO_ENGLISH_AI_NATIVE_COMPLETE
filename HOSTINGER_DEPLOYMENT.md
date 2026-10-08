# ALO English — Hostinger Production Deployment

This is the authoritative production deployment guide.

## Production Architecture

```
GitHub (main branch)
   ↓
Hostinger Git Automatic Deployment
   ↓
Hostinger Node.js Web App
   ↓
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
node .next/standalone/server.js
   ↓
https://english.aloeducation.com
```

## Step-by-step Setup in Hostinger Panel

### 1. Create/Open Node.js Web App
1. Log in to hPanel → Hosting → english.aloeducation.com → Advanced → Node.js.
2. **Node.js version**: 22.x
3. **Package manager**: npm
4. **Application root**: `/` (repository root)
5. **Application entry file**: `.next/standalone/server.js`
6. **Application URL**: `https://english.aloeducation.com`
7. Save.

### 2. Connect Git Repository
1. In Hostinger → Website → Git → Configure.
2. Connect the GitHub repository `alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE`.
3. Branch: `main`.
4. Enable **Auto Deployment**.
5. Deploy path: `/`.

### 3. Set Environment Variables
In Node.js control panel → Configuration → Environment Variables, set:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `DATABASE_URL` | `file:./db/production.db` (or your MySQL string) | Yes |
| `AUTH_SECRET` | Generate with `openssl rand -base64 48` | Yes |
| `APP_URL` | `https://english.aloeducation.com` | Yes |
| `APP_PORT` | `3000` | Yes |
| `PORT` | `3000` | Yes |
| `AI_ENABLED` | `false` | No (local rule engine works without) |
| `GROQ_API_KEY` | (optional) | No |

**Do not** rely on the tracked `.env` for production. Set every secret in the Hostinger panel.

### 4. Build Commands
Hostinger's Node.js app runs these automatically on each git push:

```bash
npm install
npx prisma generate
npm run build
```

After the first deploy, open the Hostinger terminal (or SSH if enabled, but not required) and run:

```bash
cd ~/public_html
npx prisma migrate deploy
node prisma/seed.mjs
```

This creates the database tables, admin user, exam types, and seeds the question bank.

### 5. Generate Listening Audio
Once the application is built and the database is seeded, generate audio assets:

```bash
npm install -g edge-tts  # or: pip install edge-tts
node scripts/generate-listening-audio.mjs
```

This uses the free Microsoft Edge TTS (edge-tts) to generate MP3 files from the original listening scripts, and saves them into `public/audio/listening/` while updating each question's `audioUrl`. This step is idempotent — existing files are not regenerated.

### 6. Start the Application
The Hostinger Node.js service runs the start command from `package.json`:

```bash
NODE_ENV=production node .next/standalone/server.js
```

Restart the app from the Hostinger panel once all environment variables are set.

### 7. Verify

```bash
curl https://english.aloeducation.com/api/health
```

Expected response: `{"status":"healthy",...}`

Then visit https://english.aloeducation.com, register/login, start a practice test.

## Build & Deploy Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run db:generate` | Generate Prisma client |
| `npm run build` | Production build (Next.js standalone) |
| `npm run db:migrate` | Apply database migrations |
| `node prisma/seed.mjs` | Seed admin + exam types |
| `node prisma/seed-all-missing-exams.ts` | Seed question banks for all exams |
| `npm run audio:generate` | Generate listening audio MP3s |
| `npm run content:validate` | Validate no ungradeable questions |
| `npm start` | Start the production server |

## Rollback
If a deploy fails, in Hostinger Node.js panel → Rollback to previous deployment, or redeploy the previous commit via the Git deployment history.

## What NOT to Do
- Do NOT set up VPS, SSH, or PM2.
- Do NOT introduce a second deployment workflow (GitHub Actions deploys to VPS, etc.).
- Do NOT commit real secrets into `.env`.
- Do NOT reset production database — use `prisma migrate deploy`, not `db push` or `migrate reset`.
- Do NOT run seed scripts that delete existing user data.
