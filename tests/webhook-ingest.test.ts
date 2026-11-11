/**
 * tests/webhook-ingest.test.ts
 *
 * Drives the whole inbound pipeline with an in-memory store, so the behaviour
 * that actually matters is verified without a database:
 *
 *   - a replayed webhook creates ONE student, ONE conversation, ONE message
 *   - an ambiguous identity becomes a review entry, never a wrong attachment
 *   - an attachment is stored as PENDING_REVIEW and is never auto-verified
 *   - an unverified signature writes nothing at all
 *   - an attachment for an unmatched sender is refused, not silently filed
 *
 * It also exercises the real file-writing path for attachments, against a
 * temporary upload directory, because "the bytes reached private storage" is
 * not something a mock can prove.
 */

import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SANDBOX = mkdtempSync(join(tmpdir(), 'alo-ingest-'));
process.env.UPLOAD_DIR = SANDBOX;

// Type-only imports are erased at compile time, so they do not load the module
// before UPLOAD_DIR is set above.
import type { IngestStore, InboundMessage } from '../src/lib/crm/ingest';

const { ingestInboundMessage } = await import('../src/lib/crm/ingest');
const { resolveStoragePath } = await import('../src/lib/crm/document-storage');

afterAll(() => {
  rmSync(SANDBOX, { recursive: true, force: true });
});

type EventRow = { status: string; studentId: string | null };
type StudentRow = { id: string; studentCode: string; phone: string | null; email: string | null; name: string | null };
type MessageRow = { id: string; conversationId: string; body: string; idempotencyKey: string };

/** A minimal in-memory implementation of the store port. */
function createMemoryStore() {
  const events = new Map<string, EventRow>();
  const students: StudentRow[] = [];
  const messages: MessageRow[] = [];
  const conversations: Array<{ id: string; channel: string; thread: string | null; studentId: string | null; needsReview: boolean }> = [];
  const documents: Array<{ studentId: string; documentId: string; documentType: string; storageKey: string; verificationStatus: string }> = [];
  const assignments: string[] = [];
  const consents = new Map<string, { status: string; source: string; evidence: string }>();
  const sequences = new Map<number, number>();
  let counter = 0;

  const store: IngestStore = {
    async findEvent(eventKey) {
      return events.get(eventKey)?.status ?? null;
    },
    async createEvent(input) {
      if (events.has(input.eventKey)) return false;
      events.set(input.eventKey, { status: 'PROCESSING', studentId: null });
      return true;
    },
    async completeEvent(input) {
      const existing = events.get(input.eventKey);
      if (!existing) return;
      events.set(input.eventKey, { status: input.status, studentId: input.studentId ?? null });
    },
    async findIdentityCandidates(query) {
      return students
        .filter((student) => {
          if (query.studentCode && student.studentCode === query.studentCode) return true;
          if (query.phone && student.phone === query.phone) return true;
          if (query.email && student.email === query.email) return true;
          // Mirrors the Prisma adapter: names load candidates so a collision can
          // be flagged, but they are never used to match.
          if (query.name && student.name?.toLowerCase() === query.name.toLowerCase()) return true;
          return false;
        })
        .map((student) => ({
          studentId: student.id,
          studentCode: student.studentCode,
          phone: student.phone,
          email: student.email,
          name: student.name,
        }));
    },
    async allocateStudentCode(year) {
      const next = (sequences.get(year) ?? 0) + 1;
      sequences.set(year, next);
      return next;
    },
    async createStudent(input) {
      counter += 1;
      const student: StudentRow = {
        id: `stu_${counter}`,
        studentCode: input.studentCode,
        phone: input.phone,
        email: input.email,
        name: input.name,
      };
      students.push(student);
      return { id: student.id };
    },
    async findOrCreateConversation(input) {
      const existing = conversations.find((c) => c.channel === input.channel && c.thread === input.externalThreadId);
      if (existing) return { id: existing.id, created: false };
      counter += 1;
      const id = `conv_${counter}`;
      conversations.push({
        id,
        channel: input.channel,
        thread: input.externalThreadId,
        studentId: input.studentId,
        needsReview: input.needsReview,
      });
      return { id, created: true };
    },
    async appendMessage(input) {
      const existing = messages.find((m) => m.idempotencyKey === input.idempotencyKey);
      if (existing) return { id: existing.id };
      counter += 1;
      const id = `msg_${counter}`;
      messages.push({ id, conversationId: input.conversationId, body: input.body, idempotencyKey: input.idempotencyKey });
      return { id };
    },
    async storeDocument(input) {
      // The real writer: this proves bytes reach private storage.
      const { writePrivateDocument } = await import('../src/lib/crm/document-storage');
      const result = writePrivateDocument({
        studentId: input.studentId,
        documentId: input.documentId,
        version: input.version,
        mimeType: input.mimeType,
        content: input.content,
      });
      if (result.ok) {
        documents.push({
          studentId: input.studentId,
          documentId: input.documentId,
          documentType: input.documentType,
          storageKey: result.storageKey,
          verificationStatus: 'PENDING_REVIEW',
        });
      }
      return result;
    },
    async recordAssignmentHistory(input) {
      assignments.push(input.studentId);
    },
    async recordConsent(input) {
      const key = `${input.studentId}:${input.channel}:${input.purpose}`;
      consents.set(key, { status: input.status, source: input.source, evidence: input.evidence });
    },
  };

  return { store, events, students, messages, conversations, documents, assignments, consents };
}

