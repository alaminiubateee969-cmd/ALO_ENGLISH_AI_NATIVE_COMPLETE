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
      "or run: bash scripts/generate-missing-migration.sh",
  );
  process.exit(1);
}

// Column-level parity. A table can exist and still be missing a column, which
// is enough to break a query at runtime, so check the columns too.
const SCALARS = new Set([
  "String", "Boolean", "Int", "BigInt", "Float", "Decimal", "DateTime", "Json", "Bytes",
]);

/** table name -> Set of column names declared in its CREATE TABLE. */
const columnsByTable = new Map();

/** SQLite rebuilds a table as new_X, then renames it over the original. */
const RENAME_RE = /ALTER\s+TABLE\s+"?new_(\w+)"?\s+RENAME\s+TO\s+"?(\w+)"?/gi;
const ADD_COL_RE = /ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+COLUMN\s+"?(\w+)"?/gi;
const CREATE_RE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?\s*\(([\s\S]*?)\n\);/gi;

for (const dir of migrationDirs) {
  const sqlPath = join(migrationsDir, dir, "migration.sql");
  if (!existsSync(sqlPath)) continue;
  const sql = readFileSync(sqlPath, "utf8");

  // Statements are applied in file order, so a rebuild's rename must land
  // after the CREATE TABLE that defined new_X.
  const events = [];
  for (const m of sql.matchAll(CREATE_RE)) events.push({ at: m.index, kind: "create", table: m[1], body: m[2] });
  for (const m of sql.matchAll(ADD_COL_RE)) events.push({ at: m.index, kind: "add", table: m[1], column: m[2] });
  for (const m of sql.matchAll(RENAME_RE)) events.push({ at: m.index, kind: "rename", from: m[1], to: m[2] });
  events.sort((a, b) => a.at - b.at);

  for (const event of events) {
    if (event.kind === "create") {
      const cols = new Set();
      for (const line of event.body.split("\n")) {
        const m = /^\s*"(\w+)"\s+[A-Z]/.exec(line);
        if (m) cols.add(m[1]);
      }
      columnsByTable.set(event.table, cols);
    } else if (event.kind === "add") {
      const cols = columnsByTable.get(event.table) ?? new Set();
      cols.add(event.column);
      columnsByTable.set(event.table, cols);
    } else {
      // new_X fully replaces X: the rebuilt table is the surviving definition.
      const cols = columnsByTable.get(`new_${event.from}`);
      if (cols) columnsByTable.set(event.to, cols);
    }
  }
}

const missingColumns = [];
for (const match of schema.matchAll(modelRe)) {
  const [, model, body] = match;
  const table = tablesForModel.get(model);
  const columns = columnsByTable.get(table);
  if (!columns) continue;
  for (const line of body.split("\n")) {
    const field = /^\s*(\w+)\s+([A-Z]\w*)(\[\])?(\?)?\s/.exec(`${line} `);
    if (!field) continue;
    const [, name, type, isList] = field;
    // Lists and model-typed fields are relations, not columns of this table.
    if (isList || !SCALARS.has(type)) continue;
    if (!columns.has(name)) missingColumns.push(`${model}.${name} (table ${table})`);
  }
}

if (missingColumns.length > 0) {
  fail(
    `${missingColumns.length} schema column(s) are absent from the migrated tables:\n  ` +
      missingColumns.join("\n  "),
  );
  process.exit(1);
}

console.log(
  `Schema/migration parity OK: every model has a table and every scalar column is present ` +
    `(${columnsByTable.size} tables inspected).`,
);

// ─── Question-type vocabulary parity ───────────────────────────────────────
//
// The grader, the CI content gate and the bank auditor all read
// src/lib/exam/question-types.json. The schema comment documents the same
// vocabulary. If the two drift, the bank auditor reports a bank the platform
// grades correctly as invalid — which is exactly the disagreement this check
// was added to prevent.

const vocabularyPath = join(ROOT, "src", "lib", "exam", "question-types.json");
if (!existsSync(vocabularyPath)) {
  fail("src/lib/exam/question-types.json is missing — the grader and the content validators cannot agree on question types");
  process.exit(1);
}

const vocabulary = JSON.parse(readFileSync(vocabularyPath, "utf8"));
const vocabularyTypes = [
  ...vocabulary.indexTypes,
  ...vocabulary.textTypes,
  ...vocabulary.setTypes,
  ...vocabulary.subjectiveTypes,
];
const vocabularySet = new Set(vocabularyTypes);

if (vocabularySet.size !== vocabularyTypes.length) {
  fail("src/lib/exam/question-types.json contains duplicate type names");
  process.exit(1);
}

const questionModel = /^model\s+Question\s*\{([\s\S]*?)^}/m.exec(schema);
const typeComment = questionModel
  ? (/^\s*type\s+String\s+\/\/\s*(.*)$/m.exec(questionModel[1]) || [])[1]
  : null;
const documentedTypes = typeComment
  ? typeComment.split("|").map((t) => t.trim()).filter(Boolean)
  : [];

const undocumented = vocabularyTypes.filter((t) => !documentedTypes.includes(t));
const unknown = documentedTypes.filter((t) => !vocabularySet.has(t));

if (undocumented.length > 0 || unknown.length > 0) {
  fail(
    "the Question.type vocabulary in prisma/schema.prisma does not match src/lib/exam/question-types.json:\n" +
      (undocumented.length > 0 ? `  missing from the schema comment: ${undocumented.join(", ")}\n` : "") +
      (unknown.length > 0 ? `  not in the vocabulary file: ${unknown.join(", ")}\n` : ""),
  );
  process.exit(1);
}

console.log(
  `Question-type vocabulary OK: ${vocabularyTypes.length} types documented in the schema and shared by the grader and both validators.`,
);
