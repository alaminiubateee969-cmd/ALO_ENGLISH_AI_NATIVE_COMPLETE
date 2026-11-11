import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { assertNoInlineSecrets, companyDefinitionSchema } from "@/lib/factory/validation";
import { badRequest, created, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const parsed = companyDefinitionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
    const input = parsed.data;
    assertNoInlineSecrets(input);
    const template = await db.factoryTemplateVersion.findUnique({ where: { id: input.templateVersionId }, include: { moduleLinks: true } });
    if (!template) return badRequest("Select an existing template version");
    const availableModules = new Set(template.moduleLinks.map((link) => link.moduleVersionId));
    if (input.enabledModuleVersionIds.some((id) => !availableModules.has(id))) return badRequest("A selected module is not available in this template");

    const result = await db.$transaction(async (tx) => {
      const company = await tx.factoryCompany.create({ data: { slug: input.slug, legalName: input.companyName, relationship: input.relationship, industry: input.industry, contractStatus: input.relationship === "CLIENT" ? "CONTRACT_REVIEW" : "INTERNAL" } });
      const application = await tx.factoryApplication.create({
        data: {
          companyId: company.id,
          templateVersionId: input.templateVersionId,
          name: input.applicationName,
          deploymentModel: input.deploymentModel,
          domain: input.domain || null,
          configuration: JSON.stringify(input),
          branding: JSON.stringify(input.branding),
          createdBy: user.id,
          revisions: { create: { revision: 1, configuration: JSON.stringify(input), branding: JSON.stringify(input.branding), reason: "Initial company definition", createdBy: user.id } },
        },
      });
      return { company, application };
    });
    await factoryAudit({ actorUserId: user.id, action: "COMPANY_DEFINITION_CREATED", resource: result.company.id, companyId: result.company.id, applicationId: result.application.id, metadata: { deploymentModel: input.deploymentModel, revision: 1 } });
    return created(result, "Company and versioned application definition created in DRAFT");
  });
}
