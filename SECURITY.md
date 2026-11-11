# Security Documentation

> This file describes what the code in this repository actually does. Where a
> control is enforced by a script, the file and the exact setting are named.
> Where a control is only reachable on the optional self-managed (VPS) layout
> rather than on the Hostinger deployment that is the production path, that is
> said explicitly.

## Authentication

- **Password hashing**: bcrypt with cost factor 12 (configured via `BCRYPT_COST` env).
- **Session management**: HTTP-only cookies, `Secure` flag in production, `SameSite=Lax`
  (`src/lib/auth.ts` — `setSessionCookie`).
- **CSRF protection**: the session cookie is `SameSite=Lax`, and every mutating
  endpoint accepts a JSON body only. A cross-site HTML form cannot send
  `Content-Type: application/json`, and a cross-site `fetch()` with that content
  type requires a CORS preflight that the app never approves. The application
  has **no server actions**, so the "Next.js server-action CSRF token" does not
  apply here.
- **Rate limiting**: `src/lib/rate-limit.ts` — a process-local sliding window.
  Presets: `LOGIN` 5 requests / 15 min (per client IP), `REGISTER` 3 / hour,
  `API_GENERAL` 100 / min, `API_MUTATING` 30 / min. The login, register, lead
  capture, RAG ask and speaking endpoints apply a limit. The counters are
  in-memory: they reset on restart and are not shared between instances.
- **Password reset**: Token-based, single-use, 60-minute expiry.

## Authorization (RBAC)

Two layers are in use, and they are not the same thing:

- **Legacy role strings** on the `User.role` column, enforced by
  `requireRole()` in `src/lib/auth.ts`. The values the code actually checks
  for are `SUPER_ADMIN`, `ADMIN`, `COUNSELOR`, `STUDENT` and `EXAMINER`.
- **Permission + team RBAC** (`Role`, `Permission`, `RolePermission`, `Team`,
  `TeamMember`) enforced by `src/lib/rbac.ts` (`requirePermission`,
  `requireTeamAccess`) and exposed through `/api/rbac/*`. The seed installs
  9 roles, 44 permissions and 149 role-permission mappings.

Every protected API route must validate:
1. Authenticated user (session).
2. Required role/permission.
3. Resource ownership (user can only access their own data unless ADMIN).

Object-level scoping is fail-closed in `src/lib/crud-scope.ts`: when a scope
cannot be resolved, access is denied rather than granted.

## Environment Security

- `.env` file must have `chmod 600` and be owned by the application user.
- `.env` is NEVER committed to git (see `.gitignore`).
- `.env.example` contains only placeholders, never real secrets.
- `AUTH_SECRET` must be generated on the server with `openssl rand -base64 48`.
- No hardcoded secrets in source code.
- `.env.example` lists only variables the code actually reads. A variable that
  nothing reads is removed rather than advertised — an operator must not be
  told a setting exists when it does nothing.

## Database Security

- SQLite database file must have `chmod 660` and be owned by the application user.
- The database file is NOT in the web root. Its location is resolved by
  `src/lib/paths.ts` from `DATABASE_URL` / `APP_DATA_DIR`; on the optional
  self-managed layout that is `/opt/alo-english/shared/db/`, and on Hostinger
  it is the absolute path set in the host panel.
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

## Audio / Upload Security

There is no general-purpose file-upload endpoint in this application. The only
binary payload the API accepts is speaking audio, and it is handled as Base64
inside a JSON body:

- **Size limit**: decoded audio is capped at 10 MB (`MAX_SPEECH_AUDIO_BYTES` in
  `src/lib/audio/base64.ts`) and the whole JSON body at 14 MB
  (`readJsonWithLimit` in `src/lib/http/read-json-with-limit.ts`, which
  enforces the cap while streaming and honours `Content-Length`).
- **Validation**: the payload must decode as valid Base64
  (`inspectBase64Audio`); it is not written to disk by the transcription
  endpoint.
- **Recording paths**: any locator that is opened from disk must match the
  strict `speaking/{attemptId}/{filename}` shape (`src/lib/audio/recording-path.ts`),
  which rejects path separators, traversal and unexpected extensions, and the
  caller must additionally authorize the attempt owner.
- **Upload directory**: `UPLOAD_DIR` (resolved under the data root) holds
  runtime recordings. It must be outside the web root and outside `/tmp`.

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

Applied by the application on every response (`src/proxy.ts`):
- `Content-Security-Policy` — the application sets its own policy here.
- `X-DNS-Prefetch-Control: off`.
- `Permissions-Policy` — microphone is allowed for same-origin only, because
  the speaking practice routes need it; the Caddy policy above is stricter
  and is the one that applies in production.

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

Audit logs are append-only — the application never updates or deletes a row
(the `/api/crm/audit-logs` endpoints are read-only and reject writes with
405). The published retention policy is 365 days (see
`src/app/privacy-policy/page.tsx`).

> **Not implemented:** no automated purge job removes audit rows after 365
> days. Until one exists, the retention policy is a documented commitment and
> not an enforced behaviour. Backups expire on their own schedule
> (`RETENTION_DAYS` in `scripts/backup.sh`).

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
