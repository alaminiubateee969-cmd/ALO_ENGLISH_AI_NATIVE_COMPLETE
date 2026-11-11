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

/**
 * The form's checkbox covers these channels, and the copy on the form says so
 * in these words. Consent recorded for a channel the person was not told about
 * is not consent, so the list here and the sentence on the page are one fact
 * written twice on purpose.
 */
const REGISTRATION_CONSENT_CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'] as const;

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
    const educationalId = parsed.data.educationalId || null;
    const referralCode = parsed.data.referralCode ? normalizeReferralCode(parsed.data.referralCode) : null;
    if (parsed.data.referralCode && !referralCode) {
      return badRequest("Referral code is invalid");
    }

    // STUDENT accounts require an educational ID — the platform is gated,
    // not public. Staff/partner self-registration is allowed without one
    // (those accounts are typically created by a SUPER_ADMIN anyway).
    if (!educationalId) {
      return badRequest(
        "Educational ID is required. The ALO exam platform is not public — students register with the ID issued by their counselor or branch.",
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return conflict("An account with this email already exists");

    // Educational ID uniqueness is enforced by the schema (`@unique`), but a
    // pre-check returns a clearer message than the raw P2002 below.
    const existingById = await db.user.findUnique({ where: { educationalId } });
    if (existingById) {
      return conflict(
        "An account with this educational ID already exists. If you have forgotten your password, use the reset link, or contact your branch.",
      );
    }

    const partner = referralCode
      ? await db.partner.findUnique({
          where: { referralCode },
          select: { id: true, status: true },
        })
      : null;
    if (referralCode && (!partner || partner.status !== "ACTIVE")) {
      return badRequest("This referral code is invalid or inactive");
    }

    const marketingConsent = parsed.data.marketingConsent === true;

    const user = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          name: name || null,
          passwordHash: hashPassword(password),
          role: "STUDENT",
          status: "ACTIVE",
          educationalId,
        },
        select: { id: true, email: true, name: true, role: true, educationalId: true },
      });

      let leadId: string | null = null;
      if (partner) {
        const lead = await tx.lead.create({
          data: {
            name: name || email,
            email,
            source: "REFERRAL",
            status: "NEW",
            partnerId: partner.id,
          },
          select: { id: true },
        });
        leadId = lead.id;
      }

      // Consent captured on the form. It attaches to the student record when one
      // already exists for this email, and otherwise waits against the lead until
      // the identities line up (see src/lib/crm/consent.ts). It is never attached
      // by name, and it is never written when the box was not ticked.
      if (marketingConsent) {
        const existingStudent = await tx.student.findFirst({ where: { email }, select: { id: true } });

        if (!existingStudent && !leadId) {
          const lead = await tx.lead.create({
            data: { name: name || email, email, source: "WEBSITE", status: "NEW" },
            select: { id: true },
          });
          leadId = lead.id;
        }

        const evidence = `Registration form: marketing consent checkbox ticked at ${new Date().toISOString()}`;
        for (const channel of REGISTRATION_CONSENT_CHANNELS) {
          if (existingStudent) {
            await tx.communicationConsent.upsert({
              where: { studentId_channel_purpose: { studentId: existingStudent.id, channel, purpose: "MARKETING" } },
              create: {
                studentId: existingStudent.id,
                channel,
                purpose: "MARKETING",
                status: "GRANTED",
                source: "FORM",
                evidence,
              },
              update: { status: "GRANTED", source: "FORM", evidence },
            });
          } else if (leadId) {
            await tx.communicationConsent.upsert({
              where: { capturedLeadId_channel_purpose: { capturedLeadId: leadId, channel, purpose: "MARKETING" } },
              create: {
                capturedLeadId: leadId,
                capturedLeadEmail: email,
                channel,
                purpose: "MARKETING",
                status: "GRANTED",
                source: "FORM",
                evidence,
              },
              update: { status: "GRANTED", source: "FORM", evidence },
            });
          }
        }
      }

      return createdUser;
    });

    await setSessionCookie(user.id);
    await audit("REGISTER", {
      userId: user.id,
      ipAddress: ip,
      resource: `user:${user.id}`,
      metadata: {
        ...(partner ? { attribution: "REFERRAL", partnerId: partner.id } : {}),
        marketingConsent,
        educationalId: user.educationalId ?? null,
        role: user.role,
      },
    });

    return created(
      { user, educationalId: user.educationalId ?? null },
      "Account created successfully",
    );
  });
}
