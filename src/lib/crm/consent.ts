/**
 * src/lib/crm/consent.ts
 *
 * The consent register: what a student agreed to, where, and on what evidence.
 *
 * Consent is not a boolean and it is not a checkbox that lives in a form's
 * memory. It is a record that has to survive being questioned a year later —
 * by the student, by a regulator, or by a colleague asking why a campaign went
 * out. Three consequences follow, and they are why this module exists:
 *
 *   1. **A grant needs evidence.** A `GRANTED` without a source and a piece of
 *      evidence is not a record of consent, it is an assertion. This module
 *      refuses to store one. Withdrawals and refusals are the opposite case: they
 *      are always accepted, immediately, with or without evidence, because
 *      making it easy to say stop is the entire point.
 *   2. **Marketing is global.** A withdrawal recorded on WhatsApp suppresses
 *      marketing on SMS and email too (see `isMarketingOptOut`), matching
 *      `evaluateSendPolicy`. Consent is per channel because permission to write
 *      on Instagram is not permission to text; an opt-out is a statement about
 *      the person.
 *   3. **Silence is not consent.** `UNKNOWN` is the state of having no record.
 *      It cannot be "recorded", only resolved, so it is rejected here.
 *
 * Inbound withdrawal is detected from the student's own message. That matters
 * most in Bangladesh, where a student is far more likely to write "বন্ধ করুন" or
 * "bondho korun" in a chat than to click an unsubscribe link that a WhatsApp
 * message made difficult to find in the first place.
 */

import { normalizePhone } from './identity';

export const CONSENT_CHANNELS = ['WHATSAPP', 'SMS', 'EMAIL', 'FACEBOOK', 'INSTAGRAM'] as const;
export const CONSENT_PURPOSES = ['MARKETING', 'SERVICE', 'FOLLOW_UP'] as const;
export const CONSENT_STATUSES = ['GRANTED', 'DENIED', 'WITHDRAWN', 'UNKNOWN'] as const;
export const CONSENT_SOURCES = ['FORM', 'INBOUND_MESSAGE', 'IMPORT', 'STAFF_ENTRY'] as const;

export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];
export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export type ConsentEntry = {
  channel: string;
  purpose: string;
  status: string;
  source?: string | null;
  evidence?: string | null;
  recordedAt?: Date | null;
};

export type ConsentValidation =
  | { ok: true; value: { channel: ConsentChannel; purpose: ConsentPurpose; status: ConsentStatus; source: ConsentSource; evidence: string | null } }
  | { ok: false; code: 'INVALID_CHANNEL' | 'INVALID_PURPOSE' | 'INVALID_STATUS' | 'INVALID_SOURCE' | 'SOURCE_REQUIRED' | 'EVIDENCE_REQUIRED' | 'UNKNOWN_IS_NOT_A_RECORD'; reason: string };

/** How much evidence a grant needs before it is worth storing. */
export const MIN_EVIDENCE_LENGTH = 3;

export function validateConsentCapture(input: {
  channel: string;
  purpose: string;
  status: string;
  source?: string | null;
  evidence?: string | null;
}): ConsentValidation {
  const channel = input.channel?.toUpperCase() as ConsentChannel;
  if (!CONSENT_CHANNELS.includes(channel)) {
    return { ok: false, code: 'INVALID_CHANNEL', reason: `${input.channel} is not a channel this register covers.` };
  }

  const purpose = input.purpose?.toUpperCase() as ConsentPurpose;
  if (!CONSENT_PURPOSES.includes(purpose)) {
    return { ok: false, code: 'INVALID_PURPOSE', reason: `${input.purpose} is not a purpose this register covers.` };
  }

  const status = input.status?.toUpperCase() as ConsentStatus;
  if (!CONSENT_STATUSES.includes(status)) {
    return { ok: false, code: 'INVALID_STATUS', reason: `${input.status} is not a consent status.` };
  }

  // "Unknown" is the absence of a record. Writing a row that says we do not know
  // would make the absence of consent look like a decision.
  if (status === 'UNKNOWN') {
    return { ok: false, code: 'UNKNOWN_IS_NOT_A_RECORD', reason: 'Unknown is the absence of a record, not a record. Withdraw, deny or grant instead.' };
  }

  const explicitSource = input.source ? (input.source.toUpperCase() as ConsentSource) : null;
  if (explicitSource && !CONSENT_SOURCES.includes(explicitSource)) {
    return { ok: false, code: 'INVALID_SOURCE', reason: `${input.source} is not a recognised source.` };
  }

  const evidence = input.evidence?.trim() || null;

  // A refusal or a withdrawal is always accepted. Nothing may stand between a
  // person and saying stop.
  if (status === 'DENIED' || status === 'WITHDRAWN') {
    return { ok: true, value: { channel, purpose, status, source: explicitSource ?? 'STAFF_ENTRY', evidence } };
  }

  // A grant must be provable.
  if (!explicitSource) {
    return { ok: false, code: 'SOURCE_REQUIRED', reason: `Recording ${purpose} consent for ${channel} requires a source: how did the student agree?` };
  }
  if (!evidence || evidence.length < MIN_EVIDENCE_LENGTH) {
    return {
      ok: false,
      code: 'EVIDENCE_REQUIRED',
      reason: `Recording ${purpose} consent for ${channel} requires evidence — a form reference, a message id, or the wording the student agreed to.`,
    };
  }

  return { ok: true, value: { channel, purpose, status, source: explicitSource, evidence } };
}

