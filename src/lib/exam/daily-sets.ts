/**
 * src/lib/exam/daily-sets.ts
 *
 * Daily question-set variant generation — the engine behind the platform's
 * anti-repeat policy.
 *
 * For every (examTypeCode, calendar date) pair, the platform publishes
 * exactly {@link DAILY_VARIANT_COUNT} (5) frozen question-set variants. The
 * same five variants are served to every student on that day, but:
 *
 *   1. Each student is assigned a variant they have NOT seen before
 *      (see {@link pickNextVariant} in ./QuestionExposure.ts). So two
 *      back-to-back attempts by the same student always draw different
 *      question sets.
 *   2. The order of questions inside a variant is re-shuffled per attempt
 *      (see {@link shuffleForAttempt}), so even if a student cycles back to
 *      a previously-seen variant after exhausting all five, the on-screen
 *      question order still differs from their earlier sitting.
 *   3. Variant contents are regenerated each calendar day with a different
 *      deterministic seed ({@link variantSeed}), so yesterday's variant 1
 *      and today's variant 1 are different question sets.
 *
 * Determinism contract
 * --------------------
 * The seed for variant N on day D for exam type E is a stable hash of
 * `${E}|${D}|${N}`. That means every server in a horizontally-scaled
 * deployment, every cold start, and every retry produces the SAME five
 * variants for the same (E, D) pair. Two students who happen to start the
 * same exam on the same day may draw the same variant slot — but they will
 * still see a different on-screen order because the per-attempt shuffle
 * uses {@link Math.random}.
 *
 * The 5 variants are written to the database once (the first time anyone
 * starts an exam of that type on that date) and reused by every subsequent
 * start that day. Generation is idempotent and safe under the start route's
 * transaction.
 */

import { hasAnswerKey } from "./grading";
import {
  listeningAudioRequired,
  hasReadyListeningAudio,
  ListeningAudioNotReadyError,
  QuestionShortageError,
} from "./selection";

type Db = Pick<
  typeof import("@/lib/db").db,
  | "question"
  | "practiceSet"
  | "dailyQuestionSet"
  | "dailyQuestionVariant"
>;

/** Number of variants generated per exam type per day. */
export const DAILY_VARIANT_COUNT = 5;

/** Maximum number of questions a single variant will hold. */
export const MAX_VARIANT_SIZE = 60;

/** Minimum variant size — even tiny banks get at least this many items. */
export const MIN_VARIANT_SIZE = 5;

/**
 * Today's date as a stable `YYYY-MM-DD` string in UTC. Using UTC keeps the
 * "day" boundary deterministic across deployments in different timezones —
 * a student in Dhaka and a student in London who start an exam "today" both
 * draw from the same set of 5 variants.
 */
export function todayStr(now: Date = new Date()): string {
  return now.toISOString().split("T")[0]!;
}

// ─── Seeded PRNG ────────────────────────────────────────────────────────

/**
 * Mulberry32 — a tiny, fast, well-mixed seeded PRNG. Deterministic for a
 * given 32-bit seed. Used so the variant question selection is reproducible
 * across processes and cold starts.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function rand(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string → 32-bit unsigned int. Stable across runtimes. */
function stringSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Stable seed for variant `variantIndex` of `examTypeCode` on `date`.
 * The format `E|D|V` is part of the contract: changing it reshuffles every
 * variant ever generated.
 */
function variantSeed(examTypeCode: string, date: string, variantIndex: number): number {
  return stringSeed(`${examTypeCode}|${date}|${variantIndex}`);
}

