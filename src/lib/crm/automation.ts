/**
 * src/lib/crm/automation.ts
 *
 * Idempotency keys and payload normalisation for inbound webhooks.
 *
 * Providers retry. WhatsApp Cloud, Messenger and Instagram all redeliver an
 * event when they do not receive a timely 200, and an SMS provider will replay a
 * delivery receipt for days. Without a deterministic key, one student message
 * becomes five rows, five documents and — worse — five "new student" records.
 *
 * The key is derived from what the provider guarantees to be stable for a given
 * event, and never from a clock or a random value: a key that changes on retry
 * cannot detect a retry.
 */

import { createHash } from 'node:crypto';

/** Provider identifiers as stored on AutomationEvent.provider. */
export type ProviderId = 'whatsapp_cloud' | 'meta_messenger' | 'instagram' | 'sms_provider' | 'internal';

export type InboundEventRef = {
  provider: ProviderId;
  /** Provider's own event/message id, when it supplies one. */
  externalEventId?: string | null;
  /** Provider-side conversation/thread id, when it supplies one. */
  externalThreadId?: string | null;
  /** Sender id scoped to the provider (wa_id, PSID, phone number). */
  senderId?: string | null;
  /** Provider timestamp (seconds or milliseconds, or an ISO string). */
  occurredAt?: Date | number | string | null;
  /** Raw body, used only to compute a hash when no id is available. */
  payload?: unknown;
};

/** Stable JSON with sorted keys, so the same logical payload always hashes the same. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

/** SHA-256 hex digest of a normalised value. */
export function stableHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function normalizeTimestamp(value: InboundEventRef['occurredAt']): number | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Key for an inbound webhook event.
 *
 * Order of preference, strongest first:
 *   1. provider + provider event id — exactly what deduplication needs
 *   2. provider + thread + sender + timestamp — used when the provider omits an
 *      id, and stable across retries because the provider resends the same
 *      timestamp
 *   3. provider + payload hash — last resort; catches an exact redelivery but
 *      cannot detect a re-serialised variant
 *
 * The returned object states which basis was used so the caveat is visible in
 * the audit log rather than implied.
 */
export function deriveEventKey(event: InboundEventRef): {
  key: string;
  basis: 'external_id' | 'thread_sender_time' | 'payload_hash' | 'insufficient';
} {
  const { provider, externalEventId, externalThreadId, senderId } = event;

  const externalId = externalEventId?.trim();
  if (externalId) {
    return { key: `${provider}:event:${externalId}`, basis: 'external_id' };
  }

  const occurredAt = normalizeTimestamp(event.occurredAt);
  const thread = externalThreadId?.trim();
  const sender = senderId?.trim();
  if (thread && sender && occurredAt !== null) {
    return { key: `${provider}:msg:${stableHash([thread, sender, occurredAt]).slice(0, 32)}`, basis: 'thread_sender_time' };
  }

  if (event.payload !== undefined) {
    return { key: `${provider}:payload:${stableHash(event.payload)}`, basis: 'payload_hash' };
  }

  return { key: `${provider}:unkeyable:${stableHash([provider, thread ?? null, sender ?? null, occurredAt]).slice(0, 32)}`, basis: 'insufficient' };
}

/**
 * Key for storing one provider message. Unique per channel, mirroring the
 * `Message_channel_providerMessageId_key` database constraint.
 */
export function deriveMessageKey(channel: string, providerMessageId: string): string {
  return `${channel.toUpperCase()}:${providerMessageId.trim()}`;
}

/** Key for one outbound send attempt, so a retry of the same queued send is one row. */
export function deriveSendKey(input: {
  channel: string;
  studentId: string;
  purpose: string;
  templateOrBodyHash: string;
  scheduledFor: Date;
}): string {
  return `send:${stableHash([
    input.channel.toUpperCase(),
    input.studentId,
    input.purpose,
    input.templateOrBodyHash,
    input.scheduledFor.toISOString(),
  ]).slice(0, 40)}`;
}

/** What to do with an event that has already been seen. */
export type DuplicateOutcome = {
  isDuplicate: boolean;
  /** Recorded status for AutomationEvent when the key already exists. */
  status: 'DUPLICATE';
  reason: string;
};

/**
 * Interpret an existing AutomationEvent row for the same key.
 * A previously FAILED event may be retried; a SUCCEEDED one must not be
 * reprocessed — the only correct action is to ignore it and return 200.
 */
export function classifyDuplicate(previousStatus: string | null): {
  isDuplicate: boolean;
  shouldRetry: boolean;
  reason: string;
} {
  if (previousStatus === null) {
    return { isDuplicate: false, shouldRetry: false, reason: 'First delivery of this event.' };
  }
  if (previousStatus === 'SUCCEEDED') {
    return { isDuplicate: true, shouldRetry: false, reason: 'Event already processed successfully; acknowledge and ignore.' };
  }
  if (previousStatus === 'FAILED') {
    return { isDuplicate: true, shouldRetry: true, reason: 'Previous attempt failed; safe to retry.' };
  }
  if (previousStatus === 'DUPLICATE') {
    return { isDuplicate: true, shouldRetry: false, reason: 'Already recorded as a duplicate.' };
  }
  return { isDuplicate: true, shouldRetry: false, reason: `Event is currently ${previousStatus}; do not process concurrently.` };
}
