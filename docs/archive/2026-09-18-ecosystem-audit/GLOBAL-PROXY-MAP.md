# GLOBAL PROXY MAP (§41/§42) — 2026-09-18

## Observed
| Domain | Proxy software (evidence) | Upstream | Status |
|---|---|---|---|
| aloeducation.com | **nginx/1.20.1** (Server header, OBSERVED) | dead upstream → 502 | INCIDENT |
| english.aloeducation.com | UNKNOWN vendor (headers not captured) | 127.0.0.1:3016 (deploy.yml CONFIGURED) | serving healthy ✅ |
| alolabs.net | UNKNOWN | UNKNOWN | empty body |
| icla-global.com / bdtech360.com | UNKNOWN (likely shared hosting stacks) | UNKNOWN | serving |

## Configured proxy assets in this repo (choose ONE per environment, document the choice)
1. `server-config/Caddyfile.production` — Caddy, auto-TLS, health checks (`/api/health`,
   30s interval), JSON access logs with rotation, security headers, static cache headers.
2. `server-config/alo-english.nginx` — nginx, TLS 1.2/1.3, WebSocket `/socket.io/` → 3003,
   50 MB body limit (audio uploads), gzip.
   ⚠️ Inconsistency: nginx routes `/socket.io/` to 3003 but CD never starts that process;
   Caddy config has NO socket.io route at all → the AI voice examiner WebSocket has NO
   valid production path in either documented architecture. OWNER ACTION REQUIRED (design).
3. Root `Caddyfile` — `:81` with `?XTransformPort=` dynamic upstream. SANDBOX ARTIFACT.
   If ever deployed publicly it forwards any request to any localhost port → SSRF/internal-
   port exposure (§63). Recommend: delete from production paths or firewall to loopback-only.
