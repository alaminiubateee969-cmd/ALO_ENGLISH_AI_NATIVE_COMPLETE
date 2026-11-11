/**
 * src/lib/crm/lead-score.ts
 *
 * A transparent priority score for a lead, so a counsellor knows who to call
 * next. Not a prediction, not a qualification, and never a decision.
 *
 * WHAT THIS IS NOT
 * ────────────────
 * It does not estimate the chance that a student is admitted, funded, or granted
 * a visa, and it must never be presented as one. Those outcomes depend on an
 * institution, a government and a case officer. What the score measures is the
 * much smaller thing that is actually knowable from this database: how complete
 * the file is, how much the person has engaged with us, and how recent that
 * engagement is. Two leads with the same score can be entirely different people.
 *
 * WHY IT IS EXPLAINABLE
 * ─────────────────────
 * Every point is a named contribution with a reason a counsellor can read
 * ("budget range recorded: +7"). An opaque number that staff cannot argue with is
 * worse than no number, because it gets treated as a judgement. This one is
 * designed to be argued with: `contributions` is the whole score, and there is
 * nothing else in it.
 *
 * PRIVACY
 * ───────
 * The contributions deliberately name *fields*, never values. A lead's name,
 * email address and phone number never appear in the output, so the explanation
 * can be shown in a dashboard, logged, or pasted into a briefing without moving
 * personal data around.
 */

export type LeadBand = 'COLD' | 'WARM' | 'HOT' | 'CLOSED';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST' | (string & {});

