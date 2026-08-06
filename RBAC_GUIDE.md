# RBAC (Role-Based Access Control) Guide

## Supported Roles (13)
| Role | Description | Access Level |
|---|---|---|
| SUPER_ADMIN | Full platform control | ALL |
| ADMIN | Platform administration | ALL |
| HR_MANAGER | HR management | BRANCH |
| BRANCH_MANAGER | Branch management | BRANCH |
| COUNSELOR | Student counseling | ASSIGNED |
| APPLICATION_TEAM | Application processing | ASSIGNED |
| VISA_OFFICER | Visa processing | ASSIGNED |
| FINANCE | Financial operations | DEPARTMENT |
| MARKETING | Marketing operations | DEPARTMENT |
| FRONT_DESK | Front desk operations | ASSIGNED |
| SUPPORT_STAFF | Support operations | ASSIGNED |
| PARTNER | Partner portal | OWN |
| STUDENT | Student portal | OWN |

## Scopes
- ALL: Full access to all records
- BRANCH: Access to records in user's branch
- DEPARTMENT: Access to records in user's department
- ASSIGNED: Access to records assigned to the user
- OWN: Access to user's own records only

## Enforcement
RBAC is enforced server-side on every protected API route via `requireRole()`:

```typescript
import { requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireRole('ADMIN', 'COUNSELOR');
  // Only ADMIN and COUNSELOR roles can access
}
```

## Permission Checks
- **Authentication**: `requireAuth()` — checks session
- **Authorization**: `requireRole(...roles)` — checks role
- **Ownership**: Checked in CRUD handlers (user can only access their own records)

## API Protection
Every protected route follows this pattern:
1. `requireRole()` validates the user's role
2. Zod schema validates the input
3. Database query is executed with proper scoping
4. Audit log records the action
5. Response returned via consistent format

## Frontend Protection
- Client-side: Dashboard pages redirect to `/login` if not authenticated
- Server-side: API routes return 401/403 if unauthorized
- Client-side hiding is NOT security — backend enforces all permissions
