# GLOBAL SUBDOMAIN MAP (§126) — 2026-09-18

| Subdomain | DNS | TLS | HTTPS | App identified | Auth model | Status |
|---|---|---|---|---|---|---|
| english.aloeducation.com | ✅ resolves (via successful HTTPS fetch) | ✅ handshake OK (issuer/expiry NOT VERIFIED) | ✅ | ALO English Test Platform (this repo) | next-auth session + RBAC (in code) | **LIVE-HEALTHY**; SHA on server UNKNOWN |
| www.english.aloeducation.com | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | assumed alias of above | same | UNKNOWN |
| learn.aloeducation.com | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| hosting.alolabs.net | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| agents.alolabs.net | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED + extra AI inspection (§2.3) |
| panel.alolabs.net | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED — treat as privileged (§2.4) |
| marketing.alolabs.net | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| markting.alolabs.net | ✗ fetch failed | — | — | — | — | suspected typo/legacy — DO NOT CREATE (§2.16) |
| aloeducation.com | ✅ resolves | ✅ handshake OK | ✅ (serves 502) | UNKNOWN (upstream dead) | UNKNOWN | **502 INCIDENT** |
| alolabs.net | ✅ resolves | ✅ handshake OK | ✅ empty body | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| icla-global.com | ✅ | ✅ | ✅ | WordPress + Elementor | WordPress admin (harden) | LIVE (near-empty) |
| icla-global.in | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| bdtech360.com | ✅ | ✅ | ✅ | TECH360 custom site | site + PUBLIC AI agent | LIVE — agent review pending |
| alaminn.info | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| ecotechbd.com | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| neelacholcityagro.com | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |
| uninotary.com | ✗ fetch failed | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | OWNER ACTION REQUIRED |

> "fetch failed" = the HTTPS fetch could not complete (DNS, TLS, connection refused, or
> upstream down are indistinguishable from this vantage). No value above is guessed (§175).
> Dangling-CNAME / takeover checks (§128) require DNS access — OWNER ACTION REQUIRED.
