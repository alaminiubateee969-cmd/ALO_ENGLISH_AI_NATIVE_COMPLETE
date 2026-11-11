/**
 * tests/communication-hub.test.ts
 *
 * Covers the pure core of the communication hub: student identity codes and
 * matching, webhook idempotency, send policy, and the permission matrix.
 *
 * These are the parts that decide whether a message creates a second student, a
 * second copy of a document, or an unlawful send — so they are tested from the
 * adversarial side, not just the happy path.
 */

import { describe, expect, test } from 'bun:test';
import {
  academicYear,
  formatStudentCode,
  isValidStudentCode,
  normalizeEmail,
  normalizePhone,
  normalizeStudentCode,
  parseStudentCode,
  resolveIdentity,
} from '../src/lib/crm/identity';
import {
  classifyDuplicate,
  deriveEventKey,
  deriveMessageKey,
  deriveSendKey,
  stableHash,
  stableStringify,
} from '../src/lib/crm/automation';
import {
  DAILY_MESSAGE_CAP,
  DEFAULT_BUSINESS_HOURS,
  evaluateSendPolicy,
  nextRetryAt,
  type SendContext,
} from '../src/lib/crm/messaging-policy';
import {
  canManageChannelCredentials,
  canPermanentlyDelete,
  canReadStudentDocument,
  canSendMarketing,
  canSoftDelete,
  canVerifyDocument,
  canViewCampaignPerformance,
  requiresHumanReview,
} from '../src/lib/crm/permissions';

// ─── Student identity ─────────────────────────────────────────────────────

describe('student code', () => {
  test('formats the documented shape', () => {
    expect(formatStudentCode(2026, 1)).toBe('ALO-2026-000001');
    expect(formatStudentCode(2026, 999999)).toBe('ALO-2026-999999');
  });

  test('refuses to produce an out-of-range code', () => {
    expect(() => formatStudentCode(2026, 0)).toThrow();
    expect(() => formatStudentCode(2026, 1000000)).toThrow();
    expect(() => formatStudentCode(26, 1)).toThrow();
  });

  test('round-trips through parsing', () => {
    expect(parseStudentCode('ALO-2026-000123')).toEqual({ year: 2026, sequence: 123 });
    expect(parseStudentCode('alo-2026-000123')).toEqual({ year: 2026, sequence: 123 });
    expect(parseStudentCode('ALO-26-1')).toBeNull();
    expect(isValidStudentCode('ALO-2026-000123')).toBe(true);
    expect(isValidStudentCode('ALO-2026-123')).toBe(false);
    expect(normalizeStudentCode(' alo-2026-000123 ')).toBe('ALO-2026-000123');
    expect(normalizeStudentCode('nonsense')).toBeNull();
  });

  test('uses the calendar year for allocation', () => {
    expect(academicYear(new Date('2026-01-01T00:00:00Z'))).toBe(2026);
    expect(academicYear(new Date('2026-12-31T23:59:59Z'))).toBe(2026);
  });
});

describe('phone and email normalisation', () => {
  test('treats the three Bangladesh forms as one subscriber', () => {
    const expected = '8801712345678';
    expect(normalizePhone('+880 1712-345678')).toBe(expected);
    expect(normalizePhone('8801712345678')).toBe(expected);
    expect(normalizePhone('01712345678')).toBe(expected);
  });

  test('returns null rather than guessing at unusable input', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });

  test('normalises email case and whitespace', () => {
    expect(normalizeEmail('  Student@Example.COM ')).toBe('student@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
  });
});

