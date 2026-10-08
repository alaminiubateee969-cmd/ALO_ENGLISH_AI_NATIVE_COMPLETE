# GLOBAL ARCHITECTURE (as OBSERVED/CONFIGURED, 2026-09-18)

## What is actually known today (evidence-based)

```
INTERNET
   │
   ├─ english.aloeducation.com ──HTTPS OK──▶ reverse proxy (vendor UNKNOWN)
   │                                            │
   │                                            ▼
   │                              127.0.0.1:3016  (deploy.yml CONFIGURED)
   │                                            │
   │                                PM2 process "alo-english"
   │                                Next.js 16 standalone (this repo @ 8121f03)
   │                                            │
   │                                     SQLite (Prisma) — live data DRIFTED from repo seed
   │
   ├─ aloeducation.com ──▶ nginx/1.20.1 ──▶ 502 Bad Gateway  ← LIVE INCIDENT
   ├─ alolabs.net ────────▶ HTTPS reachable, EMPTY response (app UNKNOWN)
   ├─ icla-global.com ────▶ WordPress + Elementor (near-empty page)
   ├─ bdtech360.com ──────▶ "TECH360" site + PUBLIC AI chat agent (needs review)
   └─ 10 further domains ─▶ NOT REACHABLE from inspection vantage (§ owner verify)
```

## Documented-but-unproven (CONFIGURED only)
- Ports 3011–3044 mapping (report in `config/DOMAIN-REGISTRY.yaml`).
- Alternative deployment architecture for this app: systemd `alo-english.service`
  + Caddy + `/opt/alo-english/{releases,shared}` + dedicated `aloenglish` user
  (`server-config/*`) — good hardening, but NOT the pipeline GitHub actually runs.
- CD architecture (`.github/workflows/deploy.yml`): PM2, port 3016, bind 127.0.0.1,
  rsync to `$VPS_PATH`, build on VPS — currently RED (tests fail) so NOTHING deploys
  through Git right now (§89/§162 drift risk active).

## Target architecture (§160/§169) — adopted as the goal state
Single controlled ingress → per-service isolation (user, dir, DB, secrets, ports) →
agent policy/capability layer → audit. See `docs/GLOBAL-SECURITY.md` for boundary rules.

## Verification chain (§97) status for the one VERIFIED-live domain
english.aloeducation.com: DNS✅(implicit via HTTPS fetch) TLS✅(handshake OK) HTTPS✅
Proxy🟡(vendor unknown) Port🟡(3016 CONFIGURED; live bind unverified) Process🟡(PM2 name
CONFIGURED) App✅(health 200) DB✅(connected) AI🟡(sidecar not in CD) SHA❌(live SHA unknown)
