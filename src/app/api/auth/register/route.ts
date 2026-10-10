/**
 * POST /api/auth/register — Create a student account.
 *
 * Rate limited, Zod-validated and audit-logged. Optional partner referral codes
 * are validated server-side and attributed to a CRM lead in the same database
 * transaction as the account creation.
 */

import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { badRequest, conflict, created, rateLimited, withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeReferralCode } from "@/lib/referral-code";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Invalid email address").max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  name: z.string().min(1).max(100).optional(),
  referralCode: z.string().trim().max(64).regex(/^[a-zA-Z0-9-]+$/).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const ip = getClientIp(req) || "unknown";
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.REGISTER.limit, RATE_LIMITS.REGISTER.windowSec);
    if (!rl.allowed) {
      return rateLimited("Too many registration attempts. Please try again later.");
    }

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { email, password, name } = parsed.data;
    const referralCode = parsed.data.referralCode ? normalizeReferralCode(parsed.data.referralCode) : null;
    if (parsed.data.referralCode && !referralCode) {
      return badRequest("Referral code is invalid");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return conflict("An account with this email already exists");

    const partner = referralCode
      ? await db.partner.findUnique({
          where: { referralCode },
          select: { id: true, status: true },
        })
      : null;
    if (referralCode && (!partner || partner.status !== "ACTIVE")) {
      return badRequest("This referral code is invalid or inactive");
    }

    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name: name || null,
          passwordHash: hashPassword(password),
          role: "STUDENT",
          status: "ACTIVE",
        },
        select: { id: true, email: true, name: true, role: true },
      });

      if (partner) {
        await tx.lead.create({
          data: {
            name: name || email,
            email,
            source: "REFERRAL",
            status: "NEW",
            partnerId: partner.id,
          },
        });
      }

      return createdUser;
    });

    await setSessionCookie(user.id);
    await audit("REGISTER", {
      userId: user.id,
      ipAddress: ip,
      resource: `user:${user.id}`,
      metadata: partner ? { attribution: "REFERRAL", partnerId: partner.id } : undefined,
    });

    return created({ user }, "Account created successfully");
  });
}
