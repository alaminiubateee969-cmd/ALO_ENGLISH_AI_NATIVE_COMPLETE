#!/usr/bin/env node
/**
 * scripts/check-schema-migrations.mjs — schema/migration parity check.
 *
 * Why this exists: CI provisions its database with `prisma db push`, which
 * builds tables straight from schema.prisma, while production (Hostinger)
 * provisions with `prisma migrate deploy`, which replays prisma/migrations.
 * The two can disagree, and when they do CI is green while the production
 * database is missing tables. That is undetectable from the application until
 * a query fails at runtime.
 *
 * This check needs no Prisma engine and no database: it reads the schema and
 * the migration SQL and compares the resulting table sets.
 *
 * Run:  node scripts/check-schema-migrations.mjs
 * Exit: 0 when every model has a migration that creates its table, 1 otherwise.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const inActions = Boolean(process.env.GITHUB_ACTIONS);

function fail(message) {
  console.log(inActions ? `::error ::${message}` : `error: ${message}`);
}

const schemaPath = join(ROOT, "prisma", "schema.prisma");
const migrationsDir = join(ROOT, "prisma", "migrations");

if (!existsSync(schemaPath)) {
  fail("prisma/schema.prisma is missing");
  process.exit(1);
}
if (!existsSync(migrationsDir)) {
  fail("prisma/migrations is missing — production runs `prisma migrate deploy` and would create an empty database");
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");

/** Model name -> table name, honouring @@map. */
const tablesForModel = new Map();
const modelRe = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
for (const match of schema.matchAll(modelRe)) {
  const [, model, body] = match;
  const mapped = /@@map\(\s*"([^"]+)"\s*\)/.exec(body);
  tablesForModel.set(model, mapped ? mapped[1] : model);
}

/** Tables created (and dropped) across the whole migration history. */
const created = new Set();
const dropped = new Set();
const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const dir of migrationDirs) {
  const sqlPath = join(migrationsDir, dir, "migration.sql");
  if (!existsSync(sqlPath)) {
    fail(`migration ${dir} has no migration.sql`);
    continue;
  }
  const sql = readFileSync(sqlPath, "utf8");
  for (const m of sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi)) created.add(m[1]);
  for (const m of sql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?(\w+)"?/gi)) dropped.add(m[1]);
  // A SQLite table rebuild ends with ALTER TABLE "new_X" RENAME TO "X".
  for (const m of sql.matchAll(/ALTER\s+TABLE\s+"?new_(\w+)"?\s+RENAME\s+TO\s+"?(\w+)"?/gi)) created.add(m[2]);
}

const netTables = new Set([...created].filter((t) => !dropped.has(t) || created.has(t)));
const missing = [...tablesForModel.entries()].filter(([, table]) => !netTables.has(table));

console.log(
  `schema models: ${tablesForModel.size} | migrations: ${migrationDirs.length} | tables created: ${created.size}`,
);

if (missing.length > 0) {
  fail(
    `${missing.length} model(s) have no CREATE TABLE in prisma/migrations — \`prisma migrate deploy\` would leave them out of the production database:\n  ` +
      missing.map(([model, table]) => `${model}${model === table ? "" : ` (table ${table})`}`).join("\n  "),
  );
  console.log(
    "\nFix: generate the missing migration against a scratch database, e.g.\n" +
      "  npx prisma migrate dev --name <descriptive_name>\n" +
      "or, to emit only the SQL:\n" +
      "  npx prisma migrate diff --from-migrations prisma/migrations \\\n" +
      "    --to-schema-datamodel prisma/schema.prisma --shadow-database-url <scratch> --script",
  );
  process.exit(1);
}

console.log(`Schema/migration parity OK: every model has a migration that creates its table.`);
