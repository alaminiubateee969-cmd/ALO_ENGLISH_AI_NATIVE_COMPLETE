/**
 * POST /api/payment/wallet — Record a mobile-wallet payment intent.
 *
 * Accepts a Bangladeshi mobile-wallet payment report (bKash / Nagad / Rocket /
 * Upay) from an authenticated candidate and persists a PENDING `Payment` row.
 *
 * IMPORTANT — same posture as POST /api/payment:
 *   This deployment has NO verified provider webhook, so the row is created
 *   with `status = "PENDING"` only. No attempt credit (`attemptsPaid`) is
 *   granted. A staff member must verify the transaction id against the
 *   wallet provider's merchant panel and flip the row to COMPLETED, at which
 *   point the existing quota logic reads it as paid attempts.
 *
 * Request body (JSON):
 *   walletType:     "BKASH" | "NAGAD" | "ROCKET" | "UPAY"
 *   transactionId:  6–16 char alphanumeric (the wallet SMS/app code)
 *   senderNumber:   BD mobile number (01XXXXXXXXX or +8801XXXXXXXXX)
 *   courseId?:      optional cuid — if present, the course's tuitionFee is
 *                   used as the amount/currency snapshot. If absent or the
 *                   course has no fee, the amount is 0 and currency BDT.
 *
 * The route is rate-limited per user (5 submissions / 15 min) to prevent a
 * flooded queue of fake transaction ids.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import {
  badRequest,
  created,
  rateLimited,
  withErrorHandler,
} from "@/lib/responses";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4 * 1024; // 4 KB — body is small, no PII blobs.

const WALLET_LABELS: Record<string, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket (DBBL)",
  UPAY: "Upay",
};

const schema = z.object({
  walletType: z.enum(["BKASH", "NAGAD", "ROCKET", "UPAY"]),
  transactionId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9]{6,16}$/,
      "Transaction ID must be 6–16 letters or digits.",
    ),
  senderNumber: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .refine((n) => /^(?:\+?8801|01)\d{9}$/.test(n), {
      message: "Sender number must be a valid 11-digit BD mobile number.",
    }),
  courseId: z.string().trim().length(25).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    // Per-user rate limit — a candidate cannot flood the verifier queue.
    const rl = rateLimit(
      `wallet-pay:${user.id}`,
      Math.min(RATE_LIMITS.API_MUTATING.limit, 5),
      900, // 15 min window
    );
    if (!rl.allowed) {
      return rateLimited(
        "Too many payment submissions. Please wait a few minutes before trying again.",
      );
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_BODY_BYTES);
    } catch {
      return badRequest("Invalid or too-large JSON body.");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return badRequest(first?.message || "Validation failed.");
    }

    const { walletType, transactionId, senderNumber, courseId } = parsed.data;

    // If a courseId is provided, snapshot the course tuitionFee as the
    // payment amount + currency. This is the value staff will verify the
    // candidate actually sent. If the course is missing or has no fee, the
    // amount defaults to 0 and the currency to BDT.
    let amount = 0;
    let currency = "BDT";
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { tuitionFee: true, currency: true, name: true },
      });
      if (course) {
        amount = course.tuitionFee ?? 0;
        currency = course.currency || "BDT";
      }
    }

    // Dedupe: reject an exact (user, walletType, txnId) re-submission within
    // the last 24h. Prevents a double-click from creating two PENDING rows
    // for the same transaction id, which would confuse the verifier.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await db.payment.findFirst({
      where: {
        userId: user.id,
        method: walletType,
        txnId: transactionId,
        createdAt: { gte: since },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      // Idempotent: return the existing row as a 201 so the client treats it
      // as success. The verifier sees one row, not two.
      return created(
        {
          id: existing.id,
          status: existing.status,
          duplicate: true,
        },
        "This transaction ID was already submitted — showing the existing record.",
      );
    }

    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount,
        currency,
        status: "PENDING",
        method: walletType,
        attemptsPaid: 0,
        txnId: transactionId,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        txnId: true,
        attemptsPaid: true,
        createdAt: true,
      },
    });

    // Best-effort audit (no PII): log the wallet type, payment id and the
    // client IP. The transaction id and sender number are NOT logged here —
    // they live on the Payment row, which staff access through the verifier
    // panel, not the audit log.
    const ip = getClientIp(req);
    console.info(
      "[payment-wallet]",
      `user=${user.id}`,
      `wallet=${walletType}`,
      `payment=${payment.id}`,
      `ip=${ip ?? "unknown"}`,
    );

    return created(
      {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        methodLabel: WALLET_LABELS[payment.method] ?? payment.method,
        txnId: payment.txnId,
        createdAt: payment.createdAt,
        attemptsPaid: payment.attemptsPaid,
        // Re-state the posture to the client: nothing has been granted yet.
        verified: false,
      },
      "Payment recorded as PENDING. A staff member must verify it before attempt credit is added.",
    );
  });
}
