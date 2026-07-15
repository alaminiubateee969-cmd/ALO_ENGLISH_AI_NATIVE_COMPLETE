import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answerText: z.string().optional().nullable(),
        answerJson: z.unknown().optional().nullable(),
        audioPath: z.string().optional().nullable(),
      }),
    )
    .min(0),
  timeUsedSec: z.number().int().nonnegative().optional(),
});

/**
 * POST /api/exam-attempts/[id]/submit
 *
 * Submit answers for an in-progress exam attempt. The handler:
 *   1. Validates ownership (the attempt belongs to the calling student).
 *   2. Persists each ExamAnswer row.
 *   3. Auto-grades objective questions (MCQ / TRUE_FALSE_NOT_GIVEN /
 *      FILL_BLANK / NUMERIC / MATCHING) by comparing against the
 *      stored correct answer.
 *   4. Aggregates section + overall scores.
 *   5. Marks the attempt SUBMITTED and creates an ExamResult row.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, userId: true } },
        examType: {
          select: {
            id: true,
            name: true,
            sections: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Owner check: students can only submit their own attempts.
    if (
      session.user.role === "STUDENT" &&
      attempt.student.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (attempt.status === "SUBMITTED" || attempt.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Attempt already submitted" },
        { status: 409 },
      );
    }

    // Fetch all referenced questions for grading.
    const questionIds = parsed.data.answers.map((a) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        sectionId: true,
        type: true,
        correctAnswer: true,
        correctIndices: true,
        numericAnswer: true,
        scoreValue: true,
      },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    // Build per-answer grade records.
    const sectionScores = new Map<string, { earned: number; possible: number }>();
    let overallEarned = 0;
    let overallPossible = 0;

    const answerRows = parsed.data.answers.map((a) => {
      const q = qMap.get(a.questionId);
      let isCorrect: boolean | null = null;
      let scoreAwarded: number | null = null;

      if (q) {
        const possible = q.scoreValue ?? 1;
        const section = sectionScores.get(q.sectionId) ?? { earned: 0, possible: 0 };
        section.possible += possible;
        overallPossible += possible;

        // Auto-grade objective question types only.
        if (
          q.type === "MULTIPLE_CHOICE" ||
          q.type === "TRUE_FALSE_NOT_GIVEN" ||
          q.type === "FILL_BLANK" ||
          q.type === "NUMERIC" ||
          q.type === "MATCHING"
        ) {
          const ok = gradeObjective(q, a.answerJson, a.answerText);
          if (ok !== null) {
            isCorrect = ok;
            scoreAwarded = ok ? possible : 0;
            if (ok) {
              section.earned += possible;
              overallEarned += possible;
            }
          }
        } else {
          // ESSAY / SPEAKING / SHORT_ANSWER / DESCRIPTIVE → human review.
          isCorrect = null;
          scoreAwarded = null;
        }

        sectionScores.set(q.sectionId, section);
      }

      return {
        attemptId: id,
        questionId: a.questionId,
        answerText: a.answerText ?? null,
        answerJson: (a.answerJson as never) ?? null,
        audioPath: a.audioPath ?? null,
        isCorrect,
        scoreAwarded,
      };
    });

    // Compute percentages.
    const overallScore =
      overallPossible > 0 ? Math.round((overallEarned / overallPossible) * 100 * 100) / 100 : 0;

    const sectionBreakdown: Record<string, number | null> = {};
    for (const section of attempt.examType.sections) {
      const s = sectionScores.get(section.id);
      sectionBreakdown[section.name] = s && s.possible > 0
        ? Math.round((s.earned / s.possible) * 100 * 100) / 100
        : null;
    }

    const bandEstimate = estimateBand(overallScore);
    const cefrEstimate = estimateCefr(overallScore);

    const submittedAt = new Date();

    // Persist everything inside a single transaction.
    const [updatedAttempt, result] = await prisma.$transaction(async (tx) => {
      // Upsert answers (one per question per attempt via @@unique).
      if (answerRows.length > 0) {
        await tx.examAnswer.createMany({
          data: answerRows,
          skipDuplicates: true,
        });
      }

      const updated = await tx.examAttempt.update({
        where: { id },
        data: {
          status: "SUBMITTED",
          submittedAt,
          timeUsedSec: parsed.data.timeUsedSec ?? attempt.timeUsedSec,
          overallScore,
          bandEstimate,
          cefrEstimate,
        },
      });

      const examResult = await tx.examResult.create({
        data: {
          resultCode: generateCode("RES"),
          attemptId: id,
          studentId: attempt.studentId,
          examTypeId: attempt.examTypeId,
          overallScore,
          listeningScore: sectionBreakdown["Listening"] ?? null,
          readingScore: sectionBreakdown["Reading"] ?? null,
          writingScore: sectionBreakdown["Writing"] ?? null,
          speakingScore: sectionBreakdown["Speaking"] ?? null,
          bandEstimate,
          cefrEstimate,
        },
      });

      return [updated, examResult] as const;
    });

    return NextResponse.json({ data: { attempt: updatedAttempt, result } });
  } catch (err) {
    console.error("[POST /api/exam-attempts/:id/submit] failed:", err);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}

/**
 * Attempt to auto-grade an objective question. Returns `null` when
 * grading is not possible (e.g. the stored correct answer is missing).
 */
function gradeObjective(
  q: {
    type: string;
    correctAnswer: unknown;
    correctIndices: number[] | null;
    numericAnswer: number | null;
  },
  answerJson: unknown,
  answerText: string | null | undefined,
): boolean | null {
  if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "MATCHING") {
    const correct = q.correctAnswer;
    if (typeof correct === "number") {
      if (typeof answerJson === "number") return answerJson === correct;
      const parsed = Number(answerText);
      if (!Number.isNaN(parsed)) return parsed === correct;
    }
    if (Array.isArray(q.correctIndices) && Array.isArray(answerJson)) {
      const ai = answerJson as unknown[];
      if (ai.length !== q.correctIndices.length) return false;
      return q.correctIndices.every((idx, i) => idx === Number(ai[i]));
    }
    return null;
  }

  if (q.type === "FILL_BLANK" || q.type === "SHORT_ANSWER") {
    if (typeof q.correctAnswer !== "string") return null;
    const given = typeof answerJson === "string"
      ? answerJson
      : (answerText ?? "").trim();
    return given.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
  }

  if (q.type === "NUMERIC") {
    if (q.numericAnswer === null || q.numericAnswer === undefined) return null;
    const raw = typeof answerJson === "number"
      ? answerJson
      : Number(answerText);
    if (Number.isNaN(raw)) return false;
    return Math.abs(raw - q.numericAnswer) < 0.001;
  }

  return null;
}

/** Map a 0–100 percentage score to an IELTS band estimate. */
function estimateBand(pct: number): string {
  if (pct >= 90) return "8.5-9.0";
  if (pct >= 80) return "7.5-8.0";
  if (pct >= 70) return "6.5-7.0";
  if (pct >= 55) return "5.5-6.0";
  if (pct >= 40) return "4.5-5.0";
  return "<4.5";
}

/** Map a 0–100 percentage score to a CEFR level estimate. */
function estimateCefr(pct: number): string {
  if (pct >= 85) return "C1";
  if (pct >= 70) return "B2";
  if (pct >= 55) return "B1";
  if (pct >= 40) return "A2";
  return "A1";
}
