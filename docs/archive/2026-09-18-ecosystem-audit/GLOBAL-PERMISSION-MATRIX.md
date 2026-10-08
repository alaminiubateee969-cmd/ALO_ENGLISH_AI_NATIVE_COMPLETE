# GLOBAL PERMISSION MATRIX (§28/§141/§159) — 2026-09-18

## Application RBAC (in-repo, code-verified)
- 9 roles × 44 permissions × role-permission bindings (seed-rbac; VERIFIED in DB snapshot).
- CRUD factory enforces per-entity `roleName` (e.g. leads/students → COUNSELOR+,
  audit-logs → ADMIN). RBAC admin routes require explicit permissions (`roles.view`,
  `roles.manage`). Human approval flows via `requiresAdminApproval` agent flags.

| Subject | Resources | Actions | Boundary |
|---|---|---|---|
| STUDENT | own attempts/scores/sessions | read/create own | user-scoped (§141 USER→ROLE→AGENT→RESOURCE→ACTION) |
| COUNSELOR+ | CRM leads/students/apps/docs | CRUD per entity role | team/branch scoping fields exist (verify enforcement per-entity — TODO) |
| ADMIN | settings, stats, RBAC, audit | full | permission-gated |
| PUBLIC | catalog, RAG-public, lead form, agents/status | read/submit only | allowlist in proxy.ts |
| AGENTS | session-scoped exam data; Question/Score/LearningMemory writes | scoped | no CRM, no users, no settings, no deploy (§143/§144) |

## Infrastructure permissions (configured/required state)
| Subject | Scope | Status |
|---|---|---|
| `aloenglish` OS user | own dirs; sudo → only `systemctl {start,stop,restart,reload,status,is-active} alo-english`, caddy reload/status, `journalctl -u alo-english` | CONFIGURED (sudo-policy file) ✅ |
| GitHub Actions deploy | SSH key = secret; may write ONLY `$VPS_PATH`, restart ONLY pm2 `alo-english` | CONFIGURED ✅ |
| AI agents | NO SSH, NO sudo, NO deploy, NO cross-domain data | enforced by absence of any such code path ✅ |
| Root | humans only; agents never (§35) | policy — enforce on VPS (OWNER VERIFY) |

Default posture: **DENY**, grants listed above only (§28).
