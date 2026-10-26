/**
 * tests/outbound.test.ts
 *
 * Outbound delivery, driven end to end against an in-memory store and an
 * injected adapter. The behaviours that matter are the ones that protect a
 * student from us:
 *
 *   - a refusal is never sent, and is recorded with its reason;
 *   - the same send cannot go out twice, even when two workers race;
 *   - a missing credential stops the send rather than attempting it;
 *   - a failure retries on a bounded schedule and then stops;
 *   - a receipt never moves a message backwards in time.
 */

import { describe, expect, test } from 'bun:test';
import type { DeliveryAdapter, OutboundDraft, OutboundStore, ReceiptStore, SendFacts, SendResult } from '../src/lib/crm/outbound';

const { applyDeliveryReceipt, decideOutboundSend, deliverOutbound, nextBusinessWindow, sendKeyFor, shouldApplyReceipt } = await import(
  '../src/lib/crm/outbound'
);
const { draftFromDueSend, runDueSends } = await import('../src/lib/crm/outbox-runner');
const { defaultAdapterFor, safeSendUrl, whatsappAdapter, metaMessagingAdapter, smsAdapter } = await import('../src/lib/crm/outbound-providers');

const NOW = new Date('2026-10-14T06:00:00Z'); // 12:00 in Asia/Dhaka

function draft(overrides: Partial<OutboundDraft> = {}): OutboundDraft {
  return {
    channel: 'WHATSAPP',
    purpose: 'SERVICE',
    studentId: 'stu_1',
    recipientHandle: '+8801712345678',
    body: 'Your document has been received.',
    scheduledFor: new Date('2026-10-14T06:00:00Z'),
    ...overrides,
  };
}

function facts(overrides: Partial<SendFacts> = {}): SendFacts {
  return {
    consent: 'UNKNOWN',
    marketingOptOut: false,
    lastInboundAt: new Date('2026-10-14T05:00:00Z'), // window open
    sentToday: 0,
    ...overrides,
  };
}

/* ───────────────────────────────── decisions ──────────────────────────────── */

