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
      include: { practiceSet: { include: { questions: true } } },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only submit your own attempt");
    if (attempt.status === "SUBMITTED" || attempt.status === "SCORED") {
      return badRequest("Attempt already submitted");
    }

    // Auto-score objective questions
    const objectiveQuestions = attempt.practiceSet.questions.filter(
      (q) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "FILL_BLANK"
    );
    let objectiveCorrect = 0;
    for (const q of objectiveQuestions) {
      const userAnswer = (answers as Record<string, unknown>)?.objectiveAnswers?.[q.id];
      if (!userAnswer) continue;
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        if (parseInt(String(userAnswer)) === q.correctIndex) objectiveCorrect++;
      } else if (q.type === "FILL_BLANK") {
        if (String(userAnswer).trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) objectiveCorrect++;
      }
    }
    const objectiveTotal = objectiveQuestions.length || 1;

    // Gather writing and speaking answers
    const writingText = attempt.practiceSet.questions
      .filter((q) => q.section === "WRITING" && (answers as Record<string, unknown>)?.[q.id])
      .map((q) => String((answers as Record<string, unknown>)[q.id]))
      .join("\n\n") || ((answers as Record<string, unknown>)?.writing as string) || "";

    const speakingText = attempt.practiceSet.questions
      .filter((q) => q.section === "SPEAKING" && (answers as Record<string, unknown>)?.[q.id])
      .map((q) => String((answers as Record<string, unknown>)[q.id]))
      .join("\n\n") || ((answers as Record<string, unknown>)?.speaking as string) || "";

    // Run the Exam Conductor Agent
    const result = await conductExam(attemptId, {
      writing: writingText,
      speaking: speakingText,
      readingCorrect: objectiveCorrect,
      readingTotal: objectiveTotal,
      listeningCorrect: objectiveCorrect,
      listeningTotal: objectiveTotal,
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
    ExamOrchestrator.onExamSubmitted(attemptId).catch((err) => {
      console.error("[submit] Learning loop trigger failed:", err);
    });

    return ok({ attempt: { id: attemptId, status: result.status }, result }, "Exam evaluated by AI agents");
  });
}
