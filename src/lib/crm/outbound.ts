/**
 * src/lib/crm/outbound.ts
 *
 * Sending a message out — decided, sent, recorded, retried, and never twice.
 *
 * Three things make an outbound send dangerous, and each is handled here rather
 * than left to whichever caller happens to remember:
 *
 *   1. **A send must pass the policy gate.** `evaluateSendPolicy` is the single
 *      source of truth for consent, channel rules, caps and hours. This module
 *      does not re-implement any of it; it asks, and then obeys. A refusal is
 *      recorded with its reason, so "why did this student never hear from us?"
 *      has an answer that is not a shrug.
 *   2. **A send must happen at most once.** Retries are normal (a provider
 *      times out, a worker dies after sending but before recording it), so the
 *      send is claimed against an idempotency key derived from its content and
 *      schedule. A second attempt at the same send returns DUPLICATE and does
 *      not touch the network. Sending a student the same reminder four times is
 *      exactly the failure this prevents.
 *   3. **A failure must not become an infinite loop.** Failures are classified
 *      retryable or not, backoff is bounded (`nextRetryAt`), and after the last
 *      attempt the message stays FAILED for a human. Silence is better than a
 *      retry storm at 3am.
 *
 * Nothing in this file talks to a provider: delivery is an injected adapter (see
 * ./outbound-providers), which is what makes the whole matrix testable without a
 * network and what will let an SMS provider be swapped without touching policy.
 */

import {
  DEFAULT_BUSINESS_HOURS,
  evaluateSendPolicy,
  nextRetryAt,
  type ConsentStatus,
  type MessageChannel,
  type MessagePurpose,
} from './messaging-policy';
import { deriveSendKey, stableHash, type ProviderId } from './automation';

/** Which provider carries which channel. EMAIL has no adapter here on purpose. */
const CHANNEL_PROVIDER: Partial<Record<MessageChannel, ProviderId>> = {
  WHATSAPP: 'whatsapp_cloud',
  FACEBOOK: 'meta_messenger',
  INSTAGRAM: 'instagram',
  SMS: 'sms_provider',
};

/**
 * Per-channel body ceilings.
 *
 * WhatsApp rejects anything over 4096 characters, so a longer message fails at
 * the provider rather than here — better to refuse it with a reason a human can
 * act on. SMS has no hard limit, but 1600 is ten segments and a hard stop on a
 * runaway concatenation: the cost of that mistake is real money.
 */
export const CHANNEL_BODY_LIMIT: Record<MessageChannel, number> = {
  WHATSAPP: 4096,
  FACEBOOK: 2000,
  INSTAGRAM: 1000,
  SMS: 1600,
  EMAIL: 100_000,
};

export function providerForChannel(channel: MessageChannel): ProviderId | null {
  return CHANNEL_PROVIDER[channel] ?? null;
}

export type OutboundDraft = {
  channel: MessageChannel;
  purpose: MessagePurpose;
  studentId: string;
  /** Who to send to: phone (WhatsApp/SMS) or provider-scoped id (Messenger). */
  recipientHandle: string | null;
  body: string;
  /** True when this is a provider-approved template rather than free text. */
  isApprovedTemplate?: boolean;
  templateName?: string | null;
  templateLanguage?: string | null;
  conversationId?: string | null;
  /** When the send is due. Part of the send identity. */
  scheduledFor: Date;
  /** Who or what caused this send — written to the message record. */
  createdBy?: string | null;
};

export type SendFacts = {
  consent: ConsentStatus;
  marketingOptOut: boolean;
  lastInboundAt: Date | null;
  sentToday: number;
  businessHours?: { startHour: number; endHour: number; utcOffsetMinutes: number };
};

export type OutboundDecisionCode =
  | 'OK'
  | 'EMPTY_BODY'
  | 'BODY_TOO_LONG'
  | 'MISSING_RECIPIENT'
  | 'NO_PROVIDER'
  | 'CONSENT_MISSING'
  | 'OPTED_OUT'
  | 'WHATSAPP_WINDOW_CLOSED'
  | 'DAILY_CAP_REACHED'
  | 'QUIET_HOURS'
  | 'INVALID_CONTEXT';

