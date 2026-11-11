import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { templateSchema } from "@/lib/factory/validation";
import { badRequest, created, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const parsed = templateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const input = parsed.data;
    const modules = await db.factoryModuleVersion.findMany({ where: { id: { in: input.moduleVersionIds }, status: "APPROVED" } });
    if (modules.length !== new Set(input.moduleVersionIds).size) return badRequest("Every linked module version must exist and be approved");
    const template = await db.$transaction(async (tx) => {
      const createdTemplate = await tx.factoryTemplate.create({ data: { slug: input.slug, name: input.name, category: input.category, description: input.description, status: input.approve ? "ACTIVE" : "DRAFT", createdBy: user.id } });
      await tx.factoryTemplateVersion.create({
        data: {
          templateId: createdTemplate.id,
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
      return createdTemplate;
    });
    await factoryAudit({ actorUserId: user.id, action: "TEMPLATE_VERSION_CREATED", resource: template.id, metadata: { version: input.version, approved: input.approve } });
    return created({ template }, "Private template version created");
  });
}
