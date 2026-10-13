/**
 * POST /api/crm/assistant/reply — what the after-hours assistant would say.
 *
 * Two modes, and the difference is the point:
 *
 *   draft (default)  returns the plan and the reply it would send, and sends
 *                    nothing. A counsellor can read it, correct it, or ignore it.
 *   send: true       sends it, through the same outbound funnel as any other
 *                    message — consent, service window, daily cap, exactly-once,
 *                    audit. The assistant gets no privileges a person does not
 *                    have.
 *
 * In both modes the plan is returned, including the reasons NOT to reply. A
 * HANDOFF is the interesting answer: it means a question is waiting for a person,
 * and pretending otherwise is the failure mode this whole module exists to avoid.
 *
 * Auth: staff who may send service messages. Audited either way, so "a robot
 * answered this student at 2am" is a fact in the log and not a rumour.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, forbidden, notFound, ok, unauthorized, withErrorHandler } from '@/lib/responses';
import { canSendServiceMessage, type CrmRole } from '@/lib/crm/permissions';
import { isOutsideOfficeHours, planAssistantReply } from '@/lib/crm/assistant';
import { ASSISTANT_AUTHOR, runAfterHoursAssistant } from '@/lib/crm/assistant-runner';
import { deliverOutbound } from '@/lib/crm/outbound';
import { prismaOutboundStore } from '@/lib/crm/prisma-outbound-store';
import { defaultAdapterFor } from '@/lib/crm/outbound-providers';
import { normalizePhone } from '@/lib/crm/identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  conversationId: z.string().min(1),
  send: z.boolean().optional(),
});

/** Assistant replies already sent in this conversation, from the record itself. */
async function countAssistantReplies(conversationId: string): Promise<number> {
  return db.messageOutbox.count({
    where: { conversationId, status: 'SENT', createdBy: ASSISTANT_AUTHOR },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const role = user.role as CrmRole;
    const permission = canSendServiceMessage(role);
    if (!permission.allowed) return forbidden(permission.reason);

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest('A conversationId is required.');

    const conversation = await db.conversation.findUnique({
      where: { id: parsed.data.conversationId },
      select: {
        id: true,
        channel: true,
        studentId: true,
        externalThreadId: true,
        student: { select: { id: true, phone: true, deletedAt: true } },
        messages: { where: { direction: 'INBOUND' }, orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true } },
      },
    });
    if (!conversation) return notFound('Conversation not found.');

    const lastInbound = conversation.messages[0];
    if (!lastInbound) {
      return ok({ action: 'SILENT', code: 'EMPTY_MESSAGE', reason: 'This conversation has no inbound message to answer.', draft: null, sources: [], topics: [], requiresHumanReview: false, sent: null });
    }

    const repliesThisConversation = await countAssistantReplies(conversation.id);
    const serviceWithdrawn = conversation.student
      ? (await db.communicationConsent.count({
          where: { studentId: conversation.student.id, purpose: 'SERVICE', status: { in: ['WITHDRAWN', 'DENIED'] } },
        })) > 0
      : false;

    const recipientHandle =
      conversation.student?.phone != null ? normalizePhone(conversation.student.phone) || null : conversation.externalThreadId;

    // Drafting is available at any hour: a counsellor may want to see what the
    // assistant would have said, and the plan explains why it said nothing.
    if (!parsed.data.send) {
      const previewNow = new Date();
      const plan = planAssistantReply({
        body: lastInbound.body,
        now: previewNow,
        repliesThisConversation,
        // The preview reflects reality: outside office hours it shows the reply
        // that would go out, inside hours it correctly says a person answers
        // instead. A preview that always showed a draft would teach staff to
        // expect automation the system will not actually perform.
        outsideOfficeHours: isOutsideOfficeHours(previewNow),
        serviceWithdrawn,
        enabled: true,
      });
      await audit('MESSAGES_SEND', {
        userId: user.id,
        resource: `Conversation:${conversation.id}`,
        metadata: { assistant: 'DRAFT_PREVIEW', code: plan.code, action: plan.action },
        ipAddress: getClientIp(req),
      });
      return ok({ ...plan, sent: null, note: 'Draft preview only: nothing was sent. Use send: true to send through the outbound funnel.' });
    }

    if (!conversation.studentId || !conversation.student || conversation.student.deletedAt) {
      // Without a student there is no consent register to check, so the assistant
      // cannot lawfully send. A human resolves the identity first.
      return ok({ action: 'HANDOFF', code: 'NOTHING_GROUNDED_TO_SAY', reason: 'This conversation is not attached to a student, so consent cannot be checked. Resolve the identity first.', draft: null, sources: [], topics: [], requiresHumanReview: true, sent: null });
    }

    const outcome = await runAfterHoursAssistant(
      {
        conversationId: conversation.id,
        channel: conversation.channel,
        studentId: conversation.student.id,
        recipientHandle,
        body: lastInbound.body,
        repliesThisConversation,
        serviceWithdrawn,
      },
      {
        enabled: true, // an explicit staff request bypasses the kill switch, never the policy gate
        deliver: (draft) => deliverOutbound(draft, { store: prismaOutboundStore, adapterFor: (provider) => defaultAdapterFor(provider) }),
      },
    );

    await audit('MESSAGES_SEND', {
      userId: user.id,
      resource: `Conversation:${conversation.id}`,
      metadata: { assistant: outcome.status, code: outcome.plan.code, reason: outcome.plan.reason },
      ipAddress: getClientIp(req),
    });

    return ok({
      action: outcome.plan.action,
      code: outcome.plan.code,
      reason: outcome.plan.reason,
      draft: outcome.plan.draft,
      sources: outcome.plan.sources,
      topics: outcome.plan.topics,
      requiresHumanReview: outcome.plan.requiresHumanReview,
      sent: outcome.status === 'SENT' ? outcome.delivery : null,
      status: outcome.status,
    });
  });
}
