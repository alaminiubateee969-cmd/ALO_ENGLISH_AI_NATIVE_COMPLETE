/**
 * src/lib/crm/identity.ts
 *
 * Student identity: the human-readable code, phone normalisation, and the
 * matching rules that decide whether an inbound message belongs to an existing
 * student, a new one, or a human review queue.
 *
 * THE RULE THAT MATTERS
 * ─────────────────────
 * A name, or a phone number that matches more than one record, must never
 * silently merge two students. Merging is destructive and hard to reverse: two
 * people's documents, applications and conversations would end up under one
 * identity. So anything short of a unique, strong identifier lands in the
 * review queue instead. `resolveIdentity` encodes exactly that.
 *
 * Allocation of the code itself happens server-side inside a transaction (see
 * `allocateStudentCode`), with the unique index on Student.studentCode as the
 * second line of defence.
 */

/** Prefix used for every ALO student code. */
export const STUDENT_CODE_PREFIX = 'ALO';

/** Matches ALO-YYYY-NNNNNN, e.g. ALO-2026-000001. */
export const STUDENT_CODE_PATTERN = /^ALO-(\d{4})-(\d{6})$/;

export type IdentityDecision = 'MATCHED' | 'NEW' | 'REVIEW';

export type IdentityCandidate = {
  studentId: string;
  studentCode?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Provider-scoped user id previously recorded for this student. */
  channelUserIds?: string[];
  name?: string | null;
};

export type InboundIdentity = {
  channel: string;
  /** Provider-scoped sender id (WhatsApp wa_id, Messenger PSID, SMS number…). */
  channelUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  studentCode?: string | null;
  name?: string | null;
};

export type IdentityResolution = {
  decision: IdentityDecision;
  /** Present only when the decision is MATCHED. */
  studentId?: string;
  /** Why the decision was reached — surfaced in the review queue. */
  reasons: string[];
  /** True when the record may be created before a human confirms it. */
  canCreate: boolean;
};

/** Format a sequence number into a student code. Throws on overflow. */
export function formatStudentCode(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error(`Student code year must be a four-digit year, received ${year}.`);
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error(`Student code sequence must be between 1 and 999999, received ${sequence}.`);
  }
  return `${STUDENT_CODE_PREFIX}-${year}-${String(sequence).padStart(6, '0')}`;
}

/** Parse a student code. Returns null when it is not well formed. */
export function parseStudentCode(code: string): { year: number; sequence: number } | null {
  const match = STUDENT_CODE_PATTERN.exec(code.trim().toUpperCase());
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

export function isValidStudentCode(code: string | null | undefined): boolean {
  return typeof code === 'string' && parseStudentCode(code) !== null;
}

/** Normalised form used as a lookup key. Leading zeros and + are meaningful. */
export function normalizeStudentCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  return isValidStudentCode(trimmed) ? trimmed : null;
}

/**
 * Normalise a phone number for comparison.
 *
 * Bangladesh-first: +880 1XXXXXXXXX, 880 1XXXXXXXXX and 01XXXXXXXXX all describe
 * the same subscriber, so they normalise to 8801XXXXXXXXX. Other country codes
 * are kept as digits with any leading "+" removed — this is a comparison key,
 * not an E.164 validator, and it is deliberately conservative: a number it
 * cannot parse confidently returns null rather than a wrong key.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d+]/g, '');
  const plain = digits.startsWith('+') ? digits.slice(1) : digits;
  if (!/^\d+$/.test(plain) || plain.length < 7) return null;

  // +8801XXXXXXXXX / 8801XXXXXXXXX / 01XXXXXXXXX → 8801XXXXXXXXX
  if (/^8801\d{9}$/.test(plain)) return plain;
  if (/^01\d{9}$/.test(plain)) return `88${plain}`;

  return plain.length >= 8 ? plain : null;
}

/** Normalise an email for comparison (trim + lower-case). */
export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
}

/**
 * Decide how an inbound message relates to existing records.
 *
 * Strong identifiers (student code, channel user id, unique phone, unique
 * email) match. Anything ambiguous, and anything based on a name alone,
 * becomes REVIEW with `canCreate: true`: the conversation is still recorded, but
 * it is not attached to a student until a human confirms it.
 */
export function resolveIdentity(
  inbound: InboundIdentity,
  candidates: IdentityCandidate[],
): IdentityResolution {
  const reasons: string[] = [];
  const code = normalizeStudentCode(inbound.studentCode);

  if (code) {
    const byCode = candidates.filter((candidate) => normalizeStudentCode(candidate.studentCode) === code);
    if (byCode.length === 1) {
      return { decision: 'MATCHED', studentId: byCode[0].studentId, reasons: [`Student code ${code} matched exactly.`], canCreate: false };
    }
    if (byCode.length > 1) {
      return { decision: 'REVIEW', reasons: [`Student code ${code} appears on ${byCode.length} records.`], canCreate: false };
    }
    reasons.push(`Student code ${code} did not match any record.`);
  }

  const channelUserId = inbound.channelUserId?.trim() || null;
  if (channelUserId) {
    const byHandle = candidates.filter((candidate) => candidate.channelUserIds?.includes(channelUserId));
    if (byHandle.length === 1) {
      return { decision: 'MATCHED', studentId: byHandle[0].studentId, reasons: [`Known ${inbound.channel} sender id.`], canCreate: false };
    }
    if (byHandle.length > 1) {
      return { decision: 'REVIEW', reasons: [`Sender id is recorded against ${byHandle.length} students.`], canCreate: false };
    }
    reasons.push('Sender id is not yet known to the CRM.');
  }

  const phone = normalizePhone(inbound.phone);
  if (phone) {
    const byPhone = candidates.filter((candidate) => normalizePhone(candidate.phone) === phone);
    if (byPhone.length === 1) {
      return { decision: 'MATCHED', studentId: byPhone[0].studentId, reasons: ['Phone number matched exactly one record.'], canCreate: false };
    }
    if (byPhone.length > 1) {
      // Two students sharing a phone (a family, or a shared office line) is
      // common. Picking one would attach someone else's documents to the wrong
      // person.
      return {
        decision: 'REVIEW',
        reasons: [`Phone number matches ${byPhone.length} records; a human must choose.`],
        canCreate: false,
      };
    }
    reasons.push('Phone number did not match any record.');
  }

  const email = normalizeEmail(inbound.email);
  if (email) {
    const byEmail = candidates.filter((candidate) => normalizeEmail(candidate.email) === email);
    if (byEmail.length === 1) {
      return { decision: 'MATCHED', studentId: byEmail[0].studentId, reasons: ['Email matched exactly one record.'], canCreate: false };
    }
    if (byEmail.length > 1) {
      return { decision: 'REVIEW', reasons: [`Email matches ${byEmail.length} records.`], canCreate: false };
    }
    reasons.push('Email did not match any record.');
  }

  // Name-only similarity is never enough to attach a record.
  const name = inbound.name?.trim().toLowerCase();
  if (name) {
    const byName = candidates.filter((candidate) => candidate.name?.trim().toLowerCase() === name);
    if (byName.length > 0) {
      reasons.push('Name resembles an existing record; names are not used to merge automatically.');
      return { decision: 'REVIEW', reasons, canCreate: true };
    }
  }

  reasons.push('No strong identifier matched; treat as a new student.');
  return { decision: 'NEW', reasons, canCreate: true };
}

/** The current school/reference year used for student codes. */
export function academicYear(now: Date = new Date()): number {
  return now.getUTCFullYear();
}
