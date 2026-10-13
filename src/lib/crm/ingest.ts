/**
 * src/lib/crm/ingest.ts
 *
 * The inbound-message pipeline: verify → deduplicate → identify → record.
 *
 * WHY THE STORE IS AN INTERFACE
 * ─────────────────────────────
 * The interesting behaviour here is the decision sequence, not the SQL: what
 * happens on a duplicate, on an ambiguous identity, on an opted-out student, on
 * an attachment. By depending on a small `IngestStore` port, that sequence is
 * fully testable in-process (`tests/webhook-ingest.test.ts` drives it with an
 * in-memory store), and the Prisma adapter stays a thin translation layer that
 * contains no policy of its own.
 *
 * ORDER MATTERS
 * ─────────────
 * Deduplication runs first. If a provider retries a webhook five times, the
 * identity resolution must not run five times — that is how duplicate students
 * get created. If the event was already processed successfully, this returns
 * immediately and the route replies 200.
 */

import { deriveEventKey, deriveMessageKey, type InboundEventRef, type ProviderId } from './automation';
import { academicYear, formatStudentCode, normalizePhone, resolveIdentity, type IdentityCandidate } from './identity';
import { suggestDocumentType, type StorageResult } from './document-storage';

export type InboundAttachment = {
  fileName: string;
  mimeType: string;
  content: Buffer | Uint8Array;
  /** Provider-side media id, when supplied. Used for logging only. */
  providerMediaId?: string | null;
};

export type InboundMessage = {
  provider: ProviderId;
  channel: string;
  /** Provider event id / message id. */
  externalEventId?: string | null;
  externalThreadId?: string | null;
  providerMessageId?: string | null;
  senderId: string;
  senderName?: string | null;
  senderPhone?: string | null;
  senderEmail?: string | null;
  /** A student code quoted by the sender, if any. */
  studentCode?: string | null;
  body: string;
  occurredAt?: Date | number | string | null;
  attachments?: InboundAttachment[];
  /**
   * Attachments the provider referenced that this deployment could not collect
   * (no access token, an unreachable or refused media host, an oversized file).
   * They are recorded as described rejections rather than dropped, so an
   * operator can see that media exists and why it is missing.
   */
  prefetchRejected?: Array<{ fileName: string; code: string; reason: string }>;
  /** Whether the provider signature was verified before reaching this point. */
  signatureVerified: boolean;
  payload?: unknown;
};

export type IngestOutcome =
  | { status: 'DUPLICATE'; eventKey: string; reason: string }
  | { status: 'REJECTED'; code: 'UNVERIFIED_SIGNATURE' | 'EMPTY_MESSAGE'; reason: string }
  | {
      status: 'PROCESSED';
      eventKey: string;
      eventBasis: ReturnType<typeof deriveEventKey>['basis'];
      identityDecision: 'MATCHED' | 'NEW' | 'REVIEW';
      studentId: string | null;
      studentCode: string | null;
      conversationId: string;
      messageId: string;
      needsReview: boolean;
      reviewReasons: string[];
      attachmentsStored: Array<{ documentId: string; storageKey: string; documentType: string; verificationStatus: 'PENDING_REVIEW' }>;
      attachmentsRejected: Array<{ fileName: string; code: string; reason: string }>;
    };

/** Everything the pipeline needs from persistence. */
export type IngestStore = {
  /** Previous status for this event key, or null when never seen. */
  findEvent(eventKey: string): Promise<string | null>;
  /** Create the event row. Returns false when the key already exists (race). */
  createEvent(input: {
    eventKey: string;
    kind: 'WEBHOOK_INBOUND';
    provider: string;
    signatureVerified: boolean;
    payloadHash: string | null;
    payloadSummary: string | null;
  }): Promise<boolean>;
  completeEvent(input: { eventKey: string; status: 'SUCCEEDED' | 'FAILED' | 'DUPLICATE'; studentId?: string | null; conversationId?: string | null; error?: string | null }): Promise<void>;
  /** Candidates for identity matching, limited to plausible rows. */
  /**
   * Candidates for identity matching. `name` is included so a name-collision can
   * be flagged for review: it is never used to MATCH, only to detect that a
   * person with this name already exists.
   */
  findIdentityCandidates(query: { phone: string | null; email: string | null; studentCode: string | null; channelUserId: string | null; name: string | null }): Promise<IdentityCandidate[]>;
  /** Allocate the next code for the year. Must be transactional in the adapter. */
  allocateStudentCode(year: number): Promise<number>;
  createStudent(input: { studentCode: string; name: string | null; phone: string | null; email: string | null; needsReview: boolean }): Promise<{ id: string }>;
  findOrCreateConversation(input: {
    channel: string;
    externalThreadId: string | null;
    studentId: string | null;
    needsReview: boolean;
    reviewReason: string | null;
    lastMessageAt: Date;
  }): Promise<{ id: string; created: boolean }>;
  appendMessage(input: {
    conversationId: string;
    studentId: string | null;
    channel: string;
    direction: 'INBOUND';
    body: string;
    providerMessageId: string | null;
    idempotencyKey: string;
    senderHandle: string | null;
    senderName: string | null;
    occurredAt: Date;
    attachmentCount: number;
  }): Promise<{ id: string }>;
  storeDocument(input: {
    studentId: string;
    documentId: string;
    version: number;
    mimeType: string;
    content: Buffer | Uint8Array;
    fileName: string;
    documentType: string;
    sourceChannel: string;
    conversationId: string;
  }): Promise<StorageResult>;
  recordAssignmentHistory?(input: { studentId: string; reason: string }): Promise<void>;
};

