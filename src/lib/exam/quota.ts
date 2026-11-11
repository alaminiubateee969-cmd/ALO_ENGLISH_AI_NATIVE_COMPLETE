/** Quota helpers shared by attempt creation and the learner quota summary. */

type QuotaDb = Pick<typeof import("@/lib/db").db, "freeQuota">;

/**
 * Platform policy (2026-10-27): every exam, mock and practice feature is free
 * and unlimited, 24/7 — for students, ALO members and visitors alike. There is
 * no paid tier and no attempt ceiling.
 *
 * The FreeQuota row is still kept (and `attemptsUsed` still incremented) so
 * usage analytics keep working, but the limit is set to a value no learner can
 * reach in practice, which makes the quota gate structurally unable to block
 * anyone. Kept below Prisma's Int32 ceiling (2,147,483,647).
 */
export const FREE_PRACTICE_LIMIT = 2_000_000_000;

export function freeAttemptLimitForRole(role: string): number {
  // Role kept for signature compatibility; the free plan is unlimited for all.
  void role;
  return FREE_PRACTICE_LIMIT;
}

/**
 * Reconcile the durable start counter with historical completed attempts.
 * Earlier app versions counted completions in the gate but did not always
 * keep `attemptsUsed` in sync.
 */
export function reconcileAttemptsUsed(attemptsUsed: number, completedAttempts: number): number {
  return Math.max(0, attemptsUsed, completedAttempts);
}

export function quotaSummary(input: {
  attemptsUsed: number;
  attemptsLimit: number;
  paidAttempts: number;
}) {
  const totalAllowed = Math.max(0, input.attemptsLimit) + Math.max(0, input.paidAttempts);
  const attemptsUsed = Math.max(0, input.attemptsUsed);
  return {
    attemptsUsed,
    freeLimit: Math.max(0, input.attemptsLimit),
    paidAttempts: Math.max(0, input.paidAttempts),
    totalAllowed,
    remaining: Math.max(0, totalAllowed - attemptsUsed),
    needsPayment: attemptsUsed >= totalAllowed,
  };
}

/**
 * Reserve exactly one attempt using a conditional database update. Must be
 * called inside the same transaction as attempt creation and question freeze
 * so failed starts roll back the reservation and concurrent starts cannot
 * exceed the available quota.
 */
export async function reserveQuotaAttempt(db: QuotaDb, userId: string, totalAllowed: number): Promise<boolean> {
  if (!Number.isSafeInteger(totalAllowed) || totalAllowed <= 0) return false;
  const result = await db.freeQuota.updateMany({
    where: { userId, attemptsUsed: { lt: totalAllowed } },
    data: { attemptsUsed: { increment: 1 } },
  });
  return result.count === 1;
}
