#!/usr/bin/env bash
# ============================================================
# Deployment script for English.ALOEducation.com Web_CRM
#
# Usage (from project root):
#   bash scripts/deploy.sh
#
# Or remotely:
#   ssh aloedu@english.aloeducation.com 'cd /var/www/english-aloeducation && bash scripts/deploy.sh'
#
# Requires: bun, prisma, nginx, systemctl privileges (sudo).
# ============================================================
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-/var/www/english-aloeducation}"
SERVICE_NAME="${SERVICE_NAME:-english-aloeducation}"

cd "$DEPLOY_DIR"

echo "▶ [1/7] Installing dependencies with bun…"
bun install --frozen-lockfile

echo "▶ [2/7] Generating Prisma client…"
bun run db:generate

echo "▶ [3/7] Pushing schema to database…"
bun run db:push

echo "▶ [4/7] Seeding database (idempotent)…"
bun run db:seed || echo "  (seed skipped or already applied)"

echo "▶ [5/7] Building Next.js production bundle…"
bun run build

echo "▶ [6/7] Restarting systemd service '$SERVICE_NAME'…"
sudo systemctl restart "$SERVICE_NAME"

echo "▶ [7/7] Validating & reloading nginx…"
sudo nginx -t
sudo systemctl reload nginx

# Optional: warm up the app by hitting the health endpoint.
echo "▶ Warming up application…"
sleep 2
for i in 1 2 3 4 5; do
  if curl -sf "http://127.0.0.1:3002/api/health" > /dev/null; then
    echo "  ✅ Application is healthy."
    exit 0
  fi
  echo "  …attempt $i: not ready yet, retrying in 2s"
  sleep 2
done

echo "  ⚠️  Application did not become healthy within 10s. Check logs:"
echo "     sudo journalctl -u $SERVICE_NAME -n 100 --no-pager"
exit 1
