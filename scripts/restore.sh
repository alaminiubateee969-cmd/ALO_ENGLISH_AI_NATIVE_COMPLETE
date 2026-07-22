#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/restore.sh — Restore database + uploads from a backup archive.
#
# WARNING: This OVERWRITES the current database and uploads.
# Always test in an isolated environment first.
#
# Usage:   bash scripts/restore.sh <backup-archive.tar.gz> [--confirm]
#   --confirm  Skip the interactive confirmation prompt.
#
# Exit codes:
#   0 = restore successful
#   1 = restore failed or cancelled
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Validate arguments ────────────────────────────────────────────────
if [[ "${1:-}" == "--help" ]] || [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/restore.sh <backup-archive.tar.gz> [--confirm]"
  echo ""
  echo "  backup-archive  Path to a .tar.gz backup created by backup.sh"
  echo "  --confirm       Skip the interactive confirmation prompt"
  exit 0
fi

BACKUP_ARCHIVE="$1"
CONFIRM="${2:-}"

# Reject path traversal.
case "$BACKUP_ARCHIVE" in
  ../*|*/../*) echo "ERROR: path traversal rejected" >&2; exit 1 ;;
esac

if [[ ! -f "$BACKUP_ARCHIVE" ]]; then
  echo "ERROR: backup archive not found: $BACKUP_ARCHIVE" >&2
  exit 1
fi

# ─── Verify checksum ───────────────────────────────────────────────────
CHECKSUM_FILE="${BACKUP_ARCHIVE}.sha256"
if [[ -f "$CHECKSUM_FILE" ]]; then
  echo "▸ Verifying checksum…"
  if command -v sha256sum &>/dev/null; then
    if ! (cd "$(dirname "$BACKUP_ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM_FILE")") >/dev/null 2>&1; then
      echo "ERROR: checksum verification failed" >&2
      exit 1
    fi
    echo "  ✓ Checksum verified"
  fi
fi

# ─── Load environment ──────────────────────────────────────────────────
if [[ -f "$PROJECT_ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
  set +a
fi

DB_PATH="${DATABASE_URL#file:}"
UPLOAD_DIR="${UPLOAD_DIR:-$PROJECT_ROOT/uploads}"

if [[ -z "$DB_PATH" ]] || [[ "$DB_PATH" == "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL must be in format file:/path/to/db" >&2
  exit 1
fi

# ─── Confirmation ──────────────────────────────────────────────────────
if [[ "$CONFIRM" != "--confirm" ]]; then
  echo "══════════════════════════════════════════════════════"
  echo "  WARNING: This will OVERWRITE:"
  echo "    Database: $DB_PATH"
  echo "    Uploads:  $UPLOAD_DIR"
  echo "══════════════════════════════════════════════════════"
  read -rp "Type 'RESTORE' to confirm: " CONFIRM_INPUT
  if [[ "$CONFIRM_INPUT" != "RESTORE" ]]; then
    echo "Cancelled."
    exit 1
  fi
fi

# ─── Extract ───────────────────────────────────────────────────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "▸ Extracting backup…"
tar -xzf "$BACKUP_ARCHIVE" -C "$TMP_DIR"
echo "  ✓ Extracted to $TMP_DIR"

# ─── Restore database ──────────────────────────────────────────────────
if [[ -f "$TMP_DIR/database.db" ]]; then
  echo "▸ Restoring database…"
  mkdir -p "$(dirname "$DB_PATH")"
  # Backup the current database before overwriting.
  if [[ -f "$DB_PATH" ]]; then
    cp "$DB_PATH" "${DB_PATH}.pre-restore.$(date +%s)"
    echo "  ✓ Current database backed up to ${DB_PATH}.pre-restore.*"
  fi
  cp "$TMP_DIR/database.db" "$DB_PATH"
  echo "  ✓ Database restored"
fi

# ─── Restore uploads ───────────────────────────────────────────────────
if [[ -d "$TMP_DIR/uploads" ]]; then
  echo "▸ Restoring uploads…"
  mkdir -p "$UPLOAD_DIR"
  rm -rf "${UPLOAD_DIR:?}"/*
  cp -r "$TMP_DIR/uploads/"* "$UPLOAD_DIR/"
  echo "  ✓ Uploads restored"
fi

echo ""
echo "✅ Restore complete. Restart the application service:"
echo "   sudo systemctl restart alo-english"
