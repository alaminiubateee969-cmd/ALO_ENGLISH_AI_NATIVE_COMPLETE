# GLOBAL FINAL AUDIT (§173/§174/§176) — 2026-09-18
Inspector: Arena Agent · Mode: INSPECTION ONLY (zero production changes made)
Evidence base: this repo @ `8121f03` (local==origin/main VERIFIED), GitHub Actions API,
live HTTPS probes from platform vantage. Nothing was restarted, deleted, deployed, or
reconfigured anywhere.

## Totals
| Metric | Count | Basis |
|---|---|---|
| Root domains reported | 9 (incl. ecotechbd, neelachol, uninotary) | registry |
| Subdomains reported/discovered | 7 (+2 www aliases +1 suspected typo) | registry §3 |
| Domains LIVE-probed | 15 attempted / 5 reachable / 4 serving content | this audit |
| Applications identified | 3 of ~15 (english platform; icla WordPress; bdtech360 TECH360) | probe evidence |
| Services with full chain (repo→SHA→process→port→proxy→TLS) | **0** — best partial: english.aloeducation.com | §172 |
| Ports in reported map | 15 (+2 in-repo discoveries: 3000-alt, 3003; +1 sandbox-only :81) | registry |
| Processes inventoried live | 0 (no VPS access) | — |
| Repositories mapped | 1 of ~15 | GitHub |
| Databases discovered | 1 (SQLite, this app) + 12 tracked SQL seed files (second PHP app) | repo |
| AI agents in-repo | 9 registered/inspected | GLOBAL-AI-AGENT-REGISTRY |
| AI agents external | ≥1 public agent on bdtech360.com (unreviewed) | probe |
| MCP servers | 0 in-repo (verified absent); ecosystem UNKNOWN | GLOBAL-MCP-REGISTRY |
| Deployment workflows | 2 (ci.yml, deploy.yml) — both RED on main | Actions API |
| TLS certificates verified in detail | 0 (issuer/expiry unverifiable from vantage) | GLOBAL-TLS-MAP |
| Security findings | 18 (0 fabricated) | below |
| Critical | 2 | S-01 S-02 |
| Warnings | 5 | S-03 S-04 S-05 S-06 S-08 |
| Low/Info | 5 | S-07 S-09 S-10 S-11 + archive hygiene |
| OWNER ACTION items | 12 | below |

## Consolidated findings
CRITICAL: S-01 committed SQLite with PII+hashes → purge+rotate. S-02 main RED & live
site of unknown provenance → fix tests, redeploy, verify SHA equality.
WARNING: S-03 port story conflict · S-04 examiner-stream ungoverned (CD gap, CORS *,
no route) · S-05 :81 transform proxy must never go public · S-06 two conflicting VPS IPs ·
S-08 CI hardening gaps (SHA pinning, keyscan TOFU, no secret/SAST/dep/SBOM gates).
LOW/INFO: S-07 root-SSH docs · S-09 foreign PHP app + archives tracked · S-10 public
capability metadata · S-11 live DB drift (12 vs 20 exam types).
PASSES: secret scan clean · archives traversal-safe · RAG ACL enforced · API auth
centralized & complete · RBAC permission-gated · headers/CSP · systemd/sudo hardening ·
deploy blast-radius scoping · §93 no-global-restart honored.

## OWNER ACTION REQUIRED (§178 format, condensed)
1. **PROJECT:** all — **ITEM:** VPS access inventory (hosts, SSH ports/users, `ss -lntp`,
   pm2/systemd units, dirs) — **WHY:** §8/§94 live verification impossible otherwise —
   **ACTION:** provide authorized read-only access or run the audit script pack.
2. **PROJECT:** aloeducation.com — **ITEM:** 502 incident — **ACTION:** diagnose upstream
   (nginx/1.20.1 observed); see GLOBAL-INCIDENT-RESPONSE.md INC-…-01.
3. **PROJECT:** alo-english — **ITEM:** rotate seeded admin/test passwords; purge
   `db/custom.db` from Git (full-clone history rewrite + force-push ONLY with explicit
   authorization, coordinated) — **SECURITY IMPACT:** removes crackable hashes/PII.
4. Confirm live architecture: port 3016-PM2 vs 3000-systemd; single VPS IP; update docs.
5. Map remaining 14 domains to repositories/owners; supply DNS zone exports; verify
   TLS certs + expiry monitoring; check `markting.alolabs.net` (do not create).
6. Decide examiner-stream fate: productionize (CD + route + scoped CORS + budgets) or disable.
7. Add CI security gates (gitleaks/SAST/deps/SBOM) + environment approval for prod deploys.
8. Authorize next domain in execution order (learn.aloeducation.com) after (1)–(5).

## §174 statement
Every claim above is scoped to its evidence. Nothing marked VERIFIED beyond it. No
production system was altered by this audit.
