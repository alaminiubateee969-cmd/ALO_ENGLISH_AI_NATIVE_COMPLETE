/**
 * src/lib/crm/outbox-runner.ts
 *
 * Draining the outbound queue.
 *
 * A deferred send is only meaningful if something eventually picks it up, so the
 * queue is drained by a runner rather than by hope. This is deliberately driven
 * by a host scheduler hitting an endpoint (`POST /api/crm/messages/queue/run`)
 * rather than an in-process timer: a timer inside a serverless function is a
 * timer that does not exist, and a timer inside a long-running process fire
 * twice as soon as the process is scaled to two instances.
 *
 * The runner itself is tiny and does no policy work: it reads what is due, hands
 * each row back to `deliverOutbound` (which applies the same policy gate as a
 * brand new send), and summarises the result. A deferred message that becomes
 * sendable at 09:00 is therefore re-checked at 09:00 — consent may have been
 * withdrawn overnight, and the queue must not be a way to bypass that.
 */

import type { DeliverOutcome, OutboundDraft } from './outbound';
import type { MessageChannel, MessagePurpose } from './messaging-policy';

export type DueSend = {
  sendKey: string;
  channel: string;
  purpose: string;
  studentId: string;
  conversationId: string | null;
  recipientHandle: string;
  body: string;
  isApprovedTemplate: boolean;
  templateName: string | null;
  templateLanguage: string | null;
  scheduledFor: Date;
  attempts: number;
  nextAttemptAt: Date | null;
};

export type RunnerStore = {
  /** Work that is due, oldest first, capped by the caller. */
  findDueSends(input: { at: Date; limit: number }): Promise<DueSend[]>;
  /** A row whose send is no longer possible at all (student gone, channel removed). */
  cancelSend(input: { sendKey: string; reason: string; at: Date }): Promise<void>;
};

export type RunnerSummary = {
  ranAt: Date;
  considered: number;
  sent: number;
  duplicate: number;
  refused: number;
  deferred: number;
  notConfigured: number;
  failed: number;
  items: Array<{ sendKey: string; status: DeliverOutcome['status']; detail: string }>;
};

/** Turn a queue row back into a draft. Kept separate so it can be asserted directly. */
export function draftFromDueSend(row: DueSend): OutboundDraft {
  return {
    channel: row.channel as MessageChannel,
    purpose: row.purpose as MessagePurpose,
    studentId: row.studentId,
    recipientHandle: row.recipientHandle,
    body: row.body,
    isApprovedTemplate: row.isApprovedTemplate,
    templateName: row.templateName,
    templateLanguage: row.templateLanguage,
    conversationId: row.conversationId,
    scheduledFor: row.scheduledFor,
  };
}

export const DEFAULT_RUNNER_BATCH = 25;

export async function runDueSends(
  deps: {
    store: RunnerStore;
    deliver(draft: OutboundDraft): Promise<DeliverOutcome>;
    now?: () => Date;
    limit?: number;
  },
): Promise<RunnerSummary> {
  const at = (deps.now ?? (() => new Date()))();
  const limit = deps.limit ?? DEFAULT_RUNNER_BATCH;
  const due = await deps.store.findDueSends({ at, limit });

  const summary: RunnerSummary = {
    ranAt: at,
    considered: due.length,
    sent: 0,
    duplicate: 0,
    refused: 0,
    deferred: 0,
    notConfigured: 0,
    failed: 0,
    items: [],
  };

  for (const row of due) {
    const outcome = await deps.deliver(draftFromDueSend(row));

    switch (outcome.status) {
      case 'SENT':
        summary.sent += 1;
        summary.items.push({ sendKey: row.sendKey, status: outcome.status, detail: 'Sent.' });
        break;
      case 'DUPLICATE':
        summary.duplicate += 1;
        summary.items.push({ sendKey: row.sendKey, status: outcome.status, detail: outcome.reason });
        break;
      case 'REFUSED':
        summary.refused += 1;
        summary.items.push({ sendKey: row.sendKey, status: outcome.status, detail: `${outcome.code}: ${outcome.reason}` });
        break;
      case 'DEFERRED':
        summary.deferred += 1;
        summary.items.push({ sendKey: row.sendKey, status: outcome.status, detail: `${outcome.code} until ${outcome.retryAt.toISOString()}` });
        break;
      case 'NOT_CONFIGURED':
        summary.notConfigured += 1;
        summary.items.push({ sendKey: row.sendKey, status: outcome.status, detail: outcome.reason });
        break;
      case 'FAILED':
        summary.failed += 1;
        summary.items.push({
          sendKey: row.sendKey,
          status: outcome.status,
          detail: `${outcome.code}: ${outcome.reason}${outcome.retryable && outcome.retryAt ? ` (retrying after ${outcome.retryAt.toISOString()})` : ' (no further attempts)'}`,
        });
        break;
    }
  }

  return summary;
}

/** Fired by the host scheduler. Never runs without a credential: see the route. */
export const OUTBOX_RUN_SECRET_ENV = 'CRON_SECRET';
