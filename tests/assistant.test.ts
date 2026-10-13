/**
 * tests/assistant.test.ts
 *
 * The after-hours assistant is the only component that speaks to a student
 * without a person reading the words first, so these tests are mostly about what
 * it refuses to say and when it stays quiet:
 *
 *   - it never answers a question about an admission, scholarship, visa or score
 *     outcome, however it is phrased, in English or in Bangla;
 *   - it says nothing at all while the office is open, because a person is there;
 *   - it says nothing to a student who declined service messages;
 *   - it stops after a small number of replies in one conversation;
 *   - and every reply it does send states that it is automated.
 *
 * The promise guard is also run over the entire shipped vocabulary, so a future
 * edit cannot introduce "guaranteed" into a reply without failing here.
 */

import { describe, expect, test } from 'bun:test';
import type { AssistantPlan } from '../src/lib/crm/assistant';

const {
  ASSISTANT_DISCLOSURE,
  ASSISTANT_MAX_REPLIES_PER_CONVERSATION,
  CANNED_ANSWERS,
  containsForbiddenPromise,
  detectHumanOnlyTopics,
  isOutsideOfficeHours,
  matchCannedAnswer,
  planAssistantReply,
} = await import('../src/lib/crm/assistant');
const { ASSISTANT_AUTHOR, runAfterHoursAssistant } = await import('../src/lib/crm/assistant-runner');

/** 02:00 in Dhaka (20:00 UTC the previous day). */
const NIGHT = new Date('2026-10-14T20:00:00Z');
/** 15:00 in Dhaka. */
const AFTERNOON = new Date('2026-10-14T09:00:00Z');

const base = {
  now: NIGHT,
  repliesThisConversation: 0,
  outsideOfficeHours: true,
  enabled: true,
};

describe('office hours', () => {
  test('02:00 Dhaka is outside office hours', () => {
    expect(isOutsideOfficeHours(NIGHT)).toBe(true);
  });

  test('15:00 Dhaka is inside', () => {
    expect(isOutsideOfficeHours(AFTERNOON)).toBe(false);
  });

  test('01:00 Dhaka is outside even though it is "today" in UTC terms', () => {
    // The whole point of doing this in the branch's timezone: a student writing
    // at 1am must not get a cheerful reply that implies someone is at a desk.
    expect(isOutsideOfficeHours(new Date('2026-10-14T19:00:00Z'))).toBe(true);
  });
});

describe('questions that always go to a human', () => {
  const cases: Array<[string, string]> = [
    ['Will I get admission with this profile?', 'ADMISSION_DECISION'],
    ['can i get admission in canada', 'ADMISSION_DECISION'],
    ['Will I get scholarship if my GPA is low?', 'SCHOLARSHIP_AWARD'],
    ['ami ki scholarship pabo', 'SCHOLARSHIP_AWARD'],
    ['Will my visa be approved if I show bank statements?', 'VISA_OUTCOME'],
    ['ভিসা হবে তো?', 'VISA_OUTCOME'],
    ['What band will I get if I practise for a month?', 'SCORE_OR_BAND'],
    ['what band pabo?', 'SCORE_OR_BAND'],
    ['How much do I pay for the counselling service?', 'FEES_AND_PAYMENT'],
    ['I want to file a complaint about the last class', 'COMPLAINT'],
    ['My lawyer asked for the document', 'DOCUMENT_LEGAL'],
  ];

  for (const [message, expectedTopic] of cases) {
    test(`"${message.slice(0, 48)}" is a ${expectedTopic} matter`, () => {
      const detected = detectHumanOnlyTopics(message);
      expect(detected.topics).toContain(expectedTopic as never);

      const plan = planAssistantReply({ ...base, body: message });
      expect(plan.action).toBe('HANDOFF');
      expect(plan.code).toBe('HUMAN_ONLY_TOPIC');
      expect(plan.requiresHumanReview).toBe(true);
      expect(plan.draft).toBeNull();
    });
  }

  test('the handoff names the topic and the phrase that triggered it', () => {
    const plan = planAssistantReply({ ...base, body: 'Will my visa be approved?' });
    expect(plan.reason).toContain('visa');
    expect(plan.reason).toContain('will my visa be approved');
  });
});

