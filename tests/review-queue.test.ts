/**
 * tests/review-queue.test.ts
 *
 * The queue is the human half of every "we will not guess" rule in the hub, so
 * these tests cover the two ways it can fail a person:
 *
 *   - by burying them (sorted newest-first, so the longest wait is at the
 *     bottom), and
 *   - by letting an entry be dismissed with no explanation, which is how a
 *     possible duplicate quietly becomes one person's record and another
 *     person's problem.
 */

import { describe, expect, test } from 'bun:test';

const { buildReviewQueue, describeResolution, validateResolution } = await import('../src/lib/crm/review-queue');

const NOW = new Date('2026-10-14T12:00:00Z');
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 60 * 60 * 1000);

function conversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conv_1',
    channel: 'WHATSAPP',
    externalThreadId: '8801712345678',
    studentId: null as string | null,
    needsReview: true,
    reviewReason: 'Name matches an existing student but the number does not; not attached automatically.',
    messageCount: 2,
    lastMessageAt: hoursAgo(1),
    createdAt: hoursAgo(30),
    studentName: null as string | null,
    studentCode: null as string | null,
    lastMessagePreview: 'Hello, is this the ALO office?',
    ...overrides,
  };
}

function document(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc_1',
    studentId: 'stu_1' as string | null,
    type: 'PASSPORT',
    fileName: 'passport.pdf',
    fileSize: 2 * 1024 * 1024,
    sourceChannel: 'WHATSAPP',
    verificationStatus: 'PENDING_REVIEW',
    createdAt: hoursAgo(5),
    studentName: 'Rahim',
    studentCode: 'ALO-2026-000001',
    ...overrides,
  };
}

function student(overrides: Record<string, unknown> = {}) {
  return {
    id: 'stu_1',
    studentCode: 'ALO-2026-000001',
    name: 'Rahim Uddin',
    phone: '+8801712345678',
    email: null as string | null,
    needsReview: true,
    createdAt: hoursAgo(30),
    ...overrides,
  };
}

describe('what appears in the queue', () => {
  test('only flagged conversations, only pending documents, only flagged students', () => {
    const queue = buildReviewQueue({
      conversations: [conversation(), conversation({ id: 'conv_ok', needsReview: false })],
      documents: [document(), document({ id: 'doc_ok', verificationStatus: 'VERIFIED' }), document({ id: 'doc_del', verificationStatus: 'PENDING_REVIEW' })],
      students: [student(), student({ id: 'stu_ok', needsReview: false })],
      now: NOW,
    });

    expect(queue.items.map((item) => item.id).sort()).toEqual(['conv_1', 'doc_1', 'doc_del', 'stu_1']);
    expect(queue.items.some((item) => item.id === 'conv_ok')).toBe(false);
    expect(queue.items.some((item) => item.id === 'doc_ok')).toBe(false);
  });

  test('the oldest entry comes first, because that student has waited longest', () => {
    const queue = buildReviewQueue({
      conversations: [conversation({ id: 'recent', createdAt: hoursAgo(1) }), conversation({ id: 'old', createdAt: hoursAgo(72) })],
      documents: [document({ id: 'middle', createdAt: hoursAgo(20) })],
      students: [],
      now: NOW,
    });
    expect(queue.items.map((item) => item.id)).toEqual(['old', 'middle', 'recent']);
  });

  test('every item carries a reason, never a bare flag', () => {
    const queue = buildReviewQueue({
      conversations: [conversation({ reviewReason: null })],
      documents: [document()],
      students: [student()],
      now: NOW,
    });
    for (const item of queue.items) {
      expect(item.reasons.length).toBeGreaterThan(0);
      expect(item.reasons.every((reason) => reason.trim().length > 0)).toBe(true);
    }
  });

  test('an unattached conversation is marked as needing an identity before anything else', () => {
    const queue = buildReviewQueue({ conversations: [conversation({ studentId: null })], documents: [], students: [], now: NOW });
    expect(queue.items[0]?.needsIdentityLink).toBe(true);
  });

  test('an attached conversation is not', () => {
    const queue = buildReviewQueue({ conversations: [conversation({ studentId: 'stu_9' })], documents: [], students: [], now: NOW });
    expect(queue.items[0]?.needsIdentityLink).toBe(false);
  });

  test('the last message is quoted so the decision can be made without opening another tab', () => {
    const queue = buildReviewQueue({ conversations: [conversation()], documents: [], students: [], now: NOW });
    expect(queue.items[0]?.preview).toContain('ALO office');
  });

  test('document size is human-readable', () => {
    const queue = buildReviewQueue({ conversations: [], documents: [document({ fileSize: 2 * 1024 * 1024 })], students: [], now: NOW });
    expect(queue.items[0]?.detail).toContain('2.0 MB');
  });

  test('a file of unknown origin says so rather than implying a channel', () => {
    const queue = buildReviewQueue({ conversations: [], documents: [document({ sourceChannel: null })], students: [], now: NOW });
    expect(queue.items[0]?.detail).toContain('an unknown channel');
  });
});

