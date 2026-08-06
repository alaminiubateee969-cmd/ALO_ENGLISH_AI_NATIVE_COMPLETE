# Super Admin Guide

## Access
- URL: `/super-admin/dashboard`
- Role required: SUPER_ADMIN
- Login at: `/login`

## Capabilities
Everything in Admin Guide, plus:

### AI Agent Control
- View agent status: `GET /api/agents/status`
- 20 AI agents across 6 departments
- All agents use local_rule_engine by default (no external API needed)
- Optional Groq AI enhancement via GROQ_API_KEY

### System Monitoring
- Health check: `GET /api/health`
- Platform stats: `GET /api/admin/stats`
- Audit logs: `GET /api/crm/audit-logs`

### Security Management
- Review audit logs weekly
- Manage user access (suspend offboarded employees)
- Rotate AUTH_SECRET periodically
- Verify backups monthly

### Backup Management
- Manual backup: `bash scripts/backup.sh`
- Restore: `bash scripts/restore.sh <archive> --confirm`
- Verify backup integrity via SHA-256 checksum

### Deployment
- Deploy: `bash scripts/install.sh`
- Rollback: `bash scripts/rollback.sh`
- Update: `bash scripts/update.sh`

## Security Responsibilities
1. Review audit logs weekly for suspicious activity
2. Verify backups monthly (restore test)
3. Rotate secrets quarterly
4. Monitor AI agent activity
5. Ensure offboarded employees are suspended
