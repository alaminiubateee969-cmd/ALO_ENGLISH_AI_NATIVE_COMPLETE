# GLOBAL TLS MAP (§44) — 2026-09-18

Certificate issuer/expiry/SAN/chain were NOT retrievable (no raw TLS from sandbox).
Handshake success through the HTTPS fetch tool is the only evidence available.

| Domain | HTTPS works | Cert issuer | Expiry | SAN coverage | HSTS | Grade |
|---|---|---|---|---|---|---|
| english.aloeducation.com | ✅ OBSERVED | UNKNOWN | UNKNOWN | UNKNOWN | CONFIGURED in code (proxy.ts sets HSTS incl. preload in production) | NOT VERIFIED |
| aloeducation.com | ✅ handshake; serves 502 | UNKNOWN (nginx/1.20.1 observed) | UNKNOWN | UNKNOWN | UNKNOWN | NOT VERIFIED |
| alolabs.net | ✅ handshake; empty body | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT VERIFIED |
| icla-global.com | ✅ | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT VERIFIED |
| bdtech360.com | ✅ | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | NOT VERIFIED |
| all others | NOT VERIFIED | — | — | — | — | — |

## Configured TLS posture in this repo (evidence)
- `server-config/Caddyfile.production`: automatic Let's Encrypt, HSTS max-age 1y
  includeSubDomains preload, modern headers. (Caddy path — CONFIGURED, not live-verified.)
- `server-config/alo-english.nginx`: TLSv1.2/1.3, certbot paths, HTTP→HTTPS 301. (nginx path.)
- `src/proxy.ts`: HSTS only in production; CSP with frame-ancestors 'none'.

## Owner-run TLS checklist (§44/§164)
For each live domain: `openssl s_client` issuer/expire/SAN + chain, HSTS header check,
www redirect check, and expiry monitoring with alerts (§164). One cert per-hostname must
NOT be assumed — verify individually.
