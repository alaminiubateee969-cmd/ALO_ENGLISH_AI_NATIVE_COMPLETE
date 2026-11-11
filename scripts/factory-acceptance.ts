/**
 * Disposable-database acceptance drill for the BDTECH360 factory.
 * Never run against a development or production database.
 *
 * DATABASE_URL=file:/tmp/bdtech360-factory-acceptance.db \
 * APP_DATA_DIR=/tmp/bdtech360-factory-acceptance-data \
 * FACTORY_ACCEPTANCE=1 bun scripts/factory-acceptance.ts
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databaseUrl = process.env.DATABASE_URL ?? "";
const databasePath = databaseUrl.startsWith("file:") ? databaseUrl.slice(5).split("?")[0] : "";
if (
  process.env.FACTORY_ACCEPTANCE !== "1" ||
  !databasePath.startsWith("/tmp/") ||
  !databasePath.includes("factory-acceptance") ||
  !process.env.APP_DATA_DIR?.startsWith("/tmp/")
) {
  throw new Error("Refusing acceptance drill: use FACTORY_ACCEPTANCE=1, a /tmp/*factory-acceptance*.db DATABASE_URL and /tmp APP_DATA_DIR");
}

const [{ db }, lifecycle, { createFactoryBackup }] = await Promise.all([
  import("../src/lib/db"),
  import("../src/lib/factory/lifecycle"),
  import("../src/lib/factory/backup"),
]);

const suffix = `${Date.now()}`;
const results: Array<{ id: string; status: "PASS" | "FAIL"; evidence: string }> = [];
async function check(id: string, run: () => Promise<string>) {
  try {
    results.push({ id, status: "PASS", evidence: await run() });
  } catch (error) {
    results.push({ id, status: "FAIL", evidence: error instanceof Error ? error.stack ?? error.message : String(error) });
  }
}

const operator = await db.user.create({
  data: { email: `factory-acceptance-${suffix}@example.test`, passwordHash: "disposable-only", name: "Disposable Factory Operator", role: "ADMIN", status: "ACTIVE" },
});
const template = await db.factoryTemplate.create({
  data: { slug: `acceptance-${suffix}`, name: "Acceptance Operations", category: "Operations", description: "Disposable acceptance template", status: "ACTIVE", createdBy: operator.id },
});
const moduleDefinition = await db.factoryModule.create({
  data: { slug: `contacts-${suffix}`, name: "Company Contacts", category: "CRM", description: "Company-scoped contact records", createdAt: new Date() },
});
const moduleVersion = await db.factoryModuleVersion.create({
  data: { moduleId: moduleDefinition.id, version: "1.0.0", status: "APPROVED", capabilities: JSON.stringify(["company-scoped-contacts"]), dependencies: "[]", compatibility: "factory-v1", acceptanceTests: JSON.stringify(["No cross-company rows"]), releaseNotes: "Disposable acceptance version" },
});
async function templateVersion(version: string) {
  return db.factoryTemplateVersion.create({
    data: {
      templateId: template.id,
      version,
      status: "APPROVED",
      configurationSchema: "{}",
      navigation: "[]",
      workflows: "[]",
      acceptanceTests: JSON.stringify(["Scoped contacts", "Known-good rollback"]),
      releaseNotes: `Disposable ${version}`,
      approvedBy: operator.id,
      approvedAt: new Date(),
      moduleLinks: { create: { moduleVersionId: moduleVersion.id, required: true } },
    },
  });
}
const v1 = await templateVersion("1.0.0");
const v2 = await templateVersion("2.0.0");

async function company(slug: string, deploymentModel: "SHARED_TENANT" | "DEDICATED") {
  const record = await db.factoryCompany.create({
    data: { slug: `${slug}-${suffix}`, legalName: `${slug} Acceptance Ltd`, relationship: "CLIENT", industry: "Testing", contractStatus: "CONTRACT_REVIEW" },
  });
  const configuration = {
    companyName: record.legalName,
    slug: record.slug,
    relationship: "CLIENT",
    industry: "Testing",
    applicationName: `${slug} Application`,
    templateVersionId: v1.id,
    deploymentModel,
    domain: deploymentModel === "DEDICATED" ? `${slug}-${suffix}.example.test` : "",
    enabledModuleVersionIds: [moduleVersion.id],
    departments: ["Operations"],
    integrations: [],
    retentionDays: 365,
    backupRetentionDays: 90,
    initialAdminUserId: operator.id,
    branding: { primaryColor: "#123B5D", accentColor: "#19A974", logoUrl: "", navigation: ["Contacts"] },
  };
  const application = await db.factoryApplication.create({
    data: {
      companyId: record.id,
      templateVersionId: v1.id,
      name: configuration.applicationName,
      deploymentModel,
      domain: configuration.domain || null,
      configuration: JSON.stringify(configuration),
      branding: JSON.stringify(configuration.branding),
      createdBy: operator.id,
      revisions: { create: { revision: 1, configuration: JSON.stringify(configuration), branding: JSON.stringify(configuration.branding), reason: "Acceptance initial definition", createdBy: operator.id } },
    },
  });
  return { record, application, configuration };
}
const shared = await company("shared", "SHARED_TENANT");
const other = await company("other", "SHARED_TENANT");
const dedicated = await company("dedicated", "DEDICATED");

await check("A — additive schema", async () => {
  const migration = await db.$queryRawUnsafe("SELECT migration_name FROM _prisma_migrations WHERE migration_name = '20261103223000_bdtech360_software_factory' AND finished_at IS NOT NULL") as Array<{ migration_name: string }>;
  assert.equal(migration.length, 1);
  return "Additive factory migration is recorded as successfully finished in the disposable database";
});
await check("B — versioned reusable assets", async () => {
  const versions = await db.factoryTemplateVersion.findMany({ where: { templateId: template.id }, include: { moduleLinks: true } });
  assert.deepEqual(versions.map((item) => item.version).sort(), ["1.0.0", "2.0.0"]);
  assert.ok(versions.every((item) => item.status === "APPROVED" && item.moduleLinks.length === 1));
  return "Two independent approved template versions link the same real module version";
});
await check("C — reusable company definitions", async () => {
  const revisions = await db.factoryConfigRevision.findMany({ where: { applicationId: shared.application.id } });
  assert.equal(revisions.length, 1);
  assert.deepEqual(JSON.parse(revisions[0].configuration).enabledModuleVersionIds, [moduleVersion.id]);
  return "Company, application, branding, selected modules and immutable configuration revision persist";
});
await check("D — provisioning and fail-closed dedicated model", async () => {
  const validation = await lifecycle.validateApplication(shared.application.id, operator.id);
  assert.equal(validation.passed, true);
  const provisioned = await lifecycle.provisionApplication(shared.application.id, operator.id);
  assert.equal(provisioned.status, "STAGING");
  assert.ok(provisioned.checks.every((item) => item.status === "PASS"));
  await lifecycle.validateApplication(dedicated.application.id, operator.id);
  const blocked = await lifecycle.provisionApplication(dedicated.application.id, operator.id);
  assert.equal(blocked.status, "BLOCKED");
  const unchanged = await db.factoryApplication.findUniqueOrThrow({ where: { id: dedicated.application.id } });
  assert.equal(unchanged.status, "VALIDATED");
  assert.equal(unchanged.currentReleaseId, null);
  return "Shared metadata reaches STAGING through real readback checks; dedicated remains VALIDATED with BLOCKED run and no release";
});
await check("E — tenant isolation", async () => {
  await db.factoryContact.create({ data: { companyId: shared.record.id, name: "Shared Only", createdBy: operator.id } });
  await db.factoryContact.create({ data: { companyId: other.record.id, name: "Other Only", createdBy: operator.id } });
  const scoped = await db.factoryContact.findMany({ where: { companyId: shared.record.id } });
  assert.deepEqual(scoped.map((item) => item.name), ["Shared Only"]);
  const outsiderMembership = await db.factoryMembership.findFirst({ where: { companyId: other.record.id, userId: operator.id, status: "ACTIVE" } });
  assert.equal(outsiderMembership, null);
  return "Company-scoped query returns one company's contact only; no membership exists for the other company";
});
await check("F — activation, impact and known-good rollback", async () => {
  await lifecycle.activateApplication(shared.application.id, operator.id, "Acceptance activation approved");
  const upgrade = await db.factoryRelease.create({
    data: { applicationId: shared.application.id, templateVersionId: v2.id, version: "2.0.0", status: "STAGING", releaseNotes: "Acceptance v2", impactAssessment: "Disposable upgrade changes only the selected template version.", rollbackPlan: "Reactivate superseded 1.0.0 after recording this drill approval.", createdBy: operator.id },
  });
  await db.factoryApplication.update({ where: { id: shared.application.id }, data: { templateVersionId: v2.id, status: "STAGING" } });
  await db.factoryDeployment.update({ where: { applicationId_environment: { applicationId: shared.application.id, environment: "STAGING" } }, data: { status: "READY" } });
  await lifecycle.activateApplication(shared.application.id, operator.id, "Acceptance upgrade approved");
  const rolledBack = await lifecycle.rollbackApplication(shared.application.id, operator.id, "Acceptance rollback approved");
  assert.equal(rolledBack.target.version, "1.0.0");
  assert.equal(upgrade.impactAssessment.length > 10, true);
  const approvals = await db.factoryApproval.count({ where: { applicationId: shared.application.id, status: "APPROVED" } });
  assert.equal(approvals, 3);
  return "v1 activation, v2 activation and v1 known-good rollback persist three human approval records and impact/rollback plans";
});
await check("G — verified scoped backup and readback", async () => {
  const backup = await createFactoryBackup(shared.application.id, operator.id);
  assert.equal(backup.status, "VERIFIED");
  const image = new DatabaseSync(backup.location, { readOnly: true });
  try {
    assert.equal(image.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok");
    assert.equal(image.prepare("SELECT COUNT(*) AS n FROM FactoryApplication WHERE id = ?").get(shared.application.id)!.n, 1);
    const tables = image.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('FactoryContact','User','Attempt','Question')").all();
    assert.equal(tables.length, 0);
  } finally {
    image.close();
  }
  return `Fresh SQLite image ${backup.sha256} passes integrity/readback and contains no customer/ALO tables`;
});
await check("H — audit evidence", async () => {
  const actions = await db.factoryAuditEvent.findMany({ where: { applicationId: shared.application.id }, select: { action: true } });
  for (const action of ["APPLICATION_VALIDATED", "APPLICATION_PROVISIONED", "APPLICATION_ACTIVATED", "APPLICATION_ROLLED_BACK", "FACTORY_BACKUP_VERIFIED"]) {
    assert.ok(actions.some((entry) => entry.action === action), `Missing ${action}`);
  }
  return `${actions.length} persisted application audit events include validation, provisioning, activation, rollback and backup`;
});

const report = {
  generatedAt: new Date().toISOString(),
  scope: "Disposable database only; not production evidence",
  databasePath: resolve(databasePath),
  results,
  passed: results.every((result) => result.status === "PASS"),
};
if (process.env.FACTORY_ACCEPTANCE_OUTPUT) writeFileSync(process.env.FACTORY_ACCEPTANCE_OUTPUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await db.$disconnect();
if (!report.passed) process.exitCode = 1;
