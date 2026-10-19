/**
 * GET /api/agents/metrics — the agent workforce's own numbers.
 *
 * Every figure here is a count of something that actually happened: jobs
 * that ran, jobs that failed, jobs that were dead-lettered, tokens that were
 * spent, and the approvals still waiting for a human.
 */

import { db } from "@/lib/db";
import { ok, unauthorized, withErrorHandler } from "@/lib/responses";
import { requireAuth } from "@/lib/auth";
import { queueStats } from "@/lib/agents/runtime/queue";
import { registeredAgents } from "@/lib/agents/runtime/runtime";
import { getLocalModelStatus } from "@/lib/ai/local/endpoint";
import "@/lib/agents/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!ADMIN_ROLES.has(user.role)) {
      return unauthorized("Administrator role required");
    }

    const url = new URL(req.url);
    const days = Math.min(Number(url.searchParams.get("days") ?? 7) || 7, 90);

    const since = new Date(Date.now() - days * 86_400_000);

    // The job table is the source of truth for "how much work has this agent
    // actually done". The daily counter table is a fast approximation for
    // dashboards; this endpoint reports the measured numbers.
    const jobRows = await db.agentJob.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        durationMs: true,
        attempts: true,
        inputTokens: true,
        outputTokens: true,
        agentId: true,
      },
      take: 20000,
    });

    const measuredByAgent = new Map<
      string,
      {
        jobs: number;
        succeeded: number;
        failed: number;
        retried: number;
        deadLettered: number;
        rejected: number;
        durationMsTotal: number;
        inputTokens: number;
        outputTokens: number;
      }
    >();

    for (const row of jobRows) {
      const entry =
        measuredByAgent.get(row.agentId) ??
        measuredByAgent.set(row.agentId, {
          jobs: 0,
          succeeded: 0,
          failed: 0,
          retried: 0,
          deadLettered: 0,
          rejected: 0,
          durationMsTotal: 0,
          inputTokens: 0,
          outputTokens: 0,
        }).get(row.agentId)!;
      entry.jobs += 1;
      entry.durationMsTotal += row.durationMs;
      entry.inputTokens += row.inputTokens;
      entry.outputTokens += row.outputTokens;
      if (row.status === "SUCCEEDED") entry.succeeded += 1;
      if (row.status === "FAILED") entry.failed += 1;
      if (row.status === "DEAD_LETTER") entry.deadLettered += 1;
      if (row.attempts > 1) entry.retried += 1;
    }

    const [definitions, metrics, stats, approvalsPending, recentFailures] = await Promise.all([
      db.agentDefinition.findMany({
        orderBy: [{ department: "asc" }, { code: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          version: true,
          department: true,
          enabled: true,
          permissions: true,
          maxDurationSeconds: true,
          maxRetries: true,
          maxConcurrency: true,
          preferredProvider: true,
          fallbackProvider: true,
          updatedAt: true,
        },
      }),
      db.agentMetric.findMany({
        where: { day: { gte: since.toISOString().slice(0, 10) } },
        orderBy: { day: "desc" },
      }),
      queueStats(),
      db.agentApproval.count({ where: { status: "PENDING" } }),
      db.agentJob.findMany({
        where: { status: { in: ["FAILED", "DEAD_LETTER"] } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          errorKind: true,
          error: true,
          attempts: true,
          updatedAt: true,
          agent: { select: { code: true, name: true } },
        },
      }),
    ]);

    // The per-agent totals across the window.
    const byAgent = definitions.map((definition) => {
      const rows = metrics.filter((m) => m.agentId === definition.code);
      const sum = (field: keyof (typeof rows)[number]) =>
        rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);
      const measured = measuredByAgent.get(definition.id);
      const jobs = measured?.jobs ?? 0;
      return {
        code: definition.code,
        name: definition.name,
        version: definition.version,
        department: definition.department,
        enabled: definition.enabled,
        permissions: safeParseArray(definition.permissions),
        limits: {
          maxDurationSeconds: definition.maxDurationSeconds,
          maxRetries: definition.maxRetries,
          maxConcurrency: definition.maxConcurrency,
        },
        providers: {
          preferred: definition.preferredProvider,
          fallback: definition.fallbackProvider,
        },
        jobs,
        succeeded: measured?.succeeded ?? 0,
        failed: (measured?.failed ?? 0) + (measured?.deadLettered ?? 0),
        retried: measured?.retried ?? 0,
        deadLettered: measured?.deadLettered ?? 0,
        rejected: sum("rejected"),
        successRate:
          jobs > 0 ? Math.round(((measured?.succeeded ?? 0) / jobs) * 1000) / 10 : null,
        averageDurationMs:
          (measured?.succeeded ?? 0) > 0
            ? Math.round(measured!.durationMsTotal / measured!.succeeded)
            : null,
        inputTokens: measured?.inputTokens ?? 0,
        outputTokens: measured?.outputTokens ?? 0,
        // The same shape the status route uses, so a client does not have to
        // know which endpoint it is reading.
        measured: {
          jobs,
          succeeded: measured?.succeeded ?? 0,
          failed: (measured?.failed ?? 0) + (measured?.deadLettered ?? 0),
          successRate:
            jobs > 0 ? Math.round(((measured?.succeeded ?? 0) / jobs) * 1000) / 10 : null,
          averageDurationMs:
            (measured?.succeeded ?? 0) > 0
              ? Math.round(measured!.durationMsTotal / measured!.succeeded)
              : null,
        },
        lastUpdated: definition.updatedAt,
      };
    });

    return ok({
      windowDays: days,
      registeredAgents: registeredAgents().length,
      definitions: byAgent,
      queue: stats,
      approvalsPending,
      recentFailures,
      localModel: getLocalModelStatus(),
      generatedAt: new Date().toISOString(),
    });
  });
}

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
