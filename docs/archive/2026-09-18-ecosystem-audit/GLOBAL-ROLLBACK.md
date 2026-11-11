# GLOBAL ROLLBACK (§122/§124) — 2026-09-18

## This service
| Mechanism | Evidence | Status |
|---|---|---|
| `scripts/rollback.sh` (exists; checks health on APP_PORT, default 3000) | repo | CONFIGURED — port default must be aligned with final port decision (S-03) |
| systemd release-symlink layout (`/opt/alo-english/releases/<ts>` → `current`) | SERVER-DEPLOYMENT doc | rollback = re-point symlink + restart unit — CONFIGURED (architecture B) |
| PM2 architecture (deploy.yml) | previous release = previous `$VPS_PATH` content; rsync --delete DESTROYS old files in place → **NO built-in version rollback in architecture A** | GAP — adopt releases/current symlink pattern for PM2 path too, or keep N releases |
| DB rollback | Prisma migrations are forward-only in CD; `migrate reset` banned in prod | restore-from-backup only (see backup doc) |

## Rule (§122)
Rollback path must be VERIFIED (rehearsed) before any production deploy is approved.
Currently NOT REHEARSED → production gate item open.
