/**
 * src/lib/agents/ExamConductorAgent.ts
 *
 * AGENT-CONDUCT-01 — persists objective listening/reading practice indicators
 * and the platform's own evaluation of the subjective sections.
 *
 * The evaluation agent (src/lib/ai/evaluation/ai-evaluation.ts) assesses the
 * writing response and the speaking transcript against the rubric for the
 * exam the attempt belongs to. It is the platform's own agent, and it runs
 * for every exam type the platform offers.
 *
 * The evaluation is qualitative. It never produces a band, a grade or a
 * score, because no rubric in this repository has been calibrated against
 * human raters. The numeric practice indicator still comes only from the
 * deterministic objective grader.
 *
 * Writing feedback is exposed without heuristic/LLM band numbers. Speaking is
 * evaluated from the transcript only: an attempt must include the transcript
 * before any speaking feedback is produced, and nothing acoustic is inferred.
 */

import { db } from '@/lib/db';
import { evaluateWriting, type WritingEvaluation } from './WritingEvaluationAgent';
import { calculatePracticeIndicators } from '@/lib/exam/indicators';
import {
  evaluateSpeakingWithAi,
  evaluateWritingWithAi,
  type AiEvaluation,
} from '@/lib/ai/evaluation/ai-evaluation';
import { hasSpeakingRubric, hasWritingRubric } from '@/lib/ai/evaluation/rubrics';

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
  /** The platform's own evaluation of the subjective sections. */
  evaluations: AiEvaluation[];
  disclosureText: string;
};

const PRACTICE_DISCLAIMER =
  'Listening and reading values are generic practice indicators calculated from answer accuracy, not official exam scores or publisher-equivalent results. ' +
  'Writing and speaking feedback is qualitative practice feedback from the platform\'s own evaluation agent; it carries no band, grade or score and has not been validated against human ratings. ' +
  'Speaking feedback is based on the transcript only, so pronunciation and spoken fluency are not inferred from it.';

const EVALUATION_DISCLOSURE =
  'The subjective sections were assessed by the platform\'s evaluation agent against the rubric for this exam. ' +
  'The result is qualitative practice feedback: it is not a band, a grade or a score, and it is not calibrated against human raters.';

/**
 * Persist one evaluation, replacing any earlier evaluation of the same
 * section for this attempt. The stored payload is the full evaluation
 * document, so the result can be shown again without re-running a model.
 */
async function persistEvaluation(attemptId: string, evaluation: AiEvaluation): Promise<void> {
  const payload = JSON.stringify(evaluation);
  const data = {
    examTypeCode: evaluation.examCode,
    taskType: evaluation.taskType,
    providerUsed: evaluation.providerUsed,
    fallbackUsed: evaluation.fallbackUsed,
    payload,
  };
  try {
    await db.attemptEvaluation.upsert({
      where: { attemptId_section: { attemptId, section: evaluation.section } },
      create: { attemptId, section: evaluation.section, ...data },
      update: data,
    });
  } catch (error) {
    // A storage failure must never lose the attempt: the feedback is still
    // returned to the student in the response, and the log records it.
    console.error(
      '[ExamConductor] could not persist the evaluation:',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}

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
  const speakingValue = answers.speaking ?? answers.transcript;
  const speakingText = typeof speakingValue === 'string' ? speakingValue : '';
  const writingPrompt = typeof answers.writingPrompt === 'string' ? answers.writingPrompt : '';
  const speakingPrompt = typeof answers.speakingPrompt === 'string' ? answers.speakingPrompt : '';
  const examCode = attempt.practiceSet.examType.code;
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

  // ─── The platform's own evaluation of the subjective sections ───────────
  //
  // The evaluation agent assesses the writing response and the speaking
  // transcript against the rubric for THIS exam. It never produces a band, a
  // grade or a score; the result is qualitative feedback, and it records
  // whether a model or the local rule engine produced it.
  const evaluations: AiEvaluation[] = [];

  if (writingText.trim().length > 0 && hasWritingRubric(examCode)) {
    const evaluation = await evaluateWritingWithAi({
      examCode,
      taskPrompt: writingPrompt,
      text: writingText,
    });
    evaluations.push(evaluation);
    await persistEvaluation(attemptId, evaluation);
  }

  if (speakingText.trim().length > 0 && hasSpeakingRubric(examCode)) {
    const evaluation = await evaluateSpeakingWithAi({
      examCode,
      taskPrompt: speakingPrompt,
      text: speakingText,
    });
    evaluations.push(evaluation);
    await persistEvaluation(attemptId, evaluation);
  }

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
      evaluations,
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
    evaluations,
    disclosureText: evaluations.length > 0 ? `${PRACTICE_DISCLAIMER} ${EVALUATION_DISCLOSURE}` : PRACTICE_DISCLAIMER,
  };
}
