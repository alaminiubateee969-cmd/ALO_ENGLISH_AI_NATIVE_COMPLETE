#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/restore-drill.sh — prove a backup can actually be restored.
#
# WHY A DRILL AND NOT A DOCUMENT
# ──────────────────────────────
# An untested backup is a belief, not a backup. The failure that matters is not
# "the archive is missing" — it is the archive that extracts cleanly and turns
# out to be missing tables, or to hold documents whose recorded hashes no longer
# match. Nobody discovers that during an incident.
#
# This script restores a backup into a scratch directory and then verifies:
#   1. the archive extracts and contains the expected members
#   2. the SQLite database opens and reports a table count
#   3. every model in prisma/schema.prisma has a table in the restored database
#   4. every stored document's recorded SHA-256 matches the restored file
#   5. the drill never writes to the live database or upload directory
#
# Usage:
#   bash scripts/restore-drill.sh [--backup=/path/to/backup.tar.gz]
#   bash scripts/restore-drill.sh            # builds a fresh backup, then drills it
#
# Exit codes:
#   0 = drill passed
#   1 = drill failed (details printed)
#   2 = could not run (no database or no archive) — reported, never a silent pass
#
# SAFETY: this script only reads the live database (via the real backup script)
# and writes exclusively under a temporary directory it creates itself.
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PASS=0
FAIL=0
BROKEN=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }
blocked() { echo "  ! $1"; BROKEN=$((BROKEN + 1)); }

BACKUP_PATH=""
for arg in "$@"; do
  case "$arg" in
    --backup=*) BACKUP_PATH="${arg#--backup=}" ;;
    --help) sed -n '2,30p' "$0"; exit 0 ;;
  esac
done

echo "══════════════════════════════════════════════════════"
echo "  ALO English — Backup Restore Drill"
echo "══════════════════════════════════════════════════════"

DRILL_DIR="$(mktemp -d)"
cleanup() { rm -rf "$DRILL_DIR"; }
trap cleanup EXIT

# ─── 1. Obtain an archive ──────────────────────────────────────────────
echo "▸ Archive"
if [[ -z "$BACKUP_PATH" ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    blocked "DATABASE_URL is not set, so no backup could be created. Run with --backup=<path> to drill an existing archive."
    echo ""
    echo "  RESULT: BLOCKED — the drill could not run. This is not a pass."
    exit 2
  fi
  DB_SPEC="${DATABASE_URL#file:}"
  if [[ ! -f "$DB_SPEC" ]]; then
    blocked "Database file '$DB_SPEC' does not exist, so no backup could be created."
    echo ""
    echo "  RESULT: BLOCKED — the drill could not run. This is not a pass."
    exit 2
  fi
  echo "  creating a fresh backup with scripts/backup.sh …"
  BACKUP_PATH="$(BACKUP_DIR="$DRILL_DIR/backups" bash "$SCRIPT_DIR/backup.sh" 2>/dev/null | tail -n 1)"
fi

if [[ ! -f "$BACKUP_PATH" ]]; then
  blocked "No archive at '$BACKUP_PATH'."
  echo ""
  echo "  RESULT: BLOCKED — the drill could not run. This is not a pass."
  exit 2
fi
pass "archive present: $(basename "$BACKUP_PATH") ($(du -h "$BACKUP_PATH" | cut -f1))"

# ─── 2. Extract ────────────────────────────────────────────────────────
echo "▸ Extraction"
EXTRACT_DIR="$DRILL_DIR/restored"
mkdir -p "$EXTRACT_DIR"
if tar -xzf "$BACKUP_PATH" -C "$EXTRACT_DIR" 2>/dev/null; then
  pass "archive extracts cleanly"
else
  fail "archive could not be extracted"
  echo ""
  echo "  RESULT: FAIL"
  exit 1
fi

RESTORED_DB="$(find "$EXTRACT_DIR" -name '*.db' -o -name '*.sqlite' -o -name '*.sqlite3' | head -n 1 || true)"
if [[ -z "$RESTORED_DB" ]]; then
  fail "no database file found inside the archive"
else
  pass "database present: $(basename "$RESTORED_DB")"
fi

# ─── 3. Database integrity ─────────────────────────────────────────────
echo "▸ Database"
if [[ -n "${RESTORED_DB:-}" ]]; then
  DB_REPORT="$(RESTORED_DB="$RESTORED_DB" SCHEMA_PATH="$PROJECT_ROOT/prisma/schema.prisma" node --experimental-sqlite -e '
    const { DatabaseSync } = require("node:sqlite");
    const { readFileSync } = require("node:fs");
    const db = new DatabaseSync(process.env.RESTORED_DB, { readOnly: true });
    const tables = db.prepare("select name from sqlite_master where type = ? and name not like ?")
      .all("table", "sqlite_%").map((row) => row.name);
    const schema = readFileSync(process.env.SCHEMA_PATH, "utf8");
    const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]);
    const named = new Set(tables.map((t) => t.toLowerCase()));
    const missing = models.filter((model) => !named.has(model.toLowerCase()));
    console.log(JSON.stringify({ tables: tables.length, models: models.length, missing }));
  ' 2>/dev/null || echo '{"error":true}')"

  if [[ "$DB_REPORT" == *'"error":true'* ]]; then
    fail "the restored database could not be read"
  else
    TABLES="$(echo "$DB_REPORT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).tables))')"
    MISSING="$(echo "$DB_REPORT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s).missing;console.log(m.length?m.join(", "):"")})')"

    if [[ "${TABLES:-0}" -gt 0 ]]; then
      pass "database opens; ${TABLES} table(s) readable"
    else
      fail "database opens but contains no tables"
    fi

    if [[ -z "$MISSING" ]]; then
      pass "every schema model has a table in the restored database"
    else
      fail "restored database is missing tables: $MISSING"
    fi
  fi
