# Troubleshooting Guide

## Login Failure
- Check credentials and account status
- Check rate limit (5/15min)
- Review audit logs

## Permission Denied (403)
- Check role: GET /api/auth/me
- Verify role has access (see API_DOCUMENTATION.md)

## Data Not Saving
- Check JSON body is valid
- Check Zod validation (422)
- Verify database is writable

## Build Failure
- Run: bun run typecheck
- Run: bun run lint
- Ensure ignoreBuildErrors is false

## Database Connection
- Check DATABASE_URL in .env
- Verify file exists and is writable
- Run: bun prisma validate

## Service Won't Start
- Check: sudo systemctl status alo-english
- Logs: sudo journalctl -u alo-english -n 50
- Verify .env permissions (chmod 600)

## Caddy 502
- Verify app running: curl localhost:3000/api/health
- Validate Caddy config
- Reload Caddy
