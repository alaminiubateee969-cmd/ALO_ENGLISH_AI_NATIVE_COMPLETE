/**
 * src/lib/agents/WritingEvaluationAgent.ts
 *
 * AGENT-WRITE-01 — Evaluates writing submissions across all 32 CBT exams.
 *
 * TypeScript port of the cPanel WritingEvaluationService. Uses a rule-based
 * scoring engine (local_rule_engine) that works with NO external API key.
 * When GROQ_API_KEY is configured + AI_ENABLED=true, it optionally refines
 * scores via Groq's Llama 3.3 70B model.
 *
 * Scoring dimensions (0–9 band scale):
 *   - Task Achievement
 *   - Coherence & Cohesion
 *   - Lexical Resource
 *   - Grammatical Range & Accuracy
 *
 * The agent NEVER claims to be an official examiner or produce an official
 * score. All output is framed as a practice estimate.
 */

import { GroqClient } from './GroqClient';

export type WritingEvaluation = {
  wordCount: number;
  targetWordCount: number;
  estimatedBand: number;
  taskAchievement: number;
  coherence: number;
  lexical: number;
  grammar: number;
  improvementPlan: string[];
  confidenceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  providerUsed: string;
  fallbackUsed: boolean;
  disclaimer: string;
};

const TARGET_WORD_COUNT: Record<string, number> = {
  writing_task1: 150, writing_task1_general: 150, writing_task2: 250,
  essay: 250, integrated_writing: 200, academic_discussion: 120,
  writing_sample: 150, issue_task: 250, argument_task: 250,
};
const DEFAULT_TARGET = 200;

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

const PRACTICE_DISCLAIMER =
  'Practice estimate only. Not an official exam result. Not affiliated with any official test publisher.';

export async function evaluateWriting(
  text: string,
  taskType: string = 'essay'
): Promise<WritingEvaluation> {
  const wordCount = countWords(text);
  const target = TARGET_WORD_COUNT[taskType] ?? DEFAULT_TARGET;

  let taskAchievement = scoreTaskAchievement(wordCount, target, text);
  let coherence = scoreCoherence(text);
  let lexical = scoreLexical(text);
  let grammar = scoreGrammar(text);

  let providerUsed = 'local_rule_engine';
  let fallbackUsed = false;

  if (GroqClient.isConfigured()) {
    const enhanced = await enhanceWithGroq(text, {
      taskType, wordCount, target,
      taskAchievement, coherence, lexical, grammar,
      estimatedBand: aggregateBand(taskAchievement, coherence, lexical, grammar),
    });
    if (enhanced) {
      taskAchievement = clampBand(toNum(enhanced.task_achievement ?? enhanced.taskAchievement ?? taskAchievement));
      coherence = clampBand(toNum(enhanced.coherence ?? coherence));
      lexical = clampBand(toNum(enhanced.lexical_resource ?? enhanced.lexicalResource ?? enhanced.lexical ?? lexical));
      grammar = clampBand(toNum(enhanced.grammar ?? grammar));
      providerUsed = 'groq';
    } else {
      fallbackUsed = true;
    }
  }

  const estimatedBand = aggregateBand(taskAchievement, coherence, lexical, grammar);
  const confidenceScore = computeConfidence(wordCount, target, taskAchievement, coherence, lexical, grammar);
  const confidenceLevel = confidenceLevelFromScore(confidenceScore);
  const improvementPlan = buildImprovementPlan(wordCount, target, taskAchievement, coherence, lexical, grammar);

  return {
    wordCount, targetWordCount: target, estimatedBand,
    taskAchievement, coherence, lexical, grammar,
    improvementPlan, confidenceScore, confidenceLevel,
    providerUsed, fallbackUsed, disclaimer: PRACTICE_DISCLAIMER,
  };
}

// ─── Rule-based scoring ────────────────────────────────────────────────

function countWords(text: string): number {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean === '' ? 0 : clean.split(' ').length;
}

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z\-'']+/).filter(t => t.length > 1);
}

function scoreTaskAchievement(wordCount: number, target: number, text: string): number {
  if (wordCount === 0) return 0;
  const ratio = Math.min(1.0, wordCount / Math.max(1, target));
  let lengthScore = ratio * 9.0;
  if (ratio < 0.5) lengthScore *= 0.5;
  const longSentences = splitSentences(text).filter(s => countWords(s) >= 8).length;
  const topicScore = Math.min(1.0, longSentences / 3.0);
  return round1(Math.min(9.0, lengthScore + topicScore));
}

