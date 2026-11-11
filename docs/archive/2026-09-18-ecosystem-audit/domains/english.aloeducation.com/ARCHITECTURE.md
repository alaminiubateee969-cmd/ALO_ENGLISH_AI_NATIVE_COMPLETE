# ARCHITECTURE — english.aloeducation.com
Next.js 16 (standalone) + TypeScript 5 + Prisma 6 (SQLite/MySQL) + next-auth 4 + RBAC
(9 roles/44 perms) + CRM (18 entities) + AI layer:
- `src/lib/agents/*` (5 agents + registry, Groq optional)
- `src/lib/ai/examiner/*` (voice examiner engine + ConversationMemory)
- `src/lib/ai/rag/RagEngine.ts` (isPublic-enforced retrieval)
- `src/lib/ai/learning/AgentSelfBuilder.ts` + DailyLearningLoop
- `mini-services/examiner-stream` (socket.io :3003 sidecar — CD gap S-04)
Auth: centralized `requireAuth/requireRole` (+ lib/rbac permissions). Headers/CSP via
proxy.ts. 72 API routes inventoried. See GLOBAL docs for cross-domain view.
Two deployment architectures exist (PM2:3016 — CD truth; systemd:3000 — docs); converge S-03.
