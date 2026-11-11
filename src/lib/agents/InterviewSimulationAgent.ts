/**
 * Generic interview-practice prompts and topic coverage notes.
 *
 * This module does not assess visa/admissions eligibility, predict risk or
 * outcomes, provide legal advice, or return a numeric/confidence score.
 * Responses stay local to the application; they are not sent to an external
 * model by this module.
 */
export type InterviewEvaluation = {
  interviewType: string;
  questionsAsked: number;
  topicsMentioned: string[];
  feedback: string;
  improvementTips: string[];
  followUpSuggestions: string[];
  providerUsed: 'local_topic_rules';
  disclaimer: string;
};

type InterviewResponse = { question: string; answer: string };

const DISCLAIMER =
  'Practice prompts only. This is not legal, immigration, admissions, or career advice; it does not assess eligibility, risk, or likely outcomes.';

const TOPIC_KEYWORDS: Record<string, string[]> = {
  motivation: ['why', 'goal', 'interest', 'reason', 'motivat'],
  funding: ['tuition', 'fee', 'scholarship', 'loan', 'sponsor', 'bank', 'saving', 'fund', 'budget'],
  course: ['module', 'semester', 'curriculum', 'subject', 'program', 'course', 'research', 'thesis'],
  institution: ['university', 'college', 'institution', 'campus', 'faculty'],
  career: ['career', 'job', 'work', 'profession', 'industry', 'company', 'role', 'position'],
  planning: ['plan', 'timeline', 'prepare', 'next step', 'future'],
};

export function evaluateInterview(
  responses: InterviewResponse[],
  interviewType: string = 'general',
): InterviewEvaluation {
  const validResponses = Array.isArray(responses)
    ? responses.filter((response) =>
        response && typeof response.question === 'string' && typeof response.answer === 'string',
      )
    : [];
  const text = validResponses.map((response) => `${response.question} ${response.answer}`).join(' ').toLowerCase();
  const topicsMentioned = Object.entries(TOPIC_KEYWORDS)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([topic]) => topic);
  const improvementTips = buildTips(topicsMentioned, validResponses.length, interviewType);

  return {
    interviewType: normalizeType(interviewType),
    questionsAsked: validResponses.length,
    topicsMentioned,
    feedback: validResponses.length > 0
      ? 'Use these topic notes to reflect on your preparation. No eligibility, risk, or outcome judgment is made.'
      : 'No interview responses were provided, so no topic notes were generated.',
    improvementTips,
    followUpSuggestions: buildFollowUps(interviewType, topicsMentioned),
    providerUsed: 'local_topic_rules',
    disclaimer: DISCLAIMER,
  };
}

function normalizeType(value: string): string {
  const normalized = value.trim().toLowerCase();
  return ['visa', 'course', 'career'].includes(normalized) ? normalized : 'general';
}

function buildTips(topics: string[], questionsAsked: number, type: string): string[] {
  if (questionsAsked === 0) return ['Add practice questions and your own responses to receive topic-coverage prompts.'];

  const expected = normalizeType(type) === 'visa'
    ? ['motivation', 'funding', 'planning']
    : normalizeType(type) === 'course'
      ? ['motivation', 'course', 'institution', 'planning']
      : normalizeType(type) === 'career'
        ? ['motivation', 'career', 'planning']
        : ['motivation', 'planning'];
  const missing = expected.filter((topic) => !topics.includes(topic));
  const tips = missing.map((topic) => `Consider whether your preparation covers ${topic}; answer truthfully and verify factual requirements with current official sources.`);
  tips.push('Practise explaining your ideas clearly and support factual statements with documents or sources you can verify.');
  return tips.slice(0, 4);
}

function buildFollowUps(type: string, topics: string[]): string[] {
  const normalized = normalizeType(type);
  const questions: Record<string, string[]> = {
    visa: [
      'Which current official source did you use to check the applicable requirements?',
      'What documents can you use to support the factual details in your answer?',
    ],
    course: [
      'Which course topics or modules interest you, and where can you verify that information?',
      'How does this course relate to your learning goals?',
    ],
    career: [
      'What skills do you hope to develop, and how will you practise them?',
      'What sources support your understanding of the role or industry?',
    ],
    general: [
      'What example can help explain your answer?',
      'Which detail would you like to clarify or support with a source?',
    ],
  };
  const available = questions[normalized] ?? questions.general;
  return topics.length > 0 ? available.slice(0, 2) : available.slice(0, 1);
}
