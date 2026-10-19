# API Documentation

## Authentication
- Method: HMAC-signed session token in alo_session HTTP-only cookie
- Cookie flags: HttpOnly, Secure (production), SameSite=Lax
- Token TTL: 24 hours
- Password hashing: bcrypt cost 12

## Response Format
Success: { "success": true, "status": 200, "message": "...", "data": {} }
Error: { "success": false, "status": 400, "message": "...", "error": "ERROR_CODE" }

## Error Codes
- BAD_REQUEST (400), UNAUTHORIZED (401), FORBIDDEN (403), NOT_FOUND (404)
- METHOD_NOT_ALLOWED (405), CONFLICT (409), UNPROCESSABLE_ENTITY (422)
- RATE_LIMITED (429), INTERNAL_ERROR (500)

## Auth API
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | None | Create student account |
| POST | /api/auth/login | None | Authenticate |
| POST | /api/auth/logout | Required | Clear session |
| GET | /api/auth/me | Required | Current user |

## CRM API (18 entities, each with GET/POST/GET[id]/PUT[id]/DELETE[id])
- /api/crm/leads
- /api/crm/students
- /api/crm/partners
- /api/crm/applications
- /api/crm/universities
- /api/crm/courses
- /api/crm/scholarships
- /api/crm/countries
- /api/crm/branches
- /api/crm/departments
- /api/crm/documents
- /api/crm/messages
- /api/crm/tasks
- /api/crm/appointments
- /api/crm/notifications
- /api/crm/users
- /api/crm/commissions
- /api/crm/audit-logs

## Exam Platform API
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/exam-types | None | List 20 exam types |
| GET | /api/practice-sets | None | List practice sets |
| POST | /api/attempts/start | STUDENT | Start attempt |
| POST | /api/attempts/submit | STUDENT | Submit + run the evaluation agent |
| GET | /api/attempts | STUDENT | List user attempts |
| GET | /api/attempts/:id/evaluation | Owner / ADMIN | Read the stored evaluation for an attempt |

## Admin API
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/admin/stats | ADMIN | Dashboard statistics |
| GET/POST | /api/admin/settings | ADMIN | List/update settings |

## AI Agents API
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/agents/status | None | 20 AI agents status |

## Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | None | DB connectivity check |

## Rate Limits
- Login: 5/15min, Register: 3/hour, General: 100/min, Mutating: 30/min

## Pagination
Query: ?page=1&limit=20&search=keyword
Response: { pagination: { page, limit, total, totalPages } }
