# GLOBAL DATABASE MAP (§47/§48) — 2026-09-18

## Databases discovered (all in THIS repo only; others require owner/VPS access)

| Database | Engine | Location | Evidence | Status |
|---|---|---|---|---|
| ALO English app DB | SQLite via Prisma 6 | `file:./db/custom.db` (default) / `file:/opt/alo-english/shared/db/app.db` (docs) / live value in `$DATABASE_URL` secret | .env.example, deploy docs | CONFIGURED; live DB connected (health OBSERVED); schema drift OBSERVED (live `examTypes:12` vs repo seed `20`) |
| Committed snapshot | SQLite | `db/custom.db` (tracked in Git!) | inspected | **HIGH: contains 7 users w/ bcrypt hashes, emails, session row, 29 audit-log rows** — purge + rotate (§57/§156) |
| MySQL alternative | MySQL | documented option only | .env.example comment, PRODUCTION-DEPLOYMENT-GUIDE | NOT VERIFIED |
| cpanel-production SQL seeds | MySQL dumps | `cpanel-production/database/*.sql` (12 files, tracked) | inspected listings | CONTENT AUDIT PENDING (secrets scan of SQL seeds: clean of key material so far) |

## Isolation status (§48/§101)
- This app's DB is file-scoped to this service ✅ (by design — no shared server discovered).
- No cross-domain DB credentials found in the repo (secret scan PASS).
- Every OTHER domain's database: UNKNOWN — OWNER ACTION REQUIRED (engine/host/user/backup).

## Migration posture (§50)
- `prisma/migrations/` tracked (2 migrations: init + crm_full_schema) ✅ versioned.
- `db:reset` script exists (`prisma migrate reset --force`) — must NEVER be run in production
  by agents or CI. Flagged for policy: production migrations need backup + approval gate.
