#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/rollback.sh — Roll back to the previous release.
#
# Points the `current` symlink to the previous release directory and
# restarts the service. Does NOT rollback database migrations (use
# forward-fix migrations instead — see DEPLOYMENT.md).
#
# Usage:   bash scripts/rollback.sh [--help] [--list]
#   --list  List available releases without rolling back.
#
# Exit codes:
#   0 = rollback successful
#   1 = rollback failed
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

DEPLOY_ROOT="/opt/alo-english"
RELEASES_DIR="${DEPLOY_ROOT}/releases"
CURRENT_LINK="${DEPLOY_ROOT}/current"

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: bash scripts/rollback.sh [--list]"
  echo "  --list  List available releases."
  exit 0
fi

# ─── List mode ─────────────────────────────────────────────────────────
if [[ "${1:-}" == "--list" ]]; then
  echo "Available releases (newest first):"
  if [[ -d "$RELEASES_DIR" ]]; then
    ls -1t "$RELEASES_DIR" 2>/dev/null || echo "  (none)"
  else
    echo "  (no releases directory)"
  fi
  if [[ -L "$CURRENT_LINK" ]]; then
    echo ""
    echo "Current: $(readlink "$CURRENT_LINK")"
  fi
  exit 0
fi

# ─── Validate ──────────────────────────────────────────────────────────
if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "ERROR: No releases directory at $RELEASES_DIR" >&2
  exit 1
fi

CURRENT_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  CURRENT_RELEASE=$(readlink "$CURRENT_LINK")
fi

# List releases, newest first, excluding the current one.
mapfile -t RELEASES < <(ls -1t "$RELEASES_DIR" 2>/dev/null)

PREVIOUS_RELEASE=""
for r in "${RELEASES[@]}"; do
  FULL_PATH="${RELEASES_DIR}/${r}"
  if [[ "$FULL_PATH" != "$CURRENT_RELEASE" ]]; then
    PREVIOUS_RELEASE="$FULL_PATH"
    break
  fi
done

if [[ -z "$PREVIOUS_RELEASE" ]]; then
  echo "ERROR: No previous release available for rollback" >&2
  echo "  Current: $CURRENT_RELEASE" >&2
  exit 1
fi

echo "══════════════════════════════════════════════════════"
echo "  Rollback"
echo "  From: $CURRENT_RELEASE"
echo "  To:   $PREVIOUS_RELEASE"
echo "══════════════════════════════════════════════════════"

# ─── Switch symlink ────────────────────────────────────────────────────
ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
echo "  ✓ current → $PREVIOUS_RELEASE"

# ─── Restart service ───────────────────────────────────────────────────
echo "▸ Restarting service…"
sudo systemctl restart alo-english
sleep 3

if sudo systemctl is-active --quiet alo-english; then
  echo "  ✓ Service is active"
else
  echo "✗ Service failed to start after rollback" >&2
  sudo journalctl -u alo-english --no-pager -n 20 >&2
  exit 1
fi

# ─── Health check ──────────────────────────────────────────────────────
echo "▸ Health check…"
APP_PORT="${APP_PORT:-3000}"
if curl -sf "http://localhost:${APP_PORT}/api/health" | grep -q '"status"'; then
  echo "  ✓ Health endpoint responding"
else
  echo "⚠ Health endpoint not responding — check logs" >&2
  exit 1
fi

echo ""
echo "✅ Rollback complete. Now running: $PREVIOUS_RELEASE"
echo "   Note: database was NOT rolled back. Use forward-fix migrations if needed."
