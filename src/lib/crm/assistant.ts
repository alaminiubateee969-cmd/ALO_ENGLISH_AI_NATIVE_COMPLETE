/**
 * src/lib/crm/assistant.ts
 *
 * The after-hours assistant: an automated first reply outside office hours.
 *
 * This is the highest-risk component in the hub, because it is the only one that
 * speaks to a student without a person reading the words first. Every rule here
 * exists because of a specific way that goes wrong:
 *
 *   1. **It says what it is.** Every reply carries a disclosure that it is
 *      automated. A student who believes they are talking to a counsellor is
 *      being deceived, however accurate the answers are.
 *   2. **It only answers what it was given an answer to.** Replies come from a
 *      small, reviewed set of canned answers, each with a source the student can
 *      check. There is no generation step: an unsourced sentence invented at 2am
 *      is how an institute promises a visa it cannot deliver.
 *   3. **It never promises an outcome.** Admission, scholarship, visa and score
 *      statements are refused outright — those topics go to a human, always, no
 *      matter how confident a canned answer looks.
 *   4. **It goes quiet when a human is there.** Inside office hours the
 *      assistant says nothing: a real person answering ten minutes later is
 *      better than a robot answering instantly, and a robot that jumps in front
 *      of staff trains everyone to ignore both.
 *   5. **It stops talking.** A per-conversation ceiling means a confused or
 *      hostile student gets a human, not an endless loop of cheerful automation.
 *
 * The planner is pure: it takes the facts and returns what should happen. Sending
 * is a separate step (see ./assistant-runner) and goes through the same outbound
 * funnel — with its consent rules, service window and audit trail — as any other
 * message.
 */

import { DEFAULT_BUSINESS_HOURS } from './messaging-policy';

/** Never optional, never trimmed away by a caller. */
export const ASSISTANT_DISCLOSURE = 'This is an automated message from ALO English. A counsellor will follow up when the office opens.';

/** Per-conversation ceiling for one night. After this, a human is required. */
export const ASSISTANT_MAX_REPLIES_PER_CONVERSATION = 2;

/** Topics that always go to a human, whatever the wording of the question. */
export const HUMAN_ONLY_TOPICS = [
  'ADMISSION_DECISION',
  'SCHOLARSHIP_AWARD',
  'VISA_OUTCOME',
  'SCORE_OR_BAND',
  'FEES_AND_PAYMENT',
  'COMPLAINT',
  'DOCUMENT_LEGAL',
] as const;

export type HumanOnlyTopic = (typeof HUMAN_ONLY_TOPICS)[number];

/**
 * Phrases that mark a topic as human-only.
 *
 * Matching is literal and deliberately broad. A false positive costs one
 * human-written reply; a false negative costs a promise this institute cannot
 * keep.
 */
const TOPIC_PHRASES: Array<{ topic: HumanOnlyTopic; phrases: string[] }> = [
  {
    topic: 'ADMISSION_DECISION',
    phrases: [
      'will i get admission',
      'can i get admission',
      'am i accepted',
      'admission confirmed',
      'guarantee admission',
      'chance of admission',
      'will i be selected',
      'ভর্তি হব',
      'ভর্তি হতে পারব',
      'chance koto',
    ],
  },
  {
    topic: 'SCHOLARSHIP_AWARD',
    phrases: [
      'will i get scholarship',
      'can i get scholarship',
      'scholarship confirmed',
      'full scholarship',
      'how much scholarship will i get',
      'guarantee scholarship',
      'স্কলারশিপ পাব',
      'scholarship pabo',
    ],
  },
  {
    topic: 'VISA_OUTCOME',
    phrases: [
      'will my visa be approved',
      'visa approved',
      'visa guarantee',
      'guarantee visa',
      'visa rejection chance',
      'visa hobe',
      'ভিসা পাব',
      'ভিসা হবে',
    ],
  },
  {
    topic: 'SCORE_OR_BAND',
    phrases: [
      'what band will i get',
      'will i get band',
      'guarantee band',
      'guarantee score',
      'how much score will i get',
      'band পাব',
      'band pabo',
    ],
  },
  {
    topic: 'FEES_AND_PAYMENT',
    phrases: ['how much do i pay', 'payment failed', 'refund', 'discount on fee', 'fee koto', 'টাকা ফেরত', 'ফি কত'],
  },
  {
    topic: 'COMPLAINT',
    phrases: ['complaint', 'this is unacceptable', 'i am not satisfied', 'i want to complain', 'অভিযোগ'],
  },
  {
    topic: 'DOCUMENT_LEGAL',
    phrases: ['legal', 'lawyer', 'police', 'court', 'আইনজীবী', 'আদালত', 'my nid copy', 'passport copy stolen'],
  },
];