export type IngestDependencies = {
  /** Injected for determinism in tests. */
  now?: () => Date;
  /** Deterministic id source for tests. */
  newId?: () => string;
  /** Overridable for tests to avoid touching the filesystem. */
  storeDocumentOverride?: IngestStore['storeDocument'];
};

let counter = 0;
function defaultId(): string {
  counter += 1;
  return `doc_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/**
 * Run the inbound pipeline.
 *
 * Never throws for an expected condition — a duplicate, an unverified signature
 * or an unwritable attachment all come back as a described outcome, because the
 * caller is a webhook that must answer the provider quickly and truthfully.
 */
export async function ingestInboundMessage(
  message: InboundMessage,
  store: IngestStore,
  deps: IngestDependencies = {},
): Promise<IngestOutcome> {
  const now = deps.now?.() ?? new Date();
  const newId = deps.newId ?? defaultId;

  // ── 1. Signature. An unsigned webhook is never trusted. ────────────────────
  if (!message.signatureVerified) {
    return { status: 'REJECTED', code: 'UNVERIFIED_SIGNATURE', reason: 'The provider signature did not verify; the event was not processed.' };
  }

  // ── 2. Deduplicate before doing anything with side effects. ────────────────
  const eventRef: InboundEventRef = {
    provider: message.provider,
    externalEventId: message.externalEventId,
    externalThreadId: message.externalThreadId,
    senderId: message.senderId,
    occurredAt: message.occurredAt,
    payload: message.payload,
  };
  const { key: eventKey, basis } = deriveEventKey(eventRef);

  const previousStatus = await store.findEvent(eventKey);

  if (previousStatus === 'SUCCEEDED') {
    return { status: 'DUPLICATE', eventKey, reason: 'Event already processed successfully.' };
  }
  if (previousStatus === 'DUPLICATE') {
    return { status: 'DUPLICATE', eventKey, reason: 'This event was already recorded as a duplicate.' };
  }
  if (previousStatus === 'PROCESSING') {
    return { status: 'DUPLICATE', eventKey, reason: 'Event is currently being processed.' };
  }

  // previousStatus is null (first delivery) or FAILED (a retry the provider is
  // entitled to make — see classifyDuplicate in ./automation).
  if (previousStatus === null) {
    const created = await store.createEvent({
      eventKey,
      kind: 'WEBHOOK_INBOUND',
      provider: message.provider,
      signatureVerified: true,
      payloadHash: null,
      payloadSummary: `${message.channel} inbound message`,
    });

    if (!created) {
      await store.completeEvent({ eventKey, status: 'DUPLICATE' });
      return { status: 'DUPLICATE', eventKey, reason: 'Another worker created this event first.' };
    }
  }

  // A message with referenced-but-uncollected media is not empty: the sender
  // did send something, and rejecting it would both lose the message and make
  // the provider retry forever.
  const carriesSomething =
    Boolean(message.body?.trim()) || (message.attachments?.length ?? 0) > 0 || (message.prefetchRejected?.length ?? 0) > 0;

  if (!carriesSomething) {
    await store.completeEvent({ eventKey, status: 'FAILED', error: 'empty message' });
    return { status: 'REJECTED', code: 'EMPTY_MESSAGE', reason: 'The event carried neither text nor attachments.' };
  }

  try {
    // ── 3. Identity. ────────────────────────────────────────────────────────
    const phone = normalizePhone(message.senderPhone ?? null);
    const candidates = await store.findIdentityCandidates({
      phone,
      email: message.senderEmail ?? null,
      studentCode: message.studentCode ?? null,
      channelUserId: message.senderId,
      name: message.senderName ?? null,
    });
    const resolution = resolveIdentity(
      {
        channel: message.channel,
        channelUserId: message.senderId,
        phone: message.senderPhone ?? null,
        email: message.senderEmail ?? null,
        studentCode: message.studentCode ?? null,
        name: message.senderName ?? null,
      },
      candidates,
    );

    let studentId: string | null = null;
    let studentCode: string | null = null;

    if (resolution.decision === 'MATCHED' && resolution.studentId) {
      studentId = resolution.studentId;
      studentCode = candidates.find((candidate) => candidate.studentId === studentId)?.studentCode ?? null;
    } else if (resolution.canCreate) {
      // A new student gets a code immediately: no form is required, and the
      // unique index is the second guard against a duplicate code.
      const sequence = await store.allocateStudentCode(academicYear(now));
      studentCode = formatStudentCode(academicYear(now), sequence);
      const student = await store.createStudent({
        studentCode,
        name: message.senderName ?? null,
        phone,
        email: message.senderEmail ?? null,
        needsReview: resolution.decision === 'REVIEW',
      });
      studentId = student.id;
      await store.recordAssignmentHistory?.({
        studentId,
        reason: `Created from ${message.channel} first contact`,
      });
    }
    // REVIEW with canCreate === false: an ambiguous match. Record the
    // conversation with no student attached; a human resolves it.

    const needsReview = resolution.decision === 'REVIEW';

    // ── 4. Conversation and message. ─────────────────────────────────────────
    const conversation = await store.findOrCreateConversation({
      channel: message.channel,
      externalThreadId: message.externalThreadId ?? null,
      studentId,
      needsReview,
      reviewReason: needsReview ? resolution.reasons.join(' ') : null,
      lastMessageAt: now,
    });

    const messageKey = message.providerMessageId
      ? deriveMessageKey(message.channel, message.providerMessageId)
      : `${eventKey}:message`;

    const stored = await store.appendMessage({
      conversationId: conversation.id,
      studentId,
      channel: message.channel,
      direction: 'INBOUND',
      body: message.body ?? '',
      providerMessageId: message.providerMessageId ?? null,
      idempotencyKey: messageKey,
      senderHandle: message.senderId,
      senderName: message.senderName ?? null,
      occurredAt: now,
      attachmentCount: (message.attachments?.length ?? 0) + (message.prefetchRejected?.length ?? 0),
    });

    // ── 5. Attachments. Stored privately; never auto-verified. ───────────────
    const attachmentsStored: Array<{ documentId: string; storageKey: string; documentType: string; verificationStatus: 'PENDING_REVIEW' }> = [];
    const attachmentsRejected: Array<{ fileName: string; code: string; reason: string }> = [
      ...(message.prefetchRejected ?? []),
    ];

    if (studentId && message.attachments?.length) {
      const storeDocument = deps.storeDocumentOverride ?? store.storeDocument;
      for (const attachment of message.attachments) {
        const documentId = newId();
        const type = suggestDocumentType(attachment.fileName);
        const result = await storeDocument({
          studentId,
          documentId,
          version: 1,
          mimeType: attachment.mimeType,
          content: attachment.content,
          fileName: attachment.fileName,
          documentType: type,
          sourceChannel: message.channel,
          conversationId: conversation.id,
        });

        if (result.ok) {
          attachmentsStored.push({
            documentId,
            storageKey: result.storageKey,
            documentType: type,
            // Always PENDING_REVIEW: OCR and file names suggest, humans verify.
            verificationStatus: 'PENDING_REVIEW',
          });
        } else {
          attachmentsRejected.push({ fileName: attachment.fileName, code: result.code, reason: result.reason });
        }
      }
    } else if (message.attachments?.length) {
      for (const attachment of message.attachments) {
        attachmentsRejected.push({
          fileName: attachment.fileName,
          code: 'NO_STUDENT',
          reason: 'The sender could not be matched to a student, so the file was not stored. Resolve identity first.',
        });
      }
    }

    await store.completeEvent({ eventKey, status: 'SUCCEEDED', studentId, conversationId: conversation.id });

    return {
      status: 'PROCESSED',
      eventKey,
      eventBasis: basis,
      identityDecision: resolution.decision,
      studentId,
      studentCode,
      conversationId: conversation.id,
      messageId: stored.id,
      needsReview,
      reviewReasons: resolution.reasons,
      attachmentsStored,
      attachmentsRejected,
    };
  } catch (error) {
    // A failed event is recorded as failed so a provider retry is allowed to
    // reprocess it (see classifyDuplicate).
    await store.completeEvent({
      eventKey,
      status: 'FAILED',
      error: error instanceof Error ? error.message : 'unknown ingest failure',
    });
    throw error;
  }
}
