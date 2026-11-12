/**
 * POST /api/auth/register — Create a student account.
 *
 * Rate limited, Zod-validated and audit-logged. The actual write path is
 * delegated to the shared `registerStudentInternal` helper in
 * src/lib/auth/registerStudent.ts so both this route and the chat assistant
 * (/api/chat) use ONE source of truth for registration.
 *
 * Optional partner referral codes are validated server-side and attributed
 * to a CRM lead in the same database transaction as the account creation.
 */

import { registerStudentInternal } from "@/lib/auth/registerStudent";
import { getClientIp } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { badRequest, conflict, created, rateLimited, withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Invalid email address").max(254),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
  name: z.string().min(1).max(100).optional(),
  referralCode: z.string().trim().max(64).regex(/^[a-zA-Z0-9-]+$/).optional(),
  /**
   * The marketing consent checkbox. Optional and never assumed: an absent value
   * is not consent, so nothing is written unless it is explicitly true.
   */
  marketingConsent: z.boolean().optional(),
  /**
   * Educational ID issued by ALO Education. Required for STUDENT accounts —
   * the platform is NOT public, so a learner cannot register without one.
   * The validation matches the official ID format: 4–32 chars, uppercase
   * letters + digits, dashes allowed (case-insensitive on input, stored
   * uppercased). Optional for staff/partner self-registration, but if
   * supplied it must be unique across all users.
   */
  educationalId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9][A-Z0-9-]{2,31}$/,
      "Educational ID must be 3–32 chars: letters, digits or dashes (starts with a letter or digit).",
    )
    .optional(),
  /**
   * Optional role hint. The server still pins every self-registration to
   * "STUDENT" — staff accounts are created by a SUPER_ADMIN via the
   * bootstrap or RBAC routes — so this field is accepted for forward-compat
   * but ignored.
   */
  role: z.string().max(32).optional(),
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

    const { email, password, name, referralCode, marketingConsent } = parsed.data;
    const educationalId = parsed.data.educationalId || null;

    // STUDENT accounts require an educational ID — the platform is gated,
    // not public. Staff/partner self-registration is allowed without one
    // (those accounts are typically created by a SUPER_ADMIN anyway).
    if (!educationalId) {
      return badRequest(
        "Educational ID is required. The ALO exam platform is not public — students register with the ID issued by their counselor or branch.",
      );
    }

    const result = await registerStudentInternal({
      email,
      password,
      name,
      educationalId,
      referralCode,
      marketingConsent,
      ipAddress: ip,
    });

    if (!result.ok) {
      // Map the helper's error codes to HTTP statuses so the auth modal
      // shows the right banner.
      switch (result.code) {
        case "EMAIL_TAKEN":
          return conflict(result.reason);
        case "EDU_ID_TAKEN":
          return conflict(result.reason);
        case "BAD_REFERRAL":
          return badRequest(result.reason);
        case "BAD_INPUT":
        default:
          return badRequest(result.reason);
      }
    }

    return created(
      { user: result.user, educationalId: result.user.educationalId ?? null },
      "Account created successfully",
    );
  });
}
