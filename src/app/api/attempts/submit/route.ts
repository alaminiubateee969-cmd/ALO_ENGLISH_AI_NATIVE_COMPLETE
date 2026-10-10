/**
 * POST /api/attempts/submit — Submit an attempt for grading.
 *
 * Submission is transactional and server-authoritative:
 *   1. the attempt must belong to the caller and still be IN_PROGRESS
 *   2. every answer the client sends is validated against the frozen question
 *      set and persisted, so grading reads from the database — not the request
 *   3. objective questions are graded against the stored correct answers,
 *      per section (listening and reading are scored separately)
 *   4. the attempt is claimed with an atomic `updateMany` guard, which is what
 *      actually prevents double submission and score manipulation
 *   5. only objective listening/reading evidence contributes to a numeric
 *      practice indicator; writing feedback is non-scored and speaking remains unscored
 *
 * If the deadline has passed the attempt is still submitted (with whatever was
 * autosaved) — an expired exam is never left open.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { conductExam } from "@/lib/agents/ExamConductorAgent";
import { computeClock } from "@/lib/exam/timer";
import { loadAttemptAnswers } from "@/lib/exam/questions";
import { gradeObjective, isSubjective, type GradableQuestion } from "@/lib/exam/grading";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  attemptId: z.string().cuid(),
  /** Optional: answers the client still holds in memory (offline autosave). */
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");

    const { attemptId, answers: clientAnswers } = parsed.data;

    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { practiceSet: { select: { durationMin: true, examType: { select: { code: true } } } } },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only submit your own attempt");
    if (attempt.status === "SUBMITTED" || attempt.status === "SCORED") {
      return conflict("This attempt has already been submitted.");
    }

    const clock = computeClock(attempt);

    // ── Persist whatever the client still holds, but only for questions that
    // ── actually belong to this attempt.
    const frozen = await db.attemptQuestion.findMany({
      where: { attemptId },
      select: { questionId: true },
    });
    const frozenIds = new Set(frozen.map((f) => f.questionId));

    if (clientAnswers && !clock.expired) {
      const payload = Object.entries(clientAnswers)
        .filter(([qid, value]) => frozenIds.has(qid) && value !== undefined && value !== null)
        .map(([questionId, value]) => ({
          attemptId,
          questionId,
          answer: typeof value === "string" ? value : JSON.stringify(value),
        }))
        .filter((row) => row.answer.length <= 20000);

      if (payload.length > 0) {
        await db.$transaction(
          payload.map((row) =>
            db.attemptAnswer.upsert({
              where: { attemptId_questionId: { attemptId, questionId: row.questionId } },
              create: row,
              update: { answer: row.answer },
            })
          )
        );
      }
    }

    // ── Grade from the persisted answers.
    const persistedAnswers = await loadAttemptAnswers(db, attemptId);

    const questions = await db.question.findMany({
      where: { id: { in: [...frozenIds] } },
      select: {
        id: true,
        section: true,
        type: true,
        points: true,
        correctAnswer: true,
        correctIndex: true,
        correctIndices: true,
        options: true,
      },
    });

    const graded = gradeObjective(questions as GradableQuestion[], persistedAnswers);

    const listening = graded.bySection.LISTENING ?? { correct: 0, total: 0 };
    const reading = graded.bySection.READING ?? { correct: 0, total: 0 };

    // ── Subjective responses come from the persisted store too.
    const collect = (section: string) =>
      questions
        .filter((q) => q.section.toUpperCase() === section && isSubjective(q) && persistedAnswers[q.id])
        .map((q) => persistedAnswers[q.id])
        .join("\n\n") || "";

    const writingText = collect("WRITING");

    // ── Atomically claim the attempt. This is the real double-submit guard:
    // ── concurrent requests race on this single conditional update.
    const claimed = await db.attempt.updateMany({
      where: { id: attemptId, userId: user.id, status: "IN_PROGRESS" },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    if (claimed.count === 0) {
      return conflict("This attempt has already been submitted.");
    }

    try {
      const result = await conductExam(
        attemptId,
        {
          writing: writingText,
          readingCorrect: reading.correct,
          readingTotal: reading.total,
          listeningCorrect: listening.correct,
          listeningTotal: listening.total,
        },
        { alreadyClaimed: true }
      );

      const ip = getClientIp(req);
      await audit("EXAM_SUBMIT", {
        userId: user.id,
        resource: "attempt:" + attemptId,
        ipAddress: ip,
        metadata: {
          overall: result.overall,
          provider: result.providerUsed,
          confidence: result.confidence,
          expiredAtSubmission: clock.expired,
          listening: listening.correct + "/" + listening.total,
          reading: reading.correct + "/" + reading.total,
          objectiveCorrect: graded.correctTotal + "/" + graded.objectiveTotal,
        },
      });

      if (result.status === "SCORED") {
        await audit("SCORE_GENERATED", {
          userId: user.id,
          resource: "score:" + attemptId,
          metadata: { provider: result.providerUsed, fallback: result.fallbackUsed },
        });
      }

      return ok(
        {
          attempt: { id: attemptId, status: result.status, expiredAtSubmission: clock.expired },
          result,
          objective: {
            correct: graded.correctTotal,
            total: graded.objectiveTotal,
            sections: graded.sections,
          },
        },
        "Exam evaluated"
      );
    } catch (err) {
      // Release the claim so a transient evaluation failure does not lock the attempt.
      await db.attempt
        .update({ where: { id: attemptId }, data: { status: "IN_PROGRESS", submittedAt: null } })
        .catch(() => {});
      throw err;
    }
  });
}