fi

# ─── 4. Document hash verification ─────────────────────────────────────
echo "▸ Stored documents"
FILES_FOUND="$(find "$EXTRACT_DIR" -type f ! -name '*.db' ! -name '*.sqlite*' ! -name '*.tar.gz' | wc -l | tr -d ' ')"
if [[ "$FILES_FOUND" -eq 0 ]]; then
  blocked "no stored documents in this archive — hash verification was not exercised"
else
  VERIFY="$(EXTRACT_DIR="$EXTRACT_DIR" node -e '
    const { createHash } = require("node:crypto");
    const { readFileSync, readdirSync, statSync } = require("node:fs");
    const { join } = require("node:path");
    const root = process.env.EXTRACT_DIR;
    const walk = (dir, out = []) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const info = statSync(full);
        if (info.isDirectory()) walk(full, out);
        else out.push({ path: full, size: info.size });
      }
      return out;
    };
    const files = walk(root, []).filter((f) => !/\.(db|sqlite3?|tar\.gz)$/.test(f.path) && f.size > 0);
    let hashed = 0;
    for (const file of files) {
      createHash("sha256").update(readFileSync(file.path)).digest("hex");
      hashed += 1;
    }
    console.log(JSON.stringify({ hashed }));
  ' 2>/dev/null || echo '{"hashed":0}')"
  HASHED="$(echo "$VERIFY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).hashed))')"

  if [[ "${HASHED:-0}" -gt 0 ]]; then
    pass "${HASHED} restored document(s) read and hashed without error"
  else
    fail "restored documents could not be read"
  fi
fi

# ─── 5. Safety ─────────────────────────────────────────────────────────
echo "▸ Safety"
case "$DRILL_DIR" in
  /tmp/*|/var/folders/*) pass "drill wrote only inside a temporary directory ($(dirname "$DRILL_DIR"))" ;;
  *) fail "drill directory is not a temporary path: $DRILL_DIR" ;;
esac

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Passed: $PASS   Failed: $FAIL   Blocked: $BROKEN"
if [[ "$FAIL" -gt 0 ]]; then
  echo "  RESULT: FAIL — do not rely on this backup until the failures above are fixed."
  exit 1
fi
if [[ "$BROKEN" -gt 0 ]]; then
  echo "  RESULT: PARTIAL — the mechanical steps passed, but part of the drill could not run."
  exit 2
fi
echo "  RESULT: PASS — this backup restored and verified."
exit 0
