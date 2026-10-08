# GLOBAL TOOL REGISTRY (§30/§31) — 2026-09-18

Tools = any capability an agent/process can invoke. Inventory for THIS repo (others: UNKNOWN).

| Tool / capability | Where | Allowed callers | Network | Filesystem | DB | Secrets | Approval | Rate/timeout | Status |
|---|---|---|---|---|---|---|---|---|---|
| Groq ChatCompletions | `src/lib/agents/GroqClient.ts` | evaluator agents only | api.groq.com only | none | none | GROQ_API_KEY (env) | n/a | 30 s hard clamp | CONFIGURED ✅ |
| z-ai SDK (RAG/LLM) | `src/lib/ai/rag/RagEngine.ts`, examiner engine | rag + examiner | SDK-managed | none | read (isPublic) | SDK env | n/a | SDK default | CONFIGURED |
| Prisma ORM | `src/lib/db.ts` | all API routes | none | DB file only | scoped models | DATABASE_URL | n/a | none yet — add query budgets (§66) | CONFIGURED |
| bcrypt hashing | auth lib | auth routes | none | none | users | none | n/a | cost 12 | CONFIGURED |
| PM2 / systemd | deploy.yml, server-config/ | CI (SSH) + admins only | VPS-local | service dirs | none | GitHub secrets | deploy gate | n/a | CONFIGURED |
| bash deploy/rollback/backup scripts | scripts/*.sh | humans on VPS | local | service dirs | pgrep-style checks only | reads .env | human | n/a | CONFIGURED |
| WebSocket examiner-stream | mini-services/examiner-stream | browser exam sessions | same-origin WS | none | none | none | n/a | NO session budget yet (§66/§67 TODO) | WARNING S-04 |

Explicit NON-tools (must never become agent-callable): SSH, firewall, DNS, secret rotation,
pm2 global commands, database drop/truncate/grant. None are exposed via any API route
(verified: 72 routes inventoried; no exec/shell routes exist).
