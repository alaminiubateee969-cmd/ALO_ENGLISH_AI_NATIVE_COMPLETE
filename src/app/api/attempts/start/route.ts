/**
 * POST /api/attempts/start — Start a new practice attempt.
 *
 * Requires authentication (STUDENT role).
 * Enforces free quota: 3 free tests, then payment required.
 * ALO students get 3 free; public students get 1 free.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";
import { allocateExamQuestions, InventoryInsufficientError } from "@/lib/agents/ExamQuestionAllocationAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({ practiceSetId: z.string().cuid() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { practiceSetId } = parsed.data;

    // Verify practice set exists and is active
    const practiceSet = await db.practiceSet.findFirst({
      where: { id: practiceSetId, isActive: true, examType: { isActive: true } },
      include: { questions: { where: { status: "ACTIVE" } } },
    });
    if (!practiceSet) return notFound("Practice set not found");

    // Refuse broken or empty exams even if an administrator accidentally marked
    // them active. Objective questions require a server-side answer and MCQs
    // require a parseable option list with at least two choices.
    const invalidQuestion = practiceSet.questions.find((q) => {
      if (!q.prompt.trim() || !q.section || !q.type || q.points <= 0) return true;
      if (q.type === "MULTIPLE_CHOICE") {
        try {
          const options = JSON.parse(q.options || "[]");
          return !Array.isArray(options) || options.length < 2 || q.correctIndex == null ||
            q.correctIndex < 0 || q.correctIndex >= options.length;
        } catch { return true; }
      }
      if (["TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "SHORT_ANSWER", "SENTENCE_COMPLETION"].includes(q.type)) {
        return q.correctAnswer == null && q.correctIndex == null;
      }
      return false;
    });
    if (practiceSet.durationMin <= 0 || practiceSet.questions.length === 0 || invalidQuestion) {
      return forbidden("This exam is unavailable because its content failed the production integrity check");
    }

    // ═══ FREE QUOTA ENFORCEMENT ═══════════════════════════════════════
    // ALO students get 3 free tests, public students get 1 free test
    // After that, payment is required.

    // Get or create free quota record
    let quota = await db.freeQuota.findUnique({ where: { userId: user.id } });
    if (!quota) {
      // Check if user email is from ALO (simplified: any registered student gets 3 free)
      const isAloStudent = user.role === "STUDENT";
      quota = await db.freeQuota.create({
        data: {
          userId: user.id,
          attemptsUsed: 0,
          attemptsLimit: isAloStudent ? 3 : 1,
          isAloStudent,
        },
      });
    }

    // Count completed attempts
    const completedAttempts = await db.attempt.count({
      where: { userId: user.id, status: "SUBMITTED" },
    });

    // Check if user has exceeded free quota
    if (completedAttempts >= quota.attemptsLimit) {
      // Check if user has paid for additional attempts
      const paidAttempts = await db.payment.aggregate({
        where: { userId: user.id, status: "COMPLETED" },
        _sum: { attemptsPaid: true },
      });
      const totalAllowed = quota.attemptsLimit + (paidAttempts._sum.attemptsPaid || 0);

      if (completedAttempts >= totalAllowed) {
        return forbidden(
          `You have used all ${totalAllowed} test attempts (${quota.attemptsLimit} free + ${paidAttempts._sum.attemptsPaid || 0} paid). ` +
          `Please purchase additional attempts to continue. ` +
          `Visit /pricing to buy more tests.`
        );
      }
    }

    let allocation;
    try {
      allocation = await allocateExamQuestions(user.id, practiceSetId);
    } catch (error) {
      if (error instanceof InventoryInsufficientError) return forbidden(error.message);
      throw error;
    }
    const attempt = allocation.attempt;

    // Consume quota only after allocation succeeds.
    await db.freeQuota.update({ where: { userId: user.id }, data: { attemptsUsed: { increment: 1 } } });

    await audit("EXAM_START", {
      userId: user.id,
      resource: "attempt:" + attempt.id,
      ipAddress: getClientIp(req),
      metadata: { practiceSetId, completedAttempts, quotaLimit: quota.attemptsLimit },
    });

    return ok({
      attempt: { id: attempt.id, startedAt: attempt.startedAt, questionCount: allocation.questionCount },
      quota: {
        used: completedAttempts + 1,
        limit: quota.attemptsLimit,
        remaining: Math.max(0, quota.attemptsLimit - completedAttempts - 1),
      },
    }, "Attempt started");
  });
}