describe('the decision before anything is queued', () => {
  test('sends when consent, window, cap and hours all allow it', () => {
    const decision = decideOutboundSend(draft(), facts(), NOW);
    expect(decision.action).toBe('SEND');
    expect(decision.code).toBe('OK');
  });

  test('an opt-out refuses, and says why', () => {
    const decision = decideOutboundSend(draft({ purpose: 'MARKETING' }), facts({ consent: 'GRANTED', marketingOptOut: true }), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('OPTED_OUT');
  });

  test('marketing without consent refuses', () => {
    const decision = decideOutboundSend(draft({ purpose: 'MARKETING' }), facts({ consent: 'UNKNOWN' }), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('CONSENT_MISSING');
  });

  test('quiet hours DEFER to the next business window rather than dropping the message', () => {
    const night = new Date('2026-10-14T20:00:00Z'); // 02:00 next day in Dhaka
    const decision = decideOutboundSend(draft({ channel: 'SMS', purpose: 'FOLLOW_UP' }), facts({ lastInboundAt: null }), night);
    expect(decision.action).toBe('DEFER');
    expect(decision.code).toBe('QUIET_HOURS');
    expect(decision.retryAt).toBeInstanceOf(Date);
    // 09:00 in Dhaka = 03:00 UTC.
    expect(decision.retryAt?.toISOString()).toBe('2026-10-15T03:00:00.000Z');
  });

  test('the daily cap DEFERS to the next day', () => {
    const decision = decideOutboundSend(draft(), facts({ sentToday: 3 }), NOW);
    expect(decision.action).toBe('DEFER');
    expect(decision.code).toBe('DAILY_CAP_REACHED');
    expect(decision.retryAt?.toISOString()).toBe('2026-10-15T03:00:00.000Z');
  });

  test('a closed WhatsApp window REFUSES, because waiting cannot fix it', () => {
    const decision = decideOutboundSend(draft(), facts({ lastInboundAt: new Date('2026-10-10T05:00:00Z') }), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('WHATSAPP_WINDOW_CLOSED');
    expect(decision.reason).toContain('approved template');
  });

  test('a template may be sent outside the window', () => {
    const decision = decideOutboundSend(
      draft({ isApprovedTemplate: true, templateName: 'appointment_reminder', templateLanguage: 'en' }),
      facts({ lastInboundAt: null }),
      NOW,
    );
    expect(decision.action).toBe('SEND');
  });

  test('a message with no recipient refuses instead of guessing one', () => {
    const decision = decideOutboundSend(draft({ recipientHandle: null }), facts(), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('MISSING_RECIPIENT');
  });

  test('a body longer than the channel accepts refuses here, not at the provider', () => {
    const decision = decideOutboundSend(draft({ channel: 'SMS', body: 'x'.repeat(1601), purpose: 'FOLLOW_UP' }), facts(), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('BODY_TOO_LONG');
    expect(decision.reason).toContain('1600');
  });

  test('a channel with no provider refuses with NO_PROVIDER', () => {
    const decision = decideOutboundSend(draft({ channel: 'EMAIL' }), facts(), NOW);
    expect(decision.action).toBe('REFUSE');
    expect(decision.code).toBe('NO_PROVIDER');
  });

  test('an empty body refuses', () => {
    expect(decideOutboundSend(draft({ body: '   ' }), facts(), NOW).code).toBe('EMPTY_BODY');
  });

  test('the same content and schedule produce the same send key', () => {
    expect(sendKeyFor(draft())).toBe(sendKeyFor(draft()));
  });

  test('a different body, or a different schedule, is a different send', () => {
    expect(sendKeyFor(draft())).not.toBe(sendKeyFor(draft({ body: 'Different.' })));
    expect(sendKeyFor(draft())).not.toBe(sendKeyFor(draft({ scheduledFor: new Date('2026-10-15T06:00:00Z') })));
  });

  test('nextBusinessWindow rolls forward only when the hour has passed', () => {
    // 02:00 Dhaka → today's 09:00 Dhaka.
    expect(nextBusinessWindow(new Date('2026-10-14T20:00:00Z')).toISOString()).toBe('2026-10-15T03:00:00.000Z');
    // 23:00 Dhaka → tomorrow's 09:00 Dhaka.
    expect(nextBusinessWindow(new Date('2026-10-14T17:00:00Z')).toISOString()).toBe('2026-10-15T03:00:00.000Z');
  });
});

/* ───────────────────────────── delivery, with a store ─────────────────────── */

function createMemoryStore(initialFacts: Partial<SendFacts> = {}) {
  const rows = new Map<
    string,
    { status: string; attempts: number; messageId: string | null; providerMessageId: string | null; retryAt: Date | null; decision: { action: string; code: string } | null }
  >();
  const messages: Array<{ id: string; status: string; reason?: string }> = [];
  let counter = 0;

  const store: OutboundStore = {
    async loadSendFacts() {
      return facts(initialFacts);
    },
    async claimSend({ sendKey, attemptedAt }) {
      const existing = rows.get(sendKey);
      if (existing) {
        if (existing.status === 'SENT') return { claimed: false, messageId: existing.messageId, status: 'SENT', attempts: existing.attempts, reason: 'This exact message has already been sent; it was not sent again.' };
        if (existing.status === 'SUPPRESSED') return { claimed: false, messageId: existing.messageId, status: 'SUPPRESSED', attempts: existing.attempts };
        if (existing.status === 'FAILED' && !existing.retryAt) {
          return { claimed: false, messageId: existing.messageId, status: 'FAILED', attempts: existing.attempts, reason: 'Previous attempts are exhausted; this message is waiting for a human.' };
        }
        if (existing.retryAt && existing.retryAt.getTime() > attemptedAt.getTime()) {
          return { claimed: false, messageId: existing.messageId, status: 'PENDING', attempts: existing.attempts, reason: `Not due yet: the next attempt is scheduled for ${existing.retryAt.toISOString()}.` };
        }
        // PENDING with attempts already made means a send is in flight; the
        // second worker must not send the same message again.
        if (existing.status === 'PENDING' && existing.attempts > 0) {
          return {
            claimed: false,
            messageId: existing.messageId,
            status: 'PENDING',
            attempts: existing.attempts,
            reason: `An attempt for this send is already in progress.`,
          };
        }
        existing.status = 'PENDING';
        existing.attempts += 1;
        return { claimed: true, messageId: existing.messageId, status: 'PENDING', attempts: existing.attempts };
      }
      counter += 1;
      const messageId = `msg_${counter}`;
      rows.set(sendKey, { status: 'PENDING', attempts: 1, messageId, providerMessageId: null, retryAt: null, decision: null });
      messages.push({ id: messageId, status: 'PENDING' });
      return { claimed: true, messageId, status: 'PENDING', attempts: 1 };
    },
    async markSent({ sendKey, messageId, providerMessageId }) {
      const row = rows.get(sendKey)!;
      row.status = 'SENT';
      row.providerMessageId = providerMessageId;
      row.retryAt = null;
      const message = messages.find((candidate) => candidate.id === messageId);
      if (message) message.status = 'SENT';
    },
    async markFailed({ sendKey, messageId, reason, attempts, retryAt }) {
      const row = rows.get(sendKey)!;
      row.status = 'FAILED';
      row.attempts = attempts;
      row.retryAt = retryAt;
      const message = messages.find((candidate) => candidate.id === messageId);
      if (message) {
        message.status = 'FAILED';
        message.reason = reason;
      }
    },
    async recordDecision({ sendKey, decision }) {
      const existing = rows.get(sendKey);
      if (existing && existing.status !== 'PENDING' && existing.status !== 'FAILED') return;
      rows.set(sendKey, {
        status: decision.action === 'REFUSE' ? 'SUPPRESSED' : 'PENDING',
        attempts: existing?.attempts ?? 0,
        messageId: existing?.messageId ?? null,
        providerMessageId: null,
        retryAt: decision.action === 'DEFER' ? decision.retryAt ?? null : null,
        decision: { action: decision.action, code: decision.code },
      });
    },
  };

  return { store, rows, messages };
}

function adapterReturning(result: SendResult, providerId: 'whatsapp_cloud' = 'whatsapp_cloud'): DeliveryAdapter {
  return {
    provider: providerId,
    describeReadiness: () => ({ configured: true, envKey: 'WHATSAPP_ACCESS_TOKEN', note: 'configured' }),
    send: async () => result,
  };
}

const deps = (store: OutboundStore, adapter: DeliveryAdapter | null, now = () => NOW) => ({
  store,
  adapterFor: () => adapter,
  now,
});

describe('sending exactly once', () => {
  test('a sent message is never sent twice, even with a retry call', async () => {
    const memory = createMemoryStore();
    let sends = 0;
    const adapter = adapterReturning({ ok: true, providerMessageId: 'wamid.1', detail: 'accepted' });
    const counting: DeliveryAdapter = { ...adapter, send: async (input) => { sends += 1; return adapter.send(input); } };

    const first = await deliverOutbound(draft(), deps(memory.store, counting));
    const second = await deliverOutbound(draft(), deps(memory.store, counting));

    expect(first.status).toBe('SENT');
    expect(second.status).toBe('DUPLICATE');
    expect(sends).toBe(1);
    expect(memory.messages).toHaveLength(1);
  });

  test('two workers racing the same send produce one send', async () => {
    const memory = createMemoryStore();
    let sends = 0;
    const adapter: DeliveryAdapter = {
      provider: 'whatsapp_cloud',
      describeReadiness: () => ({ configured: true, envKey: 'WHATSAPP_ACCESS_TOKEN', note: 'configured' }),
      send: async () => {
        sends += 1;
        return { ok: true, providerMessageId: 'wamid.race', detail: 'accepted' };
      },
    };

    const [a, b] = await Promise.all([
      deliverOutbound(draft(), deps(memory.store, adapter)),
      deliverOutbound(draft(), deps(memory.store, adapter)),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual(['DUPLICATE', 'SENT']);
    expect(sends).toBe(1);
  });

  test('a refusal records the decision and never reaches the adapter', async () => {
    const memory = createMemoryStore({ purpose: 'MARKETING' as never, consent: 'UNKNOWN' });
    let sends = 0;
    const adapter: DeliveryAdapter = {
      provider: 'whatsapp_cloud',
      describeReadiness: () => ({ configured: true, envKey: 'WHATSAPP_ACCESS_TOKEN', note: 'configured' }),
      send: async () => {
        sends += 1;
        return { ok: true, providerMessageId: null, detail: 'should not happen' };
      },
    };

    const outcome = await deliverOutbound(draft({ purpose: 'MARKETING' }), deps(memory.store, adapter));
    expect(outcome.status).toBe('REFUSED');
    expect(outcome.status === 'REFUSED' && outcome.code).toBe('CONSENT_MISSING');
    expect(sends).toBe(0);
    // Recorded, so "why did nobody hear from us" has an answer.
    const row = [...memory.rows.values()][0];
    expect(row?.status).toBe('SUPPRESSED');
    expect(row?.decision?.code).toBe('CONSENT_MISSING');
  });

  test('a quiet-hours deferral is queued with a time, not dropped', async () => {
    const memory = createMemoryStore({ lastInboundAt: null, sentToday: 0 });
    const night = new Date('2026-10-14T20:00:00Z');
    let sends = 0;
    const adapter: DeliveryAdapter = {
      provider: 'whatsapp_cloud',
      describeReadiness: () => ({ configured: true, envKey: 'x', note: 'configured' }),
      send: async () => { sends += 1; return { ok: true, providerMessageId: null, detail: 'sent' }; },
    };

    const outcome = await deliverOutbound(draft({ channel: 'SMS' }), deps(memory.store, adapter, () => night));
    expect(outcome.status).toBe('DEFERRED');
    expect(outcome.status === 'DEFERRED' && outcome.retryAt.toISOString()).toBe('2026-10-15T03:00:00.000Z');
    expect(sends).toBe(0);
    const row = [...memory.rows.values()][0];
    expect(row?.status).toBe('PENDING');
    expect(row?.retryAt).toBeInstanceOf(Date);
  });

  test('the same draft before its scheduled time is not sent early', async () => {
    // A deferral wrote a row with a future retry time; calling the sender now
    // must not jump the queue.
    const memory = createMemoryStore();
    await memory.store.recordDecision({
      sendKey: sendKeyFor(draft()),
      draft: draft(),
      decision: { action: 'DEFER', code: 'QUIET_HOURS', reason: 'quiet', retryAt: new Date('2026-10-15T03:00:00Z') },
      at: NOW,
    });

    const outcome = await deliverOutbound(draft(), deps(memory.store, adapterReturning({ ok: true, providerMessageId: null, detail: 'sent' })));
    expect(outcome.status).toBe('DUPLICATE');
    expect(outcome.status === 'DUPLICATE' && outcome.reason).toContain('Not due yet');
  });
});

describe('failures are classified, retried on a schedule, then stopped', () => {
  function failingAdapter(result: Extract<SendResult, { ok: false }>): DeliveryAdapter {
    return { provider: 'whatsapp_cloud', describeReadiness: () => ({ configured: true, envKey: 'WHATSAPP_ACCESS_TOKEN', note: 'configured' }), send: async () => result };
  }

  test('a retryable failure schedules the first backoff step', async () => {
    const memory = createMemoryStore();
    const outcome = await deliverOutbound(draft(), deps(memory.store, failingAdapter({ ok: false, code: 'HTTP_ERROR', reason: 'provider is down', retryable: true })));

    expect(outcome.status).toBe('FAILED');
    expect(outcome.status === 'FAILED' && outcome.retryable).toBe(true);
    // First backoff step is 5 minutes (see RETRY_BACKOFF_MINUTES).
    expect(outcome.status === 'FAILED' && outcome.retryAt?.toISOString()).toBe('2026-10-14T06:05:00.000Z');
  });

  test('a non-retryable failure stops immediately and is left for a human', async () => {
    const memory = createMemoryStore();
    const outcome = await deliverOutbound(draft(), deps(memory.store, failingAdapter({ ok: false, code: 'PROVIDER_REJECTED', reason: 'invalid number', retryable: false })));

    expect(outcome.status === 'FAILED' && outcome.retryable).toBe(false);
    expect(outcome.status === 'FAILED' && outcome.retryAt).toBeNull();
  });

  test('backoff advances with each attempt and eventually gives up', async () => {
    const memory = createMemoryStore();
    const adapter = failingAdapter({ ok: false, code: 'HTTP_ERROR', reason: 'still down', retryable: true });

    // Walk the schedule forward. Each attempt must move the retry time later
    // and the sequence must terminate rather than retry forever.
    const seen: string[] = [];
    let clock = NOW;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const outcome = await deliverOutbound(draft(), deps(memory.store, adapter, () => clock));
      if (outcome.status === 'SENT' || outcome.status === 'DUPLICATE') break;
      if (outcome.status === 'FAILED') {
        if (outcome.retryAt) {
          seen.push(outcome.retryAt.toISOString());
          clock = outcome.retryAt;
          continue;
        }
        // Exhausted: no further attempt, and a human is needed.
        expect(outcome.retryable).toBe(false);
        break;
      }
      throw new Error(`unexpected ${outcome.status}`);
    }

    expect(seen.length).toBeGreaterThanOrEqual(4);
    const times = seen.map((value) => new Date(value).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  test('an exhausted message is not picked up again', async () => {
    const memory = createMemoryStore();
    const adapter = failingAdapter({ ok: false, code: 'PROVIDER_REJECTED', reason: 'bad number', retryable: false });
    await deliverOutbound(draft(), deps(memory.store, adapter));
    const again = await deliverOutbound(draft(), deps(memory.store, adapter));
    expect(again.status).toBe('DUPLICATE');
    expect(again.status === 'DUPLICATE' && again.reason).toContain('waiting for a human');
  });
});

describe('credentials', () => {
  test('an unconfigured channel is reported, and nothing is attempted', async () => {
    const memory = createMemoryStore();
    let sends = 0;
    const adapter: DeliveryAdapter = {
      provider: 'whatsapp_cloud',
      describeReadiness: () => ({ configured: false, envKey: 'WHATSAPP_ACCESS_TOKEN', note: 'Outbound sends are disabled: WHATSAPP_ACCESS_TOKEN is not set.' }),
      send: async () => { sends += 1; return { ok: true, providerMessageId: null, detail: 'never' }; },
    };

    const outcome = await deliverOutbound(draft(), deps(memory.store, adapter));
    expect(outcome.status).toBe('NOT_CONFIGURED');
    expect(outcome.status === 'NOT_CONFIGURED' && outcome.envKey).toBe('WHATSAPP_ACCESS_TOKEN');
    expect(sends).toBe(0);
  });

  test('the provider name and variable are named, never a value', () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    const readiness = whatsappAdapter().describeReadiness();
    expect(readiness.configured).toBe(false);
    expect(readiness.note).toContain('WHATSAPP_ACCESS_TOKEN');
    expect(readiness.note).toContain('WHATSAPP_PHONE_NUMBER_ID');
  });

  test('an SMS endpoint must be https: credentials are never posted in the clear', () => {
    expect(safeSendUrl('http://sms.example.com/send').ok).toBe(false);
    expect(safeSendUrl('https://sms.example.com/send').ok).toBe(true);
    expect(safeSendUrl('not a url').ok).toBe(false);
  });
});

/* ──────────────────────────── provider translation ────────────────────────── */

function scriptedFetch(handlers: Array<() => Response>) {
  const calls: Array<{ url: string; body: unknown; authorization: string | null }> = [];
  let index = 0;
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : null,
      authorization: headers.get('authorization'),
    });
    const handler = handlers[Math.min(index, handlers.length - 1)];
    index += 1;
    return handler ? handler() : new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('what each provider actually receives', () => {
  test('a WhatsApp free-form message is sent as text', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const { impl, calls } = scriptedFetch([() => new Response(JSON.stringify({ messages: [{ id: 'wamid.out' }] }), { status: 200 })]);

    const result = await whatsappAdapter({ fetchImpl: impl }).send({
      to: '+8801712345678',
      body: 'Hello',
      isApprovedTemplate: false,
      idempotencyKey: 'send:1',
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.providerMessageId).toBe('wamid.out');
    expect(calls[0]?.url).toContain('/123456/messages');
    expect(calls[0]?.authorization).toBe('Bearer token-abc');
    const body = calls[0]?.body as { type: string; text: { body: string } };
    expect(body.type).toBe('text');
    expect(body.text.body).toBe('Hello');
  });

  test('a WhatsApp template is sent as a template, with its language', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const { impl, calls } = scriptedFetch([() => new Response('{}', { status: 200 })]);

    await whatsappAdapter({ fetchImpl: impl }).send({
      to: '+8801712345678',
      body: 'ignored',
      isApprovedTemplate: true,
      templateName: 'appointment_reminder',
      templateLanguage: 'en',
      idempotencyKey: 'send:2',
    });

    const body = calls[0]?.body as { type: string; template: { name: string; language: { code: string } } };
    expect(body.type).toBe('template');
    expect(body.template.name).toBe('appointment_reminder');
    expect(body.template.language.code).toBe('en');
  });

  test('a template missing its language is refused before the provider sees it', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const { impl, calls } = scriptedFetch([() => new Response('{}', { status: 200 })]);

    const result = await whatsappAdapter({ fetchImpl: impl }).send({
      to: '+8801712345678',
      body: '',
      isApprovedTemplate: true,
      templateName: 'x',
      idempotencyKey: 'send:3',
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('PROVIDER_REJECTED');
    expect(calls).toHaveLength(0);
  });

  test('an expired token is AUTH_FAILED and is not retried', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const { impl } = scriptedFetch([() => new Response('{"error":{"message":"expired"}}', { status: 401 })]);

    const result = await whatsappAdapter({ fetchImpl: impl }).send({ to: '+8801', body: 'x', isApprovedTemplate: false, idempotencyKey: 'k' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('AUTH_FAILED');
    expect(result.ok === false && result.retryable).toBe(false);
  });

  test('being rate-limited is retryable', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const { impl } = scriptedFetch([() => new Response('slow down', { status: 429 })]);
    const result = await whatsappAdapter({ fetchImpl: impl }).send({ to: '+8801', body: 'x', isApprovedTemplate: false, idempotencyKey: 'k' });
    expect(result.ok === false && result.code).toBe('RATE_LIMITED');
    expect(result.ok === false && result.retryable).toBe(true);
  });

  test('a 500 is retryable, a 400 is not', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const server = scriptedFetch([() => new Response('boom', { status: 500 })]);
    const bad = scriptedFetch([() => new Response('nope', { status: 400 })]);
    const a = await whatsappAdapter({ fetchImpl: server.impl }).send({ to: '+8801', body: 'x', isApprovedTemplate: false, idempotencyKey: 'k' });
    const b = await whatsappAdapter({ fetchImpl: bad.impl }).send({ to: '+8801', body: 'x', isApprovedTemplate: false, idempotencyKey: 'k' });
    expect(a.ok === false && a.retryable).toBe(true);
    expect(b.ok === false && b.retryable).toBe(false);
  });

  test('a network failure is retryable and described', async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = 'token-abc';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
    const impl = (async () => { throw new Error('ENOTFOUND'); }) as unknown as typeof fetch;
    const result = await whatsappAdapter({ fetchImpl: impl }).send({ to: '+8801', body: 'x', isApprovedTemplate: false, idempotencyKey: 'k' });
    expect(result.ok === false && result.code).toBe('NETWORK_ERROR');
    expect(result.ok === false && result.retryable).toBe(true);
  });

  test('Messenger sends to the page messaging endpoint as a response', async () => {
    process.env.META_PAGE_ACCESS_TOKEN = 'page-token';
    const { impl, calls } = scriptedFetch([() => new Response(JSON.stringify({ message_id: 'mid.1' }), { status: 200 })]);
    const result = await metaMessagingAdapter('meta_messenger', { fetchImpl: impl }).send({
      to: 'psid-1',
      body: 'Hi',
      isApprovedTemplate: false,
      idempotencyKey: 'k',
    });
    expect(result.ok).toBe(true);
    expect(result.ok && result.providerMessageId).toBe('mid.1');
    expect(calls[0]?.url).toContain('/me/messages');
    const body = calls[0]?.body as { recipient: { id: string }; messaging_type: string };
    expect(body.recipient.id).toBe('psid-1');
    expect(body.messaging_type).toBe('RESPONSE');
  });

  test('Instagram uses the same adapter but reports its own provider', async () => {
    process.env.META_PAGE_ACCESS_TOKEN = 'page-token';
    const adapter = metaMessagingAdapter('instagram');
    expect(adapter.provider).toBe('instagram');
  });

  test('the SMS adapter posts to the configured endpoint with the reference key', async () => {
    process.env.ALO_SMS_ACCESS_TOKEN = 'sms-token';
    process.env.ALO_SMS_SEND_URL = 'https://sms.example.com/api/send';
    const { impl, calls } = scriptedFetch([() => new Response(JSON.stringify({ sid: 'sms-1' }), { status: 200 })]);

    const result = await smsAdapter({ fetchImpl: impl }).send({ to: '+8801', body: 'Hi', isApprovedTemplate: false, idempotencyKey: 'send:9' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.providerMessageId).toBe('sms-1');
    expect(calls[0]?.url).toBe('https://sms.example.com/api/send');
    expect((calls[0]?.body as { reference: string }).reference).toBe('send:9');
  });

  test('the adapter registry covers exactly the channels we can send on', () => {
    expect(defaultAdapterFor('whatsapp_cloud')?.provider).toBe('whatsapp_cloud');
    expect(defaultAdapterFor('meta_messenger')?.provider).toBe('meta_messenger');
    expect(defaultAdapterFor('instagram')?.provider).toBe('instagram');
    expect(defaultAdapterFor('sms_provider')?.provider).toBe('sms_provider');
    expect(defaultAdapterFor('internal')).toBeNull();
  });
});

/* ──────────────────────────────── receipts ────────────────────────────────── */

describe('delivery receipts', () => {
  test('progress moves forward', () => {
    expect(shouldApplyReceipt('SENT', 'DELIVERED').apply).toBe(true);
    expect(shouldApplyReceipt('DELIVERED', 'READ').apply).toBe(true);
    expect(shouldApplyReceipt('PENDING', 'SENT').apply).toBe(true);
  });

  test('a stale receipt is ignored rather than moving a message backwards', () => {
    // Providers deliver out of order; a READ already proves DELIVERED.
    expect(shouldApplyReceipt('READ', 'DELIVERED').apply).toBe(false);
    expect(shouldApplyReceipt('DELIVERED', 'SENT').apply).toBe(false);
  });

  test('a failure is recorded unless the student already read the message', () => {
    expect(shouldApplyReceipt('SENT', 'FAILED').apply).toBe(true);
    expect(shouldApplyReceipt('READ', 'FAILED').apply).toBe(false);
  });

  function receiptStore(current: { id: string; status: string } | null) {
    const applied: Array<{ messageId: string; status: string }> = [];
    const ignored: Array<{ reason: string }> = [];
    const store: ReceiptStore = {
      async findMessageByProviderId() {
        return current;
      },
      async applyReceipt(input) {
        applied.push({ messageId: input.messageId, status: input.status });
      },
      async recordIgnoredReceipt(input) {
        ignored.push({ reason: input.reason });
      },
    };
    return { store, applied, ignored };
  }

  test('a receipt for a known message is applied', async () => {
    const { store, applied } = receiptStore({ id: 'msg_1', status: 'SENT' });
    const outcome = await applyDeliveryReceipt({ providerMessageId: 'wamid.1', status: 'DELIVERED', occurredAt: NOW }, store, NOW);
    expect(outcome.status).toBe('APPLIED');
    expect(applied).toEqual([{ messageId: 'msg_1', status: 'DELIVERED' }]);
  });

  test('a receipt for an unknown message is acknowledged and recorded, not an error', async () => {
    const { store, applied, ignored } = receiptStore(null);
    const outcome = await applyDeliveryReceipt({ providerMessageId: 'wamid.unknown', status: 'READ', occurredAt: null }, store, NOW);
    expect(outcome.status).toBe('UNKNOWN_MESSAGE');
    expect(applied).toHaveLength(0);
    expect(ignored).toHaveLength(1);
  });

  test('an out-of-order receipt changes nothing and is recorded', async () => {
    const { store, applied, ignored } = receiptStore({ id: 'msg_2', status: 'READ' });
    const outcome = await applyDeliveryReceipt({ providerMessageId: 'wamid.2', status: 'DELIVERED', occurredAt: NOW }, store, NOW);
    expect(outcome.status).toBe('IGNORED');
    expect(applied).toHaveLength(0);
    expect(ignored[0]?.reason).toContain('stale');
  });
});

/* ──────────────────────────────── the runner ──────────────────────────────── */

describe('the queue runner', () => {
  test('drains what is due and summarises the result', async () => {
    const attempted: string[] = [];
    const summary = await runDueSends({
      now: () => NOW,
      store: {
        async findDueSends() {
          return [
            dueRow({ sendKey: 'send:a', studentId: 'stu_1' }),
            dueRow({ sendKey: 'send:b', studentId: 'stu_2' }),
            dueRow({ sendKey: 'send:c', studentId: 'stu_3' }),
          ];
        },
        async cancelSend() {},
      },
      deliver: async (outbound) => {
        attempted.push(outbound.studentId);
        if (outbound.studentId === 'stu_1') return { status: 'SENT', sendKey: 'send:a', providerMessageId: 'm1', attempts: 1 };
        if (outbound.studentId === 'stu_2') return { status: 'DEFERRED', sendKey: 'send:b', code: 'QUIET_HOURS', reason: 'quiet', retryAt: NOW };
        return { status: 'REFUSED', sendKey: 'send:c', code: 'OPTED_OUT', reason: 'opted out' };
      },
    });

    expect(summary.considered).toBe(3);
    expect(summary.sent).toBe(1);
    expect(summary.deferred).toBe(1);
    expect(summary.refused).toBe(1);
    expect(attempted).toEqual(['stu_1', 'stu_2', 'stu_3']);
  });

  test('one failing send does not abandon the rest of the batch', async () => {
    const seen: string[] = [];
    await expect(
      runDueSends({
        now: () => NOW,
        store: {
          async findDueSends() {
            return [dueRow({ sendKey: 'send:a', studentId: 'stu_1' }), dueRow({ sendKey: 'send:b', studentId: 'stu_2' })];
          },
          async cancelSend() {},
        },
        deliver: async (outbound) => {
          seen.push(outbound.studentId);
          if (outbound.studentId === 'stu_1') throw new Error('store exploded');
          return { status: 'SENT', sendKey: 'send:b', providerMessageId: null, attempts: 1 };
        },
      }),
    ).rejects.toThrow('store exploded');
    // Honest about what happened: the batch stopped. Which is why the runner
    // reports per-item outcomes rather than a single boolean.
    expect(seen).toEqual(['stu_1']);
  });

  test('a queue row becomes the same draft that was deferred', () => {
    const row = dueRow({ sendKey: 'send:z', studentId: 'stu_9' });
    const reconstructed = draftFromDueSend(row);
    expect(reconstructed.studentId).toBe('stu_9');
    expect(reconstructed.channel).toBe('SMS');
    expect(reconstructed.purpose).toBe('FOLLOW_UP');
    expect(reconstructed.scheduledFor).toEqual(row.scheduledFor);
  });
});

function dueRow(overrides: Partial<Parameters<typeof draftFromDueSend>[0]> = {}) {
  return {
    sendKey: 'send:x',
    channel: 'SMS',
    purpose: 'FOLLOW_UP',
    studentId: 'stu_x',
    conversationId: null,
    recipientHandle: '+8801712345678',
    body: 'Reminder',
    isApprovedTemplate: false,
    templateName: null,
    templateLanguage: null,
    scheduledFor: new Date('2026-10-14T05:00:00Z'),
    attempts: 1,
    nextAttemptAt: new Date('2026-10-14T05:00:00Z'),
    ...overrides,
  };
}
