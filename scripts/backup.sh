#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/backup.sh — Database + uploads + config backup.
#
# Creates a timestamped tar.gz archive containing:
#   - SQLite database file
#   - Uploads directory
#   - Environment file
#   - Systemd service + Caddy config
#
# Usage:   bash scripts/backup.sh [--help]
# Output:  Path to the created backup archive on stdout.
#
# Exit codes:
#   0 = backup created successfully
#   1 = backup failed
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Load environment ──────────────────────────────────────────────────
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/alo-english}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DB_PATH="${DATABASE_URL#file:}"
UPLOAD_DIR="${UPLOAD_DIR:-$PROJECT_ROOT/uploads}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="alo-english-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
TMP_DIR=$(mktemp -d)

# ─── Cleanup trap ──────────────────────────────────────────────────────
cleanup() {
  [[ -d "$TMP_DIR" ]] && rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# ─── Validate ──────────────────────────────────────────────────────────
if [[ -z "$DB_PATH" ]] || [[ "$DB_PATH" == "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL must be in format file:/path/to/db" >&2
  exit 1
fi
if [[ ! -f "$DB_PATH" ]]; then
  echo "ERROR: Database file not found: $DB_PATH" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# ─── Collect files ─────────────────────────────────────────────────────
echo "▸ Creating backup: $BACKUP_NAME"

# Database (use sqlite3 .backup for consistency if available, else copy).
DB_BACKUP="$TMP_DIR/database.db"
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup '$DB_BACKUP'" 2>/dev/null || cp "$DB_PATH" "$DB_BACKUP"
else
  cp "$DB_PATH" "$DB_BACKUP"
fi
echo "  ✓ Database copied"

# Environment file (without revealing contents in logs).
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  cp "$PROJECT_ROOT/.env" "$TMP_DIR/env"
  chmod 600 "$TMP_DIR/env"
  echo "  ✓ Environment file copied"
fi

# Uploads.
if [[ -d "$UPLOAD_DIR" ]]; then
  cp -r "$UPLOAD_DIR" "$TMP_DIR/uploads"
  echo "  ✓ Uploads copied"
fi

# Server config.
mkdir -p "$TMP_DIR/server-config"
[[ -f "$PROJECT_ROOT/server-config/alo-english.service" ]] && cp "$PROJECT_ROOT/server-config/alo-english.service" "$TMP_DIR/server-config/"
[[ -f "$PROJECT_ROOT/server-config/Caddyfile.production" ]] && cp "$PROJECT_ROOT/server-config/Caddyfile.production" "$TMP_DIR/server-config/"
echo "  ✓ Server config copied"

# Metadata.
cat > "$TMP_DIR/backup-metadata.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "app_version": "$(grep '"version"' "$PROJECT_ROOT/package.json" | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')",
  "database_path": "$DB_PATH",
  "retention_days": $RETENTION_DAYS
}
EOF
echo "  ✓ Metadata written"

# ─── Create archive ────────────────────────────────────────────────────
tar -czf "$BACKUP_PATH" -C "$TMP_DIR" .
echo "  ✓ Archive created: $BACKUP_PATH"

# ─── Checksum ──────────────────────────────────────────────────────────
CHECKSUM=$(sha256sum "$BACKUP_PATH" | awk '{print $1}')
echo "$CHECKSUM  $(basename "$BACKUP_PATH")" > "${BACKUP_PATH}.sha256"
echo "  ✓ SHA-256: $CHECKSUM"

# ─── Retention: remove old backups ─────────────────────────────────────
OLD_COUNT=$(find "$BACKUP_DIR" -name "alo-english-backup-*.tar.gz" -mtime +"$RETENTION_DAYS" 2>/dev/null | wc -l || echo 0)
if [[ "$OLD_COUNT" -gt 0 ]]; then
  find "$BACKUP_DIR" -name "alo-english-backup-*.tar.gz" -mtime +"$RETENTION_DAYS" -delete
  find "$BACKUP_DIR" -name "alo-english-backup-*.tar.gz.sha256" -mtime +"$RETENTION_DAYS" -delete
  echo "  ✓ Pruned $OLD_COUNT backup(s) older than $RETENTION_DAYS days"
fi

echo ""
echo "✅ Backup complete: $BACKUP_PATH"
echo "$BACKUP_PATH"