export type OutboundDecision = {
  /** SEND now, DEFER to retryAt, or REFUSE until a human changes something. */
  action: 'SEND' | 'DEFER' | 'REFUSE';
  code: OutboundDecisionCode;
  reason: string;
  retryAt?: Date;
};

/** Start of the next local day's business window, in the configured offset. */
export function nextBusinessDayWindow(now: Date, businessHours = DEFAULT_BUSINESS_HOURS): Date {
  const shift = businessHours.utcOffsetMinutes * 60 * 1000;
  const local = new Date(now.getTime() + shift);
  const nextDayLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1, businessHours.startHour, 0, 0, 0);
  return new Date(nextDayLocal - shift);
}

/** Start of the next business window, in the configured offset. */
export function nextBusinessWindow(now: Date, businessHours = DEFAULT_BUSINESS_HOURS): Date {
  const shift = businessHours.utcOffsetMinutes * 60 * 1000;
  const local = new Date(now.getTime() + shift);
  const localHour = local.getUTCHours();
  const startOfTodayLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), businessHours.startHour, 0, 0, 0);
  const candidate = localHour < businessHours.startHour ? startOfTodayLocal : startOfTodayLocal + 24 * 60 * 60 * 1000;
  return new Date(candidate - shift);
}

/**
 * Decide what to do with a draft, before anything is queued or claimed.
 *
 * The mapping from a policy decision to an action is deliberate:
 *
 *   - a missing consent, an opt-out, or a closed WhatsApp window cannot be
 *     fixed by waiting, so they REFUSE and say what has to change;
 *   - quiet hours and the daily cap are about *when*, so they DEFER to a
 *     computed time rather than dropping the message.
 */
export function decideOutboundSend(draft: OutboundDraft, facts: SendFacts, now: Date): OutboundDecision {
  const body = draft.body?.trim() ?? '';
  if (!body && !draft.isApprovedTemplate) {
    return { action: 'REFUSE', code: 'EMPTY_BODY', reason: 'There is nothing to send.' };
  }

  if (!draft.recipientHandle?.trim()) {
    return {
      action: 'REFUSE',
      code: 'MISSING_RECIPIENT',
      reason: 'No recipient handle is recorded for this student on this channel. Guessing one would message a stranger.',
    };
  }

  const limit = CHANNEL_BODY_LIMIT[draft.channel] ?? 4096;
  if (body.length > limit) {
    return {
      action: 'REFUSE',
      code: 'BODY_TOO_LONG',
      reason: `${draft.channel} accepts at most ${limit} characters; this message is ${body.length}.`,
    };
  }

  if (!providerForChannel(draft.channel)) {
    return {
      action: 'REFUSE',
      code: 'NO_PROVIDER',
      reason: `${draft.channel} has no delivery provider configured in this deployment.`,
    };
  }

  const policy = evaluateSendPolicy({
    channel: draft.channel,
    purpose: draft.purpose,
    consent: facts.consent,
    marketingOptOut: facts.marketingOptOut,
    now,
    lastInboundAt: facts.lastInboundAt,
    sentToday: facts.sentToday,
    isApprovedTemplate: draft.isApprovedTemplate,
    businessHours: facts.businessHours,
  });

  if (policy.allowed) {
    return { action: 'SEND', code: 'OK', reason: policy.reason };
  }

  switch (policy.code) {
    case 'QUIET_HOURS':
      return {
        action: 'DEFER',
        code: 'QUIET_HOURS',
        reason: policy.reason,
        retryAt: nextBusinessWindow(now, facts.businessHours),
      };
    case 'DAILY_CAP_REACHED':
      // A cap is per local day, so the next lawful moment is the next local
      // day's business window — not the next window, which may be later today.
      return {
        action: 'DEFER',
        code: 'DAILY_CAP_REACHED',
        reason: policy.reason,
        retryAt: nextBusinessDayWindow(now, facts.businessHours),
      };
    case 'WHATSAPP_WINDOW_CLOSED':
      return {
        action: 'REFUSE',
        code: 'WHATSAPP_WINDOW_CLOSED',
        reason: `${policy.reason} Waiting will not change this: either send an approved template, or reply to the student once they write.`,
      };
    case 'OPTED_OUT':
      return { action: 'REFUSE', code: 'OPTED_OUT', reason: policy.reason };
    case 'CONSENT_MISSING':
      return { action: 'REFUSE', code: 'CONSENT_MISSING', reason: policy.reason };
    default:
      return { action: 'REFUSE', code: 'INVALID_CONTEXT', reason: policy.reason };
  }
}

