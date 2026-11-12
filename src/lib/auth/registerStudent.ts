/**
 * src/lib/auth/registerStudent.ts
 *
 * Shared internal student-registration helper. This is the single source of
 * truth for the registration write path: both /api/auth/register (the form
 * POST from the auth modal) and /api/chat (the chat assistant creating an
 * account on a visitor's behalf) call this function.
 *
 * Returns a discriminated union so callers can surface a friendly message
 * instead of a raw Prisma P2002. Sets the session cookie via
 * setSessionCookie() so the visitor is logged in immediately.
 */

import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { normalizeReferralCode } from "@/lib/referral-code";

export type RegisterStudentInput = {
  email: string;
  password: string;
  name?: string;
  educationalId: string;
  referralCode?: string;
  marketingConsent?: boolean;
  ipAddress?: string;
};

export type RegisterStudentOk = {
  ok: true;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    educationalId: string | null;
  };
  partnerId?: string | null;
  leadId?: string | null;
};

export type RegisterStudentErr = {
  ok: false;
  reason: string;
  code: "EMAIL_TAKEN" | "EDU_ID_TAKEN" | "BAD_REFERRAL" | "BAD_INPUT";
};

export type RegisterStudentResult = RegisterStudentOk | RegisterStudentErr;

const REGISTRATION_CONSENT_CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;

/**
 * Create a STUDENT account, set the session cookie, audit the registration,
 * and return the new user record. On a known conflict (email or educational
 * ID already in use), returns { ok: false, reason } so the caller can show
 * a friendly message instead of surfacing the Prisma error.
 */
export async function registerStudentInternal(
  input: RegisterStudentInput,
): Promise<RegisterStudentResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || null;
  const educationalId = input.educationalId.trim().toUpperCase();
  const password = input.password;
  const referralCode = input.referralCode ? normalizeReferralCode(input.referralCode) : null;
  const marketingConsent = input.marketingConsent === true;

  // ─── Input validation ──────────────────────────────────────────────
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: "Please use a valid email address.", code: "BAD_INPUT" };
  }
  if (!password || password.length < 12 || password.length > 128) {
    return { ok: false, reason: "Password must be 12-128 characters.", code: "BAD_INPUT" };
  }
  if (!educationalId || !/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(educationalId)) {
    return {
      ok: false,
      reason: "Educational ID must be 3-32 chars (letters, digits, or dashes).",
      code: "BAD_INPUT",
    };
  }
  if (input.referralCode && !referralCode) {
    return { ok: false, reason: "Referral code is invalid.", code: "BAD_REFERRAL" };
  }

  // ─── Pre-flight uniqueness checks (clearer than catching P2002) ─────
  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) {
    return {
      ok: false,
      reason: "An account with this email already exists. Try logging in instead.",
      code: "EMAIL_TAKEN",
    };
  }
  const existingId = await db.user.findUnique({ where: { educationalId } });
  if (existingId) {
    return {
      ok: false,
      reason: "An account with this educational ID already exists. If you've forgotten your password, use the reset link, or contact your ALO branch.",
      code: "EDU_ID_TAKEN",
    };
  }

  // ─── Validate partner referral code ─────────────────────────────────
  const partner = referralCode
    ? await db.partner.findUnique({
        where: { referralCode },
        select: { id: true, status: true },
      })
    : null;
  if (referralCode && (!partner || partner.status !== "ACTIVE")) {
    return { ok: false, reason: "This referral code is invalid or inactive.", code: "BAD_REFERRAL" };
  }

  // ─── Transactional write (user + optional lead + consent rows) ──────
  const user = await db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        name,
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
            where: {
              studentId_channel_purpose: {
                studentId: existingStudent.id,
                channel,
                purpose: "MARKETING",
              },
            },
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
            where: {
              capturedLeadId_channel_purpose: {
                capturedLeadId: leadId,
                channel,
                purpose: "MARKETING",
              },
            },
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

  // ─── Session cookie + audit ─────────────────────────────────────────
  await setSessionCookie(user.id);
  await audit("REGISTER", {
    userId: user.id,
    ipAddress: input.ipAddress || "unknown",
    resource: `user:${user.id}`,
    metadata: {
      ...(partner ? { attribution: "REFERRAL", partnerId: partner.id } : {}),
      marketingConsent,
      educationalId: user.educationalId ?? null,
      role: user.role,
      viaChat: true,
    },
  });

  return {
    ok: true,
    user,
    partnerId: partner?.id ?? null,
  };
}
