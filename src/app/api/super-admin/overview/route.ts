/**
 * GET /api/super-admin/overview — the AI Command Center dashboard payload.
 *
 * Returns the full command-center overview: department counts, workforce
 * totals, skills, prompts, SOPs, constitutional rules, workflows, models,
 * DCC aggregates, plus live counts from the platform's own tables (agents,
 * jobs, approvals, audit logs) so the dashboard surfaces real activity,
 * not just the static registry.
 *
 * Protected: SUPER_ADMIN only.
 */

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, withErrorHandler } from "@/lib/responses";
import {
  overview,
  persistRegistries,
  AI_MODELS,
  CONSTITUTIONAL_RULES,
  PROMPTS,
  SOPS,
  WORKFLOWS,
} from "@/lib/enterprise/registries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("SUPER_ADMIN");

    // Persist the static registry into Prisma on every request. This is
    // idempotent and cheap, and it keeps the audit / governance / security
    // pages honest: they read from real database rows, not from a TS module
    // a future editor could silently change.
    try {
      await persistRegistries(db);
    } catch (err) {
      // Persistence must never break the dashboard. If a row already exists
      // from a parallel request, the next call reconciles it; if the DB is
      // unavailable the dashboard still renders from the static registry.
      console.error("[super-admin/overview] persistRegistries failed:", err);
    }

    // Live platform metrics — the parts of the overview that are NOT in the
    // static registry. These come from the agent runtime, the audit trail
    // and the platform's own health.
    const [
      registeredAgents,
      queuedJobs,
      runningJobs,
      failedJobs,
      deadLetterJobs,
      pendingApprovals,
      todayEvents,
      auditLogsToday,
    ] = await Promise.all([
      db.agentDefinition.count().catch(() => 0),
      db.agentJob.count({ where: { status: "QUEUED" } }).catch(() => 0),
      db.agentJob.count({ where: { status: "RUNNING" } }).catch(() => 0),
      db.agentJob.count({ where: { status: "FAILED" } }).catch(() => 0),
      db.agentJob.count({ where: { status: "DEAD_LETTER" } }).catch(() => 0),
      db.agentApproval.count({ where: { status: "PENDING" } }).catch(() => 0),
      db.agentJobEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400_000) } },
      }).catch(() => 0),
      db.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400_000) } },
      }).catch(() => 0),
    ]);

    const dcc = overview();

    return ok(
      {
        registry: dcc,
        live: {
          registeredAgents,
          queuedJobs,
          runningJobs,
          failedJobs,
          deadLetterJobs,
          pendingApprovals,
          todayEvents,
          auditLogsToday,
        },
        lists: {
          models: AI_MODELS,
          rules: CONSTITUTIONAL_RULES,
          workflows: WORKFLOWS,
          sops: SOPS.map((s) => ({
            department: s.department,
            name: s.name,
            status: s.status,
            version: s.version,
          })),
          prompts: PROMPTS.map((p) => ({
            department: p.department,
            agent: p.agent,
            purpose: p.purpose,
            status: p.status,
            version: p.version,
          })),
        },
        generatedAt: new Date().toISOString(),
      },
      "Command center overview",
    );
  });
}
