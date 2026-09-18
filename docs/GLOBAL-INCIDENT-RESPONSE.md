# GLOBAL INCIDENT RESPONSE (§96/§113) — 2026-09-18

## Active incidents at audit time
| ID | Domain | Evidence | Stage | Owner action |
|---|---|---|---|---|
| INC-2026-09-18-01 | aloeducation.com | 502 Bad Gateway via nginx/1.20.1 (OBSERVED) | DETECTED | Diagnose upstream per §96 (DNS→TLS→proxy→upstream→port→process→logs→env→DB→firewall). Do NOT restart anything on guesswork. |
| INC-2026-09-18-02 | ecosystem | 8/15 domains unreachable from audit vantage | DETECTED | Owner runs reachability matrix from an authorized host; classify each (§172). |
| INC-2026-09-18-03 | english.aloeducation.com | CI/CD RED while site serves → unknown-provenance deployment | CONTAIN-N/A | Fix smoke tests; redeploy via pipeline; verify SHA equality (§124). |

## Response flow (binding)
DETECT → CONTAIN → DISABLE AFFECTED AGENT/SERVICE ONLY → REVOKE CREDENTIALS →
PRESERVE LOGS → BLAST-RADIUS ANALYSIS → PATCH → TEST → RESTORE → VERIFY → DOCUMENT.
- Never: global restarts, firewall flush, reset --force, history rewrites on a live checkout.
- Per-domain kill switches: proposed (GLOBAL-CENTRAL-CONFIGURATION.md) — not yet built.
- 502/503/504 rule (§96): diagnose the VERIFIED failing component only; this audit changed
  nothing on any VPS.
