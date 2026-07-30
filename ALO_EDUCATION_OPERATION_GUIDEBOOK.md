# ALO Education Operation Guidebook

## Ch1: Platform Introduction
Integrated CRM + public website + exam practice platform. Users: Super Admin, Admin, Counselor, Student, Partner.

## Ch2: First-Time Setup
1. Login as admin (password from seed output)
2. Change password
3. Configure branches/departments
4. Configure settings via /api/admin/settings

## Ch3: User Management
- Create: POST /api/crm/users
- Assign roles: SUPER_ADMIN, ADMIN, COUNSELOR, APPLICATION_TEAM, etc.
- Suspend: PUT /api/crm/users/[id] with status SUSPENDED

## Ch4: Lead Management
- Create: POST /api/crm/leads
- List: GET /api/crm/leads?page=1&limit=20&search=keyword
- Convert: POST /api/crm/students with leadId
- Pipeline: NEW -> CONTACTED -> QUALIFIED -> CONVERTED

## Ch5: Student Management
- Create: POST /api/crm/students
- Documents: POST /api/crm/documents
- Applications: POST /api/crm/applications

## Ch6: Partner Management
- Create: POST /api/crm/partners
- Commissions: GET /api/crm/commissions

## Ch7: Application Management
- Pipeline: DRAFT -> SUBMITTED -> UNDER_REVIEW -> OFFERED -> ACCEPTED -> CAS_ISSUED -> VISA_APPLIED -> VISA_APPROVED -> COMPLETED

## Ch8: Universities/Courses/Scholarships
- Countries: POST /api/crm/countries
- Universities: POST /api/crm/universities
- Courses: POST /api/crm/courses
- Scholarships: POST /api/crm/scholarships

## Ch9: Communications
- Send: POST /api/crm/messages
- Channels: WHATSAPP, FACEBOOK, INSTAGRAM, EMAIL, SMS, WEBCHAT, PORTAL, INTERNAL

## Ch10: Documents
- Upload: POST /api/crm/documents
- OCR status: PENDING -> PROCESSING -> COMPLETED/FAILED

## Ch11: Tasks/Appointments
- Tasks: POST /api/crm/tasks
- Appointments: POST /api/crm/appointments

## Ch12: Analytics
- Stats: GET /api/admin/stats (real database queries)

## Ch13: Audit Logs
- View: GET /api/crm/audit-logs

## Ch14: Backup/Restore
- Backup: bash scripts/backup.sh
- Restore: bash scripts/restore.sh <archive> --confirm

## Ch15: Troubleshooting
See TROUBLESHOOTING_GUIDE.md
