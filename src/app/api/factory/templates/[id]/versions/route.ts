import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { templateSchema } from "@/lib/factory/validation";
import { badRequest, created, notFound, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const template = await db.factoryTemplate.findUnique({ where: { id } });
    if (!template) return notFound("Template not found");
    const parsed = templateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const input = parsed.data;
    const modules = await db.factoryModuleVersion.findMany({ where: { id: { in: input.moduleVersionIds }, status: "APPROVED" } });
    if (modules.length !== new Set(input.moduleVersionIds).size) return badRequest("Every linked module version must exist and be approved");
    const version = await db.factoryTemplateVersion.create({
      data: {
        templateId: id,
        version: input.version,
        status: input.approve ? "APPROVED" : "DRAFT",
        configurationSchema: JSON.stringify(input.configurationSchema),
        navigation: JSON.stringify(input.navigation),
        workflows: JSON.stringify(input.workflows),
        acceptanceTests: JSON.stringify(input.acceptanceTests),
        releaseNotes: input.releaseNotes,
        approvedBy: input.approve ? user.id : null,
        approvedAt: input.approve ? new Date() : null,
        moduleLinks: { create: input.moduleVersionIds.map((moduleVersionId) => ({ moduleVersionId, required: true })) },
      },
    });
    if (input.approve) await db.factoryTemplate.update({ where: { id }, data: { status: "ACTIVE" } });
    await factoryAudit({ actorUserId: user.id, action: "TEMPLATE_VERSION_CREATED", resource: id, metadata: { version: input.version, approved: input.approve } });
    return created({ version }, "Template version created");
  });
}
