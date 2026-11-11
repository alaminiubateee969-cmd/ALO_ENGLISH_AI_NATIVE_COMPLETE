# GLOBAL AI AGENT SECURITY (§54–§56/§68/§74/§141/§152) — 2026-09-18

## Trust model applied to external content
All student input, uploaded documents, RAG chunks, DB text fields, and model output are
UNTRUSTED DATA. Nothing observed in this repo elevates external content to instruction
level; system prompts are code-owned constants (e.g. GroqClient SYSTEM_PROMPT — VERIFIED).

## Injection surface review (code-verified)
| Surface | Control found | Verdict |
|---|---|---|
| RAG chunks → LLM | chunks are data in `messages[]`; system prompt constant; output rendered via react-markdown (sanitizing render path in UI) | LOW risk; still add chunk-side strip of instruction-like markup (TODO) |
| Student free text → evaluators | zod-validated API bodies; text passed as user role only | LOW-MED; output is advisory text only |
| Model output → DB/HTML | scores parsed from strict JSON schema (`jsonSchema` param); rendering sanitized | LOW |
| Examiner audio → ASR → LLM | sidecar in-memory session only, no persistence to disk found | LOW (until sidecar is prod-reviewed) |
| Uploads (`/upload/`, audio) | nginx 50 MB cap documented; **no malware/type-sniffing/sanitization pipeline found** | WARNING §58 — add type verification + isolation before prod |

## §68 self-modification — verdict
No agent can alter its own permissions, allowlists, system prompts of record, credentials,
sandbox, or approval rules. AgentSelfBuilder's writes are limited to `AgentSpecialist` +
`AgentEvolution` rows (recommend human approval before new specialists activate).

## Audit (§74)
- App-level: `lib/audit.ts` + `AuditLog` table wired into CRUD factory (actor, IP via
  `getClientIp`, entity, action) — 29 rows observed in snapshot DB. ✅ pattern exists.
- Gap: agent-level structured audit (model version, prompt version, tool, args-hash,
  duration) NOT yet implemented → add per §74 before any privileged agent ships.
- Never-log-secrets: GroqClient explicitly avoids key/PII logging (VERIFIED in code).

## §152 test matrix status
Prompt-injection / tool-misuse / cross-tenant / loop / resource-exhaustion suites:
NOT PRESENT in `tests/`. Required before promoting any agent to ZONE 2+. (CI currently
fails on existing smoke tests — fix baseline first, then add adversarial suite.)

## Zone assignment (current)
| Zone | Components |
|---|---|
| ZONE 0 PUBLIC | /ask-handbook RAG chat, /api/agents/status, catalog endpoints |
| ZONE 1 READ-ONLY | student dashboards (session-scoped) |
| ZONE 2 INTERNAL | evaluator agents (session-scoped writes) |
| ZONE 3 SENSITIVE | CRM entities, student documents (role+permission gated) |
| ZONE 4 PRIVILEGED | admin settings, RBAC admin (ADMIN + permission) |
| ZONE 5 DEPLOYMENT | GitHub Actions → VPS (human-owned secrets only) |
| ZONE 6 SECURITY | audit logs, this registry, security policy docs |
