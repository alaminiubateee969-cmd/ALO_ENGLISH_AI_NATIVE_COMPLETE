/**
 * GET /api/questions?attemptId=xxx — Fetch the frozen, redacted questions for
 * an attempt owned by the authenticated caller.
 *
 * There is deliberately no practiceSetId bypass: reading a set's question
 * bank requires a quota-gated attempt created by /api/attempts/start.
 */

import { db } from "@/lib/db";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { loadAttemptQuestions } from "@/lib/exam/questions";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const attemptId = new URL(req.url).searchParams.get("attemptId");
    if (!attemptId) return badRequest("attemptId is required");

    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      select: { userId: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only open your own attempt");

    const questions = await loadAttemptQuestions(db, attemptId);
    const bySection = questions.reduce((acc, question) => {
      (acc[question.section] ??= []).push(question);
      return acc;
    }, {} as Record<string, typeof questions>);

    return ok({ questions, bySection, total: questions.length, frozen: true }, "Questions retrieved");
  });
}
