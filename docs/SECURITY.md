# Security

## Authentication & Authorization
- bcrypt cost 12 password hashing
- HMAC-SHA256 session tokens (timing-safe)
- 13 roles with server-side RBAC enforcement
- rate limiting on auth endpoints

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
