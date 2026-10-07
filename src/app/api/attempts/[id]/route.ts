/**
 * GET /api/attempts/:id — Resume an attempt.
 *
 * Returns everything needed to rebuild the exam exactly as it was:
 *   - the attempt, its status and attempt number
 *   - the server clock (remaining seconds derived from persisted timestamps)
 *   - the frozen question set, in order, with no correct answers
 *   - every answer already persisted for the attempt
 *
 * Ownership is enforced: a student can only resume their own attempt.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { computeClock } from "@/lib/exam/timer";
import { loadAttemptQuestions, loadAttemptAnswers } from "@/lib/exam/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const { id } = await ctx.params;

    const attempt = await db.attempt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        practiceSetId: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        expiresAt: true,
        durationMin: true,
        attemptNumber: true,
        practiceSet: {
          select: {
            id: true,
            title: true,
            durationMin: true,
            examType: { select: { code: true, name: true } },
          },
        },
        score: true,
      },
    });

    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only open your own attempt");

    const [questions, answers] = await Promise.all([
      loadAttemptQuestions(db, id),
      loadAttemptAnswers(db, id),
    ]);

    return ok(
      {
        attempt: {
          id: attempt.id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          attemptNumber: attempt.attemptNumber,
          practiceSetId: attempt.practiceSetId,
          practiceSet: attempt.practiceSet,
        },
        clock: computeClock(attempt),
        questions,
        answers,
        score: attempt.score,
      },
      "Attempt loaded"
    );
  });
}