function scoreCoherence(text: string): number {
  if (text.trim() === '') return 0;
  const lower = ' ' + text.toLowerCase() + ' ';
  let markerHits = 0;
  for (const m of DISCOURSE_MARKERS) {
    if (lower.includes(' ' + m + ' ') || lower.includes(' ' + m + ',') || lower.includes(' ' + m + '.')) {
      markerHits++;
    }
  }
  const paraScore = Math.min(1.0, splitParagraphs(text).length / 3.0);
  const markerScore = Math.min(1.0, markerHits / 4.0);
  return round1(paraScore * 5.0 + markerScore * 4.0);
}

function scoreLexical(text: string): number {
  const words = tokenize(text);
  if (words.length < 5) return 0;
  const sample = words.slice(0, 100);
  const ttr = new Set(sample).size / Math.max(1, sample.length);
  const diversityScore = Math.min(1.0, ttr / 0.7) * 6.0;
  const academicHits = words.filter(w => ACADEMIC_TOKENS.includes(w)).length;
  const academicScore = Math.min(3.0, academicHits * 0.5);
  return round1(Math.min(9.0, diversityScore + academicScore));
}

function scoreGrammar(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const lengths = sentences.map(s => countWords(s)).filter(l => l > 0);
  if (lengths.length < 2) return 2.0;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const rangeScore = Math.min(3.0, stdDev / 5.0);
  const runOns = lengths.filter(l => l > 40).length;
  return round1(Math.max(0, Math.min(9.0, 5.0 + rangeScore - runOns * 0.5)));
}

function aggregateBand(ta: number, co: number, le: number, gr: number): number {
  return round1((ta + co + le + gr) / 4);
}

function computeConfidence(wc: number, target: number, ta: number, co: number, le: number, gr: number): number {
  if (wc === 0) return 0.20;
  const lengthRatio = Math.min(1.0, wc / Math.max(1, target));
  const dimAvg = (ta + co + le + gr) / 4.0 / 9.0;
  return Math.round(Math.max(0, Math.min(1, dimAvg * 0.5 + lengthRatio * 0.5)) * 100) / 100;
}

function confidenceLevelFromScore(score: number): 'high' | 'medium' | 'low' {
  const low = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.45');
  const med = parseFloat(process.env.MEDIUM_CONFIDENCE_THRESHOLD || '0.70');
  if (score >= med) return 'high';
  if (score >= low) return 'medium';
  return 'low';
}

function buildImprovementPlan(wc: number, target: number, ta: number, co: number, le: number, gr: number): string[] {
  const plan: string[] = [];
  if (wc < target * 0.8) plan.push(`Expand your response to at least ${target} words for full task achievement.`);
  if (co < 6.0) plan.push('Add discourse markers (however, moreover, therefore, in conclusion) to improve coherence.');
  if (le < 6.0) plan.push('Use more varied academic vocabulary (analyse, demonstrate, significant, framework).');
  if (gr < 6.0) plan.push('Vary sentence length and structure — combine short sentences, avoid run-ons (>40 words).');
  if (plan.length === 0) plan.push('Strong response. Continue practising timed writing with varied topics.');
  return plan;
}

function clampBand(v: number): number { return Math.round(Math.max(0, Math.min(9, v)) * 10) / 10; }
function round1(v: number): number { return Math.round(v * 10) / 10; }
function toNum(v: unknown): number { const n = typeof v === 'number' ? v : parseFloat(String(v)); return isNaN(n) ? 0 : n; }

async function enhanceWithGroq(text: string, baseline: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (text.length < 20) return null;
  const prompt = `Evaluate this original PRACTICE writing submission for an English exam.
Task type: ${baseline.taskType}
Word count: ${baseline.wordCount} (target: ${baseline.target})
Rule-based baseline scores (0-9 band, refine these):
  task_achievement: ${baseline.taskAchievement}
  coherence: ${baseline.coherence}
  lexical: ${baseline.lexical}
  grammar: ${baseline.grammar}
  estimated_band: ${baseline.estimatedBand}

STUDENT SUBMISSION:
"""
${text.slice(0, 4000)}
"""

Provide your refined PRACTICE evaluation as JSON. Remember: this is a practice estimate, NOT an official score. Never claim to be an official examiner.`;

  const schema = `{
  "task_achievement": <number 0-9, one decimal>,
  "coherence": <number 0-9, one decimal>,
  "lexical_resource": <number 0-9, one decimal>,
  "grammar": <number 0-9, one decimal>,
  "estimated_band": <number 0-9, one decimal, overall>,
  "suggested_improvement": "<one specific, actionable sentence>"
}`;
  return GroqClient.evaluate(prompt, schema);
}
