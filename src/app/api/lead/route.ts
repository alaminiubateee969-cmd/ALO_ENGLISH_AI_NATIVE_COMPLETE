/**
 * POST /api/lead — Public lead capture form.
 *
 * Validates input and persists to the database (Lead table).
 * Rate limited to prevent abuse.
 */

import { db } from "@/lib/db";
import { ok, badRequest, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeReferralCode } from "@/lib/referral-code";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(254),
  phone: z.string().trim().max(30).optional(),
  exam: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  intake: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
  referralCode: z.string().trim().max(64).regex(/^[a-zA-Z0-9-]+$/).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Rate limit: 5 lead submissions per hour per IP
    const ip = getClientIp(req) || "unknown";
    const rl = rateLimit(`lead:${ip}`, 5, 3600);
    if (!rl.allowed) {
      return rateLimited("Too many submissions. Please try again later.");
    }

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { name, email, phone, exam, country, intake, message, source } = parsed.data;
    const referralCode = parsed.data.referralCode ? normalizeReferralCode(parsed.data.referralCode) : null;
    if (parsed.data.referralCode && !referralCode) {
      return badRequest("Referral code is invalid");
    }

    const partner = referralCode
      ? await db.partner.findUnique({ where: { referralCode }, select: { id: true, status: true } })
      : null;
    if (referralCode && (!partner || partner.status !== "ACTIVE")) {
      return badRequest("This referral code is invalid or inactive");
    }

    const effectiveSource = partner ? "REFERRAL" : source || "WEBSITE";
    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone,
        source: effectiveSource,
        status: "NEW",
        country: country || null,
        courseInterest: exam || null,
        intake: intake || null,
        notes: message || null,
        partnerId: partner?.id ?? null,
      },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });

    await audit("LEAD_CREATE", {
      resource: "lead:" + lead.id,
      ipAddress: ip,
      metadata: { source: effectiveSource, email, partnerId: partner?.id },
    });

    return ok({ lead }, "Lead captured successfully");
  });
}
