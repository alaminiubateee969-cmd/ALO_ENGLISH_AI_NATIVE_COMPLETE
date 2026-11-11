import { createHash } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { db } from "@/lib/db";
import { getBackupDir } from "@/lib/paths";
import { factoryAudit } from "./audit";
import { FACTORY_BACKUP_FORMAT, verifyFactoryBackupImage, type FactoryBackupObject } from "./backup-image";

export { FACTORY_BACKUP_FORMAT, verifyFactoryBackupImage } from "./backup-image";

function insertObject(database: DatabaseSync, object: FactoryBackupObject) {
  database.prepare("INSERT INTO FactoryBackupObject (kind, id, payload) VALUES (?, ?, ?)").run(
    object.kind,
    object.id,
    JSON.stringify(object.payload),
  );
}

/**
 * Export only factory control-plane metadata for one application. This is
 * deliberately NOT a whole-database VACUUM: an operator must not gain ALO or
 * tenant business records through a backup path. Customer-data backup remains
 * a separate, explicitly authorized recovery procedure.
 */
export async function createFactoryBackup(applicationId: string, actorUserId: string) {
  const application = await db.factoryApplication.findUnique({
    where: { id: applicationId },
    include: {
      company: true,
      templateVersion: { include: { moduleLinks: true } },
      revisions: { orderBy: { revision: "asc" } },
      releases: { orderBy: { createdAt: "asc" } },
      deployments: { orderBy: { environment: "asc" } },
      approvals: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!application) throw new Error("Application not found");

  const root = join(getBackupDir(), "factory", application.company.slug, application.id);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const location = join(root, `${stamp}.db`);
  const definitionPath = join(root, `${stamp}.definition.json`);
  const { company, templateVersion, revisions, releases, deployments, approvals, ...applicationRecord } = application;
  const objects: FactoryBackupObject[] = [
    { kind: "company", id: company.id, payload: company },
    { kind: "application", id: application.id, payload: applicationRecord },
    { kind: "templateVersion", id: templateVersion.id, payload: templateVersion },
    ...revisions.map((payload) => ({ kind: "configurationRevision", id: payload.id, payload })),
    ...releases.map((payload) => ({ kind: "release", id: payload.id, payload })),
    ...deployments.map((payload) => ({ kind: "deployment", id: payload.id, payload })),
    ...approvals.map((payload) => ({ kind: "approval", id: payload.id, payload })),
  ];
  const definition = {
    format: FACTORY_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    scope: "Factory control plane only; no ALO or tenant business records",
    applicationId,
    companyId: company.id,
    objects,
    restoration: "Import only after an isolated schema/version review. Never overwrite a live database from the UI.",
  };

  const image = new DatabaseSync(location);
  try {
    image.exec("PRAGMA journal_mode = DELETE; PRAGMA foreign_keys = ON;");
    image.exec(`
      CREATE TABLE FactoryBackupObject (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (kind, id)
      );
      CREATE TABLE FactoryApplication (
        id TEXT PRIMARY KEY,
        companyId TEXT NOT NULL,
        definition TEXT NOT NULL
      );
    `);
    image.exec("BEGIN IMMEDIATE");
    for (const object of objects) insertObject(image, object);
    image.prepare("INSERT INTO FactoryApplication (id, companyId, definition) VALUES (?, ?, ?)").run(
      application.id,
      company.id,
      JSON.stringify(definition),
    );
    image.exec("COMMIT");
  } catch (error) {
    try { image.exec("ROLLBACK"); } catch { /* no open transaction */ }
    throw error;
  } finally {
    image.close();
  }
  chmodSync(location, 0o600);
  writeFileSync(definitionPath, JSON.stringify(definition, null, 2), { mode: 0o600, flag: "wx" });

  const verification = verifyFactoryBackupImage(location, applicationId, company.id);
  const sha256 = createHash("sha256").update(readFileSync(location)).digest("hex");
  const backup = await db.factoryBackup.create({
    data: {
      applicationId,
      location,
      sha256,
      byteSize: statSync(location).size,
      integrity: verification.integrity,
      definitionPath,
      status: "VERIFIED",
      createdBy: actorUserId,
    },
  });
  await factoryAudit({
    actorUserId,
    action: "FACTORY_BACKUP_VERIFIED",
    resource: backup.id,
    companyId: application.companyId,
    applicationId,
    metadata: { sha256, byteSize: backup.byteSize, integrity: verification.integrity, objectCount: verification.objectCount, scope: definition.scope },
  });
  return backup;
}
