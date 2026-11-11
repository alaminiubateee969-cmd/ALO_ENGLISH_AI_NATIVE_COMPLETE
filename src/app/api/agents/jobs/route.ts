/**
 * GET  /api/agents/jobs — list agent jobs, newest first.
 * POST /api/agents/jobs — enqueue a job for an agent.
 *
 * The POST is the administrative entry point into the workforce. It validates
 * the payload against the agent's declared input schema before the job is
 * created, so a bad request is rejected at the door rather than failing
 * three times in the worker.
 */

import { db } from "@/lib/db";
import { ok, badRequest, notFound, unauthorized, withErrorHandler } from "@/lib/responses";
import { requireAuth } from "@/lib/auth";
import { enqueueJob } from "@/lib/agents/runtime/queue";
import { validateAgainstSchema } from "@/lib/agents/runtime/schema";
import { registeredAgents, syncAgentDefinitions } from "@/lib/agents/runtime/runtime";
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
    const status = url.searchParams.get("status");
    const agentCode = url.searchParams.get("agent");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

    const jobs = await db.agentJob.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(agentCode ? { agent: { code: agentCode } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        queue: true,
        attempts: true,
        maxAttempts: true,
        errorKind: true,
        error: true,
        durationMs: true,
        inputTokens: true,
        outputTokens: true,
        // The result is included so an operator can see what a job produced
        // without opening the database. It is truncated: a job's result can
        // be a large draft set.
        result: true,
        runAfter: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        agent: { select: { code: true, name: true, version: true, department: true } },
      },
    });

    return ok({ jobs });
  });
}

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!ADMIN_ROLES.has(user.role)) {
      return unauthorized("Administrator role required");
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");

    const agentCode = typeof body.agentCode === "string" ? body.agentCode : "";
    const payload = (body.payload ?? {}) as Record<string, unknown>;

    const spec = registeredAgents().find((a) => a.code === agentCode);
    if (!spec) {
      const known = registeredAgents().map((a) => a.code);
      return badRequest(
        `unknown agent "${agentCode}". Registered agents: ${known.join(", ")}`,
      );
    }

    const violations = validateAgainstSchema(payload, spec.inputSchema);
    if (violations.length > 0) {
      return badRequest(
        `payload does not match ${agentCode}'s input schema: ` +
          violations.map((v) => `${v.path} ${v.message}`).join("; "),
      );
    }

    await syncAgentDefinitions();
    const definition = await db.agentDefinition.findUnique({
      where: { code: agentCode },
      select: { id: true },
    });
    if (!definition) return notFound(`agent ${agentCode} is not registered in the database`);

    const { id, deduplicated } = await enqueueJob(definition.id, payload, {
      queue: typeof body.queue === "string" ? body.queue : undefined,
      idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined,
      idempotencyScope:
        typeof body.idempotencyScope === "string"
          ? body.idempotencyScope
          : agentCode,
      maxAttempts: typeof body.maxAttempts === "number" ? body.maxAttempts : undefined,
    });

    return ok(
      { jobId: id, agentCode, deduplicated, agentVersion: spec.version },
      deduplicated ? "An identical job already exists" : "Job enqueued",
    );
  });
}
