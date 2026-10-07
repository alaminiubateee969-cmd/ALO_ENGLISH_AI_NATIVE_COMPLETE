/**
 * src/lib/exam/questions.ts
 *
 * Shared, answer-safe question loading.
 *
 * The `select` below is the single source of truth for what a student is
 * allowed to see: it deliberately omits correctAnswer, correctIndex and
 * correctIndices. Every exam read path must go through here so that grading
 * material can never leak into a response.
 */

type Db = typeof import("@/lib/db").db;

export const SAFE_QUESTION_SELECT = {
  id: true,
  section: true,
  type: true,
  prompt: true,
  passage: true,
  audioUrl: true,
  imageUrl: true,
  options: true,
  wordLimit: true,
  points: true,
  order: true,
} as const;

/**
 * Load the frozen question set for an attempt, in the exact order it was
 * served, without any correct-answer fields.
 */
export async function loadAttemptQuestions(db: Db, attemptId: string) {
  const rows = await db.attemptQuestion.findMany({
    where: { attemptId },
    orderBy: { order: "asc" },
    select: {
      order: true,
      section: true,
      question: { select: SAFE_QUESTION_SELECT },
    },
  });

  return rows.map((r) => r.question);
}

/** Load every persisted answer for an attempt as a plain map. */
export async function loadAttemptAnswers(db: Db, attemptId: string): Promise<Record<string, string>> {
  const rows = await db.attemptAnswer.findMany({
    where: { attemptId },
    select: { questionId: true, answer: true },
  });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.questionId] = r.answer;
  return map;
}
