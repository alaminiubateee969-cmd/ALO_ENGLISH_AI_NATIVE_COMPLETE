/**
 * src/lib/agents/ExamConductorAgent.ts
 *
 * AGENT-CONDUCT-01 — persists objective listening/reading practice indicators
 * and optional non-scored writing guidance for a submitted attempt.
 *
 * Writing feedback is exposed without heuristic/LLM band numbers. Speaking is
 * not scored here: an attempt must include a securely associated recording and
 * a validated acoustic evaluation before any speaking score can be reported.
 */

import { db } from '@/lib/db';
import { evaluateWriting, type WritingEvaluation } from './WritingEvaluationAgent';
import { calculatePracticeIndicators } from '@/lib/exam/indicators';

type WritingFeedback = Pick<
  WritingEvaluation,
  'wordCount' | 'improvementPlan' | 'providerUsed' | 'disclaimer'
>;

export type ExamResult = {
  attemptId: string;
  status: 'SUBMITTED' | 'SCORED';
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: null;
  speaking: null;
  /** Null: evaluator confidence is not calibrated against human ratings. */
  confidence: null;
  confidenceLevel: 'not_calibrated';
  providerUsed: 'deterministic_objective' | 'none';
  fallbackUsed: false;
  reviewRecommendation: 'unavailable';
  writingFeedback?: WritingFeedback;
  disclosureText: string;
};

const PRACTICE_DISCLAIMER =
  'Listening and reading values are generic practice indicators calculated from answer accuracy, not official exam scores or publisher-equivalent results. ' +
  'Writing feedback is non-scored and has not been validated against human ratings. ' +
  'Speaking is not scored: this attempt does not provide a securely linked recording or validated acoustic assessment, so pronunciation and spoken fluency are not inferred from transcript text.';

/**
 * Conduct the supported, evidence-based part of the exam submission pipeline.
 * Writing feedback is qualitative only; speaking remains unscored.
 */
export async function conductExam(
  attemptId: string,
  answers: Record<string, unknown> = {},
  /**
   * Set when the caller has already atomically claimed the attempt with an
   * `updateMany` guard (see /api/attempts/submit). The status guard below is
   * then skipped so the claim is not mistaken for a double submission.
   */
  opts: { alreadyClaimed?: boolean } = {}
): Promise<ExamResult> {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      practiceSet: {
        include: { examType: true },
      },
    },
  });

  if (!attempt) throw new Error('Attempt not found');
  if (!opts.alreadyClaimed && (attempt.status === 'SUBMITTED' || attempt.status === 'SCORED')) {
    throw new Error('Attempt already submitted');
  }

  const writingValue = answers.writing ?? answers.essay;
  const writingText = typeof writingValue === 'string' ? writingValue : '';
  const readingCorrect = typeof answers.readingCorrect === 'number' ? answers.readingCorrect : 0;
  const readingTotal = typeof answers.readingTotal === 'number' ? Math.max(0, answers.readingTotal) : 0;
  const listeningCorrect = typeof answers.listeningCorrect === 'number' ? answers.listeningCorrect : 0;
  const listeningTotal = typeof answers.listeningTotal === 'number' ? Math.max(0, answers.listeningTotal) : 0;

  // The writing agent may provide useful suggestions, but its heuristic/model
  // numbers are intentionally not persisted, returned, or included in overall.
  const writingEval = writingText.length > 20 ? await evaluateWriting(writingText) : null;
  const writingFeedback: WritingFeedback | undefined = writingEval
    ? {
        wordCount: writingEval.wordCount,
        improvementPlan: writingEval.improvementPlan,
        providerUsed: writingEval.providerUsed,
        disclaimer: writingEval.disclaimer,
      }
    : undefined;

  const indicators = calculatePracticeIndicators({
    listeningCorrect,
    listeningTotal,
    readingCorrect,
    readingTotal,
  });
  const { overall, listening, reading } = indicators;
  const providerUsed: ExamResult['providerUsed'] = overall === null
    ? 'none'
    : 'deterministic_objective';

  if (overall === null) {
    // Keep the submitted attempt, but do not create a fabricated all-zero Score
    // row when this exam has no objective section supported by the scorer.
    if (!opts.alreadyClaimed) {
      await db.attempt.update({
        where: { id: attemptId },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
    }
    return {
      attemptId,
      status: 'SUBMITTED',
      overall: null,
      listening,
      reading,
      writing: null,
      speaking: null,
      confidence: null,
      confidenceLevel: 'not_calibrated',
      providerUsed,
      fallbackUsed: false,
      reviewRecommendation: 'unavailable',
      ...(writingFeedback ? { writingFeedback } : {}),
      disclosureText: `${PRACTICE_DISCLAIMER} No numeric result was created because this attempt had no listening or reading answers supported by the current scorer.`,
    };
  }

  // Persist only objective section values. Subjective sections remain null until
  // a task-specific rubric and evidence are available and independently tested.
  const scoreData = {
    attemptId,
    userId: attempt.userId,
    overall,
    listening,
    reading,
    writing: null,
    speaking: null,
    providerUsed,
    fallbackUsed: false,
  };
  if (opts.alreadyClaimed) {
    await db.score.create({ data: scoreData });
  } else {
    await db.$transaction([
      db.attempt.update({
        where: { id: attemptId },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      }),
      db.score.create({ data: scoreData }),
    ]);
  }

  return {
    attemptId,
    status: 'SCORED',
    overall,
    listening,
    reading,
    writing: null,
    speaking: null,
    confidence: null,
    confidenceLevel: 'not_calibrated',
    providerUsed,
    fallbackUsed: false,
    reviewRecommendation: 'unavailable',
    ...(writingFeedback ? { writingFeedback } : {}),
    disclosureText: PRACTICE_DISCLAIMER,
  };
}
