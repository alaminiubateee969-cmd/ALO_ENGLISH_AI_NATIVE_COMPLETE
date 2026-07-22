# Operations Guide

## Daily Operations

### Check service health

WHY: Verify the application is running and responding.

COMMAND:
```bash
sudo systemctl status alo-english
curl -s http://localhost:3000/api/health | jq .
```

EXPECTED RESULT: Service is `active (running)`, health returns `{"status":"healthy"}`.

FAILURE ACTION:
```bash
sudo journalctl -u alo-english --no-pager -n 50
sudo systemctl restart alo-english
```

### Check logs

WHY: Detect errors early.

COMMAND:
```bash
sudo journalctl -u alo-english --since "1 hour ago" --no-pager | tail -50
```

Look for: `error`, `ERR`, `unhandled`, `reject`.

## Weekly Operations

### Create a backup

WHY: Protect against data loss.

COMMAND:
```bash
sudo -u aloenglish bash /opt/alo-english/current/scripts/backup.sh
```

EXPECTED RESULT: A `.tar.gz` archive in `/var/backups/alo-english/` with a `.sha256` checksum.

FAILURE ACTION: Check disk space (`df -h`). Check that the database file exists and is readable.

### Verify backup integrity

WHY: A backup is not proven until a restore test succeeds.

COMMAND:
```bash
# Test restore in an isolated directory (does NOT touch production)
cd /tmp
mkdir restore-test
cd restore-test
tar -xzf /var/backups/alo-english/alo-english-backup-*.tar.gz
sqlite3 database.db "SELECT COUNT(*) FROM User;"
```

EXPECTED RESULT: A non-zero user count.

### Review disk usage

WHY: Prevent disk-full failures.

COMMAND:
```bash
df -h /opt/alo-english /var/backups/alo-english
du -sh /opt/alo-english/releases/*
```

Clean old releases if needed:
```bash
# Keep only the 5 most recent releases
cd /opt/alo-english/releases
ls -1t | tail -n +6 | xargs rm -rf
```

## Monthly Operations

### Update dependencies

WHY: Security patches.

COMMAND:
```bash
cd /opt/alo-english-source
bun update
bun run lint && bun run typecheck && bun test tests/
```

Review the diff. Do NOT run `bun audit --fix` automatically — review each change.

### Renew TLS certificate

Caddy handles this automatically. Verify:

COMMAND:
```bash
sudo systemctl status caddy
curl -sI https://english.aloeducation.com/ | head -5
```

### Test rollback procedure

WHY: Verify rollback works BEFORE you need it.

COMMAND:
```bash
bash /opt/alo-english/current/scripts/rollback.sh --list
# Do NOT actually roll back on a healthy production system unless testing in maintenance window.
```

## Backup Retention

- Backups older than `BACKUP_RETENTION_DAYS` (default: 14) are pruned automatically by `backup.sh`.
- Monthly: copy a backup to off-site storage (e.g., S3, rsync to another server).

## Monitoring Checklist

| Check | Command | Frequency |
|---|---|---|
| Service active | `systemctl is-active alo-english` | Every 5 min (monitoring system) |
| Health endpoint | `curl localhost:3000/api/health` | Every 5 min |
| Disk space | `df -h` | Daily |
| Backup exists | `ls /var/backups/alo-english/` | Daily |
| Log errors | `journalctl -u alo-english --since "1 hour ago"` | Daily |
| TLS certificate | `curl -sI https://...` | Weekly |
| Dependency audit | `bun audit` | Monthly |
