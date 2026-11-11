#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# scripts/verify.sh — Pre-deployment verification gate.
#
# Runs every mandatory check. Exits 0 on full pass, 1 on any failure.
# This script is NON-DESTRUCTIVE: it only reads, never writes.
#
# Usage:   bash scripts/verify.sh [--check]
#   --check  Non-destructive mode (same as default; included for spec compliance)
#
# Exit codes:
#   0 = all checks passed
#   1 = one or more checks failed
# ═══════════════════════════════════════════════════════════════════════
set -Eeuo pipefail

# ─── Configuration ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CHECK_MODE="${1:-}"
if [[ "$CHECK_MODE" == "--help" ]]; then
  echo "Usage: bash scripts/verify.sh [--check]"
  echo "  Runs all pre-deployment verification gates."
  echo "  Exits 0 on pass, 1 on fail."
  exit 0
fi

# ─── Helpers ───────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0
FAILURES=()

check() {
  local name="$1"
  local result="$2"
  local detail="${3:-}"
  if [[ "$result" == "PASS" ]]; then
    echo "  ✓ $name"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ✗ $name"
    [[ -n "$detail" ]] && echo "    └─ $detail"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILURES+=("$name")
  fi
}

echo "══════════════════════════════════════════════════════"
echo "  ALO English Test Platform — Verification Gate"
echo "══════════════════════════════════════════════════════"
echo ""

# ─── 1. Required files ─────────────────────────────────────────────────
echo "▸ Required files"
for f in package.json bun.lock package-lock.json tsconfig.json next.config.ts postcss.config.mjs .env.example prisma/schema.prisma prisma/seed.ts server.js hostinger.json scripts/ensure-prisma-client.mjs scripts/finalize-standalone.mjs scripts/smoke-standalone.mjs src/lib/paths.ts; do
  if [[ -f "$PROJECT_ROOT/$f" ]]; then
    check "  $f exists" "PASS"
  else
    check "  $f exists" "FAIL" "missing"
  fi
done

# ─── 2. Package consistency ────────────────────────────────────────────
echo "▸ Package consistency"
if command -v bun &>/dev/null; then
  if bun pm ls &>/dev/null; then
    check "  dependencies installed" "PASS"
  else
    check "  dependencies installed" "FAIL" "run: bun install"
  fi
else
  check "  bun available" "FAIL" "bun not in PATH"
fi

# ─── 3. Environment coverage ───────────────────────────────────────────
echo "▸ Environment coverage"
if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
  ENV_COUNT=$(grep -cE '^[A-Z_]+=.' "$PROJECT_ROOT/.env.example" || true)
  if [[ "$ENV_COUNT" -ge 10 ]]; then
    check "  .env.example has $ENV_COUNT variables" "PASS"
  else
    check "  .env.example has only $ENV_COUNT variables" "FAIL"
  fi
else
  check "  .env.example exists" "FAIL"
fi

# ─── 4. Database schema ────────────────────────────────────────────────
echo "▸ Database schema"
if [[ -f "$PROJECT_ROOT/prisma/schema.prisma" ]]; then
  MODEL_COUNT=$(grep -cE '^model ' "$PROJECT_ROOT/prisma/schema.prisma" || true)
  if [[ "$MODEL_COUNT" -ge 5 ]]; then
    check "  schema has $MODEL_COUNT models" "PASS"
  else
    check "  schema has only $MODEL_COUNT models" "FAIL"
  fi
else
  check "  schema.prisma exists" "FAIL"
fi

# ─── 5. Lint ───────────────────────────────────────────────────────────
echo "▸ Lint"
if command -v bun &>/dev/null; then
  if bun run lint &>/dev/null; then
    check "  eslint passes" "PASS"
  else
    check "  eslint passes" "FAIL" "run: bun run lint"
  fi
else
  check "  eslint (bun not available)" "SKIP"
fi

# ─── 6. Typecheck ──────────────────────────────────────────────────────
echo "▸ Typecheck"
if command -v bun &>/dev/null; then
  if bun run typecheck &>/dev/null 2>&1; then
    check "  tsc passes" "PASS"
  else
    check "  tsc passes" "FAIL" "run: bun run typecheck"
  fi
else
  check "  tsc (bun not available)" "SKIP"
fi

# ─── 7. Production build ───────────────────────────────────────────────
echo "▸ Production build"
if [[ -f "$PROJECT_ROOT/.next/standalone/server.js" ]]; then
  check "  standalone server.js exists" "PASS"