/** Fisher-Yates shuffle driven by an injected RNG (seeded or random). */
function shuffle<T>(arr: readonly T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

/**
 * Per-attempt shuffle using {@link Math.random}. This is the second layer
 * of randomness on top of the variant selection — it ensures two attempts
 * on the same variant never present questions in the same on-screen order.
 */
export function shuffleForAttempt<T>(arr: readonly T[]): T[] {
  return shuffle(arr, Math.random);
}

// ─── Variant size policy ────────────────────────────────────────────────

/**
 * Decide how many questions each daily variant should contain.
 *
 *   - Tiny banks (<= 10 questions): serve the whole bank in every variant.
 *     The five variants then differ only by per-attempt order, which is the
 *     best a small bank can offer and still satisfies "different order".
 *   - Small banks (<= 30): serve ~70% so the five variants differ in
 *     selection while leaving each attempt long enough to be a real sitting.
 *   - Medium banks (<= 60): serve ~50%.
 *   - Large banks (> 60): cap at 60 questions per attempt — enough for a
 *     full-length mock without overwhelming a single sitting.
 *
 * The exact subset chosen for each variant is deterministic per
 * (examTypeCode, date, variantIndex), so the five subsets are intentionally
 * different from each other AND different from any other day's subsets.
 */
export function variantSize(poolSize: number): number {
  if (poolSize <= 10) return Math.max(MIN_VARIANT_SIZE, poolSize);
  if (poolSize <= 30) return Math.max(MIN_VARIANT_SIZE, Math.ceil(poolSize * 0.7));
  if (poolSize <= 60) return Math.max(MIN_VARIANT_SIZE, Math.ceil(poolSize * 0.5));
  return MAX_VARIANT_SIZE;
}

// ─── Pool loading ───────────────────────────────────────────────────────

export type GradeablePool = {
  poolIds: string[];
  ungradeableCount: number;
  listeningAudioMissingCount: number;
};

/**
 * Load every gradeable question for a practice set and detect listening
 * questions that lack a READY audio asset. Mirrors the filtering in
 * `selectQuestions` so the daily-variant path and the legacy path agree on
 * what counts as "eligible to serve".
 */
export async function loadGradeablePool(
  db: Db,
  practiceSetId: string,
): Promise<GradeablePool> {
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

  const ungradeable = pool.filter((q) => !hasAnswerKey(q));
  const gradeable = pool.filter((q) => hasAnswerKey(q));
  const listeningAudioMissing = gradeable.filter((q) => !hasReadyListeningAudio(q));

  if (listeningAudioMissing.length > 0 && listeningAudioRequired()) {
    throw new ListeningAudioNotReadyError(listeningAudioMissing.length);
  }

  if (listeningAudioMissing.length > 0) {
    console.warn(
      `[daily-sets] ${listeningAudioMissing.length} listening question(s) on practice set ` +
        `${practiceSetId} have no READY audio; variants will serve them with transcript fallback.`,
    );
  }
  if (ungradeable.length > 0) {
    console.warn(
      `[daily-sets] ${ungradeable.length} question(s) without an answer key on practice set ` +
        `${practiceSetId} were excluded from variant generation.`,
    );
  }

  return {
    poolIds: gradeable.map((q) => q.id),
    ungradeableCount: ungradeable.length,
    listeningAudioMissingCount: listeningAudioMissing.length,
  };
}

// ─── Variant generation ─────────────────────────────────────────────────

export type VariantDescriptor = {
  id: string;
  variantIndex: number;
  questionIds: string[];
  questionCount: number;
};

export type DailyVariantsBundle = {
  dailySetId: string;
  examTypeCode: string;
  date: string;
  variants: VariantDescriptor[];
};

export type EnsureDailyVariantsResult = {
  bundle: DailyVariantsBundle;
  poolSize: number;
  ungradeableCount: number;
  listeningAudioMissingCount: number;
  /** True if the variants were created by this call; false if already present. */
  created: boolean;
};

/**
 * Get-or-create today's {@link DAILY_VARIANT_COUNT} variants for an exam
 * type. Idempotent and safe to call inside a transaction — concurrent
 * attempts on the same exam type reuse the same rows.
 *
 * @throws {QuestionShortageError}    The gradeable pool is empty.
 * @throws {ListeningAudioNotReadyError} Strict listening-audio mode is on
 *   and the pool has listening questions without a READY asset.
 */
export async function ensureDailyVariants(
  db: Db,
  args: { examTypeCode: string; practiceSetId: string },
): Promise<EnsureDailyVariantsResult> {
  const date = todayStr();
  const { examTypeCode, practiceSetId } = args;

  // Fast path: today's set already exists with all 5 variants.
  const existing = await db.dailyQuestionSet.findUnique({
    where: { examTypeCode_date: { examTypeCode, date } },
    include: { variants: { orderBy: { variantIndex: "asc" } } },
  });

  if (existing && existing.variants.length === DAILY_VARIANT_COUNT) {
    return {
      bundle: {
        dailySetId: existing.id,
        examTypeCode,
        date,
        variants: existing.variants.map((v) => ({
          id: v.id,
          variantIndex: v.variantIndex,
          questionIds: JSON.parse(v.questionIds) as string[],
          questionCount: v.questionCount,
        })),
      },
      poolSize: existing.variants[0]?.questionCount ?? 0,
      ungradeableCount: 0,
      listeningAudioMissingCount: 0,
      created: false,
    };
  }

  // Slow path: build the gradeable pool and derive the 5 variants.
  const pool = await loadGradeablePool(db, practiceSetId);
  if (pool.poolIds.length === 0) {
    throw new QuestionShortageError({
      requiredCount: 1,
      eligibleCount: 0,
      poolSize: 0,
      reusedQuestionIds: [],
      reason: "BANK_TOO_SMALL",
    });
  }

  const vSize = variantSize(pool.poolIds.length);
  const variantInputs = Array.from({ length: DAILY_VARIANT_COUNT }, (_, i) => {
    const variantIndex = i + 1;
    const rng = mulberry32(variantSeed(examTypeCode, date, variantIndex));
    // Two passes of seeded shuffle: the first shuffles the whole pool so
    // the slice is a random subset; the second is implicit because each
    // variantIndex produces a different RNG stream. The result is five
    // different subsets of the pool, each in a different seeded order.
    const shuffled = shuffle(pool.poolIds, rng);
    const ids = shuffled.slice(0, vSize);
    return {
      variantIndex,
      practiceSetId,
      questionIds: JSON.stringify(ids),
      questionCount: ids.length,
    };
  });

  let dailySet = existing;
  if (!dailySet) {
    dailySet = await db.dailyQuestionSet.create({
      data: {
        examTypeCode,
        date,
        practiceSetId,
        isGenerated: true,
        variants: { create: variantInputs },
      },
      include: { variants: { orderBy: { variantIndex: "asc" } } },
    });
  } else {
    // The daily-set header row existed (from a legacy generator) but had no
    // (or partial) variants. Fill in the missing variant slots without
    // touching any existing ones — preserving historical rows matters for
    // audit trails even though this code path is rare in practice.
    const existingIndices = new Set(dailySet.variants.map((v) => v.variantIndex));
    const toCreate = variantInputs.filter((v) => !existingIndices.has(v.variantIndex));
    if (toCreate.length > 0) {
      await db.dailyQuestionVariant.createMany({
        data: toCreate.map((v) => ({ ...v, dailySetId: dailySet!.id })),
      });
    }
    dailySet = await db.dailyQuestionSet.findUnique({
      where: { id: dailySet.id },
      include: { variants: { orderBy: { variantIndex: "asc" } } },
    });
    if (!dailySet) {
      throw new Error(`Daily question set disappeared mid-transaction for ${examTypeCode}/${date}`);
    }
  }

  return {
    bundle: {
      dailySetId: dailySet.id,
      examTypeCode,
      date,
      variants: dailySet.variants.map((v) => ({
        id: v.id,
        variantIndex: v.variantIndex,
        questionIds: JSON.parse(v.questionIds) as string[],
        questionCount: v.questionCount,
      })),
    },
    poolSize: pool.poolIds.length,
    ungradeableCount: pool.ungradeableCount,
    listeningAudioMissingCount: pool.listeningAudioMissingCount,
    created: true,
  };
}