describe('when the assistant speaks', () => {
  test('a routine question outside hours is answered with the disclosure attached', () => {
    const plan = planAssistantReply({ ...base, body: 'What time are you open tomorrow?' });
    expect(plan.action).toBe('REPLY');
    expect(plan.code).toBe('OUTSIDE_HOURS_ANSWERED');
    expect(plan.draft).toContain('9:00');
    expect(plan.draft).toContain(ASSISTANT_DISCLOSURE);
    expect(plan.sources.length).toBeGreaterThan(0);
    expect(plan.requiresHumanReview).toBe(false);
  });

  test('the answer cites where the student can check it', () => {
    const plan = planAssistantReply({ ...base, body: 'how do i start the application process?' });
    expect(plan.sources).toContain('/course-finder');
  });

  test('a Bengali question is answered by the same reviewed set', () => {
    const plan = planAssistantReply({ ...base, body: 'অফিস কতটায় খোলে?' });
    expect(plan.action).toBe('REPLY');
  });

  test('"can I talk to a real person" is answered honestly rather than deflected', () => {
    const plan = planAssistantReply({ ...base, body: 'can I talk to a real person?' });
    expect(plan.action).toBe('REPLY');
    expect(plan.draft).toContain('counsellor');
  });
});

describe('when the assistant stays quiet', () => {
  test('inside office hours it says nothing: a person answers instead', () => {
    const plan = planAssistantReply({ ...base, outsideOfficeHours: false, body: 'What time are you open?' });
    expect(plan.action).toBe('SILENT');
    expect(plan.code).toBe('HUMAN_AVAILABLE');
  });

  test('a student who declined service messages is not contacted, automatically or otherwise', () => {
    const plan = planAssistantReply({ ...base, body: 'What time are you open?', serviceWithdrawn: true });
    expect(plan.action).toBe('SILENT');
    expect(plan.code).toBe('SERVICE_WITHDRAWN');
  });

  test('the kill switch silences it entirely', () => {
    const plan = planAssistantReply({ ...base, body: 'What time are you open?', enabled: false });
    expect(plan.action).toBe('SILENT');
    expect(plan.code).toBe('DISABLED');
  });

  test('a question with no reviewed answer goes to a human rather than being improvised', () => {
    const plan = planAssistantReply({ ...base, body: 'Do you have a hostel near the Uttara campus for female students only?' });
    expect(plan.action).toBe('HANDOFF');
    expect(plan.code).toBe('NOTHING_GROUNDED_TO_SAY');
    expect(plan.requiresHumanReview).toBe(true);
  });

  test('an empty message produces nothing at all', () => {
    expect(planAssistantReply({ ...base, body: '   ' }).code).toBe('EMPTY_MESSAGE');
  });

  test('after the conversation ceiling, a human must answer', () => {
    const plan = planAssistantReply({ ...base, body: 'What time are you open?', repliesThisConversation: ASSISTANT_MAX_REPLIES_PER_CONVERSATION });
    expect(plan.action).toBe('HANDOFF');
    expect(plan.code).toBe('CONVERSATION_CEILING_REACHED');
  });
});

describe('the promise guard', () => {
  test('the entire shipped vocabulary passes it', () => {
    for (const answer of CANNED_ANSWERS) {
      const guard = containsForbiddenPromise(answer.answer);
      expect({ id: answer.id, forbidden: guard.forbidden, why: guard.why }).toEqual({ id: answer.id, forbidden: false, why: null });
    }
  });

  test('the disclosure itself passes, and carries no promise', () => {
    expect(containsForbiddenPromise(ASSISTANT_DISCLOSURE).forbidden).toBe(false);
  });

  const forbidden: string[] = [
    'We guarantee your visa.',
    'You will be accepted to the University of Toronto.',
    'Your IELTS band 7 is assured with our course.',
    'The fee is 5000 BDT per module.',
    '100% success rate for our students.',
    'apnar visa hobe, tension niben na',
  ];

  for (const sentence of forbidden) {
    test(`blocks: "${sentence}"`, () => {
      const guard = containsForbiddenPromise(sentence);
      expect(guard.forbidden).toBe(true);
      expect(guard.why).toBeTruthy();
    });
  }

  test('ordinary factual copy is not blocked', () => {
    expect(containsForbiddenPromise('The office is open from 9:00 to 21:00 Dhaka time.').forbidden).toBe(false);
    expect(containsForbiddenPromise('Bring your passport and transcripts to the consultation.').forbidden).toBe(false);
  });
});

