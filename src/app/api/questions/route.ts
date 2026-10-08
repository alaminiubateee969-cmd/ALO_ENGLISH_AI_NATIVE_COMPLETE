/**
 * GET /api/questions?practiceSetId=xxx — Fetch questions for a practice set.
 *
 * Returns questions grouped by section. Does NOT include correct answers
 * (security: students shouldn't see answers before submitting).
 */

import { db } from "@/lib/db";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { SAFE_QUESTION_SELECT, loadAttemptQuestions, withDefaultOptions } from "@/lib/exam/questions";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Phase 1: Require auth — students must be logged in to fetch questions
    const user = await requireAuth();

    const url = new URL(req.url);
    const practiceSetId = url.searchParams.get("practiceSetId");
    const attemptId = url.searchParams.get("attemptId");

    // Resume path: serve the question set frozen on the attempt. Guarantees a
    // refresh (or a different device) replays the exact same exam.
    if (attemptId) {
      const attempt = await db.attempt.findUnique({
        where: { id: attemptId },
        select: { userId: true, practiceSetId: true },
      });
      if (!attempt) return notFound("Attempt not found");
      if (attempt.userId !== user.id) return forbidden("You can only open your own attempt");

      const questions = await loadAttemptQuestions(db, attemptId);
      const bySection = questions.reduce((acc, q) => {
        if (!acc[q.section]) acc[q.section] = [];
        acc[q.section].push(q);
        return acc;
      }, {} as Record<string, typeof questions>);

      return ok({ questions, bySection, total: questions.length, frozen: true }, "Questions retrieved");
    }

    if (!practiceSetId) {
      return badRequest("practiceSetId (or attemptId) is required");
    }

    const rawQuestions = await db.question.findMany({
      where: { practiceSetId },
      orderBy: { order: "asc" },
      select: SAFE_QUESTION_SELECT,
    });
    const questions = rawQuestions.map((q) => withDefaultOptions(q));

    // Group by section
    const bySection = questions.reduce((acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    }, {} as Record<string, typeof questions>);

    return ok({ questions, bySection, total: questions.length }, "Questions retrieved");
  });
}
