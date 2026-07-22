#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/install.sh — Server-side installation script.
#
# Performs a staged deployment of the ALO English Test Platform.
# Creates a new release directory, installs dependencies, builds,
# migrates the database, and atomically switches the current symlink.
#
# Usage:   bash scripts/install.sh [--help] [--check]
#   --check  Validate only; do not modify the system.
#
# Exit codes:
#   0 = installation successful
#   1 = installation failed (see error message)
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── Configuration ─────────────────────────────────────────────────────
DEPLOY_ROOT="/opt/alo-english"
APP_USER="aloenglish"
APP_PORT="${APP_PORT:-3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${DEPLOY_ROOT}/releases/${TIMESTAMP}"
SHARED_DIR="${DEPLOY_ROOT}/shared"
CURRENT_LINK="${DEPLOY_ROOT}/current"

CHECK_MODE="false"
if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: bash scripts/install.sh [--check]"
  echo "  --check  Validate prerequisites without modifying the system."
  exit 0
fi
if [[ "${1:-}" == "--check" ]]; then
  CHECK_MODE="true"
fi

echo "══════════════════════════════════════════════════════"
echo "  ALO English Test Platform — Installer"
echo "  Deploy root:  $DEPLOY_ROOT"
echo "  Release:      $TIMESTAMP"
echo "  Check mode:   $CHECK_MODE"
echo "══════════════════════════════════════════════════════"

# ─── 1. Validate prerequisites ─────────────────────────────────────────
echo ""
echo "▸ Step 1: Validate prerequisites"

if ! command -v node &>/dev/null; then
  echo "✗ Node.js not found" >&2
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "✗ Node.js >=22 required (found $(node -v))" >&2
  exit 1
fi
echo "  ✓ Node.js $(node -v)"

if ! command -v bun &>/dev/null; then
  echo "✗ Bun not found" >&2
  exit 1
fi
echo "  ✓ Bun $(bun --version)"

if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
  echo "✗ package.json not found at $PROJECT_ROOT" >&2
  exit 1
fi
echo "  ✓ package.json found"

if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
  echo "✗ .env not found — create it from .env.example" >&2
  exit 1
fi
echo "  ✓ .env found"

if [[ "$CHECK_MODE" == "true" ]]; then
  echo ""
  echo "✅ Check mode: prerequisites validated. No changes made."
  exit 0
fi

# ─── 2. Create release directory ───────────────────────────────────────
echo ""
echo "▸ Step 2: Create release directory"
mkdir -p "$RELEASE_DIR"
mkdir -p "$SHARED_DIR/db" "$SHARED_DIR/uploads" "$SHARED_DIR/logs"
echo "  ✓ $RELEASE_DIR created"

# ─── 3. Copy source ────────────────────────────────────────────────────
echo ""
echo "▸ Step 3: Copy source files"
rsync -a --exclude='node_modules' --exclude='.next' --exclude='.git' \
  --exclude='dev.log' --exclude='server.log' --exclude='*.db' \
  --exclude='cpanel-production' --exclude='english-aloeducation' \
  --exclude='skills' --exclude='mini-services' --exclude='examples' \
  --exclude='tool-results' --exclude='upload' --exclude='download' \
  "$PROJECT_ROOT/" "$RELEASE_DIR/"
echo "  ✓ Source copied"

# ─── 4. Install dependencies ───────────────────────────────────────────
echo ""
echo "▸ Step 4: Install dependencies"
cd "$RELEASE_DIR"
bun install --frozen-lockfile
echo "  ✓ Dependencies installed"

# ─── 5. Generate Prisma client ─────────────────────────────────────────
echo ""
echo "▸ Step 5: Generate database client"
bun run db:generate
echo "  ✓ Prisma client generated"

# ─── 6. Build ──────────────────────────────────────────────────────────
echo ""
echo "▸ Step 6: Production build"
bun run build
echo "  ✓ Build complete"

if [[ ! -f "$RELEASE_DIR/.next/standalone/server.js" ]]; then
  echo "✗ Build output missing: .next/standalone/server.js" >&2
  exit 1
fi
echo "  ✓ Build output verified"

# ─── 7. Apply migrations ───────────────────────────────────────────────
echo ""
echo "▸ Step 7: Apply database migrations"
export DATABASE_URL="file:${SHARED_DIR}/db/app.db"
cd "$RELEASE_DIR"
bun prisma migrate deploy
echo "  ✓ Migrations applied"

# ─── 8. Link shared resources ──────────────────────────────────────────
echo ""
echo "▸ Step 8: Link shared resources"
# Symlink the shared .env into the release.
if [[ -f "$SHARED_DIR/.env" ]]; then
  ln -sf "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
  echo "  ✓ .env linked"
else
  cp "$PROJECT_ROOT/.env" "$SHARED_DIR/.env"
  chmod 600 "$SHARED_DIR/.env"
  ln -sf "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
  echo "  ✓ .env created and linked"
fi

# Symlink uploads.
ln -sf "$SHARED_DIR/uploads" "$RELEASE_DIR/uploads"
echo "  ✓ uploads linked"

# Symlink logs.
ln -sf "$SHARED_DIR/logs" "$RELEASE_DIR/logs"
echo "  ✓ logs linked"

# ─── 9. Switch current symlink ─────────────────────────────────────────
echo ""
echo "▸ Step 9: Switch current symlink"
PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE=$(readlink "$CURRENT_LINK")
fi
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
echo "  ✓ current → $RELEASE_DIR"
if [[ -n "$PREVIOUS_RELEASE" ]]; then
  echo "  ✓ previous: $PREVIOUS_RELEASE"
fi

# ─── 10. Install service ───────────────────────────────────────────────
echo ""
echo "▸ Step 10: Install systemd service"
if [[ -f "$RELEASE_DIR/server-config/alo-english.service" ]]; then
  sudo cp "$RELEASE_DIR/server-config/alo-english.service" /etc/systemd/system/alo-english.service
  sudo systemctl daemon-reload
  sudo systemctl enable alo-english
  echo "  ✓ Service installed and enabled"
fi

# ─── 11. Restart service ───────────────────────────────────────────────
echo ""
echo "▸ Step 11: Restart service"
sudo systemctl restart alo-english
sleep 3
if sudo systemctl is-active --quiet alo-english; then
  echo "  ✓ Service is active"
else
  echo "✗ Service failed to start" >&2
  sudo journalctl -u alo-english --no-pager -n 20 >&2
  exit 1
fi

# ─── 12. Health check ──────────────────────────────────────────────────
echo ""
echo "▸ Step 12: Local health check"
sleep 2
if curl -sf "http://localhost:${APP_PORT}/api/health" | grep -q '"status"'; then
  echo "  ✓ Health endpoint responding"
else
  echo "✗ Health endpoint not responding" >&2
  exit 1
fi

# ─── Summary ───────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT SUCCESSFUL"
echo "  Release:  $RELEASE_DIR"
echo "  Current:  $CURRENT_LINK → $RELEASE_DIR"
if [[ -n "$PREVIOUS_RELEASE" ]]; then
  echo "  Rollback: bash scripts/rollback.sh"
fi
echo "══════════════════════════════════════════════════════"
