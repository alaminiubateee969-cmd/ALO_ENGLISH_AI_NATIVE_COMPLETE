/**
 * src/lib/agents/InterviewSimulationAgent.ts
 *
 * AGENT-INTERVIEW-01 — Simulates and evaluates visa/course/career interviews.
 *
 * Rule-based scoring (local_rule_engine) with optional Groq enhancement.
 * Domain scores (0–100): financial explanation, course knowledge, career plan.
 */

import { GroqClient } from './GroqClient';

export type InterviewEvaluation = {
  interviewType: string;
  questionsAsked: number;
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  financialExplanationQuality: number;
  courseKnowledgeQuality: number;
  careerPlanConsistency: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  improvementTips: string[];
  followUpSuggestions: string[];
  confidenceScore: number; // 0.00-1.00
  confidenceLevel: 'high' | 'medium' | 'low';
  providerUsed: string;
  fallbackUsed: boolean;
  disclaimer: string;
};

const PRACTICE_DISCLAIMER =
  'Practice simulation only. Not a real visa interview assessment. Not affiliated with any official immigration authority.';

export async function evaluateInterview(
  responses: { question: string; answer: string }[],
  interviewType: string = 'visa'
): Promise<InterviewEvaluation> {
  const questionsAsked = responses.length;

  let financialQuality = scoreFinancialExplanation(responses);
  let courseQuality = scoreCourseKnowledge(responses);
  let careerConsistency = scoreCareerPlanConsistency(responses);
  const confidence = scoreConfidence(responses);
  const riskLevel = riskFromScores(financialQuality, courseQuality, careerConsistency);
  const { strengths, weaknesses } = strengthsWeaknesses(responses, interviewType);
  const feedback = buildFeedback(interviewType, confidence, weaknesses);
  let improvementTips = buildImprovementTips(weaknesses);
  let followUpSuggestions = buildFollowUpSuggestions(interviewType, weaknesses);

  let providerUsed = 'local_rule_engine';
  let fallbackUsed = false;

  if (GroqClient.isConfigured()) {
    const enhanced = await enhanceWithGroq(interviewType, responses, {
      financial: financialQuality, course: courseQuality, career: careerConsistency, confidence,
    });
    if (enhanced) {
      financialQuality = clampScore(enhanced.financialExplanationQuality ?? financialQuality);
      courseQuality = clampScore(enhanced.courseKnowledgeQuality ?? courseQuality);
      careerConsistency = clampScore(enhanced.careerPlanConsistency ?? careerConsistency);
      if (Array.isArray(enhanced.followUpQuestionSuggestions)) {
        followUpSuggestions = (enhanced.followUpQuestionSuggestions as unknown[]).slice(0, 3).map(String);
      }
      if (typeof enhanced.improvementTips === 'string') improvementTips = [enhanced.improvementTips, ...improvementTips];
      providerUsed = 'groq';
    } else {
      fallbackUsed = true;
    }
  }

  const confidenceScore = computeConfidence(confidence, financialQuality, courseQuality, careerConsistency, questionsAsked);
  const confidenceLevel = confidenceLevelFromScore(confidenceScore);

  return {
    interviewType, questionsAsked, confidence, riskLevel,
    financialExplanationQuality: financialQuality,
    courseKnowledgeQuality: courseQuality,
    careerPlanConsistency: careerConsistency,
    strengths, weaknesses, feedback, improvementTips, followUpSuggestions,
    confidenceScore, confidenceLevel,
    providerUsed, fallbackUsed,
    disclaimer: PRACTICE_DISCLAIMER,
  };
}

// ─── Rule-based scoring ────────────────────────────────────────────────

function scoreFinancialExplanation(responses: { answer: string }[]): number {
  const text = responses.map(r => r.answer.toLowerCase()).join(' ');
  if (!text) return 0;
  const financialKeywords = ['tuition', 'fees', 'scholarship', 'loan', 'sponsor', 'bank', 'savings', 'funds', 'budget', 'income'];
  let hits = 0;
  for (const kw of financialKeywords) {
    if (text.includes(kw)) hits++;
  }
  const wordCount = text.split(/\s+/).length;
  const specificity = Math.min(1.0, hits / 4.0);
  const detail = Math.min(1.0, wordCount / 200.0);
  return Math.round(Math.min(100, specificity * 60 + detail * 40));
}

function scoreCourseKnowledge(responses: { answer: string }[]): number {
  const text = responses.map(r => r.answer.toLowerCase()).join(' ');
  if (!text) return 0;
  const courseKeywords = ['module', 'semester', 'curriculum', 'subject', 'program', 'university', 'college', 'faculty', 'research', 'thesis'];
  let hits = 0;
  for (const kw of courseKeywords) {
    if (text.includes(kw)) hits++;
  }
  const specificity = Math.min(1.0, hits / 4.0);
  const wordCount = text.split(/\s+/).length;
  const detail = Math.min(1.0, wordCount / 200.0);
  return Math.round(Math.min(100, specificity * 60 + detail * 40));
}

function scoreCareerPlanConsistency(responses: { answer: string }[]): number {
  const text = responses.map(r => r.answer.toLowerCase()).join(' ');
  if (!text) return 0;
  const careerKeywords = ['career', 'job', 'work', 'profession', 'industry', 'company', 'role', 'position', 'goal', 'future'];
  let hits = 0;
  for (const kw of careerKeywords) {
    if (text.includes(kw)) hits++;
  }
  const specificity = Math.min(1.0, hits / 4.0);
  const wordCount = text.split(/\s+/).length;
  const detail = Math.min(1.0, wordCount / 200.0);
  return Math.round(Math.min(100, specificity * 60 + detail * 40));
}

