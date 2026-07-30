# PARTNER PORTAL User Guide

## Access
Login at /api/auth/login with appropriate role credentials.

## Capabilities
See API_DOCUMENTATION.md for the full endpoint list. Role-based access:
- SUPER_ADMIN/ADMIN: Full CRM access + settings + audit logs
- MARKETING_MANAGER: Leads, partners, commissions, messages
- COUNSELOR: Assigned leads, students, tasks, messages, documents
- APPLICATION_TEAM: Applications, documents
- STUDENT: Own attempts, scores, exam practice
- PARTNER: Referred leads, commissions

## Daily Operations
1. Login via /api/auth/login
2. Check dashboard: GET /api/admin/stats
3. Review assigned records via CRM API endpoints
4. Create/update tasks and messages
5. Logout via /api/auth/logout
