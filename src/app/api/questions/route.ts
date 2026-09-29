/** Return answer-safe questions for an authenticated, owned attempt. */
import { db } from "@/lib/db";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
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
      select: { userId: true, practiceSetId: true, status: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") return badRequest("Attempt is not in progress");

    const questions = await db.question.findMany({
      where: { practiceSetId: attempt.practiceSetId, status: "ACTIVE" },
      orderBy: { order: "asc" },
      select: {
        id: true, section: true, type: true, prompt: true, passage: true,
        audioUrl: true, options: true, wordLimit: true, imageUrl: true,
        points: true, order: true, difficulty: true, skill: true,
        // Correct answers and explanations intentionally never leave the server.
      },
    });

    const bySection = questions.reduce((acc, question) => {
      (acc[question.section] ??= []).push(question);
      return acc;
    }, {} as Record<string, typeof questions>);
    return ok({ attemptId, questions, bySection, total: questions.length }, "Questions retrieved");
  });
}
