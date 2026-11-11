/**
 * src/lib/crm/review-queue.ts
 *
 * The one screen where a human resolves what the machine refused to guess.
 *
 * The hub creates three kinds of "I am not sure" and each of them is a person's
 * problem until someone answers it:
 *
 *   * a conversation whose sender could not be identified confidently — the
 *     pipeline created a new record rather than attaching the message to
 *     someone who merely shares a name, and someone must confirm which person
 *     this actually is, or say that it is nobody;
 *   * a document that arrived by itself and is `PENDING_REVIEW` — only a human
 *     may mark a passport scan verified;
 *   * a student record created with `needsReview` because the match was
 *     ambiguous.
 *
 * Two decisions are baked into this module rather than left to the UI:
 *
 *   1. **Oldest first.** A queue sorted by "most recent" buries the student who
 *      has been waiting longest. This sorts by age, ascending.
 *   2. **A dismissal needs a reason.** Linking a conversation to a student is
 *      self-documenting; dismissing a possible duplicate is not, and it is the
 *      decision that could silently lose two people's files. So a dismissal
 *      without a note is refused here, not just discouraged in the UI.
 */

export const REVIEW_ITEM_KINDS = ['CONVERSATION', 'DOCUMENT', 'STUDENT'] as const;
export type ReviewItemKind = (typeof REVIEW_ITEM_KINDS)[number];

export type ReviewItem = {
  kind: ReviewItemKind;
  id: string;
  createdAt: Date;
  ageHours: number;
  /** The student the record is attached to, when there is one. */
  studentId: string | null;
  studentCode: string | null;
  studentName: string | null;
  /** One line a person reads first. */
  title: string;
  /** The detail that makes the decision possible. */
  detail: string;
  /** Why this is here. Always at least one. */
  reasons: string[];
  /** True when the only way to resolve it is to say who this is. */
  needsIdentityLink: boolean;
  channel: string | null;
  /** Free text the resolver may need (a quoted message, a file name). */
  preview: string | null;
};

export type ReviewQueueTotals = {
  total: number;
  conversations: number;
  documents: number;
  students: number;
  /** Items with no student attached, which cannot be resolved by verification alone. */
  unlinked: number;
  oldestAgeHours: number;
};

export type ReviewQueue = {
  generatedAt: Date;
  items: ReviewItem[];
  totals: ReviewQueueTotals;
};

export type ConversationRow = {
  id: string;
  channel: string;
  externalThreadId: string | null;
  studentId: string | null;
  needsReview: boolean;
  reviewReason: string | null;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  studentName?: string | null;
  studentCode?: string | null;
  lastMessagePreview?: string | null;
};

export type DocumentRow = {
  id: string;
  studentId: string | null;
  type: string;
  fileName: string;
  fileSize: number;
  sourceChannel: string | null;
  verificationStatus: string;
  createdAt: Date;
  studentName?: string | null;
  studentCode?: string | null;
};

export type StudentRow = {
  id: string;
  studentCode: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  needsReview: boolean;
  createdAt: Date;
  reviewReason?: string | null;
};

export const PENDING_DOCUMENT_STATUS = 'PENDING_REVIEW';

