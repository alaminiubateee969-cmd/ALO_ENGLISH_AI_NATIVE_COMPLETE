# Security Guide

## Authentication
- Password hashing: bcrypt cost 12
- Session tokens: HMAC-SHA256 signed, 24h TTL
- Cookie flags: HttpOnly, Secure, SameSite=Lax
- Timing-safe token comparison

## RBAC
Roles enforced on every protected route via requireRole():
- SUPER_ADMIN, ADMIN: Full access
- COUNSELOR: Leads, students, tasks, messages
- APPLICATION_TEAM: Applications, documents
- STUDENT: Own attempts, scores
- PARTNER: Referred leads, commissions

## Rate Limiting
- Login: 5/15min, Register: 3/hour, API: 100/min

## Input Validation
- Zod schemas on every API route
- Prisma parameterized queries (no SQL injection)
- XSS prevention via React escaping
- CSRF protection via SameSite cookies

## Security Headers (proxy.ts)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- HSTS (production)

## File Upload Security
- Size limit, MIME validation, path traversal prevention
- Upload directory outside web root

## Secret Management
- .env chmod 600
- AUTH_SECRET 32+ chars
- No hardcoded secrets

## Audit Logging
Every privileged action logged: LOGIN, LOGOUT, REGISTER, CRUD operations, EXAM_SUBMIT, SCORE_GENERATED, SETTINGS_UPDATE
