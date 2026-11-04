import { db } from "@/lib/db";
import { assertNoInlineSecrets, assertTransition } from "./validation";
import { factoryAudit } from "./audit";

export type FactoryCheck = { code: string; status: "PASS" | "FAIL"; detail: string };

export async function validateApplication(applicationId: string, actorUserId: string) {
  const application = await db.factoryApplication.findUnique({
    where: { id: applicationId },
    include: {
      company: true,
      templateVersion: { include: { moduleLinks: { include: { moduleVersion: true } } } },
      revisions: { orderBy: { revision: "desc" }, take: 1 },
    },
  });
  if (!application) throw new Error("Application not found");
  if (!["DRAFT", "VALIDATED", "TEST_FAILED"].includes(application.status)) throw new Error(`Cannot validate from ${application.status}`);
  const checks: FactoryCheck[] = [];
  const check = (code: string, pass: boolean, detail: string) => checks.push({ code, status: pass ? "PASS" : "FAIL", detail });
  check("template.approved", application.templateVersion.status === "APPROVED", "Template version must be approved");
  check("company.active", application.company.status === "ACTIVE", "Company must be active");
  check("revision.present", Boolean(application.revisions[0]), "An immutable configuration revision is required");

  let configuration: Record<string, unknown> = {};
  try {
    configuration = JSON.parse(application.configuration) as Record<string, unknown>;
    assertNoInlineSecrets(configuration);
    check("configuration.safe", true, "Configuration parses and contains no inline credentials");
  } catch (error) {
    check("configuration.safe", false, error instanceof Error ? error.message : "Invalid configuration");
  }
  const enabled = new Set(Array.isArray(configuration.enabledModuleVersionIds) ? configuration.enabledModuleVersionIds : []);
  const available = new Set(application.templateVersion.moduleLinks.map((link) => link.moduleVersionId));
  const missingRequired = application.templateVersion.moduleLinks.filter((link) => link.required && !enabled.has(link.moduleVersionId));
  const unknown = [...enabled].filter((id) => !available.has(id));
  const unapproved = application.templateVersion.moduleLinks.filter((link) => link.moduleVersion.status !== "APPROVED");
  check("modules.required", missingRequired.length === 0, missingRequired.length ? `${missingRequired.length} required module(s) disabled` : "All required modules selected");
  check("modules.available", unknown.length === 0, unknown.length ? "Configuration selects modules outside the template" : "Every selected module belongs to the template");
  check("modules.approved", unapproved.length === 0, "Every linked module version must be approved");
  check("dedicated.domain", application.deploymentModel !== "DEDICATED" || Boolean(application.domain), "Dedicated applications require a unique hostname");
  const initialAdminUserId = typeof configuration.initialAdminUserId === "string" ? configuration.initialAdminUserId : null;
  if (initialAdminUserId) {
    const admin = await db.user.findFirst({ where: { id: initialAdminUserId, status: "ACTIVE" }, select: { id: true } });
    check("company-admin.explicit", Boolean(admin), "The explicitly selected company administrator must be an active user");
  }
  if (application.company.relationship === "CLIENT") {
    check("client.isolation", application.deploymentModel === "SHARED_TENANT" || application.deploymentModel === "DEDICATED", "A supported isolation model is required");
  }

  const passed = checks.every((item) => item.status === "PASS");
  const updated = await db.factoryApplication.update({
    where: { id: applicationId },
    data: { status: passed ? "VALIDATED" : "TEST_FAILED", healthStatus: passed ? "READY" : "DEGRADED" },
  });
  await factoryAudit({ actorUserId, action: passed ? "APPLICATION_VALIDATED" : "APPLICATION_VALIDATION_FAILED", resource: applicationId, companyId: application.companyId, applicationId, metadata: { checks } });
  return { application: updated, checks, passed };
}

