/**
 * POST /api/payment — Purchase additional mock test attempts.
 *
 * Students get 3 free tests. After that, they must pay for more.
 * This endpoint creates a payment record (manual/stripe).
 *
 * Pricing: $2.00 per additional attempt.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({
      attempts: z.number().int().min(1).max(50),
      method: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { attempts, method } = parsed.data;
    const pricePerAttempt = 2.00;
    const amount = attempts * pricePerAttempt;

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount,
        currency: "USD",
        status: "PENDING",
        method: method || "MANUAL",
        attemptsPaid: attempts,
      },
    });

    await audit("PAYMENT_CREATE" as any, {
      userId: user.id,
      resource: "payment:" + payment.id,
      ipAddress: getClientIp(req),
      metadata: { attempts, amount, currency: "USD" },
    });

    return ok({
      payment: {
        id: payment.id,
        amount,
        currency: "USD",
        attempts,
        status: "PENDING",
        pricePerAttempt,
      },
      message: `Payment of $${amount} for ${attempts} additional test attempt(s). Complete payment to activate.`,
    }, "Payment initiated");
  });
}

/**
 * GET /api/payment — View payment history + quota status.
 */
export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const quota = await db.freeQuota.findUnique({ where: { userId: user.id } });
    const payments = await db.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const completedAttempts = await db.attempt.count({
      where: { userId: user.id, status: "SUBMITTED" },
    });

    const paidAttempts = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.attemptsPaid, 0);

    const freeLimit = quota?.attemptsLimit || 3;
    const totalAllowed = freeLimit + paidAttempts;
    const remaining = Math.max(0, totalAllowed - completedAttempts);

    return ok({
      quota: {
        freeLimit,
        attemptsUsed: completedAttempts,
        paidAttempts,
        totalAllowed,
        remaining,
        needsPayment: remaining === 0,
      },
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        attempts: p.attemptsPaid,
        date: p.createdAt,
      })),
    }, "Payment history retrieved");
  });
}
