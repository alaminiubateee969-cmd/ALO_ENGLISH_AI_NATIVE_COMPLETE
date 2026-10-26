/**
 * GET  /api/agents/approvals — list the agent actions waiting for a human.
 * POST /api/agents/approvals — decide one.
 *
 * The approval gate is the reason an agent cannot publish content, change a
 * rubric or alter the workforce on its own. A decision is recorded with the
 * person who made it, and the approval's payload is immutable afterwards.
 */

import { db } from "@/lib/db";
import { ok, badRequest, notFound, unauthorized, withErrorHandler } from "@/lib/responses";
import { requireAuth } from "@/lib/auth";
import { audit, getClientIp } from "@/lib/audit";
import { enqueueJob } from "@/lib/agents/runtime/queue";
import { validateAgainstSchema } from "@/lib/agents/runtime/schema";
import { registeredAgents } from "@/lib/agents/runtime/runtime";
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
    const status = url.searchParams.get("status") ?? "PENDING";

    const approvals = await db.agentApproval.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        action: true,
        status: true,
        subject: true,
        summary: true,
        payload: true,
        requestedBy: true,
        decidedBy: true,
        decisionNote: true,
        decidedAt: true,
        createdAt: true,
        agent: { select: { code: true, name: true, version: true } },
        job: { select: { id: true, status: true } },
      },
    });

    return ok({ approvals });
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

    const approvalId = typeof body.approvalId === "string" ? body.approvalId : "";
    const decision = body.decision === "APPROVE" ? "APPROVED" : body.decision === "REJECT" ? "REJECTED" : "";
    if (!approvalId || !decision) {
      return badRequest("approvalId and decision (APPROVE or REJECT) are required");
    }

    const approval = await db.agentApproval.findUnique({
      where: { id: approvalId },
      select: {
        id: true,
        status: true,
        action: true,
        subject: true,
        payload: true,
        agentId: true,
        agent: { select: { code: true } },
      },
    });
    if (!approval) return notFound("No such approval");
    if (approval.status !== "PENDING") {
      return badRequest(`This approval has already been ${approval.status.toLowerCase()}`);
    }

    const updated = await db.agentApproval.update({
      where: { id: approvalId },
      data: {
        status: decision,
        decidedBy: user.id,
        decidedAt: new Date(),
        decisionNote: typeof body.note === "string" ? body.note.slice(0, 1000) : null,
      },
      select: { id: true, status: true },
    });

    await audit("AGENT_APPROVAL_DECIDED", {
      userId: user.id,
      resource: `approval:${approvalId}`,
      ipAddress: getClientIp(req),
      metadata: { decision, action: approval.action, agentCode: approval.agent.code },
    });

    // An approved "question.publish" is turned into a real publish job. The
    // job re-checks the approval's status, so approving twice cannot publish
    // twice.
    let publishJobId: string | null = null;
    let publishBlockedReason: string | null = null;
    if (decision === "APPROVED" && approval.action === "question.publish") {
      const payload = JSON.parse(approval.payload) as Record<string, unknown>;
      const examTypeCode =
        typeof payload.examTypeCode === "string"
          ? payload.examTypeCode
          : (approval.subject.match(/for ([A-Z-]+)/)?.[1] ?? "");
      const practiceSetId = typeof payload.practiceSetId === "string" ? payload.practiceSetId : "";

      if (!examTypeCode) {
        publishBlockedReason =
          "The approval does not say which exam the questions belong to, so no publish job was created.";
      } else if (!practiceSetId) {
        publishBlockedReason =
          "The approval does not name a target practice set, so no publish job was created. " +
          "Re-run the quality gate with practiceSetId set, or publish the draft by hand.";
      } else {
        const spec = registeredAgents().find((a) => a.code === "AGENT-QUALITY-GATE-03");
        if (spec) {
          const violations = validateAgainstSchema(
            { examTypeCode, items: payload.items ?? [], action: "publish", approvalId, practiceSetId },
            spec.inputSchema,
          );
          if (violations.length === 0) {
            const definition = await db.agentDefinition.findUnique({
              where: { code: "AGENT-QUALITY-GATE-03" },
              select: { id: true },
            });
            if (definition) {
              const enqueued = await enqueueJob(
                definition.id,
                { examTypeCode, items: payload.items ?? [], action: "publish", approvalId, practiceSetId },
                { idempotencyKey: `publish:${approvalId}`, idempotencyScope: "question.publish" },
              );
              publishJobId = enqueued.id;
            }
          }
        }
      }
    }

    return ok({ approval: updated, publishJobId, publishBlockedReason });
  });
}