/** The send identity for a draft. Two identical drafts are one send. */
export function sendKeyFor(draft: OutboundDraft): string {
  return deriveSendKey({
    channel: draft.channel,
    studentId: draft.studentId,
    purpose: draft.purpose,
    templateOrBodyHash: stableHash([draft.isApprovedTemplate ? draft.templateName ?? 'template' : draft.body.trim(), draft.recipientHandle ?? '']),
    scheduledFor: draft.scheduledFor,
  });
}

export type SendResult =
  | { ok: true; providerMessageId: string | null; detail: string }
  | { ok: false; code: 'NOT_CONFIGURED' | 'UNSUPPORTED_CHANNEL' | 'AUTH_FAILED' | 'RATE_LIMITED' | 'PROVIDER_REJECTED' | 'NETWORK_ERROR' | 'HTTP_ERROR'; reason: string; retryable: boolean };

/** A delivery adapter, injected so policy and transport stay separable. */
export type DeliveryAdapter = {
  provider: ProviderId;
  /** Whether this deployment can actually send. Never returns a secret. */
  describeReadiness(): { configured: boolean; envKey: string | null; note: string };
  send(input: {
    to: string;
    body: string;
    isApprovedTemplate: boolean;
    templateName?: string | null;
    templateLanguage?: string | null;
    /** A key the provider can use to deduplicate on its side, where supported. */
    idempotencyKey: string;
  }): Promise<SendResult>;
};

export type OutboundStore = {
  /** Consent, opt-out, last inbound time and today's count, in one read. */
  loadSendFacts(input: { studentId: string; channel: MessageChannel; purpose: MessagePurpose; at: Date }): Promise<SendFacts>;
  /**
   * Atomically claim this send. Returns `claimed: false` when the same send is
   * already claimed, already sent, or not due yet.
   *
   * `attempts` on the result is the number of attempts performed *including*
   * this one: 1 on a first send, 2 on the first retry. Backoff is indexed by it.
   */
  claimSend(input: {
    sendKey: string;
    draft: OutboundDraft;
    attemptedAt: Date;
  }): Promise<{
    claimed: boolean;
    messageId: string | null;
    status: string | null;
    attempts: number;
    /** Why the claim was refused, when the store knows a reason the status cannot express. */
    reason?: string;
  }>;
  markSent(input: { sendKey: string; messageId: string | null; providerMessageId: string | null; at: Date }): Promise<void>;
  markFailed(input: {
    sendKey: string;
    messageId: string | null;
    code: string;
    reason: string;
    attempts: number;
    at: Date;
    retryAt: Date | null;
    gaveUp: boolean;
  }): Promise<void>;
  /** A refusal or deferral is recorded, not thrown away. */
  recordDecision(input: { sendKey: string; draft: OutboundDraft; decision: OutboundDecision; at: Date }): Promise<void>;
};

export type DeliverOutcome =
  | { status: 'SENT'; sendKey: string; providerMessageId: string | null; attempts: number }
  | { status: 'DUPLICATE'; sendKey: string; reason: string }
  | { status: 'REFUSED'; sendKey: string; code: OutboundDecisionCode; reason: string }
  | { status: 'DEFERRED'; sendKey: string; code: OutboundDecisionCode; reason: string; retryAt: Date }
  | { status: 'NOT_CONFIGURED'; sendKey: string; reason: string; envKey: string | null }
  | { status: 'FAILED'; sendKey: string; code: string; reason: string; retryable: boolean; retryAt: Date | null; attempts: number };

