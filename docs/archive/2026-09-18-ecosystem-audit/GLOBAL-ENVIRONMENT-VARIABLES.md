# GLOBAL ENVIRONMENT VARIABLES (§17/§57) — 2026-09-18

## This service — declared variables (.env.example, VERIFIED complete list)
| Var | Purpose | Secret? | Default | Prod requirement |
|---|---|---|---|---|
| DATABASE_URL | Prisma datasource (SQLite file or MySQL) | contains cred if MySQL | file:./db/custom.db | MUST point outside repo tree (shared/), 0600 |
| AUTH_SECRET | next-auth signing | **SECRET** | placeholder | openssl rand -base64 48, ≥32 chars, rotate on S-01 |
| BCRYPT_COST | hashing cost | no | 12 | 12 ✅ |
| AI_ENABLED / GROQ_API_KEY / OPENROUTER_API_KEY / GEMINI_API_KEY / HUGGINGFACE_API_KEY / AI_MODEL / AI_REQUEST_TIMEOUT_SECONDS | optional AI providers | **SECRET**s | false/empty | keys only in VPS env + GitHub secrets; never in Git/chat/RAG (§34) |
| NODE_ENV / APP_URL / APP_PORT / PORT | runtime | no | production / https://english.aloeducation.com / 3000 | align APP_PORT with final port decision (S-03) |
| BACKUP_DIR | backup target | no | /var/backups/alo-english | ensure exists + restricted perms |
| LOW_/MEDIUM_CONFIDENCE_THRESHOLD | evaluator tuning | no | 0.45/0.70 | — |
| CRON_ENABLED | daily question generation | no | false | keep OFF until reviewed (§109) |

## CI/CD-only variables (deploy.yml)
CI_DATABASE_URL, AUTH_SECRET (literal ci-only value) — test-only, clearly non-prod ✅.

## GitHub Actions secrets (names only — values NEVER read/printed, §120)
VPS_HOST, VPS_USER, VPS_SSH_PORT, VPS_PATH, VPS_SSH_KEY, CI_DATABASE_URL.
OWNER ACTION REQUIRED: confirm least-privilege values + that VPS_USER is NOT root (§35).

## Rules in force
- `.env` never committed (verified clean). Example file carries placeholders only.
- Dev/test/prod separation: no prod secret may appear in any non-prod env (§17).
