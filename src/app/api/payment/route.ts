/**
 * Payment endpoints for additional practice attempts.
 *
 * GET reports persisted quota and payment records. POST is intentionally
 * blocked: this deployment has no verified provider checkout/webhook flow, so
 * creating a PENDING row would not constitute a payment and must not reserve
 * or grant attempts.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, serviceUnavailable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { freeAttemptLimitForRole, quotaSummary, reconcileAttemptsUsed } from "@/lib/exam/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireAuth();
    return serviceUnavailable(
      "Online attempt purchases are unavailable. No payment or attempt credit was created; a payment provider and verified webhook are required.",
    );
  });
}

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const [quotaRows, payments, completedAttempts, paidAggregate] = await Promise.all([
      // FreeQuota is now keyed by (userId, examTypeCode), so a student has
      // one row per exam type they have ever started. The dashboard shows
      // them all so the learner can see "3/3 IELTS-A used, 1/3 TOEFL used".
      db.freeQuota.findMany({
        where: { userId: user.id },
        orderBy: { examTypeCode: "asc" },
        select: { id: true, examTypeCode: true, attemptsUsed: true, attemptsLimit: true, isAloStudent: true, updatedAt: true },
      }),
      db.payment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, currency: true, status: true, attemptsPaid: true, createdAt: true },
      }),
      db.attempt.count({
        where: { userId: user.id, status: { in: ["SUBMITTED", "SCORED"] } },
      }),
      db.payment.aggregate({
        where: { userId: user.id, status: "COMPLETED" },
        _sum: { attemptsPaid: true },
      }),
    ]);

    const defaultLimit = freeAttemptLimitForRole(user.role);
    const perExamType = quotaRows.map((row) =>
      quotaSummary({
        attemptsUsed: reconcileAttemptsUsed(row.attemptsUsed, completedAttempts),
        attemptsLimit: row.attemptsLimit,
        paidAttempts: paidAggregate._sum.attemptsPaid ?? 0,
        examTypeCode: row.examTypeCode,
      }),
    );

    // Aggregate summary across every exam type the student has touched.
    // `attemptsUsed` is summed, `freeLimit` is summed (so the dashboard can
    // show "you have used 4 of 6 free mock tests across 2 exam types").
    // `paidAttempts` is the global total of completed payments — payments
    // are not yet scoped to a single exam type (see start/route.ts note).
    const aggregate = quotaSummary({
      attemptsUsed: perExamType.reduce((sum, q) => sum + q.attemptsUsed, 0),
      attemptsLimit: perExamType.length > 0
        ? perExamType.reduce((sum, q) => sum + q.freeLimit, 0)
        : defaultLimit,
      paidAttempts: paidAggregate._sum.attemptsPaid ?? 0,
    });

    return ok(
      {
        quota: aggregate,
        perExamType,
        payments: payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          attempts: payment.attemptsPaid,
          date: payment.createdAt,
        })),
      },
      "Payment history retrieved",
    );
  });
}
