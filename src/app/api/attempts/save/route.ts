/**
 * POST /api/attempts/save — Persist one answer server-side (autosave).
 *
 * Previously this endpoint validated the request and returned `{saved:true}`
 * without writing anything, so every answer lived only in browser memory and
 * a refresh destroyed the whole attempt. It now upserts into AttemptAnswer.
 *
 * Rules enforced here:
 *   - the attempt must belong to the caller
 *   - the attempt must still be IN_PROGRESS
 *   - the question must belong to the frozen set for this attempt
 *   - the server deadline must not have passed
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { computeClock } from "@/lib/exam/timer";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  attemptId: z.string().cuid(),
  questionId: z.string().cuid(),
  answer: z.string().max(20000),
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
      select: { userId: true, status: true, startedAt: true, expiresAt: true, durationMin: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") return badRequest("Attempt is not in progress");

    const clock = computeClock(attempt);
    if (clock.expired) {
      return badRequest("This attempt has expired and can no longer accept answers.");
    }

    // The question must be part of the frozen set for this attempt.
    const frozen = await db.attemptQuestion.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
      select: { id: true },
    });
    if (!frozen) return badRequest("That question is not part of this attempt");

    const saved = await db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, answer },
      update: { answer },
      select: { questionId: true, updatedAt: true },
    });

    return ok(
      { saved: true, questionId: saved.questionId, updatedAt: saved.updatedAt, remainingSec: clock.remainingSec },
      "Answer saved"
    );
  });
}
