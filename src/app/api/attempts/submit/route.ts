/**
 * POST /api/attempts/submit - Submit a practice attempt for AI evaluation.
 *
 * Auto-scores objective questions (MC, TF, Fill-blank) against the database.
 * AI-evaluates subjective answers (writing, speaking) via AI agents.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { conductExam } from "@/lib/agents/ExamConductorAgent";
import { ExamOrchestrator } from "@/lib/ai/learning/ExamOrchestrator";
import { z } from "zod";
import { runAgentJob } from "@/lib/agents/AgentJobService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  attemptId: z.string().cuid(),
  answers: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { attemptId, answers } = parsed.data;

    // Verify ownership
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { practiceSet: true, assignedQuestions: { include: { question: true }, orderBy: { position: "asc" } } },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only submit your own attempt");
    if (attempt.status === "SUBMITTED" || attempt.status === "SCORED") {
      return badRequest("Attempt already submitted");
    }

    // Persist all submitted per-question answers before evaluation. Only IDs in
    // this attempt's practice set are accepted; unknown IDs are discarded.
    const payload = (answers || {}) as Record<string, unknown>;
    const objectivePayload = (payload.objectiveAnswers || {}) as Record<string, unknown>;
    const validQuestionIds = new Set(attempt.assignedQuestions.map((item) => item.question).map((q) => q.id));
    const answerMap: Record<string, string> = {};
    for (const [questionId, value] of Object.entries({ ...payload, ...objectivePayload })) {
      if (validQuestionIds.has(questionId) && typeof value === "string" && value.trim()) {
        answerMap[questionId] = value.trim();
      }
    }
    if (Object.keys(answerMap).length) {
      await db.$transaction(Object.entries(answerMap).map(([questionId, answer]) =>
        db.attemptAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId } },
          create: { attemptId, questionId, answer },
          update: { answer, answeredAt: new Date() },
        })
      ));
    }

    const persisted = await db.attemptAnswer.findMany({ where: { attemptId } });
    const persistedByQuestion = new Map(persisted.map((item) => [item.questionId, item.answer]));
    const objectiveQuestions = attempt.assignedQuestions.map((item) => item.question).filter((q) =>
      ["MULTIPLE_CHOICE", "TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "FILL_BLANK", "SHORT_ANSWER", "SENTENCE_COMPLETION"].includes(q.type)
    );
    let objectiveCorrect = 0;
    const gradingWrites: Promise<unknown>[] = [];
    for (const q of objectiveQuestions) {
      const userAnswer = persistedByQuestion.get(q.id);
      if (!userAnswer) continue;
      const expectedText = q.correctAnswer == null ? undefined : String(q.correctAnswer).trim().toLowerCase();
      const correct = q.correctIndex != null
        ? Number(userAnswer) === q.correctIndex
        : Boolean(expectedText && userAnswer.trim().toLowerCase() === expectedText);
      if (correct) objectiveCorrect++;
      gradingWrites.push(db.attemptAnswer.update({
        where: { attemptId_questionId: { attemptId, questionId: q.id } },
        data: { isCorrect: correct, pointsAwarded: correct ? q.points : 0 },
      }));
    }
    if (gradingWrites.length) await db.$transaction(gradingWrites);
    if (persisted.length) {
      const gradedAnswers = await db.attemptAnswer.findMany({ where: { attemptId } });
      await db.$transaction(gradedAnswers.map((answer) => db.studentQuestionHistory.update({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
        data: { answeredAt: new Date(), isCorrect: answer.isCorrect },
      })));
    }
    const sectionStats = (section: string) => {
      const sectionQuestions = objectiveQuestions.filter((q) => q.section === section);
      const correct = sectionQuestions.filter((q) => {
        const answer = persistedByQuestion.get(q.id);
        if (!answer) return false;
        return q.correctIndex != null ? Number(answer) === q.correctIndex :
          Boolean(q.correctAnswer && String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase());
      }).length;
      return { correct, total: sectionQuestions.length };
    };
    const readingStats = sectionStats("READING");
    const listeningStats = sectionStats("LISTENING");

    const writingText = attempt.assignedQuestions.map((item) => item.question)
      .filter((q) => q.section === "WRITING")
      .map((q) => persistedByQuestion.get(q.id) || "").filter(Boolean).join("\n\n");
    const speakingText = attempt.assignedQuestions.map((item) => item.question)
      .filter((q) => q.section === "SPEAKING")
      .map((q) => persistedByQuestion.get(q.id) || "").filter(Boolean).join("\n\n");

    // Run the Exam Conductor Agent
    const result = await conductExam(attemptId, {
      writing: writingText,
      speaking: speakingText,
      readingCorrect: readingStats.correct,
      readingTotal: readingStats.total,
      listeningCorrect: listeningStats.correct,
      listeningTotal: listeningStats.total,
    });

    // Audit log
    const ip = getClientIp(req);
    await audit("EXAM_SUBMIT", {
      userId: user.id,
      resource: "attempt:" + attemptId,
      ipAddress: ip,
      metadata: { overall: result.overall, provider: result.providerUsed, confidence: result.confidence },
    });

    await audit("SCORE_GENERATED", {
      userId: user.id,
      resource: "score:" + attemptId,
      metadata: { provider: result.providerUsed, fallback: result.fallbackUsed, confidence: result.confidence },
    });

    // Trigger the daily learning loop (non-blocking — don't delay the response)
    // This is the "প্রতিদিন তারা শিখবে" (every day they learn) feature.
    ExamOrchestrator.onExamSubmitted(attemptId).catch((err) => console.error("[submit] Learning loop trigger failed:", err));
    const student = await db.student.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (student) {
      runAgentJob("PerformanceAnalyticsAgent", { studentId: student.id, attemptId }).catch((err) => console.error("[agent-job] analytics failed", err));
      runAgentJob("CRMAgent", { studentId: student.id, action: "EXAM_COMPLETED", attemptId, score: result.overall }).catch((err) => console.error("[agent-job] CRM failed", err));
    }

    return ok({ attempt: { id: attemptId, status: result.status }, result }, "Exam evaluated by AI agents");
  });
}
