import { DatabaseSync } from "node:sqlite";

export const FACTORY_BACKUP_FORMAT = "bdtech360-control-plane-v1";
export type FactoryBackupObject = { kind: string; id: string; payload: unknown };

/** Reopen a portable control-plane image and verify its scoped definition. */
export function verifyFactoryBackupImage(location: string, applicationId: string, companyId: string) {
  const restored = new DatabaseSync(location, { readOnly: true });
  try {
    const integrity = String(Object.values(restored.prepare("PRAGMA integrity_check").get() ?? {})[0]);
    if (integrity !== "ok") throw new Error(`Backup integrity_check returned ${integrity}`);
    const row = restored.prepare("SELECT companyId, definition FROM FactoryApplication WHERE id = ?").get(applicationId) as
      | { companyId: string; definition: string }
      | undefined;
    if (!row || row.companyId !== companyId) throw new Error("Backup does not contain the requested company/application definition");
    const definition = JSON.parse(row.definition) as { format?: string; objects?: FactoryBackupObject[] };
    if (definition.format !== FACTORY_BACKUP_FORMAT || !Array.isArray(definition.objects)) throw new Error("Unsupported factory backup definition");
    const objectCount = Number((restored.prepare("SELECT COUNT(*) AS n FROM FactoryBackupObject").get() as { n: number }).n);
    if (objectCount !== definition.objects.length || objectCount < 3) throw new Error("Backup object count does not match its definition");
    return { integrity, objectCount };
  } finally {
    restored.close();
  }
}