function ageHours(from: Date, now: Date): number {
  return Math.max(0, Math.round(((now.getTime() - from.getTime()) / (60 * 60 * 1000)) * 10) / 10);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

/** Only conversations actually flagged for review, and only documents still pending. */
export function buildReviewQueue(input: {
  conversations: ConversationRow[];
  documents: DocumentRow[];
  students: StudentRow[];
  now: Date;
}): ReviewQueue {
  const { now } = input;
  const items: ReviewItem[] = [];

  for (const conversation of input.conversations) {
    if (!conversation.needsReview) continue;
    const reasons = [conversation.reviewReason?.trim() || 'Flagged for review by the inbound pipeline.'];
    items.push({
      kind: 'CONVERSATION',
      id: conversation.id,
      createdAt: conversation.createdAt,
      ageHours: ageHours(conversation.createdAt, now),
      studentId: conversation.studentId,
      studentCode: conversation.studentCode ?? null,
      studentName: conversation.studentName ?? null,
      title: conversation.externalThreadId ? `${conversation.channel} · ${conversation.externalThreadId}` : `${conversation.channel} conversation`,
      detail: `${conversation.messageCount} message${conversation.messageCount === 1 ? '' : 's'}${conversation.studentId ? ' attached to a flagged record' : ', no student attached'}`,
      reasons,
      // Nothing can be verified against a conversation with no owner.
      needsIdentityLink: !conversation.studentId,
      channel: conversation.channel,
      preview: conversation.lastMessagePreview ?? null,
    });
  }

  for (const document of input.documents) {
    if (document.verificationStatus !== PENDING_DOCUMENT_STATUS) continue;
    items.push({
      kind: 'DOCUMENT',
      id: document.id,
      createdAt: document.createdAt,
      ageHours: ageHours(document.createdAt, now),
      studentId: document.studentId,
      studentCode: document.studentCode ?? null,
      studentName: document.studentName ?? null,
      title: `${document.type} · ${document.fileName}`,
      detail: `${formatBytes(document.fileSize)} received on ${document.sourceChannel ?? 'an unknown channel'}; awaiting a human decision`,
      reasons: ['Automatically received documents are never verified automatically.'],
      needsIdentityLink: !document.studentId,
      channel: document.sourceChannel ?? null,
      preview: null,
    });
  }

  for (const student of input.students) {
    if (!student.needsReview) continue;
    items.push({
      kind: 'STUDENT',
      id: student.id,
      createdAt: student.createdAt,
      ageHours: ageHours(student.createdAt, now),
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.name,
      title: student.studentCode ? `${student.studentCode} · ${student.name}` : student.name,
      detail: [student.phone, student.email].filter(Boolean).join(' · ') || 'No phone or email recorded',
      reasons: [student.reviewReason?.trim() || 'Created from an ambiguous match; confirm whether this is a new person or an existing student.'],
      needsIdentityLink: false,
      channel: null,
      preview: null,
    });
  }

  // Oldest first: the student who has waited longest is served first.
  items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const totals: ReviewQueueTotals = {
    total: items.length,
    conversations: items.filter((item) => item.kind === 'CONVERSATION').length,
    documents: items.filter((item) => item.kind === 'DOCUMENT').length,
    students: items.filter((item) => item.kind === 'STUDENT').length,
    unlinked: items.filter((item) => item.needsIdentityLink).length,
    // The queue is sorted oldest first, so the longest wait is the FIRST item —
    // reading the last one would report the newest entry as the oldest.
    oldestAgeHours: items.length > 0 ? items[0]!.ageHours : 0,
  };

  return { generatedAt: now, items, totals };
}

/* ──────────────────────────────── resolutions ─────────────────────────────── */

export const REVIEW_ACTIONS = ['LINK_STUDENT', 'DISMISS', 'KEEP_PENDING'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const MIN_DISMISSAL_NOTE_LENGTH = 5;

export type ResolutionValidation =
  | { ok: true; action: ReviewAction; studentId: string | null; note: string | null }
  | { ok: false; code: 'INVALID_ACTION' | 'STUDENT_REQUIRED' | 'NOTE_REQUIRED' | 'SELF_LINK'; reason: string };

/**
 * Validate a resolution before it is applied.
 *
 * `LINK_STUDENT` without a student is meaningless, and `DISMISS` without a note
 * throws away a possible duplicate with no trace of who decided that or why. A
 * dismissal that cannot be explained is a dismissal someone will have to make
 * twice.
 */
export function validateResolution(input: {
  action: string;
  studentId?: string | null;
  note?: string | null;
  /** The record being resolved, so linking something to itself is refused. */
  currentStudentId?: string | null;
}): ResolutionValidation {
  const action = input.action?.toUpperCase() as ReviewAction;
  if (!REVIEW_ACTIONS.includes(action)) {
    return { ok: false, code: 'INVALID_ACTION', reason: `${input.action} is not a review action.` };
  }

  const note = input.note?.trim() || null;

  if (action === 'LINK_STUDENT') {
    const studentId = input.studentId?.trim() || null;
    if (!studentId) {
      return { ok: false, code: 'STUDENT_REQUIRED', reason: 'Linking requires the student this record belongs to.' };
    }
    if (input.currentStudentId && input.currentStudentId === studentId) {
      return { ok: false, code: 'SELF_LINK', reason: 'That is the student the record is already attached to; there is nothing to change.' };
    }
    return { ok: true, action, studentId, note };
  }

  if (action === 'DISMISS') {
    if (!note || note.length < MIN_DISMISSAL_NOTE_LENGTH) {
      return {
        ok: false,
        code: 'NOTE_REQUIRED',
        reason: 'Dismissing a review entry needs a short note: what was checked, and why this is not a duplicate.',
      };
    }
    return { ok: true, action, studentId: null, note };
  }

  // KEEP_PENDING is a deliberate deferral, and it too carries a reason.
  if (!note) {
    return { ok: false, code: 'NOTE_REQUIRED', reason: 'Leaving an entry pending needs a note saying what it is waiting for.' };
  }
  return { ok: true, action, studentId: null, note };
}

/** Human-readable summary of a resolution, for the audit log and the UI toast. */
export function describeResolution(model: { action: ReviewAction; note?: string | null }, target: { label: string }): string {
  if (model.action === 'LINK_STUDENT') return `Linked ${target.label} to a student and cleared the review flag.`;
  if (model.action === 'DISMISS') return `Dismissed the review entry for ${target.label}: ${model.note ?? ''}`.trim();
  return `Left ${target.label} pending: ${model.note ?? ''}`.trim();
}