export async function provisionApplication(applicationId: string, actorUserId: string) {
  const application = await db.factoryApplication.findUnique({
    where: { id: applicationId },
    include: { templateVersion: true, revisions: { orderBy: { revision: "desc" }, take: 1 } },
  });
  if (!application) throw new Error("Application not found");
  if (application.status !== "VALIDATED") throw new Error("Validate the application before provisioning");
  assertTransition(application.status, "PROVISIONING");

  if (application.deploymentModel === "DEDICATED") {
    const [run] = await db.$transaction([
      db.factoryProvisioningRun.create({ data: { applicationId, status: "BLOCKED", checks: "[]", error: "No dedicated infrastructure adapter is configured. No deployment was performed.", startedBy: actorUserId, finishedAt: new Date() } }),
      db.factoryDeployment.upsert({ where: { applicationId_environment: { applicationId, environment: "STAGING" } }, create: { applicationId, environment: "STAGING", status: "BLOCKED", adapter: "NONE", details: "Dedicated provisioning requires an approved external/host adapter." }, update: { status: "BLOCKED", adapter: "NONE", details: "Dedicated provisioning requires an approved external/host adapter." } }),
      db.factoryAuditEvent.create({ data: { actorUserId, action: "DEDICATED_PROVISIONING_BLOCKED", resource: applicationId, companyId: application.companyId, applicationId } }),
    ]);
    return { status: "BLOCKED", run, message: "No dedicated deployment adapter is configured; the application remains validated and is not live." };
  }

  const result = await db.$transaction(async (tx) => {
    await tx.factoryApplication.update({ where: { id: applicationId }, data: { status: "PROVISIONING" } });
    const config = JSON.parse(application.configuration) as { initialAdminUserId?: string | null };
    if (config.initialAdminUserId) {
      await tx.factoryMembership.upsert({
        where: { companyId_userId: { companyId: application.companyId, userId: config.initialAdminUserId } },
        create: { companyId: application.companyId, userId: config.initialAdminUserId, role: "COMPANY_ADMIN" },
        update: { role: "COMPANY_ADMIN", status: "ACTIVE" },
      });
    }
    const [scopedApplication, crossCompanyApplication, latestRevision] = await Promise.all([
      tx.factoryApplication.count({ where: { id: applicationId, companyId: application.companyId } }),
      tx.factoryApplication.count({ where: { id: applicationId, companyId: { not: application.companyId } } }),
      tx.factoryConfigurationRevision.findFirst({
        where: { applicationId, revision: application.revisions[0]?.revision ?? -1 },
        select: { id: true, configuration: true },
      }),
    ]);
    const configurationMatches = latestRevision?.configuration === application.configuration;
    const checks: FactoryCheck[] = [
      { code: "configuration.persisted", status: application.revisions.length > 0 && configurationMatches ? "PASS" : "FAIL", detail: "The current configuration exactly matches its persisted immutable revision" },
      { code: "tenant.boundary", status: scopedApplication === 1 && crossCompanyApplication === 0 ? "PASS" : "FAIL", detail: "Persisted application lookup succeeds inside its company scope and returns no row outside it" },
      { code: "shared.control-plane", status: application.templateVersion.status === "APPROVED" ? "PASS" : "FAIL", detail: "The selected approved template metadata was read back from the configured database" },
    ];
    const passed = checks.every((check) => check.status === "PASS");
    const release = await tx.factoryRelease.create({
      data: { applicationId, templateVersionId: application.templateVersionId, version: application.templateVersion.version, status: "STAGING", releaseNotes: application.templateVersion.releaseNotes, impactAssessment: "Initial control-plane staging release; there is no previous application release to modify.", rollbackPlan: "Before the first activation, remove staging only. After a later upgrade, retain the superseded known-good release for approved rollback.", createdBy: actorUserId },
    });
    await tx.factoryDeployment.upsert({
      where: { applicationId_environment: { applicationId, environment: "STAGING" } },
      create: { applicationId, environment: "STAGING", status: passed ? "READY" : "DEGRADED", adapter: "INTERNAL_SHARED", details: "Shared control-plane records provisioned; no external infrastructure claimed." },
      update: { status: passed ? "READY" : "DEGRADED", adapter: "INTERNAL_SHARED", details: "Shared control-plane records provisioned; no external infrastructure claimed." },
    });
    const run = await tx.factoryProvisioningRun.create({ data: { applicationId, status: passed ? "PASSED" : "TEST_FAILED", checks: JSON.stringify(checks), startedBy: actorUserId, finishedAt: new Date() } });
    const updated = await tx.factoryApplication.update({ where: { id: applicationId }, data: { status: passed ? "STAGING" : "TEST_FAILED", currentReleaseId: release.id, healthStatus: passed ? "CONTROL_PLANE_READY" : "DEGRADED", lastHealthCheckAt: new Date() } });
    await tx.factoryAuditEvent.create({ data: { actorUserId, action: passed ? "APPLICATION_PROVISIONED" : "APPLICATION_TEST_FAILED", resource: applicationId, companyId: application.companyId, applicationId, metadata: { checks } } });
    return { status: updated.status, run, release, checks };
  });
  return result;
}

