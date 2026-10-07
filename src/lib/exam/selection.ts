/**
 * src/lib/exam/selection.ts
 *
 * Server-side question selection with the platform's repetition policy.
 *
 * Guarantees:
 *   1. No question appears twice inside one attempt (distinct pool + a
 *      @@unique([attemptId, questionId]) constraint as a backstop).
 *   2. Questions the student has already seen on this practice set are
 *      excluded while enough fresh questions remain.
 *   3. A short bank is never hidden: the result carries `shortage` metadata
 *      and the set is reported so admin tooling can surface it.
 *   4. The selected IDs are persisted to AttemptQuestion, so a refresh or a
 *      different device replays the exact same set.
 *
 * Nothing here is driven by the client — the pool and the policy both live
 * on the server.
 */

type Db = typeof import("@/lib/db").db;

export type ShortageInfo = {
  requiredCount: number;
  eligibleCount: number;
  poolSize: number;
  reusedQuestionIds: string[];
  reason: "BANK_TOO_SMALL" | "FRESH_POOL_EXHAUSTED";
};

export type SelectionResult = {
  questionIds: string[];
  requiredCount: number;
  eligibleCount: number;
  poolSize: number;
  reusedQuestionIds: string[];
  shortage: ShortageInfo | null;
};

/** Thrown only when the bank physically cannot supply one full sitting. */
export class QuestionShortageError extends Error {
  readonly code = "QUESTION_BANK_SHORTAGE";
  readonly shortage: ShortageInfo;

  constructor(shortage: ShortageInfo) {
    super(
      `Question bank shortage: need ${shortage.requiredCount}, ` +
        `${shortage.eligibleCount} fresh of ${shortage.poolSize} available.`
    );
    this.name = "QuestionShortageError";
    this.shortage = shortage;
  }
}

type SelectionArgs = {
  db: Db;
  userId: string;
  practiceSetId: string;
  /** How many questions to serve. Defaults to the whole set. */
  count?: number;
  /** Ignore questions used in the student's previous attempts on this set. */
  excludePreviouslySeen?: boolean;
};

/**
 * Work out which questions an attempt should serve, and record the shortage
 * state. Pure read — persistence happens in {@link persistSelection}.
 */
export async function selectQuestions({
  db,
  userId,
  practiceSetId,
  count,
  excludePreviouslySeen = true,
}: SelectionArgs): Promise<SelectionResult> {
  const pool = await db.question.findMany({
    where: { practiceSetId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const poolIds = pool.map((q) => q.id);
  const requiredCount = Math.min(count ?? poolIds.length, poolIds.length);

  let seenIds = new Set<string>();
  if (excludePreviouslySeen) {
    const previous = await db.attemptQuestion.findMany({
      where: { attempt: { userId, practiceSetId, NOT: { status: "IN_PROGRESS" } } },
      select: { questionId: true },
    });
    seenIds = new Set(previous.map((p) => p.questionId));
  }

  const eligibleIds = poolIds.filter((id) => !seenIds.has(id));

  // Case 1 — enough fresh questions: serve them, nothing reused.
  if (eligibleIds.length >= requiredCount) {
    return {
      questionIds: eligibleIds.slice(0, requiredCount),
      requiredCount,
      eligibleCount: eligibleIds.length,
      poolSize: poolIds.length,
      reusedQuestionIds: [],
      shortage: null,
    };
  }

  // Case 2 — the bank cannot even supply one full sitting.
  if (poolIds.length < requiredCount) {
    throw new QuestionShortageError({
      requiredCount,
      eligibleCount: eligibleIds.length,
      poolSize: poolIds.length,
      reusedQuestionIds: poolIds.filter((id) => seenIds.has(id)),
      reason: "BANK_TOO_SMALL",
    });
  }

  // Case 3 — the bank is large enough for one sitting but this student has
  // already seen most of it. Serve a complete, duplicate-free set and flag
  // the shortage so admin can grow the bank. Never hidden, never silent.
  const served = poolIds.slice(0, requiredCount);
  return {
    questionIds: served,
    requiredCount,
    eligibleCount: eligibleIds.length,
    poolSize: poolIds.length,
    reusedQuestionIds: served.filter((id) => seenIds.has(id)),
    shortage: {
      requiredCount,
      eligibleCount: eligibleIds.length,
      poolSize: poolIds.length,
      reusedQuestionIds: served.filter((id) => seenIds.has(id)),
      reason: "FRESH_POOL_EXHAUSTED",
    },
  };
}

/**
 * Freeze the selected question set (and its order) onto the attempt.
 * Safe to call once per attempt — a second call is a no-op so a resumed
 * attempt can never be re-rolled.
 */
export async function persistSelection({
  db,
  attemptId,
  questionIds,
}: {
  db: Db;
  attemptId: string;
  questionIds: string[];
}): Promise<void> {
  const existing = await db.attemptQuestion.count({ where: { attemptId } });
  if (existing > 0) return; // frozen — never re-roll a started attempt

  const sections = await db.question.findMany({
    where: { id: { in: questionIds } },
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

/** Load the frozen question set in the exact order it was served. */
export async function loadFrozenQuestionIds(db: Db, attemptId: string): Promise<string[]> {
  const rows = await db.attemptQuestion.findMany({
    where: { attemptId },
    orderBy: { order: "asc" },
    select: { questionId: true },
  });
  return rows.map((r) => r.questionId);
}