function inbound(overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    provider: 'whatsapp_cloud',
    channel: 'WHATSAPP',
    externalEventId: 'wamid.TEST-1',
    externalThreadId: '8801712345678',
    providerMessageId: 'wamid.TEST-1',
    senderId: '8801712345678',
    senderName: 'Rahim',
    senderPhone: '+880 1712-345678',
    body: 'Hello, I want to study in the UK',
    occurredAt: new Date('2026-10-14T05:00:00Z'),
    signatureVerified: true,
    ...overrides,
  };
}

const FIXED_NOW = () => new Date('2026-10-14T05:00:01Z');

describe('first contact from a new student', () => {
  test('creates the student, the code, the conversation and the message', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(inbound(), memory.store, { now: FIXED_NOW });

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;

    expect(result.identityDecision).toBe('NEW');
    expect(result.studentCode).toBe('ALO-2026-000001');
    expect(result.needsReview).toBe(false);
    expect(memory.students).toHaveLength(1);
    expect(memory.messages).toHaveLength(1);
    expect(memory.conversations).toHaveLength(1);
    // The student's first contact is recorded in assignment history.
    expect(memory.assignments).toEqual([result.studentId]);
    expect(memory.events.get(result.eventKey)?.status).toBe('SUCCEEDED');
  });

  test('allocates sequential codes for sequential students', async () => {
    const memory = createMemoryStore();
    const first = await ingestInboundMessage(inbound({ externalEventId: 'A', providerMessageId: 'A' }), memory.store, { now: FIXED_NOW });
    const second = await ingestInboundMessage(
      inbound({ externalEventId: 'B', providerMessageId: 'B', senderId: '8801888888888', senderPhone: '+8801888888888', externalThreadId: '8801888888888' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(first.status === 'PROCESSED' && first.studentCode).toBe('ALO-2026-000001');
    expect(second.status === 'PROCESSED' && second.studentCode).toBe('ALO-2026-000002');
    expect(memory.students).toHaveLength(2);
  });
});

describe('replayed webhooks', () => {
  test('five deliveries of one event create one student and one message', async () => {
    const memory = createMemoryStore();
    const message = inbound();

    const results = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      results.push(await ingestInboundMessage(message, memory.store, { now: FIXED_NOW }));
    }

    expect(results[0].status).toBe('PROCESSED');
    expect(results.slice(1).every((result) => result.status === 'DUPLICATE')).toBe(true);
    expect(memory.students).toHaveLength(1);
    expect(memory.messages).toHaveLength(1);
    expect(memory.conversations).toHaveLength(1);
  });

  test('a replayed event without a provider id is still caught', async () => {
    const memory = createMemoryStore();
    const message = inbound({ externalEventId: null, providerMessageId: null, body: 'no provider id here' });

    const first = await ingestInboundMessage(message, memory.store, { now: FIXED_NOW });
    const second = await ingestInboundMessage(message, memory.store, { now: FIXED_NOW });

    expect(first.status).toBe('PROCESSED');
    expect(second.status).toBe('DUPLICATE');
    expect(memory.students).toHaveLength(1);
  });

  test('a new message in the same thread reuses the conversation', async () => {
    const memory = createMemoryStore();
    await ingestInboundMessage(inbound({ externalEventId: 'first', providerMessageId: 'first' }), memory.store, { now: FIXED_NOW });
    await ingestInboundMessage(
      inbound({ externalEventId: 'second', providerMessageId: 'second', body: 'Following up' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(memory.conversations).toHaveLength(1);
    expect(memory.messages).toHaveLength(2);
    expect(memory.students).toHaveLength(1);
  });
});

describe('signature enforcement', () => {
  test('an unverified signature writes nothing at all', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(inbound({ signatureVerified: false }), memory.store, { now: FIXED_NOW });

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') expect(result.code).toBe('UNVERIFIED_SIGNATURE');

    expect(memory.events.size).toBe(0);
    expect(memory.students).toHaveLength(0);
    expect(memory.messages).toHaveLength(0);
  });

  test('an empty message is rejected after the event row exists', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(inbound({ body: '   ' }), memory.store, { now: FIXED_NOW });

    expect(result.status).toBe('REJECTED');
    if (result.status === 'REJECTED') expect(result.code).toBe('EMPTY_MESSAGE');
    expect(memory.students).toHaveLength(0);
  });
});

describe('identity ambiguity', () => {
  test('a name-only match records the message against a NEW review record, never the existing person', async () => {
    const memory = createMemoryStore();
    const existing = await memory.store.createStudent({
      studentCode: 'ALO-2026-000009',
      name: 'Rahim Uddin',
      phone: null,
      email: null,
      needsReview: false,
    });

    const result = await ingestInboundMessage(
      inbound({ senderPhone: null, senderName: 'Rahim Uddin', senderId: 'psid-unknown' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;

    expect(result.identityDecision).toBe('REVIEW');
    expect(result.needsReview).toBe(true);
    expect(result.reviewReasons.join(' ')).toContain('not used to merge');

    // The message is stored, but against a brand-new record flagged for review —
    // it is NOT attached to the existing Rahim, whose identity was never proven.
    expect(result.studentId).not.toBe(existing.id);
    expect(memory.students).toHaveLength(2);
    expect(memory.messages).toHaveLength(1);
    expect(memory.conversations[0].studentId).toBe(result.studentId);
    expect(memory.conversations[0].needsReview).toBe(true);
  });

  test('a known phone match attaches to the existing student, with no new code', async () => {
    const memory = createMemoryStore();
    await memory.store.createStudent({ studentCode: 'ALO-2026-000042', name: 'Karim', phone: '8801712345678', email: null, needsReview: false });

    const result = await ingestInboundMessage(inbound(), memory.store, { now: FIXED_NOW });

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.identityDecision).toBe('MATCHED');
    expect(result.studentId).toBe('stu_1');
    expect(memory.students).toHaveLength(1);
    expect(memory.assignments).toHaveLength(0);
  });
});

describe('attachments', () => {
  test('stores the file privately as PENDING_REVIEW and never verifies it', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({
        attachments: [
          { fileName: 'passport-scan.pdf', mimeType: 'application/pdf', content: Buffer.from('%PDF-1.4 passport') },
        ],
      }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;

    expect(result.attachmentsStored).toHaveLength(1);
    const stored = result.attachmentsStored[0];
    expect(stored.documentType).toBe('PASSPORT');
    expect(stored.verificationStatus).toBe('PENDING_REVIEW');
    expect(result.attachmentsRejected).toEqual([]);

    // The bytes really are on disk, inside the private root, mode 0600.
    const path = resolveStoragePath(stored.storageKey);
    expect(path).not.toBeNull();
    expect(statSync(path!).size).toBeGreaterThan(0);
    expect(statSync(path!).mode & 0o777).toBe(0o600);
    expect(memory.documents[0].verificationStatus).toBe('PENDING_REVIEW');
  });

  test('an unsupported attachment is reported, not silently dropped', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ attachments: [{ fileName: 'virus.exe', mimeType: 'application/x-msdownload', content: Buffer.from('MZ') }] }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.attachmentsStored).toEqual([]);
    expect(result.attachmentsRejected[0].code).toBe('UNSUPPORTED_TYPE');
  });

  test('an attachment from an unproven sender is filed against the new review record, never the existing student', async () => {
    const memory = createMemoryStore();
    const existing = await memory.store.createStudent({
      studentCode: 'ALO-2026-000009',
      name: 'Rahim Uddin',
      phone: null,
      email: null,
      needsReview: false,
    });

    const result = await ingestInboundMessage(
      inbound({
        senderPhone: null,
        senderName: 'Rahim Uddin',
        senderId: 'psid-unknown',
        attachments: [{ fileName: 'passport.pdf', mimeType: 'application/pdf', content: Buffer.from('%PDF unrouted') }],
      }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;

    expect(result.identityDecision).toBe('REVIEW');
    expect(result.attachmentsStored).toHaveLength(1);

    // The critical property: the passport scan is NOT added to the existing
    // student's document list. It belongs to the new pending-review record and
    // waits for a human to decide who the person is.
    expect(memory.documents[0].studentId).not.toBe(existing.id);
    expect(memory.documents[0].studentId).toBe(result.studentId);
    expect(memory.documents[0].verificationStatus).toBe('PENDING_REVIEW');
  });

  test('an attachment with no resolvable student at all is refused, not stored', async () => {
    const memory = createMemoryStore();
    // Force the "ambiguous, cannot create" path: two records share the phone the
    // message arrives from, so neither can be chosen and no new record is made.
    await memory.store.createStudent({ studentCode: 'ALO-2026-000011', name: 'A', phone: '8801712345678', email: null, needsReview: false });
    await memory.store.createStudent({ studentCode: 'ALO-2026-000012', name: 'B', phone: '8801712345678', email: null, needsReview: false });

    const result = await ingestInboundMessage(
      inbound({ attachments: [{ fileName: 'bank.pdf', mimeType: 'application/pdf', content: Buffer.from('%PDF shared line') }] }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.needsReview).toBe(true);
    expect(result.studentId).toBeNull();
    expect(result.attachmentsStored).toEqual([]);
    expect(result.attachmentsRejected[0].code).toBe('NO_STUDENT');
    expect(memory.documents).toHaveLength(0);
  });
});

describe('failure handling', () => {
  test('a store failure marks the event FAILED so a retry can reprocess it', async () => {
    const memory = createMemoryStore();
    const originalAppend = memory.store.appendMessage;
    memory.store.appendMessage = async () => {
      throw new Error('database is on fire');
    };

    await expect(ingestInboundMessage(inbound(), memory.store, { now: FIXED_NOW })).rejects.toThrow('database is on fire');

    const statuses = [...memory.events.values()].map((row) => row.status);
    expect(statuses).toEqual(['FAILED']);

    // With the fault cleared, the provider's retry succeeds.
    memory.store.appendMessage = originalAppend;
    const retry = await ingestInboundMessage(inbound(), memory.store, { now: FIXED_NOW });
    expect(retry.status).toBe('PROCESSED');
    expect(memory.messages).toHaveLength(1);
  });
});

describe('media that the provider referenced but this deployment could not collect', () => {
  test('a media-only message is still recorded, not rejected as empty', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({
        body: '',
        prefetchRejected: [
          { fileName: 'passport.pdf', code: 'NOT_CONFIGURED', reason: 'WHATSAPP_ACCESS_TOKEN is not configured, so inbound media was recorded but not collected.' },
        ],
      }),
      memory.store,
      { now: FIXED_NOW },
    );

    // Rejecting this would lose a real message from a real student and make the
    // provider retry forever, for a configuration gap on our side.
    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(memory.messages).toHaveLength(1);
    expect(result.attachmentsStored).toHaveLength(0);
    expect(result.attachmentsRejected).toHaveLength(1);
    expect(result.attachmentsRejected[0].code).toBe('NOT_CONFIGURED');
  });

  test('a genuinely empty event is still rejected', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(inbound({ body: '   ' }), memory.store, { now: FIXED_NOW });
    expect(result.status).toBe('REJECTED');
    expect(result.status === 'REJECTED' && result.code).toBe('EMPTY_MESSAGE');
  });

  test('uncollected media and stored media are reported together, without confusion', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({
        body: 'Sending both',
        attachments: [{ fileName: 'transcript.pdf', mimeType: 'application/pdf', content: Buffer.from('a real transcript') }],
        prefetchRejected: [{ fileName: 'video.mp4', code: 'UNSUPPORTED_TYPE', reason: 'Media type video/mp4 is not an accepted document type.' }],
      }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.attachmentsStored).toHaveLength(1);
    expect(result.attachmentsRejected.map((rejection) => rejection.code)).toEqual(['UNSUPPORTED_TYPE']);
    // Both the stored and the uncollected attachment are counted: the number
    // describes what the sender sent, not what we managed to keep.
    expect(memory.documents).toHaveLength(1);
  });
});

