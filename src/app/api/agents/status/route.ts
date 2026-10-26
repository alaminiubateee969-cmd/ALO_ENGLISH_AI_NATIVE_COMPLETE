/**
 * GET /api/agents/status — the agent workforce's own status.
 *
 * This endpoint reports what is actually registered and what has actually
 * run. The agent list is derived from the runtime's definitions, and the
 * status of each agent is derived from its recent job outcomes — it is never
 * a hand-written word. An agent that has never run says "registered"; one
 * that has completed work says "ready"; one whose jobs have all failed says
 * "failed".
 *
 * The provider status is read from configuration, not from a live probe, so
 * this endpoint stays fast. The Model Router agent (013) does the actual
 * probing, and its result is available at /api/agents/metrics.
 */

import { requireRole } from '@/lib/auth';
import { AI_AGENTS, getAgentStats } from '@/lib/agents/registry';
import { MARKETING_SKILLS, getSkillStats } from '@/lib/agents/skills';
import { ok } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

  const measurements: Record<
    string,
    {
      jobs: number;
      succeeded: number;
      failed: number;
      successRate: number | null;
      averageDurationMs: number | null;
    }
  > = {};

  for (const row of rows) {
    const entry =
      measurements[row.agent.code] ??
      (measurements[row.agent.code] = {
        jobs: 0,
        succeeded: 0,
        failed: 0,
        successRate: null,
        averageDurationMs: null,
      });
    entry.jobs += 1;
    if (row.status === "SUCCEEDED") entry.succeeded += 1;
    if (row.status === "FAILED" || row.status === "DEAD_LETTER") entry.failed += 1;
  }

  for (const entry of Object.values(measurements)) {
    entry.successRate =
      entry.jobs > 0 ? Math.round((entry.succeeded / entry.jobs) * 1000) / 10 : null;
  }
  return measurements;
}

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const measurements = await gatherMeasurements();
    const agents = buildAgentRegistry(measurements);

    const byStatus: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    for (const agent of agents) {
      byStatus[agent.status] = (byStatus[agent.status] ?? 0) + 1;
      byDepartment[agent.department] = (byDepartment[agent.department] ?? 0) + 1;
    }

    const pendingApprovals = await db.agentApproval.count({ where: { status: "PENDING" } });

    return ok(
      {
        stats: {
          total: agents.length,
          byStatus,
          byDepartment,
          ready: byStatus.ready ?? 0,
        },
        agents: agents.map((agent) => ({
          code: agent.code,
          name: agent.name,
          version: agent.version,
          department: agent.department,
          responsibility: agent.responsibility,
          canAutoExecute: agent.canAutoExecute,
          requiresAdminApproval: agent.requiresAdminApproval,
          status: agent.status,
          examScope: agent.examScope,
          publicLabel: agent.publicLabel,
          permissions: agent.permissions,
          limits: agent.limits,
          measured: agent.measured,
        })),
        // Reviewed skill packs (inputs, steps, guardrails, output sections).
        // Registered metadata only — none of these has been executed against a
        // provider, so they are reported separately from agent readiness.
        skills: MARKETING_SKILLS.map((skill) => ({
          id: skill.id,
          name: skill.name,
          owner: skill.owner,
          purpose: skill.purpose,
          canAutoExecute: skill.canAutoExecute,
          status: skill.status,
          guardrailCount: skill.guardrails.length,
          stepCount: skill.steps.length,
        })),
        skillStats: getSkillStats(),
        readiness: {
          status: pendingApprovals > 0 ? "AWAITING_APPROVAL" : "MEASURED",
          basis:
            "Agent status is derived from completed jobs in the last 30 days, not from a " +
            "hand-written list. The provider status is read from configuration; run the Model " +
            "Router agent (AGENT-MODEL-ROUTER-13) to probe the model servers for real.",
        },
        registered: AI_AGENTS.length,
      },
      "Agent workforce status",
    );
  });
}
