# GLOBAL PORT MAP (§7/§8/§10) — 2026-09-18

Machine-readable source: `config/DOMAIN-REGISTRY.yaml` (`port_map_reported`).

## Reported map (REPORTED/CONFIGURED — no live socket inspection possible from sandbox)
See registry. Additionally discovered **in-repo** ports the reported map omits:

| Port | Owner (evidence) | Evidence status | Notes |
|---|---|---|---|
| 3000 | this app — README/PM2 ecosystem.config.js/Caddyfile.production/nginx/scripts default | CONFIGURED (alternative architecture) | CONFLICTS with 3016 until owner confirms which architecture is live |
| 3003 | this app — `mini-services/examiner-stream/index.ts` (`const PORT = 3003`) | CONFIGURED in code | NOT started by deploy.yml → feature at risk; CORS `origin:"*"` flagged |
| 81 | sandbox Caddyfile (`XTransformPort` query proxy) | CONFIGURED (sandbox artifact) | **MUST NOT be exposed publicly** — acts as unauthenticated localhost port-forward (§63 SSRF-class) |

## Collision check (§10)
- 3011,3012,3013,3014,3016,3017,3018,3019,3020,3021,3022,3023,3024,3029,3044: no intra-map
  duplicates. 3000 (docs) vs 3016 (CD) is a *documented architecture conflict* for the SAME
  service, not a collision between services.
- Live bind-address verification (`ss -lntp`, firewall state) requires VPS access —
  OWNER ACTION REQUIRED for every port (§8 checklist).

## Binding policy (§8 target state)
All application ports MUST bind `127.0.0.1` only and be published via 443 reverse proxy.
`deploy.yml` sets `APP_HOST=127.0.0.1` (CONFIGURED ✅). Other services UNKNOWN.
