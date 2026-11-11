/**
 * POST /api/crm/messages/send — send (or queue) one outbound message.
 *
 * This is the only route that sends anything, and it is deliberately a single
 * funnel: every outbound message therefore passes the same policy gate, the same
 * exactly-once claim and the same audit trail, whether it came from a counselor
 * replying to a student, a campaign, or the queue runner after quiet hours.
 *
 * The response says what happened rather than what was requested:
 *
 *   SENT            the provider accepted it
 *   DUPLICATE       this exact message already went out; nothing was sent again
 *   DEFERRED        allowed, but not now — `retryAt` says when
 *   REFUSED         policy says no; `code` and `reason` say why (consent missing,
 *                   opted out, WhatsApp window closed, body too long, …)
 *   NOT_CONFIGURED  the deployment has no credential for this channel
 *   FAILED          the provider rejected it or it could not be reached
 *
 * A refusal is answered 200, not 4xx: the request was well formed, and the answer
 * is a business decision the UI must show. Only a malformed request or a missing
 * permission is an HTTP error.
 *
 * Auth: an authenticated staff member whose role may send (see
 * `canSendMarketing` / `canSendServiceMessage` in @/lib/crm/permissions). A
 * STUDENT or PARTNER account cannot send as the institute.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canSendMarketing, canSendServiceMessage, type CrmRole } from '@/lib/crm/permissions';
import { deliverOutbound } from '@/lib/crm/outbound';
import { prismaOutboundStore } from '@/lib/crm/prisma-outbound-store';
import { defaultAdapterFor } from '@/lib/crm/outbound-providers';
import { normalizePhone } from '@/lib/crm/identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sendSchema = z.object({
  studentId: z.string().min(1),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL', 'FACEBOOK', 'INSTAGRAM']),
  purpose: z.enum(['MARKETING', 'SERVICE', 'FOLLOW_UP']),
  body: z.string().max(20_000),
  conversationId: z.string().min(1).optional(),
  /** Messenger/Instagram address the student uses there; taken from the student for WhatsApp/SMS. */
  recipientHandle: z.string().max(300).optional(),
  isApprovedTemplate: z.boolean().optional(),
  templateName: z.string().max(200).optional(),
  templateLanguage: z.string().max(20).optional(),
  /** ISO timestamp; defaults to now. Part of the send's identity. */
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const parsed = sendSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest('Invalid send request.');

    const input = parsed.data;
    const role = user.role as CrmRole;
    const permission = input.purpose === 'MARKETING' ? canSendMarketing(role) : canSendServiceMessage(role);
    if (!permission.allowed) {
      await audit('MESSAGES_SEND', {
        userId: user.id,
        resource: `Student:${input.studentId}`,
        metadata: { refusedBy: permission.code, role, purpose: input.purpose },
        ipAddress: getClientIp(req),
      });
      return forbidden(permission.reason);
    }

    const student = await db.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, phone: true, email: true, name: true, deletedAt: true },
    });
    if (!student || student.deletedAt) return notFound('Student not found.');

    // The handle is resolved from the record, never invented. A Messenger send
    // needs the address the student writes from, which only the conversation
    // knows — guessing one would message a stranger.
    const recipientHandle =
      input.recipientHandle?.trim() ||
      (input.channel === 'WHATSAPP' || input.channel === 'SMS' ? normalizePhone(student.phone ?? '') : null) ||
      (input.channel === 'EMAIL' ? student.email?.trim() || null : null);

    const outcome = await deliverOutbound(
      {
        channel: input.channel,
        purpose: input.purpose,
        studentId: student.id,
        recipientHandle,
        body: input.body,
        isApprovedTemplate: input.isApprovedTemplate ?? false,
        templateName: input.templateName ?? null,
        templateLanguage: input.templateLanguage ?? null,
        conversationId: input.conversationId ?? null,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
        createdBy: user.id,
      },
      { store: prismaOutboundStore, adapterFor: (provider) => defaultAdapterFor(provider) },
    );

    await audit('MESSAGES_SEND', {
      userId: user.id,
      resource: `Student:${student.id}`,
      metadata: { result: outcome.status, detail: outcome, channel: input.channel, purpose: input.purpose },
      ipAddress: getClientIp(req),
    });

    return ok({
      allowed: outcome.status === 'SENT' || outcome.status === 'DEFERRED' || outcome.status === 'DUPLICATE',
      result: outcome.status,
      outcome,
    });
  });
}
