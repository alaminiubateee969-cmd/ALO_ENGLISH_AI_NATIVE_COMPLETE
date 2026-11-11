/** Quota helpers shared by attempt creation and the learner quota summary. */

import { db as defaultDb } from "@/lib/db";

type QuotaDb = Pick<typeof defaultDb, "freeQuota">;

/**
 * Platform policy (user spec): each student gets **3 free mock tests per
 * exam type** using their educational ID, then additional tests require
 * payment. Free quota is tracked per (userId, examTypeCode) — not globally
 * — so a student can sit 3 IELTS-A and 3 TOEFL without paying.
 *
 * The legacy "unlimited free" limit (2 billion) was retired when this file
 * was rewritten for the per-exam-type gate; existing FreeQuota rows were
 * dropped during the migration so the new (userId, examTypeCode) compound
 * key starts from a clean slate.
 */
export const FREE_PRACTICE_LIMIT = 3;

/**
 * Default free attempt limit for a given role. Students get the standard 3
 * per exam type; staff/admin roles bypass the gate by getting a very large
 * ceiling (kept below Prisma's Int32 max so the conditional update in
 * {@link reserveQuotaAttempt} cannot overflow on a 32-bit DB column).
 */
export function freeAttemptLimitForRole(role: string): number {
  const r = (role || "").toUpperCase();
  if (r === "SUPER_ADMIN" || r === "ADMIN") return 2_000_000_000;
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
  examTypeCode?: string;
}) {
  const totalAllowed = Math.max(0, input.attemptsLimit) + Math.max(0, input.paidAttempts);
  const attemptsUsed = Math.max(0, input.attemptsUsed);
  return {
    examTypeCode: input.examTypeCode ?? null,
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
 *
 * Per-exam-type: the conditional update keys on (userId, examTypeCode) so
 * a student burning their last IELTS-A slot cannot also consume the last
 * TOEFL slot in the same transaction.
 */
export async function reserveQuotaAttempt(
  db: QuotaDb,
  userId: string,
  totalAllowed: number,
  examTypeCode: string,
): Promise<boolean> {
  if (!Number.isSafeInteger(totalAllowed) || totalAllowed <= 0) return false;
  if (!examTypeCode) return false;
  const result = await db.freeQuota.updateMany({
    where: {
      userId,
      examTypeCode,
      attemptsUsed: { lt: totalAllowed },
    },
    data: { attemptsUsed: { increment: 1 } },
  });
  return result.count === 1;
}
