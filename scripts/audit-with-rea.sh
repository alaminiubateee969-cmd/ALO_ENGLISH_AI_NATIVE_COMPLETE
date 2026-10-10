#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node - <<'NODE'
const [major, minor] = process.versions.node.split(".").map(Number);
const supported =
  (major === 22 && minor >= 19) ||
  (major === 24 && minor >= 11) ||
  major >= 26;
if (!supported) {
  console.error("REA requires Node.js 22.19+, 24.11+, or 26+.");
  process.exit(1);
}
NODE

if [[ $# -gt 0 ]]; then
  TARGET="$1"
  if [[ "$TARGET" != /* ]]; then TARGET="$PWD/$TARGET"; fi
else
  # REA inventories the target directory as supplied. Stage the source/config
  # files only so ignored build output, local databases, secrets and node_modules
  # are never included in the audit or its evidence graph.
  TARGET="$(mktemp -d)"
  trap 'rm -rf "$TARGET"' EXIT
  cp -a "$ROOT/src" "$ROOT/prisma" "$ROOT/tests" "$ROOT/scripts" \
    "$ROOT/package.json" "$ROOT/tsconfig.json" "$ROOT/next.config.ts" "$TARGET/"
fi

# Pin the upstream release and keep the default output reviewable.
npx --yes rea-agents@6.3.0 analyze-javascript-application \
  "$TARGET" \
  --format json \
  --filter-output normalized_result.summary,normalized_result.statistics,normalized_result.limitations
