/**
 * src/lib/crm/prisma-store.ts
 *
 * Prisma adapter implementing the `IngestStore` port.
 *
 * This layer contains no policy. Every decision — whether to merge, create,
 * review, store or suppress — is made in src/lib/crm/ingest.ts, which is tested
 * without a database. What lives here is translation: Prisma calls, and the two
 * places where atomicity has to be enforced by the database itself:
 *
 *   1. Student code allocation, inside a transaction.
 *   2. Message insertion, where the unique idempotencyKey is the backstop
 *      against a concurrent duplicate webhook.
 */

import { db } from '@/lib/db';
import { writePrivateDocument, type StorageResult } from './document-storage';
import { audit } from '@/lib/audit';
import type { IngestStore } from './ingest';
import type { IdentityCandidate } from './identity';

export const prismaIngestStore: IngestStore = {
  async findEvent(eventKey) {
    const existing = await db.automationEvent.findUnique({
      where: { idempotencyKey: eventKey },
      select: { status: true },
    });
    return existing?.status ?? null;
  },

  async createEvent(input) {
    try {
      await db.automationEvent.create({
        data: {
          kind: input.kind,
          provider: input.provider,
          idempotencyKey: input.eventKey,
          status: 'PROCESSING',
          signatureVerified: input.signatureVerified,
          payloadHash: input.payloadHash,
          payloadSummary: input.payloadSummary,
          attempts: 1,
        },
      });
      return true;
    } catch {
      // Unique violation: another worker got there first.
      return false;
    }
  },

  async completeEvent(input) {
    await db.automationEvent
      .update({
        where: { idempotencyKey: input.eventKey },
        data: {
          status: input.status,
          studentId: input.studentId ?? null,
          conversationId: input.conversationId ?? null,
          lastError: input.error ?? null,
          processedAt: new Date(),
        },
      })
      .catch(() => {
        // Completing an event must never throw back into the webhook.
      });
  },

  async findIdentityCandidates(query) {
    const or: Record<string, unknown>[] = [];
    if (query.phone) or.push({ phone: { contains: query.phone.slice(-8) } });
    if (query.email) or.push({ email: { equals: query.email } });
    if (query.studentCode) or.push({ studentCode: { equals: query.studentCode } });
    // Names are loaded so a collision can be sent to review. They are never
    // used to attach a message to an existing student — see resolveIdentity.
    if (query.name) or.push({ name: { equals: query.name } });
    if (or.length === 0) return [];

    const students = await db.student.findMany({
      where: { OR: or },
      select: { id: true, studentCode: true, phone: true, email: true, name: true },
      take: 25,
    });

    // Typed by assignment rather than by a generic argument: when the Prisma
    // client is not generated, `students` is `any` and a generic call on it is a
    // compile error, which would hide real type errors behind an install step.
    const candidates: IdentityCandidate[] = students.map(
      (student: { id: string; studentCode: string | null; phone: string | null; email: string | null; name: string | null }) => ({
        studentId: student.id,
        studentCode: student.studentCode,
        phone: student.phone,
        email: student.email,
        name: student.name,
      }),
    );
    return candidates;
  },

  async allocateStudentCode(year) {
    // The transaction is what makes this safe: two concurrent inbound messages
    // serialise on the sequence row, so they cannot receive the same number.
    return db.$transaction(async (tx) => {
      await tx.studentIdSequence.upsert({
        where: { year },
        create: { year, lastValue: 0 },
        update: {},
      });
      const updated = await tx.studentIdSequence.update({
        where: { year },
        data: { lastValue: { increment: 1 } },
        select: { lastValue: true },
      });
      return updated.lastValue;
    });
  },

  async createStudent(input) {
    return db.student.create({
      data: {
        studentCode: input.studentCode,
        name: input.name ?? 'Unknown (needs review)',
        phone: input.phone,
        email: input.email,
        status: input.needsReview ? 'PENDING_REVIEW' : 'ACTIVE',
      },
      select: { id: true },
    });
  },

  async findOrCreateConversation(input) {
    if (input.externalThreadId) {
      const existing = await db.conversation.findUnique({
        where: { channel_externalThreadId: { channel: input.channel, externalThreadId: input.externalThreadId } },
        select: { id: true },
      });
      if (existing) {
        await db.conversation.update({
          where: { id: existing.id },
          data: {
            lastMessageAt: input.lastMessageAt,
            messageCount: { increment: 1 },
            needsReview: input.needsReview,
            reviewReason: input.reviewReason,
            ...(input.studentId ? { studentId: input.studentId } : {}),
          },
        });
        return { id: existing.id, created: false };
      }
    }

    const created = await db.conversation.create({
      data: {
        channel: input.channel,
        externalThreadId: input.externalThreadId,
        studentId: input.studentId,
        needsReview: input.needsReview,
        reviewReason: input.reviewReason,
        lastMessageAt: input.lastMessageAt,
        messageCount: 1,
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  },

  async appendMessage(input) {
    try {
      const message = await db.message.create({
        data: {
          conversationId: input.conversationId,
          studentId: input.studentId,
          channel: input.channel,
          direction: input.direction,
          body: input.body,
          providerMessageId: input.providerMessageId,
          idempotencyKey: input.idempotencyKey,
          senderHandle: input.senderHandle,
          senderName: input.senderName,
          status: 'DELIVERED',
          deliveredAt: input.occurredAt,
        },
        select: { id: true },
      });
      return message;
    } catch {
      // The unique index caught a concurrent duplicate. Return the existing row
      // instead of failing the webhook: the message is stored either way.
      const existing = await db.message.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: { id: true },
      });
      if (existing) return existing;
      throw new Error('Message could not be stored and no existing row was found.');
    }
  },

  async storeDocument(input): Promise<StorageResult> {
    const stored = writePrivateDocument({
      studentId: input.studentId,
      documentId: input.documentId,
      version: input.version,
      mimeType: input.mimeType,
      content: input.content,
    });

    if (!stored.ok) return stored;

    await db.document.create({
      data: {
        id: input.documentId,
        studentId: input.studentId,
        type: input.documentType,
        fileName: input.fileName,
        // filePath and storageKey both hold the private relative key. Neither is
        // ever served directly; reads go through the authorized download route.
        filePath: stored.storageKey,
        storageKey: stored.storageKey,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        fileHash: stored.fileHash,
        sourceChannel: input.sourceChannel,
        conversationId: input.conversationId,
        currentVersion: input.version,
        // Automatically received: never auto-verified.
        verificationStatus: 'PENDING_REVIEW',
        versions: {
          create: {
            version: input.version,
            storageKey: stored.storageKey,
            fileHash: stored.fileHash,
            fileSize: stored.fileSize,
            mimeType: stored.mimeType,
            sourceChannel: input.sourceChannel,
            reviewStatus: 'PENDING_REVIEW',
          },
        },
      },
    });

    return stored;
  },

  /**
   * A withdrawal made in the student's own message.
   *
   * The register is one row per (student, channel, purpose), so this is an
   * upsert: a second "stop" updates the same row rather than piling up records.
   * The evidence is the message id, which is what makes the decision auditable
   * later — the row points at the words the student actually wrote.
   *
   * A withdrawal is never downgraded by a later grant: if the student writes
   * "stop" and then agrees in person, the staff member can record a new GRANTED
   * from the UI, which is a deliberate act by a named person. What must not
   * happen is an automated path silently re-granting consent.
   */
  async recordConsent(input) {
    await db.communicationConsent.upsert({
      where: {
        studentId_channel_purpose: {
          studentId: input.studentId,
          channel: input.channel,
          purpose: input.purpose,
        },
      },
      create: {
        studentId: input.studentId,
        channel: input.channel,
        purpose: input.purpose,
        status: input.status,
        source: input.source,
        evidence: input.evidence,
      },
      update: {
        status: input.status,
        source: input.source,
        evidence: input.evidence,
      },
    });

    await audit('CONSENT_RECORD', {
      resource: `Student:${input.studentId}`,
      metadata: {
        channel: input.channel,
        purpose: input.purpose,
        status: input.status,
        source: input.source,
        evidence: input.evidence,
      },
    });
  },

  async recordAssignmentHistory(input) {
    await db.counselorAssignmentHistory.create({
      data: { studentId: input.studentId, reason: input.reason },
    });
  },
};
