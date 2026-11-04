import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { integrationReport } from "@/lib/integrations/registry";
import { ok, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    await requireFactoryOperator();
    const [companies, templates, modules, applications, runs, deployments, releases, approvals, backups, changes, auditEvents] = await Promise.all([
      db.factoryCompany.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { applications: true, memberships: true } } } }),
      db.factoryTemplate.findMany({ orderBy: { createdAt: "desc" }, include: { versions: { orderBy: { createdAt: "desc" }, include: { moduleLinks: true } } } }),
      db.factoryModule.findMany({ orderBy: { name: "asc" }, include: { versions: { orderBy: { createdAt: "desc" } } } }),
      db.factoryApplication.findMany({ orderBy: { createdAt: "desc" }, include: { company: true, templateVersion: { include: { template: true } }, revisions: { orderBy: { revision: "desc" }, take: 1 } } }),
      db.factoryProvisioningRun.findMany({ orderBy: { startedAt: "desc" }, take: 50 }),
      db.factoryDeployment.findMany({ orderBy: { updatedAt: "desc" } }),
      db.factoryRelease.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.factoryApproval.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.factoryBackup.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.factoryChangeRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      db.factoryAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    return ok({
      summary: {
        companies: companies.length,
        applications: applications.length,
        live: applications.filter((app) => app.status === "LIVE").length,
        templates: templates.length,
        modules: modules.length,
        pendingApprovals: approvals.filter((item) => item.status === "PENDING").length,
        degraded: applications.filter((app) => app.healthStatus === "DEGRADED").length,
        verifiedBackups: backups.filter((item) => item.status === "VERIFIED").length,
      },
      companies, templates, modules, applications, runs, deployments, releases, approvals, backups, changes, auditEvents,
      integrations: integrationReport(),
    });
  });
}
