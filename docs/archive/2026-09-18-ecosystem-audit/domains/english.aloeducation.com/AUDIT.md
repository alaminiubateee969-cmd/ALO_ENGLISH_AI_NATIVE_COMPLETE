# AUDIT — english.aloeducation.com (DOMAIN 1 of execution order) — 2026-09-18
Status: **LIVE-HEALTHY / SHA-UNVERIFIED / PARTIALLY VERIFIED** (first domain attempted
per §182; blocked items documented, none guessed).

| Area | Status | Evidence/Note |
|---|---|---|
| Repository/Git | VERIFIED | remote + SHA 8121f03 == origin/main; clean tree pre-audit |
| GitHub CI | FAILED (honest) | smoke tests red — pipeline correctly blocks deploy |
| CD pipeline | CONFIGURED | deploy.yml: SSH→rsync→build→pm2→3016→local+public checks |
| Live HTTPS | VERIFIED (OBSERVED) | /api/health 200 healthy, DB connected, 2026-09-18T01:04Z |
| Live SHA | NOT VERIFIED | health payload lacks commit; add build-id to /api/health (TODO) |
| Port | CONFIGURED 3016 (conflict with docs' 3000 flagged S-03) | deploy.yml |
| Process | CONFIGURED pm2 `alo-english` | live state UNKNOWN |
| Database | VERIFIED connected; DRIFT observed (examTypes 12 vs 20) | health + snapshot |
| Secrets | VERIFIED clean | 12-pattern scan, 0 hits |
| AI agents | CONFIGURED, 9 inspected; sidecar CD-gap S-04 | registry doc |
| MCP | NONE | verified absent |
| Sandbox/permissions | VERIFIED in code (no exec/SSH paths in agents) | §59/§60 review |
| Proxy/TLS | PARTIAL (HTTPS works; vendor/cert UNKNOWN) | probes |
| DNS | PARTIAL (resolves; records UNKNOWN) | GLOBAL-DNS-MAP |
| Backup/Rollback | CONFIGURED, NOT rehearsed | docs |
