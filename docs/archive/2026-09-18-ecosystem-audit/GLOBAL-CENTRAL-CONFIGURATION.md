# GLOBAL CENTRAL CONFIGURATION (§13–§17/§107–§109) — 2026-09-18

## Canonical source created this inspection
- `config/DOMAIN-REGISTRY.yaml` — domains, ports, owners, evidence status (single source of truth).

## Current duplication problems found (to converge — do NOT edit blindly, §107)
| Value | Currently duplicated in | Canonical target |
|---|---|---|
| App port (3000 vs 3016) | README, ecosystem.config.js, Caddyfile.production, alo-english.nginx, scripts/{install,rollback}.sh, deploy.yml, SERVER-DEPLOYMENT doc | deploy.yml `APP_PORT` (3016) pending owner confirmation |
| Domain name | README, .env.example (APP_URL), proxy configs, deploy.yml public check | config registry |
| Company/contact | FUNDING.yml, legal-pages component, multiple guides | single branding profile (proposed `config/branding.*`) |
| Security headers | next.config.ts AND proxy.ts AND both proxy configs | keep defense-in-depth but document ordering (§131) |

## Proposed central layout (§14) — to be created only with owner approval
```
config/
  DOMAIN-REGISTRY.yaml      (done)
  branding/  environments/  feature-flags/  agents/  tools/  mcp/  policies/
```

## Change-control rules (binding)
1. Shared-value change → list consuming domains from registry → test each before prod (§107).
2. Version every config file (git is the versioning; tag changes) (§108).
3. Risky features behind flags, default OFF; new agents default DISABLED until reviewed
   (§109/§110) — CRON_ENABLED and AI_ENABLED already default false ✅.
4. Kill switches (§73/§111/§112): proposed `config/policies/kill-switches.yaml` covering
   global/per-domain/per-agent/per-tool/per-MCP — NOT yet implemented (design stage).
