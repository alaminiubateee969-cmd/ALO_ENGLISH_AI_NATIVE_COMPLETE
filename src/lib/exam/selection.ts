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
 *   3. If an internal caller specifies a required count and the bank cannot
 *      meet it, selection fails rather than silently shortening the session.
 *      The public start route serves the complete gradeable set; this is not
 *      evidence that the set matches an official exam's length or blueprint.
 *   4. The selected IDs are persisted to AttemptQuestion, so a refresh or a
 *      different device replays the exact same set.
 *
 * Nothing here is driven by the client — the pool and the policy both live
 * on the server.
 */

import { hasAnswerKey } from "./grading";

type Db = Pick<typeof import("@/lib/db").db, "question" | "attemptQuestion">;

export type ShortageInfo = {
  requiredCount: number;
  eligibleCount: number;
  poolSize: number;
  reusedQuestionIds: string[];
  reason: "BANK_TOO_SMALL" | "FRESH_POOL_EXHAUSTED";
};

export type SelectionResult = {
  questionIds: string[];
  /** Questions in the set that carry no answer key and were excluded. */
  ungradeableCount: number;
  /**
   * Gradeable LISTENING questions served without a READY verified audio
   * asset. In transcript-fallback mode (the default) these questions are
   * still served — the student reads the listening script — and the count
   * is surfaced to the client and the audit log so the gap is disclosed,
   * never silent. In strict mode selection throws instead (see
   * {@link listeningAudioRequired}).
   */
  listeningAudioMissingCount: number;
  requiredCount: number;
  eligibleCount: number;
  poolSize: number;
  reusedQuestionIds: string[];
  shortage: ShortageInfo | null;
};

/**
 * Should a listening question without verified audio block the attempt?
 *
 * Strict mode (`EXAM_REQUIRE_LISTENING_AUDIO=1`) refuses to start any
 * paper whose listening questions lack a READY audio asset. That is the
 * right posture for a deployment that has run `npm run audio:generate`
 * and wants real-exam fidelity. It is the wrong default for every other
 * deployment: this repository ships zero audio assets, so under a strict
 * default NO paper containing a listening question could ever start on a
 * fresh install — the exam system would be present but unusable.
 *
 * The default is therefore transcript fallback: serve the question, show
 * the listening script (see `redactListeningTranscript`), and report the
 * missing-audio count in the selection result. Audio generation remains
 * available (`npm run audio:generate` + `audio:verify`) and any operator
 * who completes it can flip strict mode on.
 */
