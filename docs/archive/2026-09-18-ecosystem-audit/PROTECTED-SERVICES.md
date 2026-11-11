# PROTECTED SERVICES REGISTRY (§12)

> STATUS LANGUAGE per master spec §174. "VERIFY" = evidence NOT YET gathered.
> Generated 2026-09-18 from commit `8121f036` (VERIFIED local == origin/main).

| # | Domain | Reported Port | Process | Directory | Repository | Protected |
|---|--------|---------------|---------|-----------|------------|-----------|
| 1 | alolabs.net | 3011 | VERIFY | VERIFY | VERIFY (no repo found) | YES |
| 2 | hosting.alolabs.net | 3012 | VERIFY | VERIFY | VERIFY | YES |
| 3 | agents.alolabs.net | 3013 | VERIFY | VERIFY | VERIFY | YES |
| 4 | panel.alolabs.net | 3014 | VERIFY | VERIFY | VERIFY | YES |
| 5 | aloeducation.com | 3044 | VERIFY | VERIFY | VERIFY (no repo found) | YES |
| 6 | english.aloeducation.com | 3016 (CD) / 3000 (docs) | `alo-english` (PM2, CONFIGURED) | `$VPS_PATH` secret / `/opt/alo-english` (docs) | **this repo** (main @ 8121f03) | YES |
| 7 | learn.aloeducation.com | 3017 | VERIFY | VERIFY | VERIFY | YES |
| 8 | alaminn.info | 3018 | VERIFY | VERIFY | VERIFY | YES |
| 9 | icla-global.com | 3019 | VERIFY (WordPress OBSERVED) | VERIFY | VERIFY | YES |
| 10 | icla-global.in | 3020 | VERIFY | VERIFY | VERIFY | YES |
| 11 | bdtech360.com | 3021 | VERIFY | VERIFY | VERIFY | YES |
| 12 | ecotechbd.com | 3022 | VERIFY | VERIFY | VERIFY | YES |
| 13 | neelacholcityagro.com | 3023 | VERIFY | VERIFY | VERIFY | YES |
| 14 | uninotary.com | 3024 | VERIFY | VERIFY | VERIFY | YES |
| 15 | marketing.alolabs.net | 3029 | VERIFY | VERIFY | VERIFY | YES |

## Isolation rules in force (§11, §92, §179)
1. A change/deploy of `english.aloeducation.com` (this repo) must never restart, redeploy,
   or reconfigure any other row above. `deploy.yml` only ever touches `pm2` app `alo-english`
   inside `$VPS_PATH` — VERIFIED in code (§93 compliant: no `pm2 restart all` anywhere).
2. No service in this table may read another service's env/secrets/database.
3. `db/custom.db` (SQLite) belongs to this service ONLY.
4. Sidecar `examiner-stream` (3003) belongs to this service ONLY.

## Known cross-service risks found
- `deploy.yml` rsync target `$VPS_PATH` is a GitHub secret — must point to a directory
  dedicated to this service only. OWNER ACTION REQUIRED: confirm value isolates this app.
- Shared VPS IP(s) reported in docs (`103.231.239.79`, `115.187.18.239` — CONFLICT, both
  unverified). If one VPS hosts multiple rows, per-service OS users + firewall scoping are
  mandatory. OWNER ACTION REQUIRED: confirm.
