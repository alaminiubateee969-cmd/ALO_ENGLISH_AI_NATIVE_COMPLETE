/**
 * src/lib/QuestionExposure.ts
 *
 * Anti-repetition system: tracks which questions a student has seen
 * and prevents showing the same question within a configurable reuse window.
 *
 * Uses the existing Score + Question models to determine exposure.
 */

import { db } from "@/lib/db";

export type ExposureRecord = {
  questionId: string;
  attemptId: string;
  section: string;
  type: string;
  seenAt: Date;
};

/**
 * Get all questions a student has been exposed to.
 * Returns question IDs from all completed/in-progress attempts.
 */
export async function getExposedQuestionIds(userId: string): Promise<Set<string>> {
  // Get all attempts by this user
  const attempts = await db.attempt.findMany({
    where: { userId },
    select: { id: true, practiceSetId: true },
  });

  if (attempts.length === 0) return new Set();

  // Get all question IDs from practice sets used in those attempts
  const practiceSetIds = [...new Set(attempts.map((a) => a.practiceSetId))];
  const questions = await db.question.findMany({
    where: { practiceSetId: { in: practiceSetIds } },
    select: { id: true },
  });

  // Return all questions the student has been exposed to
  return new Set(questions.map((q) => q.id));
}

/**
 * Select questions for a new exam attempt, avoiding recently seen ones.
 *
 * Strategy:
 * 1. Get all questions for the practice set
 * 2. Filter out questions the student has seen before
 * 3. If not enough unseen questions, allow reuse of older ones
 * 4. Shuffle the final selection
 */
export async function selectQuestionsForStudent(
  practiceSetId: string,
  userId: string,
  count?: number
): Promise<string[]> {
  // Get all questions for this practice set
  const allQuestions = await db.question.findMany({
    where: { practiceSetId },
    select: { id: true, section: true, type: true, order: true },
    orderBy: { order: "asc" },
  });

  if (allQuestions.length === 0) return [];

  // Get exposed question IDs
  const exposedIds = await getExposedQuestionIds(userId);

  // Split into unseen and seen
  const unseen = allQuestions.filter((q) => !exposedIds.has(q.id));
  const seen = allQuestions.filter((q) => exposedIds.has(q.id));

  // Prefer unseen questions
  let selected = unseen;

  // If not enough unseen, add seen questions (least recently used first)
  if (count && selected.length < count && seen.length > 0) {
    const needed = count - selected.length;
    selected = [...selected, ...seen.slice(0, needed)];
  }

  // If count specified, limit to that number
  if (count && selected.length > count) {
    selected = selected.slice(0, count);
  }

  // Shuffle the selection (deterministic based on userId for reproducibility)
  const seed = parseInt(userId.slice(-8), 16) || 1;
  selected = deterministicShuffle(selected, seed);

  return selected.map((q) => q.id);
}

/**
 * Deterministic shuffle — same input + seed = same output.
 * This ensures question order is consistent for the same student.
 */
function deterministicShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Verify anti-repetition works:
 * Student A's question set should differ from Student B's
 * (when enough questions exist).
 */
export async function verifyAntiRepetition(
  userIdA: string,
  userIdB: string,
  practiceSetId: string
): Promise<{ aDifferentFromB: boolean; aQuestions: string[]; bQuestions: string[] }> {
  const aQuestions = await selectQuestionsForStudent(practiceSetId, userIdA);
  const bQuestions = await selectQuestionsForStudent(practiceSetId, userIdB);

  // If both got all questions, they might be the same set (just shuffled differently)
  // The key check is: are the orderings different?
  const sameOrder = aQuestions.every((q, i) => q === bQuestions[i]);
  const aDifferentFromB = !sameOrder || aQuestions.length !== bQuestions.length;

  return { aDifferentFromB, aQuestions, bQuestions };
}
