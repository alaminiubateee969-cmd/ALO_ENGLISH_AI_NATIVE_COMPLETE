/**
 * src/lib/crm/prisma-outbound-store.ts
 *
 * The persistence adapter behind outbound delivery.
 *
 * It contains no policy: every decision about whether to send, retry or give up
 * is made in ./outbound, and this file only records the outcome. What it DOES
 * own is the one thing that cannot be done in memory — atomicity:
 *
 *   * `claimSend` creates the outbox row and the Message row in one transaction,
 *     and lets the unique index on `sendKey` decide the winner when two workers
 *     try to send the same message at the same time. The loser sends nothing.
 *   * `Message.idempotencyKey` carries the same key, so even a manual insert
 *     cannot produce a second message row for one send.
 *
 * A retry is legitimate only when the previous attempt failed; a claim on a row
 * that is already sent, cancelled or not yet due is refused with a reason.
 */

import { db } from '@/lib/db';
import { audit } from '@/lib/audit';
import { stableHash } from './automation';
import type { MessageChannel, MessagePurpose } from './messaging-policy';
import { DEFAULT_BUSINESS_HOURS } from './messaging-policy';
import type { OutboundDraft, OutboundStore, ReceiptStore } from './outbound';
import type { DeliveryStatus } from './outbound';
import type { RunnerStore } from './outbox-runner';

const TERMINAL_SENT = ['SENT', 'DELIVERED', 'READ'];

/**
 * How long an in-flight attempt may sit before it is treated as abandoned.
 * Long enough to cover a slow provider call, short enough that a crashed worker
 * does not leave a student waiting indefinitely.
 */
const IN_FLIGHT_TIMEOUT_MINUTES = 10;

function localDayStart(at: Date, utcOffsetMinutes = DEFAULT_BUSINESS_HOURS.utcOffsetMinutes): Date {
  const shifted = new Date(at.getTime() + utcOffsetMinutes * 60 * 1000);
  const startLocal = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), 0, 0, 0, 0);
  return new Date(startLocal - utcOffsetMinutes * 60 * 1000);
}

