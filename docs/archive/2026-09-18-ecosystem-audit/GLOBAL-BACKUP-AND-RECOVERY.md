# GLOBAL BACKUP AND RECOVERY (§114–§116) — 2026-09-18

## Configured (this service)
| Item | Mechanism | Status |
|---|---|---|
| DB backup | `scripts/backup.sh` (bun run backup) → $BACKUP_DIR (/var/backups/alo-english), cron 02:00 as aloenglish (docs) | CONFIGURED — live cron NOT VERIFIED (OWNER VERIFY) |
| Restore | `scripts/restore.sh` (bun run restore) | CONFIGURED — restore TEST never evidenced (§116 → REQUIRED) |
| Health probe | `scripts/healthcheck.sh` + Caddy health_uri + deploy pipeline local wait | CONFIGURED |
| Uploads/docs | NOT covered by any found backup config | GAP — include shared/uploads (§114) |
| Agent registry/policies/prompts | none exist yet to back up | N/A→ create with central config |
| Release manifests | none yet | created in GLOBAL-RELEASE-MANIFEST.md |

## Isolation rule (§115)
Backup dir must be writable by `aloenglish` for dumps but NOT deletable by app/agents
(append-only or separate backup user). VERIFY on VPS.

## Recovery targets to define (owner)
RPO/RTO per service; quarterly restore test evidence recorded here (§116).