describe('totals', () => {
  test('counts each kind, the unattached ones, and the longest wait', () => {
    const queue = buildReviewQueue({
      conversations: [conversation({ createdAt: hoursAgo(72) })],
      documents: [document(), document({ id: 'doc_2' })],
      students: [student()],
      now: NOW,
    });

    expect(queue.totals).toEqual({
      total: 4,
      conversations: 1,
      documents: 2,
      students: 1,
      unlinked: 1, // the conversation has no student; the flagged student and its documents do
      oldestAgeHours: 72,
    });
  });

  test('an empty queue reports zero, not a missing value', () => {
    const queue = buildReviewQueue({ conversations: [], documents: [], students: [], now: NOW });
    expect(queue.totals.total).toBe(0);
    expect(queue.totals.oldestAgeHours).toBe(0);
    expect(queue.items).toEqual([]);
  });
});

describe('resolving an entry', () => {
  test('linking requires a student', () => {
    const result = validateResolution({ action: 'LINK_STUDENT' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('STUDENT_REQUIRED');
  });

  test('linking to the student it already belongs to is refused as a no-op', () => {
    const result = validateResolution({ action: 'LINK_STUDENT', studentId: 'stu_1', currentStudentId: 'stu_1' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('SELF_LINK');
  });

  test('a valid link carries the student through', () => {
    const result = validateResolution({ action: 'LINK_STUDENT', studentId: 'stu_2' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.studentId).toBe('stu_2');
  });

  test('dismissing without a note is refused: this is the decision that loses files', () => {
    const result = validateResolution({ action: 'DISMISS' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('NOTE_REQUIRED');
  });

  test('a one-word dismissal note is not an explanation', () => {
    const result = validateResolution({ action: 'DISMISS', note: 'ok' });
    expect(result.ok).toBe(false);
  });

  test('a real dismissal note is accepted', () => {
    const result = validateResolution({ action: 'DISMISS', note: 'Checked the number against the CRM: it is the same person already on the record.' });
    expect(result.ok).toBe(true);
    expect(result.ok && result.action).toBe('DISMISS');
  });

  test('deferring needs a reason too', () => {
    expect(validateResolution({ action: 'KEEP_PENDING' }).ok).toBe(false);
    expect(validateResolution({ action: 'KEEP_PENDING', note: 'Waiting for the student to send their NID.' }).ok).toBe(true);
  });

  test('an unknown action is refused rather than guessed at', () => {
    const result = validateResolution({ action: 'MERGE_EVERYTHING' });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.code).toBe('INVALID_ACTION');
  });
});

describe('the summary a person reads afterwards', () => {
  test('a link says what moved', () => {
    expect(describeResolution({ action: 'LINK_STUDENT' }, { label: 'WHATSAPP · 88017' })).toContain('Linked');
  });

  test('a dismissal quotes the note', () => {
    expect(describeResolution({ action: 'DISMISS', note: 'same person' }, { label: 'WHATSAPP · 88017' })).toContain('same person');
  });

  test('a deferral says what it waits for', () => {
    expect(describeResolution({ action: 'KEEP_PENDING', note: 'waiting for NID' }, { label: 'doc_1' })).toContain('waiting for NID');
  });
});
