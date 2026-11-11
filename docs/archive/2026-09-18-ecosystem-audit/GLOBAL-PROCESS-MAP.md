# GLOBAL PROCESS MAP (§94) — 2026-09-18

No live process inspection was possible (no VPS/SSH access from sandbox). Everything below
is what the repository CONFIGURES; live PID/user/cwd verification = OWNER ACTION REQUIRED.

## This service (english.aloeducation.com) — two configured architectures

### A) CD pipeline architecture (.github/workflows/deploy.yml) — what GitHub actually runs
| Field | Value | Status |
|---|---|---|
| Process manager | PM2 | CONFIGURED |
| Process name | `alo-english` | CONFIGURED |
| Start | `pm2 start .next/standalone/server.js --name alo-english --cwd $VPS_PATH` | CONFIGURED |
| Env | PORT=3016, HOSTNAME=127.0.0.1, NODE_ENV=production | CONFIGURED |
| Restart scope | `pm2 delete alo-english` then start — ONLY this app | CONFIGURED ✅ (§93) |
| Sidecar examiner-stream (3003) | **not started anywhere in CD** | WARNING — feature gap |

### B) Documentation architecture (README, server-config/, SERVER-DEPLOYMENT-*.md)
| Field | Value | Status |
|---|---|---|
| Process manager | systemd `alo-english.service` (+ PM2 alt in ecosystem.config.js) | CONFIGURED |
| User/Group | `aloenglish` (dedicated, no root) | CONFIGURED ✅ (§35) |
| Directory | `/opt/alo-english/{releases,current,shared}` release-symlink layout | CONFIGURED |
| Env file | `/opt/alo-english/shared/.env` (0600) | CONFIGURED |
| Hardening | NoNewPrivileges, ProtectSystem=strict, PrivateTmp, cap-bounding, restricted sudo | CONFIGURED ✅ |
| Port | 3000 | CONFLICT with A |

**Live process inventory (PID, user, cwd, runtime version, command, env, port, deployed SHA):
UNKNOWN for every service in the ecosystem — full VPS inventory is the #1 owner action.**