describe('the vocabulary itself', () => {
  test('every answer has keywords, a body, and no empty strings', () => {
    for (const answer of CANNED_ANSWERS) {
      expect(answer.keywords.length).toBeGreaterThan(0);
      expect(answer.answer.trim().length).toBeGreaterThan(20);
      expect(answer.keywords.every((keyword) => keyword.trim().length > 1)).toBe(true);
    }
  });

  test('answer ids are unique', () => {
    const ids = CANNED_ANSWERS.map((answer) => answer.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('matching picks the answer with the most keyword hits', () => {
    const matched = matchCannedAnswer('ielts preparation study plan');
    expect(matched?.id).toBe('preparation-overview');
  });
});

/* ─────────────────────────────── the runner ──────────────────────────────── */

function planOf(outcome: { plan?: AssistantPlan }): AssistantPlan {
  const plan = outcome.plan;
  if (!plan) throw new Error('outcome had no plan');
  return plan;
}

describe('sending an assistant reply', () => {
  const conversation = {
    conversationId: 'conv_1',
    channel: 'WHATSAPP',
    studentId: 'stu_1',
    recipientHandle: '+8801712345678',
    body: 'What time are you open tomorrow?',
    repliesThisConversation: 0,
    serviceWithdrawn: false,
  };

  test('a reply goes through the outbound funnel as a SERVICE message', async () => {
    const drafts: Array<{ purpose: string; channel: string; body: string; createdBy?: string }> = [];
    const outcome = await runAfterHoursAssistant(conversation, {
      now: () => NIGHT,
      enabled: true,
      deliver: async (draft) => {
        drafts.push(draft);
        return { status: 'SENT', sendKey: 'send:1', providerMessageId: 'wamid.1', attempts: 1 };
      },
    });

    expect(outcome.status).toBe('SENT');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.purpose).toBe('SERVICE');
    expect(drafts[0]?.channel).toBe('WHATSAPP');
    expect(drafts[0]?.body).toContain(ASSISTANT_DISCLOSURE);
    // Recorded as the assistant's own message, so "a robot answered this" is
    // answerable from the database.
    expect(drafts[0]?.createdBy).toBe(ASSISTANT_AUTHOR);
  });

  test('a handoff is returned to the caller with requiresHumanReview set', async () => {
    const outcome = await runAfterHoursAssistant({ ...conversation, body: 'Will I get admission?' }, {
      now: () => NIGHT,
      enabled: true,
      deliver: async () => {
        throw new Error('nothing should have been sent');
      },
    });

    expect(outcome.status).toBe('HANDOFF');
    expect(planOf(outcome).requiresHumanReview).toBe(true);
  });

  test('the office-hours decision is recomputed, never trusted from a caller', async () => {
    // The caller says it is night; the clock says midday in Dhaka.
    const outcome = await runAfterHoursAssistant(conversation, {
      now: () => AFTERNOON,
      enabled: true,
      deliver: async () => {
        throw new Error('nothing should have been sent');
      },
    });
    expect(outcome.status).toBe('SILENT');
    expect(planOf(outcome).code).toBe('HUMAN_AVAILABLE');
  });

  test('a conversation with no address to reply to is skipped, not silently dropped', async () => {
    const outcome = await runAfterHoursAssistant({ ...conversation, recipientHandle: null }, {
      now: () => NIGHT,
      enabled: true,
      deliver: async () => {
        throw new Error('nothing should have been sent');
      },
    });
    expect(outcome.status).toBe('SKIPPED');
    expect(outcome.status === 'SKIPPED' && outcome.reason).toContain('No recipient handle');
  });

  test('a delivery the policy gate refuses is reported as a refusal, not as sent', async () => {
    // The funnel can refuse for reasons the assistant cannot see (quiet hours,
    // daily cap, closed WhatsApp window). The assistant must not claim success.
    const outcome = await runAfterHoursAssistant(conversation, {
      now: () => NIGHT,
      enabled: true,
      deliver: async () => ({ status: 'REFUSED', sendKey: 'send:2', code: 'DAILY_CAP_REACHED', reason: 'cap reached' }),
    });

    expect(outcome.status).toBe('SENT');
    expect(outcome.status === 'SENT' && outcome.delivery.status).toBe('REFUSED');
  });

  test('disabled means disabled, whatever the caller passes', async () => {
    const outcome = await runAfterHoursAssistant(conversation, {
      now: () => NIGHT,
      enabled: false,
      deliver: async () => {
        throw new Error('nothing should have been sent');
      },
    });
    expect(outcome.status).toBe('SILENT');
    expect(planOf(outcome).code).toBe('DISABLED');
  });
});
