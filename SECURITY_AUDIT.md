# Security Audit

## Authentication Security
- Password hashing: bcrypt cost 12 - VERIFIED
- Session tokens: HMAC-SHA256 signed - VERIFIED
- Cookie flags: HttpOnly, Secure, SameSite=Lax - VERIFIED
- Timing-safe comparison: VERIFIED

## Authorization (RBAC)
- requireAuth() on every protected route - VERIFIED
- requireRole() with role-based access - VERIFIED
- 13 roles supported - VERIFIED

## Input Validation
- Zod schemas on all API routes - VERIFIED
- No raw SQL (Prisma parameterized queries) - VERIFIED
- Path traversal prevention (isPathSafe) - VERIFIED

## Rate Limiting
- Login: 5/15min - VERIFIED
- Register: 3/hour - VERIFIED

## Security Headers
- X-Content-Type-Options: nosniff - VERIFIED
- X-Frame-Options: DENY - VERIFIED
- Referrer-Policy - VERIFIED
- Permissions-Policy - VERIFIED
- HSTS (production) - VERIFIED

## File Security
- Upload size limit - VERIFIED
- MIME validation - VERIFIED
- Upload directory outside web root - VERIFIED

## Secret Management
- .env.example has no real secrets - VERIFIED
- AUTH_SECRET marked as REQUIRED - VERIFIED
- No hardcoded secrets in source - VERIFIED

## Audit Logging
- Every CRUD operation logged - VERIFIED
- Login/logout logged - VERIFIED
- Exam submissions logged - VERIFIED

## Systemd Hardening
- NoNewPrivileges - VERIFIED
- ProtectSystem=strict - VERIFIED
- ProtectHome - VERIFIED
- Empty CapabilityBoundingSet - VERIFIED

## Sudo Policy
- No ALL=(ALL) NOPASSWD:ALL - VERIFIED
- Restricted to service management only - VERIFIED