/**
 * Marketing opt-out, which is global by design.
 *
 * Denied and withdrawn are treated the same here: both mean do not send
 * marketing. The distinction is kept in the record for the audit trail, not in
 * the send decision.
 */
export function isMarketingOptOut(entries: ConsentEntry[]): boolean {
  return entries.some((entry) => entry.purpose === 'MARKETING' && (entry.status === 'WITHDRAWN' || entry.status === 'DENIED'));
}

export type ConsentCell = {
  channel: ConsentChannel;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  source: string | null;
  evidence: string | null;
  recordedAt: Date | null;
};

/** The full grid, with an explicit row for every combination that has no record. */
export function consentMatrix(entries: ConsentEntry[]): ConsentCell[] {
  const byKey = new Map<string, ConsentEntry>();
  for (const entry of entries) byKey.set(`${entry.channel}:${entry.purpose}`, entry);

  const cells: ConsentCell[] = [];
  for (const channel of CONSENT_CHANNELS) {
    for (const purpose of CONSENT_PURPOSES) {
      const entry = byKey.get(`${channel}:${purpose}`);
      cells.push({
        channel,
        purpose,
        status: (entry?.status as ConsentStatus) ?? 'UNKNOWN',
        source: entry?.source ?? null,
        evidence: entry?.evidence ?? null,
        recordedAt: entry?.recordedAt ?? null,
      });
    }
  }
  return cells;
}

/**
 * Why marketing is or is not available for this student, in one sentence a
 * person can act on. The UI shows this instead of a bare badge, because "blocked"
 * without a reason is what makes staff work around the system.
 */
export function marketingReadiness(entries: ConsentEntry[]): { allowed: boolean; reason: string; grantedChannels: ConsentChannel[] } {
  if (isMarketingOptOut(entries)) {
    const where = entries
      .filter((entry) => entry.purpose === 'MARKETING' && (entry.status === 'WITHDRAWN' || entry.status === 'DENIED'))
      .map((entry) => entry.channel)
      .join(', ');
    return {
      allowed: false,
      reason: `Marketing is suppressed for this student (recorded on ${where}). This applies to every channel, not only the one where they said stop.`,
      grantedChannels: [],
    };
  }

  const grantedChannels = entries
    .filter((entry) => entry.purpose === 'MARKETING' && entry.status === 'GRANTED')
    .map((entry) => entry.channel as ConsentChannel);

  if (grantedChannels.length === 0) {
    return {
      allowed: false,
      reason: 'No marketing consent is recorded. Marketing stays blocked until a real capture happens — an inbound keyword, a form, or a staff entry with evidence.',
      grantedChannels: [],
    };
  }

  return {
    allowed: true,
    reason: `Marketing consent is recorded for ${grantedChannels.join(', ')}. Other channels still need their own capture.`,
    grantedChannels,
  };
}

/* ────────────────────────── inbound withdrawal capture ─────────────────────── */

