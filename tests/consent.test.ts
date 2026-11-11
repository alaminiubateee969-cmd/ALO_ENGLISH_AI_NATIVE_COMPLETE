/**
 * tests/consent.test.ts
 *
 * The consent register is the part of this system that has to survive being
 * questioned a year later, so these tests are mostly about what it REFUSES:
 *  - a grant with no source, or no evidence ("we think they agreed" is not a record);
 *  - a row that says "unknown", which is the absence of a record;
 *  - a capture attached to a student by name, which is how one person's consent
 *    ends up on another person's file.
 *
 * And about what it must never get wrong in the other direction: a withdrawal or
 * a denial is always accepted, immediately, with nothing required.
 */

import { describe, expect, test } from 'bun:test';

const {
  captureBelongsToStudent,
  consentMatrix,
  detectWithdrawalIntent,
  isMarketingOptOut,
  marketingReadiness,
  validateConsentCapture,
  WITHDRAWAL_PHRASES,
} = await import('../src/lib/crm/consent');

describe('recording a grant', () => {
  test('a grant with a source and evidence is accepted', () => {
    const result = validateConsentCapture({
      channel: 'whatsapp',
      purpose: 'marketing',
      status: 'granted',
      source: 'form',
      evidence: 'Website form checkbox, wording recorded 2026-10-14',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.channel).toBe('WHATSAPP');
    expect(result.value.status).toBe('GRANTED');
  });

  test('a grant with no source is refused', () => {
    const result = validateConsentCapture({ channel: 'SMS', purpose: 'MARKETING', status: 'GRANTED', evidence: 'verbal' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('SOURCE_REQUIRED');
  });

  test('a grant with no evidence is refused', () => {
    const result = validateConsentCapture({ channel: 'SMS', purpose: 'MARKETING', status: 'GRANTED', source: 'STAFF_ENTRY' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('EVIDENCE_REQUIRED');
  });

  test('evidence of three characters of whitespace is not evidence', () => {
    const result = validateConsentCapture({ channel: 'SMS', purpose: 'MARKETING', status: 'GRANTED', source: 'STAFF_ENTRY', evidence: '   ' });
    expect(result.ok).toBe(false);
  });
});

describe('recording a refusal or a withdrawal', () => {
  test('a withdrawal needs no source and no evidence', () => {
    const result = validateConsentCapture({ channel: 'WHATSAPP', purpose: 'MARKETING', status: 'WITHDRAWN' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Recorded as a staff entry so the register always says where it came from,
    // but nothing was required of the person saying stop.
    expect(result.value.source).toBe('STAFF_ENTRY');
    expect(result.value.evidence).toBeNull();
  });

  test('a denial needs nothing either', () => {
    expect(validateConsentCapture({ channel: 'SMS', purpose: 'SERVICE', status: 'DENIED' }).ok).toBe(true);
  });

  test('"unknown" cannot be recorded: it is the absence of a record', () => {
    const result = validateConsentCapture({ channel: 'SMS', purpose: 'MARKETING', status: 'UNKNOWN' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('UNKNOWN_IS_NOT_A_RECORD');
  });
});

describe('validation of the axis itself', () => {
  test('an unknown channel is refused', () => {
    expect(validateConsentCapture({ channel: 'TELEGRAM', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'x' }).ok).toBe(false);
  });

  test('an unknown purpose is refused', () => {
    expect(validateConsentCapture({ channel: 'SMS', purpose: 'GOSSIP', status: 'GRANTED', source: 'FORM', evidence: 'x' }).ok).toBe(false);
  });

  test('an unknown source is refused', () => {
    const result = validateConsentCapture({ channel: 'SMS', purpose: 'MARKETING', status: 'GRANTED', source: 'HEARSAY', evidence: 'x' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('INVALID_SOURCE');
  });
});

describe('the matrix', () => {
  const entries = [
    { channel: 'WHATSAPP', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'form', recordedAt: new Date('2026-10-01') },
    { channel: 'SMS', purpose: 'MARKETING', status: 'WITHDRAWN', source: 'INBOUND_MESSAGE', evidence: 'message:1', recordedAt: new Date('2026-10-02') },
  ];

  test('covers every channel/purpose combination, including the empty ones', () => {
    const matrix = consentMatrix(entries);
    expect(matrix).toHaveLength(15); // 5 channels × 3 purposes
    const emailService = matrix.find((cell) => cell.channel === 'EMAIL' && cell.purpose === 'SERVICE');
    expect(emailService?.status).toBe('UNKNOWN');
    expect(emailService?.recordedAt).toBeNull();
  });

  test('a recorded decision appears with its evidence', () => {
    const cell = consentMatrix(entries).find((candidate) => candidate.channel === 'WHATSAPP' && candidate.purpose === 'MARKETING');
    expect(cell?.status).toBe('GRANTED');
    expect(cell?.evidence).toBe('form');
  });
});

describe('marketing opt-out is global', () => {
  test('a withdrawal on one channel suppresses marketing everywhere', () => {
    const entries = [
      { channel: 'WHATSAPP', purpose: 'MARKETING', status: 'GRANTED' },
      { channel: 'SMS', purpose: 'MARKETING', status: 'WITHDRAWN' },
    ];
    expect(isMarketingOptOut(entries)).toBe(true);
    const readiness = marketingReadiness(entries);
    expect(readiness.allowed).toBe(false);
    expect(readiness.reason).toContain('every channel');
  });

  test('a denial counts the same as a withdrawal', () => {
    expect(isMarketingOptOut([{ channel: 'EMAIL', purpose: 'MARKETING', status: 'DENIED' }])).toBe(true);
  });

  test('a withdrawal of service consent does not suppress marketing consent', () => {
    expect(isMarketingOptOut([{ channel: 'SMS', purpose: 'SERVICE', status: 'WITHDRAWN' }])).toBe(false);
  });

  test('no marketing consent at all says so, and says what would fix it', () => {
    const readiness = marketingReadiness([]);
    expect(readiness.allowed).toBe(false);
    expect(readiness.reason).toContain('No marketing consent');
  });

  test('consent on one channel does not silently grant another', () => {
    const readiness = marketingReadiness([{ channel: 'EMAIL', purpose: 'MARKETING', status: 'GRANTED' }]);
    expect(readiness.allowed).toBe(true);
    expect(readiness.grantedChannels).toEqual(['EMAIL']);
    expect(readiness.reason).toContain('Other channels still need their own capture');
  });
});

describe('a student saying stop in their own words', () => {
  test('plain English words are detected', () => {
    for (const phrase of ['STOP', 'please unsubscribe me', 'do not message me again']) {
      const intent = detectWithdrawalIntent(phrase);
      expect(intent.withdrawal).toBe(true);
      expect(intent.purposes).toEqual(['MARKETING']);
    }
  });

  test('Bengali is detected, because that is how most students will write it', () => {
    const intent = detectWithdrawalIntent('আমাকে মেসেজ পাঠাবেন না');
    expect(intent.withdrawal).toBe(true);
    expect(intent.matched.length).toBeGreaterThan(0);
  });

  test('romanised Bengali is detected too', () => {
    expect(detectWithdrawalIntent('please message bondho korun').withdrawal).toBe(true);
    expect(detectWithdrawalIntent('msg bondho koro').withdrawal).toBe(true);
  });

  test('a withdrawal withdraws marketing, NOT service', () => {
    // A student saying "stop the offers" must still be able to get a reply about
    // their application. Cutting off support on a keyword would be the harm the
    // keyword is meant to prevent.
    const intent = detectWithdrawalIntent('stop sending me offers');
    expect(intent.purposes).toEqual(['MARKETING']);
  });

  test('an explicit "contact me never" declines service too', () => {
    const intent = detectWithdrawalIntent('do not contact me again, no calls');
    expect(intent.withdrawal).toBe(true);
    expect(intent.purposes).toEqual(['MARKETING', 'SERVICE', 'FOLLOW_UP']);
  });

  test('the matched phrase is quoted back so a human can check it', () => {
    const intent = detectWithdrawalIntent('kindly unsubscribe me from the list');
    expect(intent.matched).toContain('unsubscribe');
  });

  test('ordinary messages are not mistaken for a withdrawal', () => {
    for (const message of [
      'I want to study in the UK, when is the next intake?',
      'ami IELTS prepare korte chai',
      'My deadline is next month, please help',
      'Can you send me the course list?',
    ]) {
      expect(detectWithdrawalIntent(message).withdrawal).toBe(false);
    }
  });

  test('an empty message is not a withdrawal', () => {
    expect(detectWithdrawalIntent('').withdrawal).toBe(false);
    expect(detectWithdrawalIntent(null).withdrawal).toBe(false);
  });

  test('the phrase list has no empty entries, which would match everything', () => {
    expect(WITHDRAWAL_PHRASES.every((phrase) => phrase.trim().length > 1)).toBe(true);
  });
});

describe('a form capture finding its owner', () => {
  test('matches on email, case-insensitively', () => {
    const result = captureBelongsToStudent({ channel: 'EMAIL', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'form', recordedAt: null, leadEmail: 'Rahim@Example.com' }, { email: 'rahim@example.com' });
    expect(result.belongs).toBe(true);
  });

  test('matches on a normalised phone number', () => {
    const result = captureBelongsToStudent({ channel: 'SMS', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'form', recordedAt: null, leadPhone: '01712-345678' }, { phone: '+8801712345678' });
    expect(result.belongs).toBe(true);
  });

  test('never matches on a name', () => {
    // Two students can share a name. The capture carries no email or phone here,
    // so it must not attach — even though the student "looks" like the lead.
    const result = captureBelongsToStudent({ channel: 'EMAIL', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'form', recordedAt: null }, { email: 'someone@example.com', phone: '+8801712345678' });
    expect(result.belongs).toBe(false);
    expect(result.reason).toContain('Neither email nor phone');
  });

  test('a different email and phone do not match', () => {
    const result = captureBelongsToStudent({ channel: 'EMAIL', purpose: 'MARKETING', status: 'GRANTED', source: 'FORM', evidence: 'form', recordedAt: null, leadEmail: 'a@example.com', leadPhone: '01711111111' }, { email: 'b@example.com', phone: '+8801700000000' });
    expect(result.belongs).toBe(false);
  });
});
