import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { assertNoInlineSecrets, configRevisionSchema } from "@/lib/factory/validation";
import { badRequest, notFound, ok, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    await requireFactoryOperator();
    const { id } = await ctx.params;
    const application = await db.factoryApplication.findUnique({ where: { id }, include: { company: true, templateVersion: { include: { moduleLinks: true } }, revisions: { orderBy: { revision: "desc" } }, deployments: true, releases: true, provisioningRuns: true } });
    if (!application) return notFound("Application not found");
    return ok({ application });
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const parsed = configRevisionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    assertNoInlineSecrets(parsed.data.configuration);
    const application = await db.factoryApplication.findUnique({ where: { id }, include: { revisions: { orderBy: { revision: "desc" }, take: 1 } } });
    if (!application) return notFound("Application not found");
    if (!["DRAFT", "VALIDATED", "TEST_FAILED"].includes(application.status)) return badRequest("Create a reviewed staging change rather than editing a live application");
    const revision = (application.revisions[0]?.revision ?? 0) + 1;
    const updated = await db.$transaction(async (tx) => {
      await tx.factoryConfigRevision.create({ data: { applicationId: id, revision, configuration: JSON.stringify(parsed.data.configuration), branding: JSON.stringify(parsed.data.branding), reason: parsed.data.reason, createdBy: user.id } });
      return tx.factoryApplication.update({ where: { id }, data: { configuration: JSON.stringify(parsed.data.configuration), branding: JSON.stringify(parsed.data.branding), status: "DRAFT" } });
    });
    await factoryAudit({ actorUserId: user.id, action: "CONFIGURATION_REVISION_CREATED", resource: id, companyId: application.companyId, applicationId: id, metadata: { revision, reason: parsed.data.reason } });
    return ok({ application: updated, revision }, "Independent company configuration revision created");
  });
}