else
  check "  standalone server.js exists" "FAIL" "run: bun run build"
fi
if [[ -d "$PROJECT_ROOT/.next/static" ]]; then
  check "  static assets exist" "PASS"
else
  check "  static assets exist" "FAIL"
fi
# `next build` does NOT copy these into .next/standalone; scripts/finalize-standalone.mjs
# does. A build that skipped that step publishes an unstyled, asset-less site
# while still reporting success, so assert the artifact rather than the build.
if [[ -d "$PROJECT_ROOT/.next/standalone/.next/static" ]]; then
  check "  standalone has client bundles" "PASS"
else
  check "  standalone has client bundles" "FAIL" "run: npm run build"
fi
if [[ -d "$PROJECT_ROOT/.next/standalone/public" ]]; then
  check "  standalone has public assets" "PASS"
else
  check "  standalone has public assets" "FAIL" "run: npm run build"
fi
if [[ -f "$PROJECT_ROOT/.next/standalone/prisma/schema.prisma" ]]; then
  check "  standalone has prisma schema" "PASS"
else
  check "  standalone has prisma schema" "FAIL" "run: npm run build"
fi

# ─── 8. Helper script syntax ───────────────────────────────────────────
echo "▸ Helper script syntax"
for s in install.sh update.sh rollback.sh backup.sh restore.sh healthcheck.sh verify.sh; do
  if [[ -f "$PROJECT_ROOT/scripts/$s" ]]; then
    if bash -n "$PROJECT_ROOT/scripts/$s" 2>/dev/null; then
      check "  $s syntax" "PASS"
    else
      check "  $s syntax" "FAIL"
    fi
  else
    check "  $s exists" "FAIL"
  fi
done

# ─── 9. Server config ──────────────────────────────────────────────────
echo "▸ Server configuration"
for f in server-config/alo-english.service server-config/Caddyfile.production server-config/sudo-policy; do
  if [[ -f "$PROJECT_ROOT/$f" ]]; then
    check "  $f exists" "PASS"
  else
    check "  $f exists" "FAIL"
  fi
done

# ─── 10. Repository preflight ──────────────────────────────────────────
# These two need no bun, no Prisma engine and no database, so they run even
# when the rest of this gate is skipped.
echo "▸ Repository preflight"
if node "$PROJECT_ROOT/scripts/check-manifest.mjs" &>/dev/null; then
  check "  manifest preflight" "PASS"
else
  check "  manifest preflight" "FAIL" "run: node scripts/check-manifest.mjs"
fi
if node "$PROJECT_ROOT/scripts/check-schema-migrations.mjs" &>/dev/null; then
  check "  schema/migration parity" "PASS"
else
  check "  schema/migration parity" "FAIL" "run: node scripts/check-schema-migrations.mjs"
fi

# ─── 11. Unit smoke test ───────────────────────────────────────────────
echo "▸ Smoke test"
if command -v bun &>/dev/null; then
  if bun test "$PROJECT_ROOT/tests/smoke.test.ts" &>/dev/null 2>&1; then
    check "  smoke test passes" "PASS"
  else
    check "  smoke test passes" "FAIL" "run: bun test tests/smoke.test.ts"
  fi
else
  check "  smoke test (bun not available)" "SKIP"
fi

# ─── 12. Artifact smoke test ───────────────────────────────────────────
# Boots the built server and asserts it serves a styled page and a health
# document. Only meaningful once a build exists; skipped otherwise.
echo "▸ Artifact smoke test"
if [[ -f "$PROJECT_ROOT/.next/standalone/server.js" ]]; then
  if node "$PROJECT_ROOT/scripts/smoke-standalone.mjs" &>/dev/null; then
    check "  built artifact serves traffic" "PASS"
  else
    check "  built artifact serves traffic" "FAIL" "run: node scripts/smoke-standalone.mjs"
  fi
else
  check "  built artifact serves traffic (no build present)" "SKIP"
fi

# ─── Summary ───────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "  Passed: $PASS_COUNT / $TOTAL"
echo "  Failed: $FAIL_COUNT / $TOTAL"
if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo "  Failures: ${FAILURES[*]}"
fi
echo "══════════════════════════════════════════════════════"

if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo "  RESULT: PASS — all checks passed"
  exit 0
else
  echo "  RESULT: FAIL — $FAIL_COUNT check(s) failed"
  exit 1
fi
