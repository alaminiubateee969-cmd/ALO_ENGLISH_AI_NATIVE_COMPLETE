import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { changeRequestSchema } from "@/lib/factory/validation";
import { badRequest, created, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const parsed = changeRequestSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const change = await db.factoryChangeRequest.create({ data: { ...parsed.data, templateId: parsed.data.templateId || null, requestedBy: user.id } });
    await factoryAudit({ actorUserId: user.id, action: "ENGINEERING_CHANGE_REQUESTED", resource: change.id, metadata: { kind: change.kind, disposition: change.disposition } });
    return created({ change }, "Engineering change recorded for review");
  });
}
