/**
 * GET  /api/crm/consent — read the consent register for a student.
 * POST /api/crm/consent — record a consent decision.
 *
 * THE TWO RULES THIS ROUTE ENFORCES
 * ─────────────────────────────────
 * 1. **A grant must be provable.** `validateConsentCapture` refuses a `GRANTED`
 *    without a source and evidence. A withdrawal or denial is always accepted,
 *    with nothing required: making it easy to say stop is the whole point.
 * 2. **A withdrawal is global for marketing.** `evaluateSendPolicy` already
 *    treats any marketing withdrawal as suppressing marketing on every channel;
 *    the route does not try to be cleverer than that, it records what happened.
 *
 * WHEN A CAPTURE IS PROMOTED
 * A form is filled in by someone with no student record yet, so the capture waits
 * against the lead's email and phone (see the `capturedLead*` columns). Reading a
 * student's register promotes any capture whose email or normalised phone matches
 * — never by name, because two students can share a name and attaching one
 * person's consent to another is exactly the mistake this register exists to
 * prevent.
 *
 * Auth: staff whose role may record consent (`canRecordConsent`). A STUDENT or
 * PARTNER account cannot write to the register.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canRecordConsent, type CrmRole } from '@/lib/crm/permissions';
import { captureBelongsToStudent, consentMatrix, isMarketingOptOut, marketingReadiness, validateConsentCapture } from '@/lib/crm/consent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const captureSchema = z.object({
  studentId: z.string().min(1),
  channel: z.string().min(1).max(40),
  purpose: z.string().min(1).max(40),
  status: z.string().min(1).max(40),
  source: z.string().max(40).optional(),
  evidence: z.string().max(500).optional(),
});

const CONSENT_SELECT = {
  channel: true,
  purpose: true,
  status: true,
  source: true,
  evidence: true,
  recordedAt: true,
} as const;

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const studentId = new URL(req.url).searchParams.get('studentId');
    if (!studentId) return badRequest('A studentId is required: consent is read per person.');

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, studentCode: true, email: true, phone: true, deletedAt: true },
    });
    if (!student || student.deletedAt) return notFound('Student not found.');

    const entries = await db.communicationConsent.findMany({
      where: { studentId, purpose: { in: ['MARKETING', 'SERVICE', 'FOLLOW_UP'] } },
      select: CONSENT_SELECT,
      orderBy: [{ channel: 'asc' }, { purpose: 'asc' }],
    });

    // Promote anything captured before this person was a student.
    const waiting = await db.communicationConsent.findMany({
      where: {
        capturedLeadId: { not: null },
        OR: [{ capturedLeadEmail: student.email ?? '\u0000' }, { capturedLeadPhone: student.phone ?? '\u0000' }],
      },
      select: { id: true, channel: true, purpose: true, status: true, source: true, evidence: true, recordedAt: true, capturedLeadId: true, capturedLeadEmail: true, capturedLeadPhone: true },
    });

    const promoted: string[] = [];
    for (const capture of waiting) {
      const match = captureBelongsToStudent(capture, student);
      if (!match.belongs) continue;
      const written = await db.communicationConsent.upsert({
        where: { studentId_channel_purpose: { studentId, channel: capture.channel, purpose: capture.purpose } },
        create: {
          studentId,
          channel: capture.channel,
          purpose: capture.purpose,
          status: capture.status,
          source: capture.source,
          evidence: capture.evidence,
        },
        // An existing decision by this student is never overwritten by an older
        // capture from the website: the later, more specific record wins.
        update: {},
        select: { id: true, channel: true, purpose: true, status: true },
      });
      promoted.push(`${written.channel}/${written.purpose}`);
      await audit('CONSENT_RECORD', {
        userId: user.id,
        resource: `Student:${studentId}`,
        metadata: { promotedFromLead: capture.capturedLeadId, channel: capture.channel, purpose: capture.purpose, match: match.reason },
      });
    }

    const current = promoted.length > 0
      ? await db.communicationConsent.findMany({ where: { studentId }, select: CONSENT_SELECT, orderBy: [{ channel: 'asc' }, { purpose: 'asc' }] })
      : entries;

    return ok({
      student: { id: student.id, name: student.name, studentCode: student.studentCode },
      entries: current,
      matrix: consentMatrix(current),
      marketingOptOut: isMarketingOptOut(current),
      marketing: marketingReadiness(current),
      promoted,
    });
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const role = user.role as CrmRole;
    const permission = canRecordConsent(role);
    if (!permission.allowed) {
      await audit('CONSENT_RECORD', { userId: user.id, metadata: { refusedBy: permission.code, role }, ipAddress: getClientIp(req) });
      return forbidden(permission.reason);
    }

    const parsed = captureSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest('Invalid consent record.');

    const validation = validateConsentCapture(parsed.data);
    if (!validation.ok) return badRequest(validation.reason);

    const student = await db.student.findUnique({ where: { id: parsed.data.studentId }, select: { id: true, deletedAt: true } });
    if (!student || student.deletedAt) return notFound('Student not found.');

    const value = validation.value;
    const saved = await db.communicationConsent.upsert({
      where: { studentId_channel_purpose: { studentId: student.id, channel: value.channel, purpose: value.purpose } },
      create: {
        studentId: student.id,
        channel: value.channel,
        purpose: value.purpose,
        status: value.status,
        source: value.source,
        evidence: value.evidence,
        recordedByUserId: user.id,
      },
      update: {
        status: value.status,
        source: value.source,
        evidence: value.evidence,
        recordedByUserId: user.id,
      },
      select: CONSENT_SELECT,
    });

    await audit('CONSENT_RECORD', {
      userId: user.id,
      resource: `Student:${student.id}`,
      metadata: { channel: value.channel, purpose: value.purpose, status: value.status, source: value.source },
      ipAddress: getClientIp(req),
    });

    const entries = await db.communicationConsent.findMany({ where: { studentId: student.id }, select: CONSENT_SELECT });

    return ok({
      entry: saved,
      matrix: consentMatrix(entries),
      marketingOptOut: isMarketingOptOut(entries),
      marketing: marketingReadiness(entries),
    });
  });
}
