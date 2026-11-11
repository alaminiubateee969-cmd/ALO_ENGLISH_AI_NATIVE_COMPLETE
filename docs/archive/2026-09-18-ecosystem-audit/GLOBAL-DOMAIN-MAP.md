# GLOBAL DOMAIN MAP (§158) — 2026-09-18

Canonical machine-readable source: [`config/DOMAIN-REGISTRY.yaml`](./DOMAIN-REGISTRY.yaml)

## Root domains (6 discovered/reported)
| Root domain | Subdomains reported | Live status (observed 2026-09-18) |
|---|---|---|
| aloeducation.com | english (✅ healthy), learn (✗ unreachable) | **502 Bad Gateway — DOWN** |
| alolabs.net | hosting, agents, panel, marketing (all ✗ unreachable), markting (suspected typo, NOT created) | reachable, EMPTY body |
| icla-global.com | none discovered | 200 — WordPress, near-empty |
| icla-global.in | none discovered | unreachable |
| bdtech360.com | none discovered | 200 — TECH360 + public AI agent |
| alaminn.info | none discovered | unreachable |
| (also reported) | ecotechbd.com, neelacholcityagro.com, uninotary.com (roots) | unreachable |

## Subdomain inventory (§3 — discovered from repo evidence only; NO intrusive enumeration performed)
| Subdomain | Evidence source | Status |
|---|---|---|
| english.aloeducation.com | README, deploy.yml, .env.example, Caddyfile.production, nginx conf | VERIFIED LIVE (health 200) |
| www.english.aloeducation.com | nginx conf + deploy doc | CONFIGURED only, live NOT VERIFIED |
| learn.aloeducation.com | master prompt report | NOT VERIFIED |
| hosting/agents/panel/marketing.alolabs.net | master prompt report | NOT VERIFIED |
| markting.alolabs.net | §2.16 | UNKNOWN — owner to check DNS; must NOT be created |
| server.aloeducation.com | README heading ("Deploy to VPS (server.aloeducation.com)") | UNKNOWN — owner to check DNS |

## Discovery NOT performed (and why)
- DNS zone walking / certificate-transparency harvesting / brute-force subdomain enumeration
  were NOT executed: sandbox has no raw network access, and §4 forbids unauthorized
  intrusive enumeration. Full discovery requires owner-run DNS/cPanel/Cloudflare review —
  see OWNER ACTIONS in `docs/GLOBAL-FINAL-AUDIT.md`.