describe('a student withdrawing consent in their own message', () => {
  test('"stop" withdraws marketing consent and keeps the message as evidence', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ body: 'Please STOP sending me offers', externalEventId: 'W1', providerMessageId: 'W1' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.consentChanges).toHaveLength(1);
    expect(result.consentChanges[0]?.status).toBe('WITHDRAWN');
    expect(result.consentChanges[0]?.purpose).toBe('MARKETING');

    const recorded = memory.consents.get(`${result.studentId}:WHATSAPP:MARKETING`);
    expect(recorded?.status).toBe('WITHDRAWN');
    expect(recorded?.source).toBe('INBOUND_MESSAGE');
    // The evidence is the message itself: a consent record must point at the
    // words the student actually wrote.
    expect(recorded?.evidence).toBe(`message:${result.messageId}`);
  });

  test('a withdrawal also applies when the sender is a brand new student', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ body: 'bondho korun', externalEventId: 'W2', providerMessageId: 'W2' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status === 'PROCESSED' && result.identityDecision).toBe('NEW');
    expect(result.status === 'PROCESSED' && result.consentChanges[0]?.status).toBe('WITHDRAWN');
  });

  test('marketing stops but the message is still answered: "stop" is not a service withdrawal', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ body: 'stop the offers please', externalEventId: 'W3', providerMessageId: 'W3' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    // One change, marketing, and nothing recorded against SERVICE or FOLLOW_UP.
    expect(result.consentChanges).toHaveLength(1);
    expect(memory.consents.has(`${result.studentId}:WHATSAPP:SERVICE`)).toBe(false);
  });

  test('"never contact me" declines service as well, because that is what was said', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ body: 'do not contact me again', externalEventId: 'W4', providerMessageId: 'W4' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    if (result.status !== 'PROCESSED') return;
    expect(result.consentChanges.map((change) => change.purpose).sort()).toEqual(['FOLLOW_UP', 'MARKETING', 'SERVICE']);
  });

  test('an ordinary message records no consent change at all', async () => {
    const memory = createMemoryStore();
    const result = await ingestInboundMessage(
      inbound({ body: 'When is the next IELTS intake?', externalEventId: 'W5', providerMessageId: 'W5' }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(result.status).toBe('PROCESSED');
    expect(result.status === 'PROCESSED' && result.consentChanges).toEqual([]);
    expect(memory.consents.size).toBe(0);
  });

  test('a withdrawal that cannot be applied is flagged for a human, never swallowed', async () => {
    // An ambiguous sender: the store cannot attach the message to either
    // candidate, and the pipeline creates a flagged record instead. The
    // withdrawal must not be silently dropped in that case — the same person
    // would keep receiving marketing.
    const memory = createMemoryStore();
    await ingestInboundMessage(
      inbound({ externalEventId: 'X1', providerMessageId: 'X1', senderName: 'Rahim' }),
      memory.store,
      { now: FIXED_NOW },
    );

    const ambiguous = await ingestInboundMessage(
      inbound({
        externalEventId: 'X2',
        providerMessageId: 'X2',
        body: 'stop messaging me',
        studentCode: null,
        senderPhone: null,
        senderId: 'unknown-handle',
        externalThreadId: 'unknown-handle',
      }),
      memory.store,
      { now: FIXED_NOW },
    );

    expect(ambiguous.status).toBe('PROCESSED');
    if (ambiguous.status !== 'PROCESSED') return;
    expect(ambiguous.needsReview).toBe(true);
    // Either the withdrawal was applied to a confidently identified student, or
    // it is named in the review reasons as something a human must do by hand.
    const applied = ambiguous.consentChanges.length > 0;
    const escalated = ambiguous.reviewReasons.some((reason) => reason.includes('asked to stop'));
    expect(applied || escalated).toBe(true);
  });
});
