# API Documentation

All API routes use a consistent response structure:

## Response Format

### Success
```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "status": 400,
  "message": "Readable error message",
  "error": "ERROR_CODE"
}
```

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method |
| `CONFLICT` | 409 | Resource already exists |
| `UNPROCESSABLE_ENTITY` | 422 | Validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

### Public Endpoints

#### `GET /api/health`
Health check. No auth required.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "checks": { "database": "connected", "examTypes": 20 }
}
```

#### `GET /api/exam-types`
List all active exam types. No auth required.

**Response data:**
```json
{
  "examTypes": [
    { "id": "cuid", "code": "IELTS-A", "name": "IELTS Academic", "category": "English Proficiency", "practiceSetCount": 5 }
  ]
}
```

#### `GET /api/practice-sets?examTypeId=cuid`
List practice sets, optionally filtered by exam type. No auth required.

---

### Authentication Endpoints

#### `POST /api/auth/register`
Create a new student account. Rate limited: 3/hour/IP.

**Body:**
```json
{ "email": "user@example.com", "password": "min-12-chars", "name": "Optional Name" }
```

**Response (201):** `{ user: { id, email, name, role } }`
Sets `alo_session` HTTP-only cookie.

#### `POST /api/auth/login`
Authenticate. Rate limited: 5/15min/IP.

**Body:** `{ "email": "...", "password": "..." }`

**Response (200):** `{ user: { id, email, name, role } }`

#### `POST /api/auth/logout`
Clear session. Requires auth.

#### `GET /api/auth/me`
Get current user. Requires auth.

---

### Student Endpoints (require STUDENT role)

#### `POST /api/attempts/start`
Start a new practice attempt.

**Body:** `{ "practiceSetId": "cuid" }`
**Response:** `{ attempt: { id, startedAt } }`

#### `POST /api/attempts/submit`
Submit an attempt for scoring. Validates ownership.

**Body:** `{ "attemptId": "cuid", "answers": { ... } }`
**Response:** `{ attempt: { id, status }, score: { id, overall, listening, reading, writing, speaking, confidence, providerUsed } }`

#### `GET /api/attempts?page=1&limit=20`
List the current user's attempts (paginated).

---

### Admin Endpoints (require ADMIN role)

#### `GET /api/admin/stats`
Aggregate dashboard statistics.

**Response data:**
```json
{
  "users": { "total": 100, "students": 95, "examiners": 3 },
  "content": { "examTypes": 20, "practiceSets": 50 },
  "activity": { "totalAttempts": 500, "submittedAttempts": 450, "totalScores": 450, "completionRate": 90 }
}
```

#### `GET /api/admin/settings`
List all platform settings.

#### `POST /api/admin/settings`
Update a setting. Audit logged.

**Body:** `{ "key": "setting_key", "value": "new_value" }`

---

## Rate Limits

| Endpoint group | Limit | Window |
|---|---|---|
| Login | 5 requests | 15 minutes |
| Register | 3 requests | 1 hour |
| General API | 100 requests | 1 minute |
| Mutating API | 30 requests | 1 minute |

Rate-limited responses include `429` status and `RATE_LIMITED` error code.

## Authentication

- **Method**: HMAC-signed session token in `alo_session` HTTP-only cookie.
- **Cookie flags**: `HttpOnly`, `Secure` (production), `SameSite=Lax`.
- **Token TTL**: 24 hours.
- **Password hashing**: bcrypt cost 12.

## Security

- All input validated with Zod schemas.
- SQL injection protection via Prisma parameterized queries.
- XSS protection via React escaping + CSP headers.
- CSRF protection via SameSite cookies.
- Rate limiting on auth endpoints.
- Audit logging on every mutating action.
- Security headers on every response (middleware).