export type DeliverDeps = {
  store: OutboundStore;
  adapterFor(provider: ProviderId): DeliveryAdapter | null;
  now?: () => Date;
};

/**
 * Send one outbound message, or explain why it was not sent.
 *
 * Order matters and is the whole point: policy → claim → credentials → network.
 * Any other order either messages someone who said stop, messages them twice,
 * or attempts an unauthenticated send.
 */
export async function deliverOutbound(draft: OutboundDraft, deps: DeliverDeps): Promise<DeliverOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const sendKey = sendKeyFor(draft);

  const facts = await deps.store.loadSendFacts({ studentId: draft.studentId, channel: draft.channel, purpose: draft.purpose, at: now });
  const decision = decideOutboundSend(draft, facts, now);

  if (decision.action === 'REFUSE') {
    await deps.store.recordDecision({ sendKey, draft, decision, at: now });
    return { status: 'REFUSED', sendKey, code: decision.code, reason: decision.reason };
  }
  if (decision.action === 'DEFER') {
    await deps.store.recordDecision({ sendKey, draft, decision, at: now });
    return {
      status: 'DEFERRED',
      sendKey,
      code: decision.code,
      reason: decision.reason,
      retryAt: decision.retryAt ?? nextBusinessWindow(now, facts.businessHours),
    };
  }

  const claim = await deps.store.claimSend({ sendKey, draft, attemptedAt: now });
  if (!claim.claimed) {
    return {
      status: 'DUPLICATE',
      sendKey,
      reason: claim.reason ?? `This send already exists with status ${claim.status ?? 'unknown'}; it was not sent again.`,
    };
  }

  const provider = providerForChannel(draft.channel);
  const adapter = provider ? deps.adapterFor(provider) : null;
  if (!adapter) {
    await deps.store.markFailed({
      sendKey,
      messageId: claim.messageId,
      code: 'NO_PROVIDER',
      reason: `${draft.channel} has no delivery adapter in this deployment.`,
      attempts: claim.attempts,
      at: now,
      retryAt: null,
      gaveUp: true,
    });
    return { status: 'FAILED', sendKey, code: 'NO_PROVIDER', reason: `${draft.channel} has no delivery adapter.`, retryable: false, retryAt: null, attempts: claim.attempts };
  }

  const readiness = adapter.describeReadiness();
  if (!readiness.configured) {
    // Fails closed: a missing credential is a deployment gap, not a reason to
    // attempt an unauthenticated send. Recording it means the message is not
    // lost, and the operator knows exactly which variable to set.
    await deps.store.markFailed({
      sendKey,
      messageId: claim.messageId,
      code: 'NOT_CONFIGURED',
      reason: readiness.note,
      attempts: claim.attempts,
      at: now,
      retryAt: null,
      gaveUp: true,
    });
    return { status: 'NOT_CONFIGURED', sendKey, reason: readiness.note, envKey: readiness.envKey };
  }

  const result = await adapter.send({
    to: draft.recipientHandle ?? '',
    body: draft.body,
    isApprovedTemplate: Boolean(draft.isApprovedTemplate),
    templateName: draft.templateName ?? null,
    templateLanguage: draft.templateLanguage ?? null,
    idempotencyKey: sendKey,
  });

  if (result.ok) {
    await deps.store.markSent({ sendKey, messageId: claim.messageId, providerMessageId: result.providerMessageId, at: now });
    return { status: 'SENT', sendKey, providerMessageId: result.providerMessageId, attempts: claim.attempts };
  }

  // `claim.attempts` counts the attempt that just failed, which is the index
  // into the backoff schedule (first failure → 5 minutes, then 30, 120, 720).
  // After the last step the message is left for a human, not retried forever.
  const attemptNumber = claim.attempts;
  const backoff = nextRetryAt(attemptNumber, now);
  const gaveUp = !result.retryable || backoff.exhausted || !backoff.retryAt;

  await deps.store.markFailed({
    sendKey,
    messageId: claim.messageId,
    code: result.code,
    reason: result.reason,
    attempts: attemptNumber,
    at: now,
    retryAt: gaveUp ? null : backoff.retryAt,
    gaveUp,
  });

  return {
    status: 'FAILED',
    sendKey,
    code: result.code,
    reason: result.reason,
    retryable: !gaveUp,
    retryAt: gaveUp ? null : backoff.retryAt,
    attempts: attemptNumber,
  };
}

