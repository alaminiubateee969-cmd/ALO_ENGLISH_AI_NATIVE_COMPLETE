/**
 * src/lib/QuestionExposure.ts
 *
 * Per-student exposure tracking for the daily-variant anti-repeat system.
 *
 * Every time an attempt is started against a {@link DailyQuestionVariant},
 * a row is written here. The picker ({@link pickNextVariant}) consults
 * these rows to decide which variant the student should draw next:
 *
 *   1. Prefer a variant the student has never seen (across all days — the
 *      unique constraint on `(userId, variantId)` is what makes "seen"
 *      unambiguous even though variants are regenerated daily).
 *   2. If every variant has been seen at least once (e.g. the student has
 *      already taken 5+ sittings today), fall back to the variant whose
 *      most-recent exposure is the oldest — the least-recently-seen one —
 *      so repeat sittings are spaced as far apart as possible.
 *
 * The unique constraint on `(userId, variantId)` makes the exposure record
 * idempotent: the FIRST attempt that draws a variant owns the timestamp,
 * and subsequent attempts that re-draw the same variant (after cycling
 * through all five) leave that timestamp intact. That is by design — the
 * picker uses the original exposure time as the "when did the student last
 * see this" signal.
 */

import type { DailyVariantsBundle, VariantDescriptor } from "@/lib/exam/daily-sets";

type Db = Pick<
  typeof import("@/lib/db").db,
  "attemptVariantExposure"
>;

export type VariantPick = {
  variantId: string;
  variantIndex: number;
  questionIds: string[];
  /**
   * True if the student has never been exposed to this variant. The start
   * route surfaces this in its audit metadata so an operator can see how
   * often the anti-repeat policy lands on a fresh set vs. cycles back.
   */
  isFresh: boolean;
  /**
   * When `isFresh` is false, the timestamp of the most recent prior
   * exposure to this variant. Null for fresh picks. Used by callers for
   * logging/audit only — never for control flow.
   */
  lastSeenAt: Date | null;
};

/**
 * Set of variant IDs this user has already been exposed to. Cheap lookup
 * used by {@link pickNextVariant} to filter the day's five variants.
 */
export async function getExposedVariantIds(
  db: Db,
  userId: string,
  variantIds: readonly string[],
): Promise<Set<string>> {
  if (variantIds.length === 0) return new Set();
  const rows = await db.attemptVariantExposure.findMany({
    where: { userId, variantId: { in: [...variantIds] } },
    select: { variantId: true },
  });
  return new Set(rows.map((r) => r.variantId));
}

/**
 * Most-recent exposure time per variant ID, for the variants given. Used
 * by the fallback picker to choose the least-recently-seen variant.
 */
async function getLastSeenByVariant(
  db: Db,
  userId: string,
  variantIds: readonly string[],
): Promise<Map<string, Date>> {
  if (variantIds.length === 0) return new Map();
  const rows = await db.attemptVariantExposure.findMany({
    where: { userId, variantId: { in: [...variantIds] } },
    select: { variantId: true, createdAt: true },
  });
  const map = new Map<string, Date>();
  for (const r of rows) {
    const prev = map.get(r.variantId);
    if (!prev || r.createdAt > prev) map.set(r.variantId, r.createdAt);
  }
  return map;
}

/**
 * Choose the next variant for a student.
 *
 * 1. If any of the day's variants have not been seen, pick one uniformly
 *    at random from the unseen set. (Random rather than ordered so two
 *    students starting at the same time are not deterministically forced
 *    onto the same variant slot — variety is good even on day one.)
 * 2. Otherwise pick the variant whose most-recent exposure is oldest —
 *    i.e. the one the student has gone longest without re-seeing.
 */
export async function pickNextVariant(
  db: Db,
  userId: string,
  bundle: DailyVariantsBundle,
): Promise<VariantPick> {
  const variantIds = bundle.variants.map((v) => v.id);
  const exposed = await getExposedVariantIds(db, userId, variantIds);

  const fresh = bundle.variants.filter((v) => !exposed.has(v.id));
  if (fresh.length > 0) {
    const pick = fresh[Math.floor(Math.random() * fresh.length)]!;
    return {
      variantId: pick.id,
      variantIndex: pick.variantIndex,
      questionIds: pick.questionIds,
      isFresh: true,
      lastSeenAt: null,
    };
  }

  // All five have been seen — fall back to the least-recently-seen one.
  const lastSeen = await getLastSeenByVariant(db, userId, variantIds);
  const sortedByAgeAsc = [...bundle.variants].sort((a, b) => {
    const ta = lastSeen.get(a.id)?.getTime() ?? 0;
    const tb = lastSeen.get(b.id)?.getTime() ?? 0;
    return ta - tb;
  });
  const pick = sortedByAgeAsc[0]!;
  return {
    variantId: pick.id,
    variantIndex: pick.variantIndex,
    questionIds: pick.questionIds,
    isFresh: false,
    lastSeenAt: lastSeen.get(pick.id) ?? null,
  };
}

/**
 * Record that an attempt used a particular variant. Idempotent: the unique
 * constraint on `(userId, variantId)` makes the first attempt on a variant
 * own the exposure row, and any later attempt that re-draws the same
 * variant (after cycling) leaves the original timestamp intact — which is
 * exactly what the picker needs to keep spacing repeats apart.
 *
 * Must be called inside the same transaction as attempt creation so a
 * failed start cannot leave a dangling exposure row.
 */
export async function recordVariantExposure(
  db: Db,
  args: { userId: string; attemptId: string; variantId: string },
): Promise<void> {
  try {
    await db.attemptVariantExposure.create({
      data: {
        userId: args.userId,
        attemptId: args.attemptId,
        variantId: args.variantId,
      },
    });
  } catch (err) {
    // P2002 = unique constraint violation. Either:
    //   - (userId, variantId) already exists — the student is re-taking a
    //     variant they have already been exposed to (cycled past all 5).
    //     The original exposure row is intentionally preserved.
    //   - attemptId already has an exposure row — should never happen
    //     because the start route is the only writer and runs once per
    //     attempt, but defended anyway.
    // Either way: silent no-op, NOT an error.
    if (!isUniqueConstraintError(err)) throw err;
  }
}

/**
 * Look up the exposure row (if any) for a given attempt. Used by callers
 * that want to surface "you are taking daily variant #N" to the student.
 */
export async function getAttemptVariant(
  db: Db,
  attemptId: string,
): Promise<VariantDescriptor | null> {
  const row = await db.attemptVariantExposure.findUnique({
    where: { attemptId },
    select: {
      variant: {
        select: {
          id: true,
          variantIndex: true,
          questionIds: true,
          questionCount: true,
        },
      },
    },
  });
  if (!row?.variant) return null;
  return {
    id: row.variant.id,
    variantIndex: row.variant.variantIndex,
    questionIds: JSON.parse(row.variant.questionIds) as string[],
    questionCount: row.variant.questionCount,
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "P2002";
}