/**
 * Words that mean stop, in the languages our students actually write in.
 *
 * Deliberately literal: a false positive here suppresses a marketing message
 * that might have been welcome, which is a much smaller harm than a false
 * negative that keeps messaging someone who asked us to stop. Service messages
 * are unaffected unless the student explicitly declines service.
 */
export const WITHDRAWAL_PHRASES: string[] = [
  'stop',
  'stop messaging',
  'stop sending',
  'unsubscribe',
  'opt out',
  'optout',
  'do not message',
  "don't message",
  'dont message',
  'no more messages',
  'remove me from',
  'leave me alone',
  // Bengali
  'বন্ধ',
  'বন্ধ করুন',
  'মেসেজ বন্ধ',
  'মেসেজ পাঠাবেন না',
  'পাঠাবেন না',
  'আর মেসেজ',
  // Romanised Bengali, which is how most students type
  'bondho',
  'bondho korun',
  'bondho koro',
  'message bondho',
  'msg bondho',
  'pathaben na',
  'pathano bondho',
  'aro message',
];

/** Phrases that show the student means everything we send, not only marketing. */
export const TOTAL_STOP_PHRASES: string[] = [
  'never contact me',
  'do not contact me',
  "don't contact me",
  'dont contact me',
  'no calls',
  'no more calls',
  'সব বন্ধ',
  'কথা বলবেন না',
  'aro call',
  'sob bondho',
  'call bondho',
  'contact bondho',
];

export type WithdrawalIntent = {
  withdrawal: boolean;
  /** The phrase that matched, quoted back so a human can check it. */
  matched: string[];
  /** Marketing always; service and follow-up only when the student said "everything". */
  purposes: ConsentPurpose[];
};

export function detectWithdrawalIntent(body: string | null | undefined): WithdrawalIntent {
  const text = (body ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return { withdrawal: false, matched: [], purposes: [] };

  const matchedWithdrawal = WITHDRAWAL_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));
  const matchedTotalStop = TOTAL_STOP_PHRASES.filter((phrase) => text.includes(phrase.toLowerCase()));

  // A sentence like "do not contact me again" says both things at once, so the
  // total-stop phrases are part of detection rather than a second pass over a
  // message that already had to match a marketing phrase to be looked at at all.
  if (matchedWithdrawal.length === 0 && matchedTotalStop.length === 0) {
    return { withdrawal: false, matched: [], purposes: [] };
  }

  return {
    withdrawal: true,
    matched: [...matchedWithdrawal, ...matchedTotalStop],
    // Consent is withdrawn for marketing either way. Declining service is only
    // recorded when it was actually said: a "stop" about marketing must never
    // quietly cut off a student's support.
    purposes: matchedTotalStop.length > 0 ? ['MARKETING', 'SERVICE', 'FOLLOW_UP'] : ['MARKETING'],
  };
}

/* ───────────────────────────── lead-level captures ─────────────────────────── */

export type CapturedConsent = {
  channel: string;
  purpose: string;
  status: string;
  source: string | null;
  evidence: string | null;
  recordedAt: Date | null;
  /** Set while the capture is attached to a lead rather than a student. */
  leadId?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
};

/**
 * Does a capture taken before the person was a student belong to this student?
 *
 * A form is filled in by someone who has not yet talked to us, so the register
 * cannot hang the consent on a student record that does not exist. It is
 * captured against the lead instead, and promoted when the identities line up —
 * email first, then a normalised phone number. Never by name: two students can
 * share a name, and attaching one person's consent to another is exactly the
 * kind of mistake this whole module exists to prevent.
 */
export function captureBelongsToStudent(
  capture: CapturedConsent,
  student: { email?: string | null; phone?: string | null },
): { belongs: boolean; reason: string } {
  const captureEmail = capture.leadEmail?.trim().toLowerCase() || null;
  const studentEmail = student.email?.trim().toLowerCase() || null;
  if (captureEmail && studentEmail && captureEmail === studentEmail) {
    return { belongs: true, reason: `Email matches (${studentEmail}).` };
  }

  const capturePhone = normalizePhone(capture.leadPhone ?? '');
  const studentPhone = normalizePhone(student.phone ?? '');
  if (capturePhone && studentPhone && capturePhone === studentPhone) {
    return { belongs: true, reason: `Phone matches (${studentPhone}).` };
  }

  return { belongs: false, reason: 'Neither email nor phone matches this student.' };
}