export async function activateApplication(applicationId: string, actorUserId: string, note: string) {
  const application = await db.factoryApplication.findUnique({
    where: { id: applicationId },
    include: { releases: { orderBy: { createdAt: "desc" } }, deployments: true },
  });
  if (!application) throw new Error("Application not found");
  if (application.deploymentModel !== "SHARED_TENANT") throw new Error("Dedicated activation requires a verified deployment adapter");
  if (!["STAGING", "AWAITING_APPROVAL", "LIVE", "DEGRADED"].includes(application.status)) throw new Error(`Cannot activate from ${application.status}`);
  const release = application.releases.find((item) => item.status === "STAGING");
  if (!release) throw new Error("No staging release is awaiting activation");
  const staging = application.deployments.find((item) => item.environment === "STAGING");
  if (staging?.status !== "READY") throw new Error("Staging is not READY");

  return db.$transaction(async (tx) => {
    for (const previous of application.releases.filter((item) => item.status === "ACTIVE")) {
      await tx.factoryRelease.update({ where: { id: previous.id }, data: { status: "SUPERSEDED" } });
    }
    await tx.factoryRelease.update({ where: { id: release.id }, data: { status: "ACTIVE" } });
    await tx.factoryDeployment.upsert({ where: { applicationId_environment: { applicationId, environment: "PRODUCTION" } }, create: { applicationId, environment: "PRODUCTION", status: "DEPLOYED", adapter: "INTERNAL_SHARED", details: "Human-approved shared application activation." }, update: { status: "DEPLOYED", adapter: "INTERNAL_SHARED", details: "Human-approved shared application activation." } });
    const approval = await tx.factoryApproval.create({ data: { applicationId, action: application.status === "STAGING" ? "ACTIVATE" : "UPGRADE", status: "APPROVED", requestedBy: actorUserId, decidedBy: actorUserId, decidedAt: new Date(), note } });
    const updated = await tx.factoryApplication.update({ where: { id: applicationId }, data: { status: "LIVE", currentReleaseId: release.id, healthStatus: "CONTROL_PLANE_READY", lastHealthCheckAt: new Date() } });
    await tx.factoryAuditEvent.create({ data: { actorUserId, action: "APPLICATION_ACTIVATED", resource: applicationId, companyId: application.companyId, applicationId, metadata: { releaseId: release.id, approvalId: approval.id } } });
    return { application: updated, release, approval };
  });
}

export async function rollbackApplication(applicationId: string, actorUserId: string, note: string) {
  const application = await db.factoryApplication.findUnique({ where: { id: applicationId }, include: { releases: { orderBy: { createdAt: "desc" } } } });
  if (!application) throw new Error("Application not found");
  if (!["LIVE", "DEGRADED"].includes(application.status)) throw new Error("Only a live/degraded release can be rolled back");
  assertTransition(application.status, "ROLLED_BACK");
  const current = application.releases.find((release) => release.id === application.currentReleaseId && release.status === "ACTIVE");
  const target = application.releases.find((release) => release.status === "SUPERSEDED");
  if (!current || !target) throw new Error("No known-good superseded release is available");

  return db.$transaction(async (tx) => {
    await tx.factoryRelease.update({ where: { id: current.id }, data: { status: "ROLLED_BACK" } });
    await tx.factoryRelease.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
    const approval = await tx.factoryApproval.create({ data: { applicationId, action: "ROLLBACK", status: "APPROVED", requestedBy: actorUserId, decidedBy: actorUserId, decidedAt: new Date(), note } });
    const updated = await tx.factoryApplication.update({ where: { id: applicationId }, data: { status: "ROLLED_BACK", templateVersionId: target.templateVersionId, currentReleaseId: target.id, healthStatus: "CONTROL_PLANE_READY", lastHealthCheckAt: new Date() } });
    await tx.factoryDeployment.updateMany({ where: { applicationId, environment: "PRODUCTION" }, data: { status: "ROLLED_BACK", details: `Rolled back to ${target.version}` } });
    await tx.factoryAuditEvent.create({ data: { actorUserId, action: "APPLICATION_ROLLED_BACK", resource: applicationId, companyId: application.companyId, applicationId, metadata: { from: current.id, to: target.id, approvalId: approval.id } } });
    return { application: updated, target, approval };
  });
}
