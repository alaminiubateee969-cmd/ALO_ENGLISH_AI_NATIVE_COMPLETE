/**
 * Text-only writing feedback used after a practice attempt.
 *
 * This local rule engine offers generic revision suggestions. It does not
 * implement or claim any publisher-specific rubric, calibrated band, or
 * human-validated writing score. Student submissions are not sent to an
 * external model by this module.
 */
export type WritingEvaluation = {
  wordCount: number;
  improvementPlan: string[];
  providerUsed: 'local_rule_engine';
  disclaimer: string;
};

const DISCOURSE_MARKERS = [
  'however', 'moreover', 'furthermore', 'therefore', 'in addition',
  'on the other hand', 'as a result', 'consequently', 'for instance',
  'for example', 'in conclusion', 'to summarise', 'to summarize',
  'firstly', 'secondly', 'finally', 'nevertheless', 'thus',
];

const ACADEMIC_TOKENS = [
  'analyse', 'analysis', 'demonstrate', 'significant', 'approach',
  'concept', 'context', 'evidence', 'factor', 'framework',
  'impact', 'indicate', 'perspective', 'principle', 'process',
  'research', 'result', 'structure', 'theory', 'trend',
];

const DISCLAIMER =
  'Generic text-only suggestions from local heuristics. Not an exam score, not a publisher-specific rubric, and not validated against human ratings.';

export function evaluateWriting(text: string): WritingEvaluation {
  const wordCount = countWords(text);
  const improvementPlan = buildImprovementPlan(text, wordCount);

  return {
    wordCount,
    improvementPlan,
    providerUsed: 'local_rule_engine',
    disclaimer: DISCLAIMER,
  };
}

function countWords(text: string): number {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean === '' ? 0 : clean.split(' ').length;
}

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z\-'']+/).filter((token) => token.length > 1);
}

function buildImprovementPlan(text: string, wordCount: number): string[] {
  if (wordCount === 0) return ['Write a response before requesting text-only feedback.'];

  const plan: string[] = [];
  const paragraphs = splitParagraphs(text);
  const sentences = splitSentences(text);
  const words = tokenize(text);
  const uniqueRatio = words.length > 0 ? new Set(words).size / words.length : 0;
  const lower = ` ${text.toLowerCase()} `;
  const markerHits = DISCOURSE_MARKERS.filter((marker) =>
    lower.includes(` ${marker} `) || lower.includes(` ${marker},`) || lower.includes(` ${marker}.`),
  ).length;
  const longSentences = sentences.filter((sentence) => countWords(sentence) > 40).length;
  const academicHits = words.filter((word) => ACADEMIC_TOKENS.includes(word)).length;

  if (wordCount < 80) {
    plan.push('Check the task prompt for its required length; no task-specific minimum was supplied for this feedback.');
  }
  if (paragraphs.length < 2 && wordCount >= 80) {
    plan.push('Consider separating the response into paragraphs so each main idea is easier to follow.');
  }
  if (markerHits === 0 && wordCount >= 80) {
    plan.push('Review how ideas connect; use linking phrases only where they express the intended relationship.');
  }
  if (words.length >= 10 && uniqueRatio < 0.5) {
    plan.push('Review repeated wording and consider precise alternatives where they preserve your meaning.');
  }
  if (academicHits === 0 && wordCount >= 100) {
    plan.push('Use specific vocabulary that accurately expresses your ideas rather than adding formal words for their own sake.');
  }
  if (longSentences > 0) {
    plan.push('Review very long sentences for clear boundaries and readable structure.');
  }
  if (plan.length === 0) {
    plan.push('Review the response against the exact task prompt and check that each paragraph supports your main point.');
  }

  return plan.slice(0, 5);
}
