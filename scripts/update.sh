#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/update.sh — Update to a new release (alias for install.sh).
#
# Performs the same staged deployment as install.sh. The current release
# is preserved for rollback.
#
# Usage:   bash scripts/update.sh
# Exit codes:
#   0 = update successful
#   1 = update failed
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

echo "▸ Update = staged install (previous release preserved for rollback)"
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/install.sh" "$@"