export function listeningAudioRequired(): boolean {
  const raw = process.env.EXAM_REQUIRE_LISTENING_AUDIO?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Thrown when the bank cannot supply the server-selected session count. */
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

export class ListeningAudioNotReadyError extends Error {
  readonly code = "LISTENING_AUDIO_NOT_READY";

  constructor(readonly questionCount: number) {
    super(`${questionCount} gradeable listening question(s) do not have a matching READY audio asset.`);
    this.name = "ListeningAudioNotReadyError";
  }
}

export function hasReadyListeningAudio(question: {
  section: string;
  audioUrl?: string | null;
  audioAsset?: { status?: string | null; location?: string | null; verifiedAt?: Date | null } | null;
}): boolean {
  if (question.section.toUpperCase() !== "LISTENING") return true;
  const audioUrl = question.audioUrl?.trim();
  return Boolean(
    audioUrl &&
    question.audioAsset?.status === "READY" &&
    question.audioAsset.location === audioUrl &&
    question.audioAsset.verifiedAt,
  );
}

type SelectionArgs = {
  db: Db;
  userId: string;
  practiceSetId: string;
  /** Internal policy count. Defaults to the whole gradeable set (not an official-length assertion). */
  count?: number;
  /** Ignore questions used in the student's previous attempts on this set. */
  excludePreviouslySeen?: boolean;
  /**
   * Refuse papers whose listening questions lack READY audio instead of
   * serving them with the transcript fallback. Defaults to
   * {@link listeningAudioRequired} (env-driven, default off).
   */
  requireListeningAudio?: boolean;
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
  requireListeningAudio = listeningAudioRequired(),
}: SelectionArgs): Promise<SelectionResult> {
  const pool = await db.question.findMany({
    where: { practiceSetId },
    orderBy: [{ order: "asc" }, { id: "asc" }],
    select: {
      id: true,
      section: true,
      type: true,
      audioUrl: true,
      audioAsset: { select: { status: true, location: true, verifiedAt: true } },
      correctAnswer: true,
      correctIndex: true,
      correctIndices: true,
    },
  });

  // A question with no answer key can never be marked correct, so it must
  // never be served. Skipping it here is what keeps an attempt gradeable.
  const ungradeable = pool.filter((q) => !hasAnswerKey(q));
  const gradeable = pool.filter((q) => hasAnswerKey(q));
  const listeningAudioUnavailable = gradeable.filter((q) => !hasReadyListeningAudio(q));
  if (listeningAudioUnavailable.length > 0 && requireListeningAudio) {
    throw new ListeningAudioNotReadyError(listeningAudioUnavailable.length);
  }
  const listeningAudioMissingCount = listeningAudioUnavailable.length;
  if (listeningAudioMissingCount > 0) {
    console.warn(
      `[selection] ${listeningAudioMissingCount} listening question(s) have no READY audio asset; ` +
        "serving with transcript fallback (set EXAM_REQUIRE_LISTENING_AUDIO=1 to block instead).",
    );
  }
  if (ungradeable.length > 0) {
    console.warn(
      `[selection] ${ungradeable.length} question(s) without an answer key were excluded: ` +
        ungradeable.slice(0, 5).map((q) => q.id).join(", ")
    );
  }

  const poolIds = gradeable.map((q) => q.id);
  // Deliberately NOT clamped to the pool size: asking for more questions
  // than the bank holds is a real shortage and must surface as one, not be
  // quietly downgraded to a shorter paper.
  // An empty gradeable pool must fail closed instead of creating a blank
  // attempt. A normal (unspecified) sitting requires every gradeable item, or
  // at least one item when the pool is empty so the shortage is explicit.
  const requiredCount = count ?? Math.max(1, poolIds.length);

  let seenIds = new Set<string>();
  if (excludePreviouslySeen) {
    const previous = await db.attemptQuestion.findMany({
      where: { attempt: { userId, practiceSetId, NOT: { status: "IN_PROGRESS" } } },
      select: { questionId: true },
    });
    seenIds = new Set(previous.map((p) => p.questionId));
  }

  const eligibleIds = poolIds.filter((id) => !seenIds.has(id));

  // Case 2 — the bank cannot supply the server-selected session count. Never
  // downgrade it to a shorter set; official-format length remains a separate
  // content-validation/release requirement.
  if (poolIds.length < requiredCount) {
    throw new QuestionShortageError({
      requiredCount,
      eligibleCount: eligibleIds.length,
      poolSize: poolIds.length,
      reusedQuestionIds: poolIds.filter((id) => seenIds.has(id)),
      reason: "BANK_TOO_SMALL",
    });
  }

  // Case 1 — enough fresh questions: serve them, nothing reused.
  if (eligibleIds.length >= requiredCount) {
    return {
      questionIds: eligibleIds.slice(0, requiredCount),
      ungradeableCount: ungradeable.length,
      listeningAudioMissingCount,
      requiredCount,
      eligibleCount: eligibleIds.length,
      poolSize: poolIds.length,
      reusedQuestionIds: [],
      shortage: null,
    };
  }

  // Case 3 — the bank is large enough for one sitting but this student has
  // already seen most of it. Serve a complete, duplicate-free set and flag
  // the shortage so admin can grow the bank. Never hidden, never silent.
  const served = poolIds.slice(0, requiredCount);
  return {
    questionIds: served,
    ungradeableCount: ungradeable.length,
    listeningAudioMissingCount,
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