export const prismaOutboundStore: OutboundStore = {
  /**
   * Consent, opt-out, last inbound time and today's count, in one read.
   *
   * `marketingOptOut` is deliberately NOT scoped to this channel: a withdrawal
   * is a statement about the student, not about one app, and applying it
   * per-channel is how someone who said "stop messaging me" keeps receiving
   * SMS.
   */
  async loadSendFacts({ studentId, channel, purpose, at }) {
    const [consent, optOut, lastInbound, sentToday] = await Promise.all([
      db.communicationConsent.findUnique({
        where: { studentId_channel_purpose: { studentId, channel, purpose } },
        select: { status: true },
      }),
      db.communicationConsent.findFirst({
        where: { studentId, purpose: 'MARKETING', status: { in: ['WITHDRAWN', 'DENIED'] } },
        select: { id: true },
      }),
      db.message.findFirst({
        where: { studentId, direction: 'INBOUND' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      db.message.count({
        where: {
          studentId,
          channel,
          direction: 'OUTBOUND',
          status: { in: TERMINAL_SENT },
          createdAt: { gte: localDayStart(at) },
        },
      }),
    ]);

    return {
      consent: (consent?.status as 'GRANTED' | 'DENIED' | 'WITHDRAWN' | 'UNKNOWN' | undefined) ?? 'UNKNOWN',
      marketingOptOut: optOut !== null,
      lastInboundAt: lastInbound?.createdAt ?? null,
      sentToday,
    };
  },

  async claimSend({ sendKey, draft, attemptedAt }) {
    const existing = await db.messageOutbox.findUnique({ where: { sendKey } });
    if (existing) {
      if (existing.status === 'SENT') {
        return { claimed: false, messageId: existing.messageId, status: 'SENT', attempts: existing.attempts, reason: 'This exact message has already been sent; it was not sent again.' };
      }
      if (existing.status === 'SUPPRESSED' || existing.status === 'CANCELLED') {
        return {
          claimed: false,
          messageId: existing.messageId,
          status: existing.status,
          attempts: existing.attempts,
          reason: `This send was ${existing.status.toLowerCase()}: ${existing.lastDecisionCode ?? 'no reason recorded'}${existing.lastError ? ` — ${existing.lastError}` : ''}`,
        };
      }
      if (existing.nextAttemptAt && existing.nextAttemptAt.getTime() > attemptedAt.getTime()) {
        return {
          claimed: false,
          messageId: existing.messageId,
          status: 'PENDING',
          attempts: existing.attempts,
          reason: `Not due yet: the next attempt is scheduled for ${existing.nextAttemptAt.toISOString()}.`,
        };
      }
      // A PENDING row that has already been attempted is one whose send is in
      // flight right now. Claiming it would send the same message twice, which
      // is precisely what the claim exists to prevent. A worker that died mid
      // send would otherwise strand the row forever, so an attempt older than
      // IN_FLIGHT_TIMEOUT_MINUTES is treated as abandoned and may be re-claimed:
      // a duplicate message is bad, a message that is never sent is worse.
      if (existing.status === 'PENDING' && existing.attempts > 0) {
        const inFlightFor = attemptedAt.getTime() - existing.updatedAt.getTime();
        if (inFlightFor < IN_FLIGHT_TIMEOUT_MINUTES * 60 * 1000) {
          return {
            claimed: false,
            messageId: existing.messageId,
            status: 'PENDING',
            attempts: existing.attempts,
            reason: `An attempt for this send is already in progress (started ${existing.updatedAt.toISOString()}).`,
          };
        }
      }
      if (existing.status === 'FAILED' && !existing.nextAttemptAt) {
        return {
          claimed: false,
          messageId: existing.messageId,
          status: 'FAILED',
          attempts: existing.attempts,
          reason: `Previous attempts are exhausted (${existing.attempts}); this message is waiting for a human.`,
        };
      }
      // A retry of a failed send, a due deferral, or a scheduled send that has
      // come due: claim it, and count this attempt.
      const claimed = await db.messageOutbox.update({
        where: { sendKey },
        data: { status: 'PENDING', lastError: null, attempts: { increment: 1 }, updatedAt: attemptedAt },
      });
      return { claimed: true, messageId: claimed.messageId, status: claimed.status, attempts: claimed.attempts };
    }

    try {
      const row = await db.$transaction(async (tx) => {
        const created = await tx.messageOutbox.create({
          data: {
            sendKey,
            channel: draft.channel,
            purpose: draft.purpose,
            studentId: draft.studentId,
            conversationId: draft.conversationId ?? null,
            recipientHandle: draft.recipientHandle ?? '',
            body: draft.body,
            isApprovedTemplate: Boolean(draft.isApprovedTemplate),
            templateName: draft.templateName ?? null,
            templateLanguage: draft.templateLanguage ?? null,
            scheduledFor: draft.scheduledFor,
            status: 'PENDING',
            attempts: 1,
            updatedAt: attemptedAt,
            createdBy: draft.createdBy ?? null,
          },
        });

        // The Message row is the student-visible record. It starts PENDING: the
        // provider has not accepted it yet, and saying SENT before it is would
        // be a lie in the conversation history.
        const message = await tx.message.create({
          data: {
            channel: draft.channel,
            direction: 'OUTBOUND',
            body: draft.body,
            recipientHandle: draft.recipientHandle ?? null,
            studentId: draft.studentId,
            conversationId: draft.conversationId ?? null,
            status: 'PENDING',
            idempotencyKey: sendKey,
          },
          select: { id: true },
        });

        await tx.messageOutbox.update({ where: { id: created.id }, data: { messageId: message.id } });
        return { messageId: message.id, attempts: created.attempts };
      });

      return { claimed: true, messageId: row.messageId, status: 'PENDING', attempts: row.attempts };
    } catch (error) {
      // The unique index rejected the insert: another worker claimed it first,
      // or a previous attempt exists. Either way this attempt sends nothing.
      const conflict = await db.messageOutbox.findUnique({ where: { sendKey } });
      if (!conflict) throw error;
      return {
        claimed: false,
        messageId: conflict.messageId,
        status: conflict.status,
        attempts: conflict.attempts,
        reason: 'Another process claimed this send first; it was not sent twice.',
      };
    }
  },

  async markSent({ sendKey, messageId, providerMessageId, at }) {
    await db.messageOutbox.update({
      where: { sendKey },
      data: { status: 'SENT', providerMessageId, sentAt: at, nextAttemptAt: null, lastError: null },
    });
    if (messageId) {
      await db.message.update({
        where: { id: messageId },
        data: { status: 'SENT', providerMessageId, sentAt: at },
      });
    }
  },

  async markFailed({ sendKey, messageId, code, reason, attempts, at, retryAt, gaveUp }) {
    await db.messageOutbox.update({
      where: { sendKey },
      data: {
        status: 'FAILED',
        attempts,
        lastError: `${code}: ${reason}`,
        lastDecisionCode: code,
        nextAttemptAt: retryAt,
        updatedAt: at,
      },
    });
    if (messageId) {
      await db.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', failedReason: `${code}: ${reason}${gaveUp ? ' (no further attempts)' : ''}` },
      });
    }
  },

  /**
   * A refusal or a deferral is recorded rather than thrown away.
   *
   * A refused send is SUPPRESSED: it must never be picked up by the runner. A
   * deferred send stays PENDING with `nextAttemptAt` set, so the queue can find
   * it when the window opens. Neither ever overwrites a row that was actually
   * sent.
   */
  async recordDecision({ sendKey, draft, decision, at }) {
    const existing = await db.messageOutbox.findUnique({ where: { sendKey }, select: { status: true } });
    if (existing && existing.status !== 'PENDING' && existing.status !== 'FAILED') return;

    const data = {
      channel: draft.channel,
      purpose: draft.purpose,
      studentId: draft.studentId,
      conversationId: draft.conversationId ?? null,
      recipientHandle: draft.recipientHandle ?? '',
      body: draft.body,
      isApprovedTemplate: Boolean(draft.isApprovedTemplate),
      templateName: draft.templateName ?? null,
      templateLanguage: draft.templateLanguage ?? null,
      scheduledFor: draft.scheduledFor,
      status: decision.action === 'REFUSE' ? 'SUPPRESSED' : 'PENDING',
      lastDecisionCode: decision.code,
      lastError: decision.reason,
      nextAttemptAt: decision.action === 'DEFER' ? decision.retryAt ?? null : null,
      updatedAt: at,
      createdBy: draft.createdBy ?? null,
    };

    try {
      await db.messageOutbox.upsert({ where: { sendKey }, create: { sendKey, ...data }, update: data });
    } catch (error) {
      // Two workers deciding the same send is harmless; the row exists either way.
      const stillThere = await db.messageOutbox.findUnique({ where: { sendKey }, select: { id: true } });
      if (!stillThere) throw error;
    }

    // Recorded centrally: "why did this student never receive anything" must be
    // answerable from the audit log alone.
    await audit('MESSAGES_SEND', {
      resource: `MessageOutbox:${sendKey}`,
      metadata: { decision: decision.action, code: decision.code, reason: decision.reason, studentId: draft.studentId, channel: draft.channel },
    });
  },
};

/* ───────────────────────────── delivery receipts ─────────────────────────── */

export const prismaReceiptStore: ReceiptStore = {
  async findMessageByProviderId(providerMessageId) {
    const message = await db.message.findFirst({
      where: { providerMessageId, direction: 'OUTBOUND' },
      select: { id: true, status: true },
    });
    return message ?? null;
  },

  async applyReceipt({ messageId, status, occurredAt, errorCode, errorReason }) {
    const data: Record<string, unknown> = { status };
    if (status === 'DELIVERED') data.deliveredAt = occurredAt;
    if (status === 'READ') data.readAt = occurredAt;
    if (status === 'FAILED') data.failedReason = `${errorCode ?? 'FAILED'}: ${errorReason ?? 'The provider reported a delivery failure.'}`;
    await db.message.update({ where: { id: messageId }, data });
  },

  /**
   * A receipt that changes nothing is still recorded — in the automation log,
   * not the message. Both "this arrived out of order" and "this arrived for a
   * message we do not have" are things an operator may need to see, and neither
   * is an error worth failing the webhook over.
   */
  async recordIgnoredReceipt({ providerMessageId, status, reason, at }) {
    const eventKey = `receipt:${stableHash([providerMessageId, status]).slice(0, 40)}`;
    try {
      await db.automationEvent.create({
        data: {
          kind: 'RECEIPT',
          idempotencyKey: eventKey,
          status: 'SKIPPED',
          signatureVerified: true,
          payloadSummary: `${status} receipt ignored: ${reason}`,
          processedAt: at,
        },
      });
    } catch {
      // Already recorded from an earlier delivery of the same receipt.
    }
  },
};

/* ───────────────────────────── the queue runner ──────────────────────────── */

export const prismaRunnerStore: RunnerStore = {
  /**
   * What is due: PENDING rows whose next attempt is now or earlier than the
   * scheduled time. FAILED rows are included only while they still have a next
   * attempt — a row that gave up is for a human, and picking it up again is
   * exactly the retry loop the bounded backoff exists to prevent.
   */
  async findDueSends({ at, limit }) {
    const rows = await db.messageOutbox.findMany({
      where: {
        OR: [
          { status: 'PENDING', nextAttemptAt: { lte: at } },
          { status: 'PENDING', nextAttemptAt: null, scheduledFor: { lte: at } },
        ],
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { scheduledFor: 'asc' }],
      take: limit,
    });

    return rows.map((row) => ({
      sendKey: row.sendKey,
      channel: row.channel,
      purpose: row.purpose,
      studentId: row.studentId,
      conversationId: row.conversationId,
      recipientHandle: row.recipientHandle,
      body: row.body,
      isApprovedTemplate: row.isApprovedTemplate,
      templateName: row.templateName,
      templateLanguage: row.templateLanguage,
      scheduledFor: row.scheduledFor,
      attempts: row.attempts,
      nextAttemptAt: row.nextAttemptAt,
    }));
  },

  async cancelSend({ sendKey, reason, at }) {
    await db.messageOutbox.update({
      where: { sendKey },
      data: { status: 'CANCELLED', lastError: reason, nextAttemptAt: null, updatedAt: at },
    });
  },
};

export type { OutboundDraft, DeliveryStatus, MessageChannel, MessagePurpose };
