import { db } from "@/lib/db";

export async function factoryAudit(input: {
  actorUserId: string;
  action: string;
  resource: string;
  companyId?: string | null;
  applicationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.factoryAuditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resource: input.resource,
      companyId: input.companyId ?? null,
      applicationId: input.applicationId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
