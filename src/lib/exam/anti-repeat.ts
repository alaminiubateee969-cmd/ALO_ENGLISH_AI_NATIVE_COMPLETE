/**
 * src/lib/exam/anti-repeat.ts
 *
 * High-level entry point for the platform's anti-repeat selection policy.
 *
 * Composes three pieces:
 *   1. {@link ensureDailyVariants}  — generate (or load) today's 5 frozen
 *      variants for the exam type, each a different seeded subset of the
 *      gradeable question pool.
 *   2. {@link pickNextVariant}      — choose a variant the student has not
 *      seen before (or, if all 5 have been seen, the least-recently-seen
 *      one).
 *   3. {@link shuffleForAttempt}    — re-shuffle the chosen variant's
 *      questions per-attempt so two attempts on the same variant still
 *      present a different on-screen order.
 *
 * Then persists the result onto the attempt as {@link AttemptQuestion}
 * rows (the existing freeze mechanism — a refresh or a different device
 * replays the exact same set) and writes an {@link AttemptVariantExposure}
 * row so the next start knows not to draw the same variant again.
 *
 * The contract is one-transaction atomic: a failed start cannot burn a
 * quota slot, cannot create an attempt, and cannot record an exposure row.
 */

import { ensureDailyVariants, shuffleForAttempt } from "./daily-sets";
import { pickNextVariant, recordVariantExposure } from "@/lib/QuestionExposure";
import type { SelectionResult } from "./selection";

type Db = Pick<
  typeof import("@/lib/db").db,
  | "question"
  | "practiceSet"
  | "examType"
  | "attemptQuestion"
  | "dailyQuestionSet"
  | "dailyQuestionVariant"
  | "attemptVariantExposure"
>;

/**
 * Selection result enriched with anti-repeat bookkeeping. Caller can log
 * `variantIndex`, `isFreshVariant`, and `dailySetDate` to the audit trail
 * so operators can verify the policy is doing what it claims.
 */
export type AntiRepeatSelection = SelectionResult & {
  /** ID of the daily variant this attempt was assigned. */
  variantId: string;
  /** 1..5 — slot within the daily set. */
  variantIndex: number;
  /** True if the student has never seen this variant before. */
  isFreshVariant: boolean;
  /** `YYYY-MM-DD` of the daily set this variant belongs to. */
  dailySetDate: string;
};

/**
 * Resolve the question set for a new attempt under the anti-repeat policy.
 *
 * Pure read — does not mutate the attempt, the daily variants, or the
 * exposure table. {@link persistAntiRepeatSelection} does the writes and
 * must run inside the same transaction.
 *
 * @throws {QuestionShortageError}        The gradeable pool is empty.
 * @throws {ListeningAudioNotReadyError}  Strict listening-audio mode is on
 *   and the pool has listening questions without a READY asset.
 */
export async function selectQuestionsWithAntiRepeat(
  db: Db,
  userId: string,
  practiceSetId: string,
): Promise<AntiRepeatSelection> {
  const practiceSet = await db.practiceSet.findUnique({
    where: { id: practiceSetId },
    select: { id: true, examType: { select: { code: true } } },
  });
  if (!practiceSet) {
    throw new Error(`Practice set ${practiceSetId} not found`);
  }
  const examTypeCode = practiceSet.examType.code;

  const ensured = await ensureDailyVariants(db, { examTypeCode, practiceSetId });
  const pick = await pickNextVariant(db, userId, ensured.bundle);

  // Per-attempt shuffle — the second layer of randomness. The variant's
  // canonical order is deterministic; the on-screen order is not.
  const orderedIds = shuffleForAttempt(pick.questionIds);

  return {
    questionIds: orderedIds,
    ungradeableCount: ensured.ungradeableCount,
    listeningAudioMissingCount: ensured.listeningAudioMissingCount,
    requiredCount: orderedIds.length,
    eligibleCount: pick.questionIds.length,
    poolSize: ensured.poolSize,
    reusedQuestionIds: [],
    shortage: null,
    variantId: pick.variantId,
    variantIndex: pick.variantIndex,
    isFreshVariant: pick.isFresh,
    dailySetDate: ensured.bundle.date,
  };
}

/**
 * Freeze the anti-repeat selection onto an attempt and record the variant
 * exposure. Idempotent on the attempt: a second call (e.g. a resume) is a
 * no-op so a started attempt can never be re-rolled.
 *
 * Must be called inside the same transaction as `Attempt.create` so a
 * failure rolls back the attempt, the frozen questions, and the exposure
 * row together.
 */
export async function persistAntiRepeatSelection(
  db: Db,
  args: { attemptId: string; userId: string; selection: AntiRepeatSelection },
): Promise<void> {
  await persistQuestionOrder(db, args.attemptId, args.selection.questionIds);
  await recordVariantExposure(db, {
    userId: args.userId,
    attemptId: args.attemptId,
    variantId: args.selection.variantId,
  });
}

/**
 * Freeze the question IDs (in their per-attempt shuffled order) onto the
 * attempt as {@link AttemptQuestion} rows. Mirrors `persistSelection` in
 * ./selection.ts — kept here as a private helper so the anti-repeat path
 * has no cyclic dependency on the legacy selection module.
 */
async function persistQuestionOrder(
  db: Db,
  attemptId: string,
  questionIds: readonly string[],
): Promise<void> {
  const existing = await db.attemptQuestion.count({ where: { attemptId } });
  if (existing > 0) return; // frozen — never re-roll a started attempt

  if (questionIds.length === 0) return;

  const sections = await db.question.findMany({
    where: { id: { in: [...questionIds] } },
    select: { id: true, section: true },
  });
  const sectionById = new Map(sections.map((q) => [q.id, q.section]));

  await db.attemptQuestion.createMany({
    data: questionIds.map((questionId, index) => ({
      attemptId,
      questionId,
      order: index,
      section: sectionById.get(questionId) ?? "GENERAL",
    })),
  });
}
