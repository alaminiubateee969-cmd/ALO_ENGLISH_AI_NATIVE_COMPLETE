#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/healthcheck.sh — Application health check.
#
# Tests the local health endpoint and reports status.
# Non-destructive: only reads.
#
# Usage:   bash scripts/healthcheck.sh [URL]
#   URL  Health endpoint URL (default: http://localhost:3016/api/health)
#
# Exit codes:
#   0 = healthy
#   1 = unhealthy or unreachable
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

HEALTH_URL="${1:-http://localhost:3016/api/health}"
TIMEOUT=10

echo "▸ Checking health endpoint: $HEALTH_URL"

RESPONSE=$(curl -sS --max-time "$TIMEOUT" -w "\n%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [[ -z "$HTTP_CODE" ]] || [[ "$HTTP_CODE" == "000" ]]; then
  echo "✗ UNREACHABLE — endpoint did not respond within ${TIMEOUT}s"
  exit 1
fi

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "✗ UNHEALTHY — HTTP $HTTP_CODE"
  echo "  Response: $BODY"
  exit 1
fi

# Parse JSON status field if jq is available.
if command -v jq &>/dev/null; then
  STATUS=$(echo "$BODY" | jq -r '.status // empty' 2>/dev/null || echo "")
  if [[ -n "$STATUS" ]]; then
    if [[ "$STATUS" == "healthy" ]]; then
      echo "✓ HEALTHY — status: $STATUS"
      echo "  Response: $BODY"
      exit 0
    else
      echo "✗ UNHEALTHY — status: $STATUS"
      echo "  Response: $BODY"
      exit 1
    fi
  fi
fi

# Fallback: just check for HTTP 200.
echo "✓ HEALTHY — HTTP 200"
echo "  Response: $BODY"
exit 0
