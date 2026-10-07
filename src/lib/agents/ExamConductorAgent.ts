/**
 * src/lib/agents/ExamConductorAgent.ts
 *
 * AGENT-CONDUCT-01 — Orchestrates the full exam lifecycle:
 *   start → answer → submit → evaluate → report
 *
 * This agent coordinates the Writing, Speaking, and Interview evaluation
 * agents, aggregates scores, and produces the final Smart Score Report.
 *
 * No-Human Practice Exam Mode: all 32 CBT exams run start→report without
 * human staff. Confidence-based escalation is OPTIONAL (never blocks).
 */

import { db } from '@/lib/db';
import { evaluateWriting, WritingEvaluation } from './WritingEvaluationAgent';
import { evaluateSpeaking, SpeakingEvaluation } from './SpeakingEvaluationAgent';
import { evaluateInterview, InterviewEvaluation } from './InterviewSimulationAgent';

export type ExamResult = {
  attemptId: string;
  status: 'SUBMITTED' | 'SCORED';
  overall: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  providerUsed: string;
  fallbackUsed: boolean;
  reviewRecommendation: 'none' | 'optional' | 'recommended';
  writingEvaluation?: WritingEvaluation;
  speakingEvaluation?: SpeakingEvaluation;
  interviewEvaluation?: InterviewEvaluation;
  disclosureText: string;
};

const PRACTICE_DISCLAIMER =
  'This report was generated automatically by the ALO Evaluation System. ' +
  'It is a practice indicator, not an official exam score. ' +
  'Not affiliated with any official test publisher.';

/**
 * Conduct the full exam evaluation pipeline.
 *
 * @param attemptId  The attempt to evaluate.
 * @param answers    The student's answers (writing text, speaking transcript, etc.).
 * @returns          The complete exam result with all evaluations.
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
  // Fetch the attempt + practice set.
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

  // Extract answer components.
  const writingText = (answers.writing as string) || (answers.essay as string) || '';
  const speakingTranscript = (answers.speaking as string) || (answers.transcript as string) || '';
  const interviewResponses = (answers.interviewResponses as { question: string; answer: string }[]) || [];
  const readingCorrect = (answers.readingCorrect as number) || 0;
  const readingTotal = (answers.readingTotal as number) || 40;
  const listeningCorrect = (answers.listeningCorrect as number) || 0;
  const listeningTotal = (answers.listeningTotal as number) || 40;

  // Run evaluation agents in parallel.
  const [writingEval, speakingEval, interviewEval] = await Promise.all([
    writingText.length > 20 ? evaluateWriting(writingText) : null,
    speakingTranscript.length > 20 ? evaluateSpeaking(speakingTranscript) : null,
    interviewResponses.length > 0 ? evaluateInterview(interviewResponses) : null,
  ]);

  // Calculate section scores (0-9 band).
  const writing = writingEval?.estimatedBand ?? scoreFromCorrect(0, 1); // default if no writing
  const speaking = speakingEval?.estimatedBand ?? scoreFromCorrect(0, 1);
  const reading = scoreFromCorrect(readingCorrect, readingTotal);
  const listening = scoreFromCorrect(listeningCorrect, listeningTotal);

  // Aggregate.
  const overall = round1((listening + reading + writing + speaking) / 4);

  // Confidence: average of agent confidences, or computed from sections.
  const confidences: number[] = [];
  if (writingEval) confidences.push(writingEval.confidenceScore);
  if (speakingEval) confidences.push(speakingEval.confidenceScore);
  if (interviewEval) confidences.push(interviewEval.confidenceScore);
  const confidence = confidences.length > 0
    ? round2(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : round2((listening + reading + writing + speaking) / 36); // fallback

  const confidenceLevel = confidenceLevelFromScore(confidence);

  // Provider: prefer the highest-tier provider used.
  const providers = [
    writingEval?.providerUsed,
    speakingEval?.providerUsed,
    interviewEval?.providerUsed,
  ].filter(Boolean);
  const providerUsed = providers.includes('groq')
    ? 'groq'
    : providers.includes('local_rule_engine')
      ? 'local_rule_engine'
      : 'local_rule_engine';
  const fallbackUsed = [writingEval?.fallbackUsed, speakingEval?.fallbackUsed, interviewEval?.fallbackUsed].some(Boolean);

  // Review recommendation (never blocks the report).
  const reviewRecommendation: 'none' | 'optional' | 'recommended' =
    confidenceLevel === 'low' ? 'recommended' :
    confidenceLevel === 'medium' ? 'optional' : 'none';

  // Mark attempt as submitted + create score.
  const [, score] = await db.$transaction([
    db.attempt.update({
      where: { id: attemptId },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    }),
    db.score.create({
      data: {
        attemptId,
        userId: attempt.userId,
        overall,
        listening,
        reading,
        writing,
        speaking,
        confidence,
        providerUsed,
        fallbackUsed,
      },
    }),
  ]);

  const result: ExamResult = {
    attemptId,
    status: 'SCORED',
    overall,
    listening,
    reading,
    writing,
    speaking,
    confidence,
    confidenceLevel,
    providerUsed,
    fallbackUsed,
    reviewRecommendation,
    writingEvaluation: writingEval ?? undefined,
    speakingEvaluation: speakingEval ?? undefined,
    interviewEvaluation: interviewEval ?? undefined,
    disclosureText: PRACTICE_DISCLAIMER,
  };

  return result;
}

// ─── Helpers ───────────────────────────────────────────────────────────

/** Convert a correct/total ratio to a 0-9 band score. */
function scoreFromCorrect(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  return round1(ratio * 9.0);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function confidenceLevelFromScore(score: number): 'high' | 'medium' | 'low' {
  const low = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.45');
  const med = parseFloat(process.env.MEDIUM_CONFIDENCE_THRESHOLD || '0.70');
  if (score >= med) return 'high';
  if (score >= low) return 'medium';
  return 'low';
}
