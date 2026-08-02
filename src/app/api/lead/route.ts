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
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required").max(254),
  phone: z.string().min(1, "Phone is required").max(30),
  exam: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  intake: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
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

    // Persist to database
    const lead = await db.lead.create({
      data: {
        name,
        email,
        phone,
        source: source || "WEBSITE",
        status: "NEW",
        country: country || null,
        courseInterest: exam || null,
        intake: intake || null,
        notes: message || null,
      },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });

    await audit("LEAD_CREATE", {
      resource: "lead:" + lead.id,
      ipAddress: ip,
      metadata: { source: source || "WEBSITE", email },
    });

    return ok({ lead }, "Lead captured successfully");
  });
}
