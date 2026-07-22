# Troubleshooting

## Service won't start

### Symptom: `systemctl start alo-english` fails

WHY: The service file may reference a missing path or the build output doesn't exist.

COMMAND:
```bash
sudo journalctl -u alo-english --no-pager -n 50
```

Common causes:
1. **`.next/standalone/server.js` missing** — run `bun run build` in the release directory.
2. **`WorkingDirectory` doesn't exist** — verify `/opt/alo-english/current` is a valid symlink.
3. **`EnvironmentFile` missing** — verify `/opt/alo-english/shared/.env` exists and has `chmod 600`.
4. **Port conflict** — check if another process is using port 3000: `ss -tlnp | grep :3000`.

### Symptom: Service starts but health endpoint returns 503

WHY: The database is unreachable or not migrated.

COMMAND:
```bash
sudo -u aloenglish sqlite3 /opt/alo-english/shared/db/app.db "SELECT COUNT(*) FROM ExamType;"
```

If the table doesn't exist, run migrations:
```bash
cd /opt/alo-english/current
sudo -u aloenglish DATABASE_URL="file:/opt/alo-english/shared/db/app.db" bun prisma migrate deploy
```

## Database Issues

### Symptom: `Database connection failed`

WHY: The `DATABASE_URL` in `.env` may be incorrect.

COMMAND:
```bash
grep DATABASE_URL /opt/alo-english/shared/.env
```

Verify:
- Format is `file:<absolute-path>`
- The file exists and is writable by `aloenglish`
- The directory exists

### Symptom: Migration fails

WHY: The migration SQL may conflict with existing schema.

COMMAND:
```bash
cd /opt/alo-english/current
sudo -u aloenglish DATABASE_URL="file:/opt/alo-english/shared/db/app.db" bun prisma migrate status
```

Do NOT use `migrate dev` in production. If a migration fails, inspect the SQL in `prisma/migrations/` and fix forward with a new migration.

## Build Issues

### Symptom: `bun run build` fails with TypeScript errors

WHY: Type errors must be fixed, not bypassed.

COMMAND:
```bash
bun run typecheck
```

Fix every error. Do NOT set `ignoreBuildErrors: true` in `next.config.ts` (this is a production blocker).

### Symptom: `bun install --frozen-lockfile` fails

WHY: The lockfile is out of sync with `package.json`.

FAILURE ACTION:
1. Run `bun install` (without `--frozen-lockfile`) to update the lockfile.
2. Commit the updated `bun.lock`.
3. Re-run `bun install --frozen-lockfile` to verify.

## Caddy / HTTPS Issues

### Symptom: 502 Bad Gateway

WHY: Caddy can't reach the Next.js server.

COMMAND:
```bash
sudo systemctl status alo-english
curl -s http://localhost:3000/api/health
```

If the app is running locally but Caddy returns 502, check the Caddy config:
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Symptom: TLS certificate not provisioning

WHY: DNS must point to the server before Caddy can provision Let's Encrypt.

COMMAND:
```bash
dig english.aloeducation.com
```

Verify the A record points to this server's IP. Port 443 must be open:
```bash
sudo ufw status
```

## Permission Issues

### Symptom: `EACCES: permission denied`

WHY: The application user can't write to shared directories.

COMMAND:
```bash
sudo chown -R aloenglish:aloenglish /opt/alo-english/shared
sudo chmod -R 770 /opt/alo-english/shared
```

## Rollback Issues

### Symptom: Rollback fails

WHY: No previous release exists.

COMMAND:
```bash
bash /opt/alo-english/current/scripts/rollback.sh --list
```

If only one release exists, rollback is not possible. Deploy a fix forward instead.

### Symptom: After rollback, database errors

WHY: The database schema may have changed between releases.

Database rollback is NOT automatic. Use forward-fix migrations. If the previous release is incompatible with the current database schema, create a new migration that reconciles the schema.

## Getting Help

1. Check `journalctl -u alo-english` for application logs.
2. Check `/opt/alo-english/shared/logs/` for application-level logs.
3. Run `bash scripts/verify.sh` to check all gates.
4. Run `bash scripts/healthcheck.sh` to test the health endpoint.