describe('identity resolution', () => {
  const existing = [
    { studentId: 's1', studentCode: 'ALO-2026-000001', phone: '+8801712345678', email: 'rahim@example.com', name: 'Rahim Uddin', channelUserIds: ['wa-111'] },
    { studentId: 's2', studentCode: 'ALO-2026-000002', phone: '+8801812345678', email: 'karim@example.com', name: 'Karim Ali' },
  ];

  test('an exact student code always matches', () => {
    const result = resolveIdentity({ channel: 'WHATSAPP', studentCode: 'ALO-2026-000002' }, existing);
    expect(result.decision).toBe('MATCHED');
    expect(result.studentId).toBe('s2');
  });

  test('a known channel sender id matches', () => {
    const result = resolveIdentity({ channel: 'WHATSAPP', channelUserId: 'wa-111' }, existing);
    expect(result.decision).toBe('MATCHED');
    expect(result.studentId).toBe('s1');
  });

  test('a unique phone match works across the +880/0 forms', () => {
    const result = resolveIdentity({ channel: 'SMS', phone: '01712345678' }, existing);
    expect(result.decision).toBe('MATCHED');
    expect(result.studentId).toBe('s1');
  });

  test('creates a new student when nothing matches', () => {
    const result = resolveIdentity({ channel: 'WHATSAPP', phone: '+8801999999999' }, existing);
    expect(result.decision).toBe('NEW');
    expect(result.canCreate).toBe(true);
  });

  test('NEVER merges on a name alone — it goes to review', () => {
    const result = resolveIdentity({ channel: 'FACEBOOK', name: 'Rahim Uddin' }, existing);
    expect(result.decision).toBe('REVIEW');
    expect(result.studentId).toBeUndefined();
    expect(result.canCreate).toBe(true);
    expect(result.reasons.join(' ')).toContain('not used to merge');
  });

  test('a phone shared by two students goes to review, not to a guess', () => {
    const shared = [
      { studentId: 's1', phone: '+8801712345678' },
      { studentId: 's2', phone: '01712345678' },
    ];
    const result = resolveIdentity({ channel: 'WHATSAPP', phone: '+8801712345678' }, shared);
    expect(result.decision).toBe('REVIEW');
    expect(result.canCreate).toBe(false);
    expect(result.reasons.join(' ')).toContain('matches 2 records');
  });

  test('an unknown student code does not block a phone-based match', () => {
    const result = resolveIdentity(
      { channel: 'WHATSAPP', studentCode: 'ALO-2026-000999', phone: '+8801712345678' },
      existing,
    );
    expect(result.decision).toBe('MATCHED');
    expect(result.studentId).toBe('s1');
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────

describe('webhook idempotency', () => {
  test('prefers the provider event id, and it is stable across retries', () => {
    const base = { provider: 'whatsapp_cloud' as const, externalEventId: 'wamid.ABC', senderId: '8801712345678' };
    const first = deriveEventKey(base);
    const retry = deriveEventKey({ ...base, occurredAt: new Date('2026-10-14T10:00:00Z') });
    expect(first.basis).toBe('external_id');
    expect(first.key).toBe(retry.key);
  });

  test('falls back to thread + sender + timestamp, and survives a re-serialised payload', () => {
    const event = {
      provider: 'meta_messenger' as const,
      externalThreadId: 't_123',
      senderId: 'psid_9',
      occurredAt: 1791972000000,
    };
    const first = deriveEventKey({ ...event });
    const retry = deriveEventKey({ ...event, payload: { different: 'serialisation' } });
    expect(first.basis).toBe('thread_sender_time');
    expect(first.key).toBe(retry.key);
  });

  test('accepts ISO timestamps as well as epoch millis', () => {
    const a = deriveEventKey({ provider: 'instagram', externalThreadId: 't', senderId: 's', occurredAt: '2026-10-14T10:00:00Z' });
    const b = deriveEventKey({ provider: 'instagram', externalThreadId: 't', senderId: 's', occurredAt: Date.parse('2026-10-14T10:00:00Z') });
    expect(a.key).toBe(b.key);
  });

  test('a different timestamp is a different event', () => {
    const a = deriveEventKey({ provider: 'instagram', externalThreadId: 't', senderId: 's', occurredAt: 1000 });
    const b = deriveEventKey({ provider: 'instagram', externalThreadId: 't', senderId: 's', occurredAt: 2000 });
    expect(a.key).not.toBe(b.key);
  });

  test('reports when it had to fall back to a payload hash', () => {
    const result = deriveEventKey({ provider: 'sms_provider', payload: { id: 1 } });
    expect(result.basis).toBe('payload_hash');
  });

  test('the same provider id in two providers is two events', () => {
    const wa = deriveEventKey({ provider: 'whatsapp_cloud', externalEventId: 'X' });
    const ig = deriveEventKey({ provider: 'instagram', externalEventId: 'X' });
    expect(wa.key).not.toBe(ig.key);
  });

  test('stableStringify is key-order independent', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableHash({ b: 1, a: 2 })).toBe(stableHash({ a: 2, b: 1 }));
  });

  test('message and send keys are namespaced and normalised', () => {
    expect(deriveMessageKey('whatsapp', 'wamid.1')).toBe('WHATSAPP:wamid.1');
    const when = new Date('2026-10-14T10:00:00Z');
    expect(deriveSendKey({ channel: 'sms', studentId: 's1', purpose: 'FOLLOW_UP', templateOrBodyHash: 'h', scheduledFor: when })).toBe(
      deriveSendKey({ channel: 'SMS', studentId: 's1', purpose: 'FOLLOW_UP', templateOrBodyHash: 'h', scheduledFor: when }),
    );
  });

  test('classifies an already-processed event instead of reprocessing it', () => {
    expect(classifyDuplicate(null).isDuplicate).toBe(false);
    expect(classifyDuplicate('SUCCEEDED')).toEqual({
      isDuplicate: true,
      shouldRetry: false,
      reason: 'Event already processed successfully; acknowledge and ignore.',
    });
    expect(classifyDuplicate('FAILED').shouldRetry).toBe(true);
    expect(classifyDuplicate('PROCESSING').shouldRetry).toBe(false);
  });
});

// ─── Send policy ──────────────────────────────────────────────────────────

describe('send policy', () => {
  const base: SendContext = {
    channel: 'SMS',
    purpose: 'MARKETING',
    consent: 'GRANTED',
    marketingOptOut: false,
    now: new Date('2026-10-14T06:00:00Z'), // 12:00 in Dhaka
    sentToday: 0,
  };

  test('allows a consented marketing send inside business hours', () => {
    const result = evaluateSendPolicy(base);
    expect(result.allowed).toBe(true);
    expect(result.code).toBe('OK');
  });

  test('marketing without consent is refused', () => {
    const result = evaluateSendPolicy({ ...base, consent: 'UNKNOWN' });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('CONSENT_MISSING');
  });

  test('a central opt-out beats granted consent on any channel', () => {
    const result = evaluateSendPolicy({ ...base, channel: 'WHATSAPP', marketingOptOut: true, consent: 'GRANTED' });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('OPTED_OUT');
  });

  test('an opt-out does not block a service reply', () => {
    const result = evaluateSendPolicy({
      ...base,
      purpose: 'SERVICE',
      marketingOptOut: true,
      channel: 'WHATSAPP',
      lastInboundAt: new Date('2026-10-14T05:00:00Z'),
    });
    expect(result.allowed).toBe(true);
  });

  test('a declined student is not contacted on that channel', () => {
    const result = evaluateSendPolicy({ ...base, purpose: 'FOLLOW_UP', consent: 'DENIED' });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('CONSENT_MISSING');
  });

  test('WhatsApp outside the 24h window needs an approved template', () => {
    const stale = { ...base, channel: 'WHATSAPP' as const, purpose: 'SERVICE' as const, lastInboundAt: new Date('2026-10-10T05:00:00Z') };
    expect(evaluateSendPolicy(stale).code).toBe('WHATSAPP_WINDOW_CLOSED');
    expect(evaluateSendPolicy({ ...stale, isApprovedTemplate: true }).allowed).toBe(true);
  });

  test('an open WhatsApp window outranks quiet hours', () => {
    const night = new Date('2026-10-14T20:00:00Z'); // 02:00 in Dhaka
    const result = evaluateSendPolicy({
      ...base,
      channel: 'WHATSAPP',
      purpose: 'SERVICE',
      now: night,
      lastInboundAt: new Date(night.getTime() - 60 * 60 * 1000),
    });
    expect(result.allowed).toBe(true);
  });

  test('quiet hours block an SMS reminder', () => {
    const result = evaluateSendPolicy({ ...base, now: new Date('2026-10-14T20:00:00Z') });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('QUIET_HOURS');
  });

  test('the daily cap stops a retry loop', () => {
    const result = evaluateSendPolicy({ ...base, sentToday: DAILY_MESSAGE_CAP });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('DAILY_CAP_REACHED');
  });

  test('an invalid clock is refused rather than defaulted', () => {
    const result = evaluateSendPolicy({ ...base, now: new Date('nonsense') });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('INVALID_CONTEXT');
  });

  test('retry backoff is bounded and then exhausted', () => {
    const from = new Date('2026-10-14T06:00:00Z');
    expect(nextRetryAt(1, from).retryAt?.toISOString()).toBe('2026-10-14T06:05:00.000Z');
    expect(nextRetryAt(4, from).retryAt?.toISOString()).toBe('2026-10-14T18:00:00.000Z');
    expect(nextRetryAt(5, from)).toEqual({ retryAt: null, exhausted: true });
  });

  test('business hours default to the Dhaka working day', () => {
    expect(DEFAULT_BUSINESS_HOURS.utcOffsetMinutes).toBe(360);
    expect(DEFAULT_BUSINESS_HOURS.startHour).toBe(9);
  });
});

// ─── Permissions ──────────────────────────────────────────────────────────

describe('communication-hub permissions', () => {
  const studentId = 's1';

  test('a marketing manager may run campaigns but never read documents', () => {
    expect(canViewCampaignPerformance('MARKETING_MANAGER').allowed).toBe(true);
    expect(canSendMarketing('MARKETING_MANAGER').allowed).toBe(true);

    const read = canReadStudentDocument({ role: 'MARKETING_MANAGER', studentId, isAssignedCounselor: false });
    expect(read.allowed).toBe(false);
    expect(read.code).toBe('TARGET_PROTECTED');
  });

  test('rank alone never opens a passport scan', () => {
    for (const role of ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'] as const) {
      const withoutGrant = canReadStudentDocument({ role, studentId, isAssignedCounselor: false, sensitivity: 'SENSITIVE' });
      expect(withoutGrant.allowed).toBe(false);
      expect(withoutGrant.code).toBe('GRANT_REQUIRED');

      const withGrant = canReadStudentDocument({ role, studentId, isAssignedCounselor: false, sensitivity: 'SENSITIVE', hasExplicitGrant: true });
      expect(withGrant.allowed).toBe(true);
      expect(withGrant.auditRequired).toBe(true);
    }
  });

  test('the assigned counselor may open it, and the read is audited', () => {
    const result = canReadStudentDocument({ role: 'COUNSELOR', studentId, isAssignedCounselor: true, sensitivity: 'SENSITIVE' });
    expect(result.allowed).toBe(true);
    expect(result.auditRequired).toBe(true);
  });

  test('an unassigned counselor is refused', () => {
    const result = canReadStudentDocument({ role: 'COUNSELOR', studentId, isAssignedCounselor: false, sensitivity: 'SENSITIVE' });
    expect(result.allowed).toBe(false);
  });

  test('partners see referral status, never identity documents', () => {
    const result = canReadStudentDocument({ role: 'PARTNER', studentId, isAssignedCounselor: false, partnerStudentIds: [studentId] });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('GRANT_REQUIRED');
  });

  test('a partner outside scope is a scope failure, not a grant requirement', () => {
    const result = canReadStudentDocument({ role: 'PARTNER', studentId: 'other', isAssignedCounselor: false, partnerStudentIds: [studentId] });
    expect(result.code).toBe('SCOPE_MISMATCH');
  });

  test('permanent deletion is not a role permission for anyone', () => {
    for (const role of ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER'] as const) {
      const result = canPermanentlyDelete(role);
      expect(result.allowed).toBe(false);
      expect(result.auditRequired).toBe(true);
    }
  });

  test('soft delete is limited to branch managers and above', () => {
    expect(canSoftDelete('BRANCH_MANAGER').allowed).toBe(true);
    expect(canSoftDelete('COUNSELOR').allowed).toBe(false);
    expect(canSoftDelete('MARKETING_MANAGER').allowed).toBe(false);
  });

  test('verification needs both a reviewing role and responsibility', () => {
    expect(canVerifyDocument('VISA_OFFICER', true).allowed).toBe(true);
    expect(canVerifyDocument('VISA_OFFICER', false).allowed).toBe(false);
    expect(canVerifyDocument('MARKETING_MANAGER', true).allowed).toBe(false);
  });

  test('only a super admin may manage credentials', () => {
    expect(canManageChannelCredentials('SUPER_ADMIN').allowed).toBe(true);
    expect(canManageChannelCredentials('ADMIN').allowed).toBe(false);
  });

  test('sensitive topics are routed to a human', () => {
    expect(requiresHumanReview('Can you check my passport number?').required).toBe(true);
    expect(requiresHumanReview('I had a visa refusal last year').required).toBe(true);
    expect(requiresHumanReview('What documents do I need for a bank statement?').required).toBe(true);
    expect(requiresHumanReview('What time is the IELTS class?').required).toBe(false);
  });
});
