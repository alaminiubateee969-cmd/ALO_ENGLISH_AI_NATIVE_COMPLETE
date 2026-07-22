# Security Documentation

## Authentication

- **Password hashing**: bcrypt with cost factor 12 (configured via `BCRYPT_COST` env).
- **Session management**: HTTP-only cookies, `Secure` flag in production, `SameSite=Lax`.
- **CSRF protection**: Next.js built-in CSRF token validation for server actions.
- **Rate limiting**: Login attempts limited by `LOGIN_MAX_ATTEMPTS` (default: 5), lockout for `LOGIN_LOCKOUT_MINUTES` (default: 15).
- **Password reset**: Token-based, single-use, 60-minute expiry.

## Authorization (RBAC)

Roles defined in the `User` model:
- `STUDENT` — can take practice tests, view own results.
- `EXAMINER` — can review writing/speaking submissions.
- `ADMIN` — full platform management.
- `AMBASSADOR` — can manage referrals and vouchers.

Every protected API route must validate:
1. Authenticated user (session).
2. Required role/permission.
3. Resource ownership (user can only access their own data unless ADMIN).

## Environment Security

- `.env` file must have `chmod 600` and be owned by the application user.
- `.env` is NEVER committed to git (see `.gitignore`).
- `.env.example` contains only placeholders, never real secrets.
- `AUTH_SECRET` must be generated on the server with `openssl rand -base64 48`.
- No hardcoded secrets in source code.

## Database Security

- SQLite database file must have `chmod 660` and be owned by `aloenglish:aloenglish`.
- The database file is NOT in the web root (lives in `/opt/alo-english/shared/db/`).
- All queries use Prisma's parameterized queries (SQL injection protection).
- No raw SQL string concatenation with user input.

## Network Security

### Firewall (UFW)

Public ports: SSH (22), HTTP (80), HTTPS (443) only.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

The application port (3000) must NOT be public — Caddy proxies to it locally.

### SSH

- Disable password authentication.
- Use SSH keys only.
- Consider changing the default SSH port.
- Never close your SSH session until you've verified a new connection works after config changes.

## File Upload Security

- Upload directory is outside the web root (`/opt/alo-english/shared/uploads/`).
- File size limit enforced via `UPLOAD_MAX_MB` (default: 25).
- MIME type validation on upload.
- Executable file extensions (`.php`, `.phtml`, `.sh`, etc.) are blocked.

## Sudo Policy

The application user (`aloenglish`) has NO unrestricted sudo. The sudoers policy (`/etc/sudoers.d/alo-english`) allows ONLY:
- `systemctl start/stop/restart/reload/status alo-english`
- `systemctl reload/status caddy`
- `journalctl -u alo-english` (read-only)

See `server-config/sudo-policy` for the exact rules.

## Security Headers

Applied by Caddy (see `server-config/Caddyfile.production`):
- `Strict-Transport-Security`: HSTS with preload.
- `X-Content-Type-Options`: nosniff.
- `X-Frame-Options`: DENY.
- `Referrer-Policy`: strict-origin-when-cross-origin.
- `Permissions-Policy`: camera, microphone, geolocation disabled.

## Systemd Hardening

The service file (`server-config/alo-english.service`) includes:
- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectSystem=strict`
- `ProtectHome=true`
- `ProtectKernelTunables=true`
- `ProtectKernelModules=true`
- `ProtectControlGroups=true`
- `RestrictNamespaces=true`
- `CapabilityBoundingSet=` (empty — no capabilities)

## Audit Logging

The `AuditLog` model records:
- User ID (nullable for anonymous actions).
- Action (e.g., `LOGIN_SUCCESS`, `LOGIN_FAILED`, `EXAM_SUBMIT`, `ADMIN_SETTINGS_UPDATE`).
- Resource (what was acted upon).
- IP address.
- Timestamp.
- Metadata (JSON string).

Audit logs are immutable and should be retained for 365 days.

## Dependency Security

- Run `bun audit` monthly.
- Review each advisory. Do NOT auto-fix — evaluate the risk and test the update.
- Critical vulnerabilities must be patched within 48 hours.

## Incident Response

1. **Isolate**: Stop the service if active exploitation is suspected: `sudo systemctl stop alo-english`.
2. **Preserve**: Take a backup of the database and logs: `bash scripts/backup.sh`.
3. **Investigate**: Review `journalctl -u alo-english` and the `AuditLog` table.
4. **Remediate**: Patch the vulnerability, deploy a fix.
5. **Restore**: Restart the service and verify: `bash scripts/healthcheck.sh`.
6. **Document**: Record the incident, timeline, root cause, and remediation.

## What NOT to Do

- Never commit `.env` files to git.
- Never use `eval` or execute user-supplied shell commands.
- Never log passwords, session tokens, or API secrets.
- Never give the application user unrestricted sudo.
- Never expose the database port publicly.
- Never use `|| true` to bypass mandatory security checks.
- Never set `ignoreBuildErrors: true` in production.
