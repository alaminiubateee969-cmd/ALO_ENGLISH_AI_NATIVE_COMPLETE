/**
 * POST /api/attempts/start — Start a new practice attempt.
 *
 * Requires authentication. Enforces the free quota (server-side) and then:
 *   1. creates the attempt with a server-authoritative deadline
 *   2. selects the question set using the server-side repetition policy
 *   3. freezes that set on the attempt (AttemptQuestion rows)
 *
 * The response carries the server clock so the browser never has to invent
 * the remaining time, and the frozen question IDs so a refresh replays the
 * exact same exam.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict, unprocessable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { computeClock, deadlineFor } from "@/lib/exam/timer";
import { selectQuestions, persistSelection, QuestionShortageError } from "@/lib/exam/selection";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({
      practiceSetId: z.string().cuid(),
      /** Optional: how many questions to serve (defaults to the whole set). */
      count: z.number().int().positive().max(500).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { practiceSetId, count } = parsed.data;

    const practiceSet = await db.practiceSet.findFirst({
      where: { id: practiceSetId, isActive: true },
    });
    if (!practiceSet) return notFound("Practice set not found");

    const questionCount = await db.question.count({ where: { practiceSetId } });
    if (questionCount === 0) {
      return unprocessable("This practice set has no questions yet.");
    }

    // ═══ FREE QUOTA ENFORCEMENT (server-side) ══════════════════════════════
    let quota = await db.freeQuota.findUnique({ where: { userId: user.id } });
    if (!quota) {
      const isAloStudent = user.role === "STUDENT";
      quota = await db.freeQuota.create({
        data: { userId: user.id, attemptsUsed: 0, attemptsLimit: isAloStudent ? 3 : 1, isAloStudent },
      });
    }

    const completedAttempts = await db.attempt.count({
      where: { userId: user.id, status: "SUBMITTED" },
    });

    if (completedAttempts >= quota.attemptsLimit) {
      const paidAttempts = await db.payment.aggregate({
        where: { userId: user.id, status: "COMPLETED" },
        _sum: { attemptsPaid: true },
      });
      const totalAllowed = quota.attemptsLimit + (paidAttempts._sum.attemptsPaid || 0);
      if (completedAttempts >= totalAllowed) {
        return forbidden(
          `You have used all ${totalAllowed} test attempts (${quota.attemptsLimit} free + ${paidAttempts._sum.attemptsPaid || 0} paid). ` +
            `Please purchase additional attempts to continue.`
        );
      }
    }

    // ═══ CREATE THE ATTEMPT ════════════════════════════════════════════════
    const attemptNumber =
      (await db.attempt.count({ where: { userId: user.id, practiceSetId } })) + 1;

    let attemptId = "";
    let selection;

    try {
      const created = await db.attempt.create({
        data: {
          userId: user.id,
          practiceSetId,
          status: "IN_PROGRESS",
          attemptNumber,
          durationMin: practiceSet.durationMin,
          expiresAt: deadlineFor(new Date(), practiceSet.durationMin),
        },
        select: { id: true, startedAt: true },
      });
      attemptId = created.id;

      selection = await selectQuestions({
        db,
        userId: user.id,
        practiceSetId,
        count,
      });

      await persistSelection({ db, attemptId, questionIds: selection.questionIds });
    } catch (err) {
      // Roll back a half-built attempt so a shortage never burns the quota.
      if (attemptId && err instanceof QuestionShortageError) {
        await db.attempt.delete({ where: { id: attemptId } }).catch(() => {});
        return conflict(
          `${err.message} An administrator has been notified; please choose another practice set.`
        );
      }
      throw err;
    }

    await db.freeQuota.update({
      where: { userId: user.id },
      data: { attemptsUsed: { increment: 1 } },
    });

    await audit("EXAM_START", {
      userId: user.id,
      resource: "attempt:" + attemptId,
      ipAddress: getClientIp(req),
      metadata: {
        practiceSetId,
        questionCount: selection.questionIds.length,
        shortage: selection.shortage?.reason ?? null,
        completedAttempts,
        quotaLimit: quota.attemptsLimit,
      },
    });

    return ok(
      {
        attempt: {
          id: attemptId,
          startedAt: new Date().toISOString(),
          attemptNumber,
          durationMin: practiceSet.durationMin,
        },
        clock: computeClock({
          startedAt: new Date(),
          expiresAt: deadlineFor(new Date(), practiceSet.durationMin),
          durationMin: practiceSet.durationMin,
        }),
        questions: { ids: selection.questionIds, count: selection.questionIds.length },
        shortage: selection.shortage,
        quota: {
          used: completedAttempts + 1,
          limit: quota.attemptsLimit,
          remaining: Math.max(0, quota.attemptsLimit - completedAttempts - 1),
        },
      },
      "Attempt started"
    );
  });
}