function scoreConfidence(responses: { answer: string }[]): number {
  const text = responses.map(r => r.answer.toLowerCase()).join(' ');
  if (!text) return 0;
  const hedging = ['maybe', 'perhaps', 'i think', 'i guess', "i'm not sure", 'sort of', 'kind of', 'probably'];
  let hedgeCount = 0;
  for (const h of hedging) {
    if (text.includes(h)) hedgeCount++;
  }
  const wordCount = text.split(/\s+/).length;
  const detail = Math.min(100, (wordCount / 300) * 100);
  return Math.round(Math.max(0, Math.min(100, detail - hedgeCount * 8)));
}

function riskFromScores(financial: number, course: number, career: number): 'low' | 'medium' | 'high' {
  const avg = (financial + course + career) / 3;
  if (avg >= 70) return 'low';
  if (avg >= 45) return 'medium';
  return 'high';
}

function strengthsWeaknesses(responses: { question: string; answer: string }[], type: string): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const totalWords = responses.reduce((sum, r) => sum + r.answer.split(/\s+/).length, 0);
  const avgLength = totalWords / Math.max(1, responses.length);

  if (avgLength >= 50) strengths.push('Detailed responses with sufficient elaboration.');
  else weaknesses.push('Responses are too brief — aim for at least 50 words per answer.');

  const financial = scoreFinancialExplanation(responses);
  if (financial >= 60) strengths.push('Clear financial preparation evidence.');
  else weaknesses.push('Financial explanation needs more specific details (tuition, sponsor, funds).');

  const course = scoreCourseKnowledge(responses);
  if (course >= 60) strengths.push('Good understanding of the chosen course.');
  else weaknesses.push('Show deeper knowledge of course modules, curriculum, and university.');

  const career = scoreCareerPlanConsistency(responses);
  if (career >= 60) strengths.push('Consistent career plan alignment.');
  else weaknesses.push('Connect your studies to a clearer career trajectory.');

  if (strengths.length === 0) strengths.push('Willingness to practice — the first step to improvement.');
  return { strengths, weaknesses };
}

function buildFeedback(type: string, confidence: number, weaknesses: string[]): string {
  const typeLabel = type === 'visa' ? 'visa interview' : type === 'course' ? 'course interview' : 'career interview';
  if (confidence >= 70) return `Strong ${typeLabel} preparation. Address the minor weaknesses below for a polished performance.`;
  if (confidence >= 45) return `Adequate ${typeLabel} preparation. Focus on the weaknesses below to strengthen your responses.`;
  return `Your ${typeLabel} preparation needs significant work. Review the weaknesses below and practice again.`;
}

function buildImprovementTips(weaknesses: string[]): string[] {
  return weaknesses.length > 0 ? weaknesses : ['Continue practising with varied interview questions.'];
}

function buildFollowUpSuggestions(type: string, weaknesses: string[]): string[] {
  const base: Record<string, string[]> = {
    visa: [
      'Can you explain your funding source in more detail?',
      'Why did you choose this specific university over others?',
      'What are your plans after completing your studies?',
    ],
    course: [
      'Which specific modules interest you most in this course?',
      'How does this course align with your previous studies?',
      'What research have you done about the faculty?',
    ],
    career: [
      'Where do you see yourself in 5 years after this course?',
      'What specific role are you targeting in your career?',
      'How will this course help you achieve your career goals?',
    ],
  };
  return base[type] || base.visa;
}

function computeConfidence(confidence: number, financial: number, course: number, career: number, questionsAsked: number): number {
  if (questionsAsked === 0) return 0.20;
  const domainAvg = (financial + course + career) / 3.0 / 100.0;
  const confScore = confidence / 100.0;
  return Math.round(Math.max(0, Math.min(1, domainAvg * 0.6 + confScore * 0.4)) * 100) / 100;
}

function confidenceLevelFromScore(score: number): 'high' | 'medium' | 'low' {
  const low = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.45');
  const med = parseFloat(process.env.MEDIUM_CONFIDENCE_THRESHOLD || '0.70');
  if (score >= med) return 'high';
  if (score >= low) return 'medium';
  return 'low';
}

function clampScore(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

async function enhanceWithGroq(
  interviewType: string,
  responses: { question: string; answer: string }[],
  baseline: Record<string, number>
): Promise<Record<string, unknown> | null> {
  const transcript = responses.map(r => `Q: ${r.question}\nA: ${r.answer}`).join('\n\n');
  if (transcript.length < 30) return null;

  const prompt = `Evaluate this original PRACTICE ${interviewType} interview simulation.
Rule-based baseline domain scores (0-100, refine these):
  financial_explanation_quality: ${baseline.financial}
  course_knowledge_quality: ${baseline.course}
  career_plan_consistency: ${baseline.career}

Q&A TRANSCRIPT:
"""
${transcript.slice(0, 4000)}
"""

Provide your refined PRACTICE evaluation as JSON. Remember: this is a practice simulation, NOT a real visa interview assessment. Never claim to be an official.`;

  const schema = `{
  "financial_explanation_quality": <integer 0-100>,
  "course_knowledge_quality": <integer 0-100>,
  "career_plan_consistency": <integer 0-100>,
  "follow_up_question_suggestions": ["<question 1>", "<question 2>", "<question 3>"],
  "improvement_tips": "<one specific, actionable sentence>"
}`;
  return GroqClient.evaluate(prompt, schema);
}
