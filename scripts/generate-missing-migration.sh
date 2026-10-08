#!/usr/bin/env bash
#
# scripts/generate-missing-migration.sh
#
# Generate the migration for schema models that prisma/migrations does not yet
# create, then prove the result with the parity check.
#
# WHY THIS EXISTS
#   CI provisions its database with `prisma db push` (built from the schema);
#   production on Hostinger provisions with `prisma migrate deploy` (replays
#   prisma/migrations). Replaying the current history in SQLite produces 27
#   tables against 44 schema models, so a fresh production database would have
#   no Question, Role, Permission or FreeQuota table.
#
#   `scripts/check-schema-migrations.mjs` reports that gap and CI fails on it.
#   Closing the gap needs the Prisma engine binary, which is downloaded from
#   binaries.prisma.sh — run this on a host with outbound internet.
#
# SAFETY
#   - Never run against a production DATABASE_URL. It uses a throwaway SQLite
#     file as the shadow database and writes only a migration directory.
#   - It does not apply anything, does not reset, and does not deploy.
#   - Review the generated SQL, commit it, then let the normal deploy run
#     `prisma migrate deploy`.
#
# Usage:  bash scripts/generate-missing-migration.sh [migration_name]

set -euo pipefail

cd "$(dirname "$0")/.."

NAME="${1:-exam_platform_schema}"
STAMP="$(date -u +%Y%m%d%H%M%S)"
DIR="prisma/migrations/${STAMP}_${NAME}"
SHADOW="prisma/.shadow-generate.db"

echo "==> Checking whether a migration is actually needed"
if node scripts/check-schema-migrations.mjs; then
  echo "Schema and migrations already agree — nothing to generate."
  exit 0
fi

echo
echo "==> Generating migration into ${DIR}"
mkdir -p "$DIR"
rm -f "$SHADOW"

# migrate diff emits exactly the SQL that reconciles the migration history with
# the schema. --script writes SQL only; nothing is applied.
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "file:./$(basename "$SHADOW")" \
  --script > "$DIR/migration.sql"

rm -f "$SHADOW"

LINES="$(wc -l < "$DIR/migration.sql")"
if [ "$LINES" -lt 1 ]; then
  echo "ERROR: generated migration is empty — removing it." >&2
  rmdir "$DIR" 2>/dev/null || rm -rf "$DIR"
  exit 1
fi

echo "    wrote ${LINES} lines of SQL"
echo
echo "==> Verifying parity"
node scripts/check-schema-migrations.mjs

echo
echo "Done. Review the SQL, then:"
echo "  git add ${DIR}"
echo "  git commit -m 'Add migration for missing exam-platform tables'"
echo
echo "If the production database was originally created with \`prisma db push\`,"
echo "it has no _prisma_migrations history and \`migrate deploy\` will try to"
echo "recreate existing tables. Baseline it first (verify the schema matches"
echo "before doing this):"
echo "  npx prisma migrate resolve --applied <each existing migration name>"
