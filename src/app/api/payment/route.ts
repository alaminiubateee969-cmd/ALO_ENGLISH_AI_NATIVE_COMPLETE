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
    const [quota, payments, completedAttempts, paidAggregate] = await Promise.all([
      db.freeQuota.findUnique({ where: { userId: user.id } }),
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

    const freeLimit = quota?.attemptsLimit ?? freeAttemptLimitForRole(user.role);
    const attemptsUsed = reconcileAttemptsUsed(quota?.attemptsUsed ?? 0, completedAttempts);
    const summary = quotaSummary({
      attemptsUsed,
      attemptsLimit: freeLimit,
      paidAttempts: paidAggregate._sum.attemptsPaid ?? 0,
    });

    return ok(
      {
        quota: summary,
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
