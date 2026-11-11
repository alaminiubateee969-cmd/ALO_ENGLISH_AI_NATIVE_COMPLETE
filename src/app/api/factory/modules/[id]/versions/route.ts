import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { moduleSchema } from "@/lib/factory/validation";
import { badRequest, created, notFound, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    if (!await db.factoryModule.findUnique({ where: { id } })) return notFound("Module not found");
    const parsed = moduleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const input = parsed.data;
    const version = await db.factoryModuleVersion.create({ data: { moduleId: id, version: input.version, capabilities: JSON.stringify(input.capabilities), dependencies: JSON.stringify(input.dependencies), compatibility: input.compatibility, acceptanceTests: JSON.stringify(input.acceptanceTests), releaseNotes: input.releaseNotes } });
    const impacted = await db.factoryApplication.findMany({ where: { templateVersion: { moduleLinks: { some: { moduleVersion: { moduleId: id } } } } }, select: { id: true, name: true, status: true, company: { select: { legalName: true } } } });
    await factoryAudit({ actorUserId: user.id, action: "MODULE_VERSION_CREATED", resource: id, metadata: { version: input.version, impactedApplicationIds: impacted.map((app) => app.id) } });
    return created({ version, impact: impacted }, "Module version created; dependent applications identified without automatic upgrade");
  });
}
