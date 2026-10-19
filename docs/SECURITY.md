# Security

## Authentication & Authorization
- bcrypt cost 12 password hashing
- HMAC-SHA256 session tokens (timing-safe)
- two enforcement layers: legacy role strings on `User.role`
  (`SUPER_ADMIN`, `ADMIN`, `COUNSELOR`, `STUDENT`, `EXAMINER`) and
  permission + team RBAC (`src/lib/rbac.ts`, `/api/rbac/*`) seeded with
  9 roles, 44 permissions and 149 role-permission mappings
- object-level scoping is fail-closed (`src/lib/crud-scope.ts`)
- rate limiting on auth endpoints (in-process sliding window)

## Answer Key Protection
- /api/questions omits correctAnswer, correctIndex from response
- Server-side scoring only — browser never receives correct answers
- Student cannot access another student's attempt/score

## AI Security
- Student essays/transcripts treated as UNTRUSTED input (never as AI instructions)
- Prompt injection protection: system prompt is privileged, user content is data
- No cross-user memory leakage (privacy isolation enforced)
- Agent permissions: READ_STUDENT_MEMORY, EVALUATE_ATTEMPT, etc. (no DEPLOY without approval)

## Payment Security
- Server-side quota enforcement (FreeQuota + Payment models)
- Payment status verified server-side, never trusted from client
- No card data stored