/** The parts of a lead the score reads. Everything else is ignored. */
export type ScorableLead = {
  status: LeadStatus;
  source?: string | null;
  country?: string | null;
  courseInterest?: string | null;
  intake?: string | null;
  budgetRange?: string | null;
  englishStatus?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

export type LeadEngagement = {
  /** Inbound and outbound messages exchanged with this lead. */
  messageCount?: number;
  /** Local practice attempts, when the person also holds a student account. */
  practiceAttempts?: number;
  /** Whether a service-purpose consent record exists. */
  hasServiceConsent?: boolean;
  /** Whether the person agreed to marketing contact. */
  hasMarketingConsent?: boolean;
  /** When the last human contact happened, if it is recorded at all. */
  lastContactedAt?: Date | null;
};

export type LeadContribution = {
  code: string;
  /** What was measured, in words a counsellor can read. */
  label: string;
  points: number;
  /** Which bucket it belongs to, for grouping in a UI. */
  group: 'COMPLETENESS' | 'ENGAGEMENT' | 'RECENCY' | 'STATUS' | 'CONSENT';
};

export type LeadScore = {
  score: number;
  band: LeadBand;
  contributions: LeadContribution[];
  /** The two or three things that would raise the score most. */
  nextActions: string[];
  /** Always present, so no caller can present a score without its limits. */
  disclaimer: string;
};

export const LEAD_SCORE_DISCLAIMER =
  'A priority score built from file completeness, engagement and recency. It is not a prediction of admission, scholarship or visa outcome, and it does not replace a counsellor reading the file.';

const MAX_SCORE = 100;

/** Days after which an untouched lead is considered stale. */
export const STALE_AFTER_DAYS = 14;
/** Days after which a lead with no contact at all is considered cold. */
export const UNCONTACTED_AFTER_DAYS = 7;

function has(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Score a lead. Deterministic: the same inputs always produce the same score and
 * the same order of contributions.
 */
export function scoreLead(lead: ScorableLead, engagement: LeadEngagement = {}, now: Date = new Date()): LeadScore {
  const contributions: LeadContribution[] = [];
  const add = (code: string, group: LeadContribution['group'], label: string, points: number) => {
    if (points !== 0) contributions.push({ code, group, label, points });
  };

  // ── Completeness ──────────────────────────────────────────────────────────
  // What a counsellor needs before the first real conversation. Weighted by how
  // much work its absence costs later: an intake is the difference between a file
  // that can be planned and one that cannot.
  if (has(lead.intake)) add('INTAKE_RECORDED', 'COMPLETENESS', 'Target intake recorded', 8);
  if (has(lead.courseInterest)) add('COURSE_INTEREST_RECORDED', 'COMPLETENESS', 'Course interest recorded', 8);
  if (has(lead.country)) add('COUNTRY_RECORDED', 'COMPLETENESS', 'Destination recorded', 6);
  if (has(lead.budgetRange)) add('BUDGET_RECORDED', 'COMPLETENESS', 'Budget range recorded', 7);
  if (has(lead.englishStatus)) add('ENGLISH_STATUS_RECORDED', 'COMPLETENESS', 'English test status recorded', 6);
  if (has(lead.phone)) add('PHONE_PRESENT', 'COMPLETENESS', 'Phone number on file', 6);
  if (has(lead.email)) add('EMAIL_PRESENT', 'COMPLETENESS', 'Email address on file', 4);
  if (has(lead.notes)) add('NOTES_PRESENT', 'COMPLETENESS', 'Notes on file', 2);

  // ── Engagement ────────────────────────────────────────────────────────────
  const messages = engagement.messageCount ?? 0;
  if (messages >= 5) add('MESSAGES_HIGH', 'ENGAGEMENT', 'Five or more messages exchanged', 14);
  else if (messages >= 2) add('MESSAGES_MEDIUM', 'ENGAGEMENT', 'Two or more messages exchanged', 8);
  else if (messages >= 1) add('MESSAGES_LOW', 'ENGAGEMENT', 'At least one message exchanged', 4);

  const attempts = engagement.practiceAttempts ?? 0;
  if (attempts >= 3) add('PRACTICE_HIGH', 'ENGAGEMENT', 'Three or more practice attempts', 8);
  else if (attempts >= 1) add('PRACTICE_LOW', 'ENGAGEMENT', 'Practice attempted', 5);

  // ── Consent ───────────────────────────────────────────────────────────────
  // Consent is not enthusiasm, and it is scored as what it is: permission to keep
  // talking. Absence of consent is never scored as negative — the score must not
  // push anyone towards contacting a person who said no.
  if (engagement.hasServiceConsent) add('SERVICE_CONSENT', 'CONSENT', 'Agreed to service messages', 6);
  if (engagement.hasMarketingConsent) add('MARKETING_CONSENT', 'CONSENT', 'Agreed to marketing messages', 3);

  // ── Recency ───────────────────────────────────────────────────────────────
  const ageDays = daysBetween(lead.createdAt, now);
  if (ageDays <= 7) add('NEW_RECENT', 'RECENCY', 'Enquiry within the last week', 10);
  else if (ageDays <= 30) add('NEW_THIS_MONTH', 'RECENCY', 'Enquiry within the last month', 6);
  else add('NEW_OLDER', 'RECENCY', 'Enquiry older than a month', 2);

  const lastContact = engagement.lastContactedAt ?? null;
  if (lastContact && lead.status !== 'LOST') {
    const sinceContact = daysBetween(lastContact, now);
    if (sinceContact <= 3) add('CONTACTED_RECENTLY', 'RECENCY', 'Contacted in the last three days', 4);
    else if (sinceContact >= STALE_AFTER_DAYS) add('CONTACT_STALE', 'RECENCY', `No contact for ${sinceContact} days`, -6);
  } else if (!lastContact && lead.status === 'NEW' && ageDays >= UNCONTACTED_AFTER_DAYS) {
    add('NEVER_CONTACTED', 'RECENCY', `Never contacted and ${ageDays} days old`, -5);
  }

  // ── Status ────────────────────────────────────────────────────────────────
  switch (lead.status) {
    case 'CONTACTED':
      add('STATUS_CONTACTED', 'STATUS', 'Conversation started', 4);
      break;
    case 'QUALIFIED':
      add('STATUS_QUALIFIED', 'STATUS', 'Marked qualified by a counsellor', 10);
      break;
    case 'CONVERTED':
      add('STATUS_CONVERTED', 'STATUS', 'Converted to a student', 15);
      break;
    case 'LOST':
      add('STATUS_LOST', 'STATUS', 'Marked lost', -25);
      break;
    default:
      break;
  }

  const raw = contributions.reduce((total, contribution) => total + contribution.points, 0);
  const score = Math.max(0, Math.min(MAX_SCORE, raw));

  return {
    score,
    band: bandFor(score, lead.status),
    contributions,
    nextActions: nextActionsFor(lead, engagement, contributions),
    disclaimer: LEAD_SCORE_DISCLAIMER,
  };
}

export function bandFor(score: number, status?: LeadStatus): LeadBand {
  // A closed file is closed: showing "HOT" next to a lost lead is how a call list
  // starts contradicting the counsellor who closed it.
  if (status === 'LOST') return 'CLOSED';
  if (score >= 65) return 'HOT';
  if (score >= 35) return 'WARM';
  return 'COLD';
}

/**
 * The highest-value missing pieces, in the order worth fixing them. Derived from
 * the same contributions that produced the score, so the advice cannot disagree
 * with the number.
 */
function nextActionsFor(lead: ScorableLead, engagement: LeadEngagement, contributions: LeadContribution[]): string[] {
  const present = new Set(contributions.map((contribution) => contribution.code));
  const actions: string[] = [];

  if (lead.status === 'LOST') return ['No action: the file is closed.'];
  if (lead.status === 'CONVERTED') return ['No action needed: this lead is already a student.'];

  // Contact first, then the gaps. A lead nobody has called is the one that goes
  // stale while a counsellor fills in fields.
  if (lead.status === 'NEW') actions.push('Make first contact and record it.');
  if (present.has('CONTACT_STALE') || present.has('NEVER_CONTACTED')) {
    actions.push('Follow up: the file has gone quiet.');
  }

  if (!present.has('INTAKE_RECORDED')) actions.push('Ask which intake the student is targeting.');
  if (!present.has('COURSE_INTEREST_RECORDED')) actions.push('Record the course or subject interest.');
  if (!present.has('COUNTRY_RECORDED')) actions.push('Confirm the destination country.');
  if (!present.has('BUDGET_RECORDED')) actions.push('Ask about the tuition budget range.');
  if (!present.has('ENGLISH_STATUS_RECORDED')) actions.push('Record the current English test status.');
  if (!present.has('PHONE_PRESENT') && !present.has('EMAIL_PRESENT')) {
    actions.push('Collect a working phone number or email address.');
  }
  return actions.slice(0, 3);
}

/** One sentence a counsellor can read out loud, or show a colleague. */
export function describeLeadScore(score: LeadScore): string {
  const positive = score.contributions.filter((contribution) => contribution.points > 0).length;
  const negative = score.contributions.filter((contribution) => contribution.points < 0).length;
  return `${score.band} (${score.score}/100): ${positive} positive signal${positive === 1 ? '' : 's'}${
    negative > 0 ? `, ${negative} warning${negative === 1 ? '' : 's'}` : ''
  }.`;
}

/** Sort a list for a call queue: highest score first, then oldest first. */
export function rankLeads<T extends { score: number; createdAt: Date }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}
