import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { badRequest, created, notFound, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null) as { templateVersionId?: unknown; impactAssessment?: unknown; rollbackPlan?: unknown } | null;
    if (!body || typeof body.templateVersionId !== "string") return badRequest("templateVersionId is required");
    if (typeof body.impactAssessment !== "string" || body.impactAssessment.trim().length < 10 || body.impactAssessment.length > 10000) return badRequest("A specific impactAssessment (10–10000 characters) is required");
    if (typeof body.rollbackPlan !== "string" || body.rollbackPlan.trim().length < 10 || body.rollbackPlan.length > 10000) return badRequest("A specific rollbackPlan (10–10000 characters) is required");
    const application = await db.factoryApplication.findUnique({ where: { id }, include: { releases: true } });
    if (!application) return notFound("Application not found");
    if (application.deploymentModel !== "SHARED_TENANT") return badRequest("Dedicated release staging requires a verified infrastructure adapter");
    if (!["LIVE", "DEGRADED", "ROLLED_BACK"].includes(application.status)) return badRequest("An existing provisioned application is required");
    if (application.releases.some((release) => release.status === "STAGING")) return badRequest("A staging release already exists");
    const template = await db.factoryTemplateVersion.findUnique({ where: { id: body.templateVersionId }, include: { moduleLinks: { include: { moduleVersion: true } } } });
    if (!template || template.status !== "APPROVED") return badRequest("The target template version must be approved");
    if (template.moduleLinks.some((link) => link.moduleVersion.status !== "APPROVED")) return badRequest("The target contains an unapproved module");
    const result = await db.$transaction(async (tx) => {
      const release = await tx.factoryRelease.create({ data: { applicationId: id, templateVersionId: template.id, version: template.version, status: "STAGING", releaseNotes: template.releaseNotes, impactAssessment: String(body.impactAssessment).trim(), rollbackPlan: String(body.rollbackPlan).trim(), createdBy: user.id } });
      await tx.factoryApplication.update({ where: { id }, data: { templateVersionId: template.id, status: "STAGING" } });
      await tx.factoryDeployment.upsert({ where: { applicationId_environment: { applicationId: id, environment: "STAGING" } }, create: { applicationId: id, environment: "STAGING", status: "READY", adapter: "INTERNAL_SHARED", details: "Approved dependencies loaded into staging; production remains represented by its own release record." }, update: { status: "READY", adapter: "INTERNAL_SHARED", details: "Approved dependencies loaded into staging; production remains represented by its own release record." } });
      return release;
    });
    await factoryAudit({ actorUserId: user.id, action: "STAGING_RELEASE_CREATED", resource: id, companyId: application.companyId, applicationId: id, metadata: { releaseId: result.id, templateVersionId: template.id } });
    return created({ release: result }, "Approved release staged without overwriting the active release");
  });
}
