import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  attemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  answer: z.string().trim().min(1).max(10000),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    const { attemptId, questionId, answer } = parsed.data;

    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true, practiceSetId: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") return badRequest("Attempt is not in progress");

    const question = await db.question.findFirst({
      where: { id: questionId, practiceSetId: attempt.practiceSetId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!question) return badRequest("Question does not belong to this attempt");

    const saved = await db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, answer },
      update: { answer, answeredAt: new Date() },
      select: { questionId: true, answeredAt: true, updatedAt: true },
    });

    return ok({ saved: true, attemptId, ...saved }, "Answer saved");
  });
}
