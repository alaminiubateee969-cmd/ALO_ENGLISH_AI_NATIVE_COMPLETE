/**
 * POST /api/agents/worker/run — drain the agent job queue.
 *
 * WHY A ROUTE AND NOT A SEPARATE PROCESS
 * ──────────────────────────────────────
 * The production deployment is a single Node process running the standalone
 * Next.js build, with a SQLite database and no Redis and no second container.
 * A separate worker process would need its own database connection, its own
 * deployment, and its own supervision, for the sake of running the same code.
 * Instead the worker is a route the platform already serves, and the host
 * calls it — from cron, from a deploy hook, or from the admin panel.
 *
 * Two ways in:
 *   - an administrator's session cookie, for a manual "run now";
 *   - the `AGENT_WORKER_TOKEN` shared secret, for an unattended cron call.
 *
 * The route is bounded. It processes at most `maxJobs` jobs and returns
 * immediately; a caller that wants more runs it again. A job that takes
 * longer than its own agent's budget is aborted by the runtime and retried.
 */

import { db } from "@/lib/db";
import { ok, unauthorized, badRequest, withErrorHandler } from "@/lib/responses";
import { requireAuth } from "@/lib/auth";
import { drainQueue, syncAgentDefinitions, registeredAgents } from "@/lib/agents/runtime/runtime";
import { queueStats } from "@/lib/agents/runtime/queue";
import "@/lib/agents/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    const maxJobs = typeof body.maxJobs === "number" ? Math.min(Math.max(body.maxJobs, 1), 200) : 20;
    const agentCode = typeof body.agentCode === "string" ? body.agentCode : null;

    // ── Authorisation ────────────────────────────────────────────────────
    const token = (process.env.AGENT_WORKER_TOKEN || "").trim();
    const provided = req.headers.get("x-agent-worker-token")?.trim() ?? "";
    const tokenAccepted = token.length > 0 && provided.length > 0 && provided === token;

    if (!tokenAccepted) {
      const user = await requireAuth();
      if (!ADMIN_ROLES.has(user.role)) {
        return unauthorized("Administrator role required to run the agent worker");
      }
    }

    // Reconcile the database copy of the agent definitions before working, so
    // the monitor always shows the current code's version of each agent.
    await syncAgentDefinitions();

    const processed = await drainQueue(agentCode ? [agentCode] : [], maxJobs);
    const stats = await queueStats();

    return ok(
      {
        processed,
        maxJobs,
        agents: registeredAgents().length,
        queue: stats,
      },
      processed > 0 ? `Processed ${processed} agent job(s)` : "No agent job was ready",
    );
  });
}

/** GET — the queue's current state, for the admin monitor. */
export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const token = (process.env.AGENT_WORKER_TOKEN || "").trim();
    const provided = req.headers.get("x-agent-worker-token")?.trim() ?? "";
    const tokenAccepted = token.length > 0 && provided.length > 0 && provided === token;
    if (!tokenAccepted) {
      const user = await requireAuth();
      if (!ADMIN_ROLES.has(user.role)) {
        return unauthorized("Administrator role required");
      }
    }

    const stats = await queueStats();
    const recent = await db.agentJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        queue: true,
        attempts: true,
        maxAttempts: true,
        errorKind: true,
        error: true,
        durationMs: true,
        createdAt: true,
        updatedAt: true,
        agent: { select: { code: true, name: true, version: true } },
      },
    });

    return ok({ queue: stats, recent });
  });
}