/* ────────────────────────────── delivery receipts ─────────────────────────── */

export type DeliveryStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

/** Providers report progress; these never move backwards. */
const STATUS_RANK: Record<DeliveryStatus, number> = { SENT: 1, DELIVERED: 2, READ: 3, FAILED: 0 };

export type DeliveryReceipt = {
  providerMessageId: string;
  status: DeliveryStatus;
  occurredAt: Date | null;
  errorCode?: string | null;
  errorReason?: string | null;
};

/**
 * Should this receipt be applied to a message currently at `current`?
 *
 * Receipts arrive out of order — a READ can arrive before the DELIVERED that
 * logically preceded it. Applying them blindly would leave a message that the
 * student has plainly read showing as merely delivered. So a regression is
 * ignored, and the one exception is FAILED: a failure is new information and is
 * applied unless the message was already read (a "failed" receipt for a message
 * the student replied to is wrong, and saying the message failed would be worse
 * than ignoring it).
 */
export function shouldApplyReceipt(current: string, incoming: DeliveryStatus): { apply: boolean; reason: string } {
  const currentRank = STATUS_RANK[current as DeliveryStatus];
  if (currentRank === undefined) {
    return { apply: true, reason: `Current status ${current} is not a delivery status; applying.` };
  }
  if (incoming === 'FAILED') {
    return current === 'READ' || current === 'DELIVERED'
      ? { apply: false, reason: `Ignored a FAILED receipt: the message was already ${current.toLowerCase()}.` }
      : { apply: true, reason: 'Recording the failure.' };
  }
  if (STATUS_RANK[incoming] > currentRank) {
    return { apply: true, reason: `Progressing ${current} → ${incoming}.` };
  }
  return { apply: false, reason: `Ignored a stale ${incoming} receipt for a message already ${current}.` };
}

export type ReceiptStore = {
  findMessageByProviderId(providerMessageId: string): Promise<{ id: string; status: string } | null>;
  applyReceipt(input: { messageId: string; status: DeliveryStatus; occurredAt: Date; errorCode?: string | null; errorReason?: string | null }): Promise<void>;
  recordIgnoredReceipt(input: { providerMessageId: string; status: DeliveryStatus; reason: string; at: Date }): Promise<void>;
};

export type ReceiptOutcome =
  | { status: 'APPLIED'; messageId: string; from: string; to: DeliveryStatus }
  | { status: 'IGNORED'; reason: string }
  | { status: 'UNKNOWN_MESSAGE'; providerMessageId: string };

export async function applyDeliveryReceipt(receipt: DeliveryReceipt, store: ReceiptStore, at = new Date()): Promise<ReceiptOutcome> {
  const message = await store.findMessageByProviderId(receipt.providerMessageId);
  if (!message) {
    // A receipt for a message we have no record of is not an error: it may be
    // from before a restore, or for a send made outside this system. It is
    // recorded for reconciliation and acknowledged.
    await store.recordIgnoredReceipt({
      providerMessageId: receipt.providerMessageId,
      status: receipt.status,
      reason: 'No outbound message matches this provider message id.',
      at,
    });
    return { status: 'UNKNOWN_MESSAGE', providerMessageId: receipt.providerMessageId };
  }

  const decision = shouldApplyReceipt(message.status, receipt.status);
  if (!decision.apply) {
    await store.recordIgnoredReceipt({ providerMessageId: receipt.providerMessageId, status: receipt.status, reason: decision.reason, at });
    return { status: 'IGNORED', reason: decision.reason };
  }

  await store.applyReceipt({
    messageId: message.id,
    status: receipt.status,
    occurredAt: receipt.occurredAt ?? at,
    errorCode: receipt.errorCode ?? null,
    errorReason: receipt.errorReason ?? null,
  });
  return { status: 'APPLIED', messageId: message.id, from: message.status, to: receipt.status };
}
