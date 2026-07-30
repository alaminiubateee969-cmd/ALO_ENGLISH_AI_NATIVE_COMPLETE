# Incident Response Guide

## Compromised Account
1. Suspend: PUT /api/crm/users/[id] with status SUSPENDED
2. Review audit logs: GET /api/crm/audit-logs?search=LOGIN
3. Reset password
4. Notify user

## Token Leak
1. Rotate AUTH_SECRET: openssl rand -base64 48
2. Update .env
3. Restart: sudo systemctl restart alo-english
4. All sessions invalidated

## Database Failure
1. Check database file
2. Restore from backup: bash scripts/restore.sh <archive> --confirm
3. Restart service
4. Verify: curl localhost:3000/api/health
