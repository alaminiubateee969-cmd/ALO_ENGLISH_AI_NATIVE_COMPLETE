# Admin Guide

## Access
- URL: `/admin/dashboard`
- Role required: ADMIN or SUPER_ADMIN
- Login at: `/login`

## Daily Operations

### 1. Check Dashboard
- View platform statistics: user count, lead count, student count, application count
- Access via: `GET /api/admin/stats`

### 2. Manage Users
- List users: `GET /api/crm/users`
- Create user: `POST /api/crm/users`
- Update user: `PUT /api/crm/users/[id]`
- Assign roles: SUPER_ADMIN, ADMIN, COUNSELOR, etc.
- Suspend user: `PUT /api/crm/users/[id]` with `status: "SUSPENDED"`

### 3. Manage Leads
- List leads: `GET /api/crm/leads`
- Create lead: `POST /api/crm/leads`
- Assign counselor: `PUT /api/crm/leads/[id]` with `counselorId`
- Update status: NEW → CONTACTED → QUALIFIED → CONVERTED

### 4. Manage Students
- List students: `GET /api/crm/students`
- Create student: `POST /api/crm/students`
- View documents: `GET /api/crm/documents?studentId=xxx`

### 5. Manage Universities/Courses/Scholarships
- Countries: `POST /api/crm/countries`
- Universities: `POST /api/crm/universities`
- Courses: `POST /api/crm/courses`
- Scholarships: `POST /api/crm/scholarships`
- Publish: `PUT /api/crm/universities/[id]` with `isPublished: true`

### 6. View Audit Logs
- All actions are logged: `GET /api/crm/audit-logs`
- Searchable by action, user, date

### 7. System Settings
- View: `GET /api/admin/settings`
- Update: `POST /api/admin/settings`

## RBAC
Admins have ALL scope — can access all records across all branches.
See RBAC_GUIDE.md for role details.