/** Which topics this message raises, if any. */
export function detectHumanOnlyTopics(body: string): { topics: HumanOnlyTopic[]; matched: string[] } {
  const text = (body ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return { topics: [], matched: [] };

  const topics: HumanOnlyTopic[] = [];
  const matched: string[] = [];
  for (const entry of TOPIC_PHRASES) {
    for (const phrase of entry.phrases) {
      if (text.includes(phrase)) {
        if (!topics.includes(entry.topic)) topics.push(entry.topic);
        if (!matched.includes(phrase)) matched.push(phrase);
      }
    }
  }
  return { topics, matched };
}

/* ────────────────────────────── canned answers ────────────────────────────── */

export type CannedAnswer = {
  id: string;
  /** Intent keywords, matched literally against the student's message. */
  keywords: string[];
  /** The reviewed reply. Plain words; no promises; no numbers that can drift. */
  answer: string;
  /** Where the student can check this, so the reply is verifiable. */
  sources: string[];
};

/**
 * The entire vocabulary of the assistant.
 *
 * Content rules, applied when these were written and enforced by
 * `containsForbiddenPromise` before anything is sent:
 *   - no score, band, admission, scholarship or visa statement of any kind;
 *   - no price, since fees change and a stale number is a dispute;
 *   - no deadline presented as fact — point at the official source instead;
 *   - nothing about an individual's application, which the assistant cannot see.
 */
export const CANNED_ANSWERS: readonly CannedAnswer[] = [
  {
    id: 'office-hours',
    keywords: ['office hour', 'open', 'khola', 'কতটায় খোলে', 'what time are you open', 'closed', 'বন্ধ থাকে'],
    answer:
      'Our office is open from 9:00 to 21:00 (Dhaka time), and messages sent outside those hours are answered first thing the next working morning.',
    sources: ['/contact'],
  },
  {
    id: 'where-to-start',
    keywords: ['how do i start', 'getting started', 'start korte', 'first step', 'ki kore shuru', 'শুরু করব', 'where do i begin'],
    answer:
      'Start with the course finder or a consultation request: tell us your target country, course level, and the test you plan to take. A counsellor then maps the options and the order to do things in.',
    sources: ['/course-finder', '/book-consultation'],
  },
  {
    id: 'practice-tests',
    keywords: ['practice test', 'mock test', 'free test', 'exam option', 'practice korte', 'মক টেস্ট', 'exam list', 'test list', 'কোন পরীক্ষা'],
    answer:
      'You can see the practice sets that are currently active, and their exam types, on the practice-test page. Question counts and timings come from what the server has published for that set.',
    sources: ['/practice-test', '/exam-prep'],
  },
  {
    id: 'preparation-overview',
    keywords: ['ielts', 'toefl', 'pte', 'duolingo', 'preparation', 'prepare', 'কীভাবে প্রস্তুতি', 'প্রস্তুতি', 'study plan'],
    answer:
      'The preparation overview lists the test formats we currently cover and links the official provider pages for each test, so you can check the format details at the source rather than from us.',
    sources: ['/language-prep'],
  },
  {
    id: 'documents-to-bring',
    keywords: ['documents', 'কাগজ', 'passport copy', 'papers', 'what do i need to bring', 'কি কি লাগবে'],
    answer:
      'Bring your passport, your academic transcripts, and any test score reports you already have. A counsellor will confirm the exact list for your case — the requirement differs by country and intake.',
    sources: ['/book-consultation'],
  },
  {
    id: 'privacy-and-data',
    keywords: ['privacy', 'my data', 'দাতা তথ্য', 'গোপনীয়তা', 'what do you do with my data', 'delete my data'],
    answer:
      'The privacy policy sets out what we collect and why. You can ask us to stop marketing messages at any time by replying with the word stop, and it applies to every channel we message you on.',
    sources: ['/privacy-policy'],
  },
  {
    id: 'human-request',
    keywords: ['talk to someone', 'speak to a human', 'real person', 'call me', 'কথা বলতে চাই', 'human'],
    answer: 'A counsellor will get back to you; your message is in the queue with the rest of your conversation.',
    sources: [],
  },
] as const;

export function matchCannedAnswer(body: string): CannedAnswer | null {
  const text = (body ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return null;
  let best: { answer: CannedAnswer; score: number } | null = null;
  for (const answer of CANNED_ANSWERS) {
    const score = answer.keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
    if (score > 0 && (!best || score > best.score)) best = { answer, score };
  }
  return best?.answer ?? null;
}

/* ──────────────────────────── the promise guard ───────────────────────────── */

/**
 * A last line of defence, applied to every draft immediately before it is sent.
 *
 * The canned answers above are written to pass this. It exists so that a future
 * edit — or an operator-supplied replacement — cannot quietly introduce a
 * promise, and so a test can assert the whole shipped vocabulary is clean.
 */
const FORBIDDEN_PROMISE_PATTERNS: Array<{ pattern: RegExp; why: string }> = [
  { pattern: /\bguarantee[ds]?\b/i, why: 'A guarantee is a promise we cannot keep.' },
  { pattern: /\b100%\s*(?:sure|chance|success|guaranteed)?\b/i, why: 'Certainty cannot be promised.' },
  { pattern: /\byou will (?:be )?(?:get|receive|pass|be approved|be accepted|be selected)\b/i, why: 'An outcome is not ours to promise.' },
  { pattern: /\bapnar? visa (?:hobe|hobey|guarantee)\b/i, why: 'Visa outcomes are not ours to promise.' },
  { pattern: /\b(?:visa|admission|scholarship|score|band)\b[^.]{0,40}\b(?:confirmed|assured|certain)\b/i, why: 'A decision we do not make is not confirmed by us.' },
  // Money in either order: "5000 BDT" is as much a price as "BDT 5000", and a
  // student will write it the Bangladeshi way round.
  { pattern: /(?:\d[\d,.]*\s*(?:tk|taka|bdt|usd|dollars?|৳)\b)|(?:\b(?:tk|taka|bdt|usd|dollars?)\b\s?\d)|(?:[৳$]\s?\d)/i, why: 'Fees change; a stale number becomes a dispute.' },
  { pattern: /\b(?:band|score)\s?\d(?:\.\d)?\b/i, why: 'The assistant never states a score.' },
];

export function containsForbiddenPromise(text: string): { forbidden: boolean; why: string | null; matched: string | null } {
  for (const entry of FORBIDDEN_PROMISE_PATTERNS) {
    const match = entry.pattern.exec(text ?? '');
    if (match) return { forbidden: true, why: entry.why, matched: match[0] };
  }
  return { forbidden: false, why: null, matched: null };
}

/* ─────────────────────────────── the planner ──────────────────────────────── */

export type AssistantAction = 'REPLY' | 'HANDOFF' | 'SILENT';

export type AssistantPlan = {
  action: AssistantAction;
  /** Machine-readable reason, safe to log. */
  code:
    | 'OUTSIDE_HOURS_ANSWERED'
    | 'HUMAN_AVAILABLE'
    | 'HUMAN_ONLY_TOPIC'
    | 'NOTHING_GROUNDED_TO_SAY'
    | 'CONVERSATION_CEILING_REACHED'
    | 'SERVICE_WITHDRAWN'
    | 'DISABLED'
    | 'FORBIDDEN_PROMISE_BLOCKED'
    | 'EMPTY_MESSAGE';
  reason: string;
  /** The reply to send, when action is REPLY. Always carries the disclosure. */
  draft: string | null;
  /** Where the student can check the claim. */
  sources: string[];
  topics: HumanOnlyTopic[];
  /** True when a human must look at this conversation before anything else goes out. */
  requiresHumanReview: boolean;
};

export type AssistantInput = {
  /** The student's message. */
  body: string;
  now: Date;
  /** Replies the assistant has already sent in this conversation. */
  repliesThisConversation: number;
  /** False when the office is open and staff are answering. */
  outsideOfficeHours: boolean;
  /** Set when the student has declined service messages. */
  serviceWithdrawn?: boolean;
  /** Kill switch, from ASSISTANT_ENABLED. */
  enabled?: boolean;
  businessHours?: { startHour: number; endHour: number; utcOffsetMinutes: number };
};

/** Local hour in the configured offset — the assistant works in Dhaka time. */
export function localHour(now: Date, utcOffsetMinutes = DEFAULT_BUSINESS_HOURS.utcOffsetMinutes): number {
  return new Date(now.getTime() + utcOffsetMinutes * 60 * 1000).getUTCHours();
}

export function isOutsideOfficeHours(now: Date, businessHours = DEFAULT_BUSINESS_HOURS): boolean {
  const hour = localHour(now, businessHours.utcOffsetMinutes);
  return hour < businessHours.startHour || hour >= businessHours.endHour;
}

function handoff(code: AssistantPlan['code'], reason: string, topics: HumanOnlyTopic[] = []): AssistantPlan {
  return { action: 'HANDOFF', code, reason, draft: null, sources: [], topics, requiresHumanReview: true };
}

function silent(code: AssistantPlan['code'], reason: string, topics: HumanOnlyTopic[] = []): AssistantPlan {
  return { action: 'SILENT', code, reason, draft: null, sources: [], topics, requiresHumanReview: topics.length > 0 };
}

/**
 * Decide what the assistant should do with one inbound message.
 *
 * Order matters: the kill switch first, then the reasons NOT to speak, and only
 * then the answer. Every early return is a case where a human or silence is
 * better than an automatic reply.
 */
export function planAssistantReply(input: AssistantInput): AssistantPlan {
  const body = (input.body ?? '').trim();

  if (input.enabled === false) {
    return silent('DISABLED', 'The after-hours assistant is not enabled in this deployment.');
  }
  if (!body) {
    return silent('EMPTY_MESSAGE', 'There is nothing to answer.');
  }

  const { topics, matched } = detectHumanOnlyTopics(body);

  // A student who declined service messages is not messaged, automatic or not.
  // The assistant has no special standing to override a withdrawal.
  if (input.serviceWithdrawn) {
    return silent('SERVICE_WITHDRAWN', 'The student has declined service messages; the assistant does not contact them either.', topics);
  }

  if (topics.length > 0) {
    return handoff(
      'HUMAN_ONLY_TOPIC',
      `This message asks about ${topics.join(', ').toLowerCase().replace(/_/g, ' ')} ("${matched[0]}"), which the assistant never answers.`,
      topics,
    );
  }

  if (input.repliesThisConversation >= ASSISTANT_MAX_REPLIES_PER_CONVERSATION) {
    return handoff(
      'CONVERSATION_CEILING_REACHED',
      `The assistant has already sent ${input.repliesThisConversation} replies in this conversation; the next message must be from a person.`,
      topics,
    );
  }

  // Inside office hours a person is here: saying nothing is the correct answer.
  if (!input.outsideOfficeHours) {
    return silent('HUMAN_AVAILABLE', 'The office is open, so a person answers this instead of the assistant.');
  }

  const canned = matchCannedAnswer(body);
  if (!canned) {
    // No grounded answer. Inventing one is the failure mode this whole module
    // exists to prevent, so the message waits for a human instead.
    return handoff('NOTHING_GROUNDED_TO_SAY', 'The assistant has no reviewed answer for this question, so it stays quiet and a human replies.');
  }

  const draft = `${canned.answer}\n\n${ASSISTANT_DISCLOSURE}`;
  const guard = containsForbiddenPromise(draft);
  if (guard.forbidden) {
    // Should be unreachable: the canned answers are checked by a test. If it ever
    // fires, silence is better than a promise.
    return handoff('FORBIDDEN_PROMISE_BLOCKED', `The drafted reply was blocked by the promise guard: ${guard.why}`, topics);
  }

  return {
    action: 'REPLY',
    code: 'OUTSIDE_HOURS_ANSWERED',
    reason: `Answered from the reviewed answer "${canned.id}".`,
    draft,
    sources: [...canned.sources],
    topics: [],
    requiresHumanReview: false,
  };
}
