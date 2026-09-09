/**
 * src/lib/agents/SpeakingEvaluationAgent.ts
 *
 * AGENT-SPEAK-01 — Evaluates spoken-response transcripts across all 32 CBT exams.
 *
 * Rule-based scoring (local_rule_engine) with optional Groq enhancement.
 * Dimensions (0–9 band): fluency, pronunciation (estimate), grammar,
 * lexical resource, coherence, confidence.
 */

import { GroqClient } from './GroqClient';
import { getRandomExaminer, adjustPronunciationScoreForBengaliAccent, adjustFluencyScoreForBengaliAccent } from './AIExaminers';

export type SpeakingEvaluation = {
  wordCount: number;
  durationSeconds: number;
  fluency: number;
  pronunciation: number;
  grammar: number;
  lexical: number;
  coherence: number;
  confidence: number;
  estimatedBand: number;
  improvementTips: string[];
  confidenceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  providerUsed: string;
  fallbackUsed: boolean;
  disclaimer: string;
  examinerName: string;
  examinerTitle: string;
  accentAdjusted: boolean;
};

const PRACTICE_DISCLAIMER =
  'Practice estimate only. Not an official exam result. Pronunciation is an estimate based on transcript patterns.';

export async function evaluateSpeaking(
  transcript: string,
  durationSeconds: number = 120
): Promise<SpeakingEvaluation> {
  const wordCount = countWords(transcript);

  let fluency = scoreFluency(wordCount, durationSeconds);
  let pronunciation = scorePronunciation(transcript);
  let grammar = scoreGrammar(transcript);
  let lexical = scoreLexical(transcript);
  let coherence = scoreCoherence(transcript);
  let confidence = scoreConfidence(transcript, fluency);

  let providerUsed = 'local_rule_engine';
  let fallbackUsed = false;

  if (GroqClient.isConfigured()) {
    const enhanced = await enhanceWithGroq(transcript, {
      duration: durationSeconds, wordCount,
      fluency, pronunciation, grammar, lexical, coherence, confidence,
    });
    if (enhanced) {
      fluency = clamp(enhanced.fluency ?? fluency);
      pronunciation = clamp(enhanced.pronunciation ?? pronunciation);
      grammar = clamp(enhanced.grammar ?? grammar);
      lexical = clamp(enhanced.lexical_resource ?? enhanced.lexicalResource ?? enhanced.lexical ?? lexical);
      coherence = clamp(enhanced.coherence ?? coherence);
      providerUsed = 'groq';
    } else {
      fallbackUsed = true;
    }
  }

  const estimatedBand = aggregateBand(fluency, pronunciation, grammar, lexical, coherence);
  const confidenceScore = computeConfidence(wordCount, durationSeconds, fluency, pronunciation, grammar, lexical, coherence, confidence);
  const confidenceLevel = confidenceLevelFromScore(confidenceScore);
  const improvementTips = buildTips(fluency, pronunciation, grammar, lexical, coherence);

  // ═══ Bengali Accent-Aware Adjustment ═══════════════════════════════
  // Select a Bengali AI examiner who understands Bengali English patterns
  const examiner = getRandomExaminer();

  // Adjust pronunciation score — don't penalize Bengali accent patterns
  const adjustedPronunciation = adjustPronunciationScoreForBengaliAccent(
    pronunciation, transcript, examiner
  );

  // Adjust fluency score — Bengali intonation is different from native English
  const adjustedFluency = adjustFluencyScoreForBengaliAccent(
    fluency, wordCount, durationSeconds, examiner
  );

  // Recalculate band with adjusted scores
  const adjustedBand = aggregateBand(adjustedFluency, adjustedPronunciation, grammar, lexical, coherence);

  return {
    wordCount, durationSeconds,
    fluency: adjustedFluency, pronunciation: adjustedPronunciation, grammar, lexical, coherence, confidence,
    estimatedBand: adjustedBand, improvementTips,
    confidenceScore, confidenceLevel,
    providerUsed, fallbackUsed,
    disclaimer: PRACTICE_DISCLAIMER,
    examinerName: examiner.name,
    examinerTitle: examiner.title,
    accentAdjusted: true,
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

/** Fluency: words per minute. 120+ wpm = 7-9 band, <60 wpm = 3-4. */
function scoreFluency(wordCount: number, durationSec: number): number {
  if (durationSec === 0 || wordCount === 0) return 0;
  const wpm = (wordCount / durationSec) * 60;
  if (wpm >= 150) return 9.0;
  if (wpm >= 120) return 8.0;
  if (wpm >= 100) return 7.0;
  if (wpm >= 80) return 6.0;
  if (wpm >= 60) return 5.0;
  if (wpm >= 40) return 4.0;
  return 3.0;
}

/** Pronunciation estimate: based on filler words and hesitation markers. */
function scorePronunciation(text: string): number {
  if (text.trim() === '') return 0;
  const lower = text.toLowerCase();
  const fillers = ['um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean'];
  let fillerCount = 0;
  for (const f of fillers) {
    const matches = lower.match(new RegExp(`\\b${f}\\b`, 'g'));
    if (matches) fillerCount += matches.length;
  }
  const wordCount = countWords(text);
  const fillerRatio = fillerCount / Math.max(1, wordCount);
  if (fillerRatio < 0.02) return 8.0;
  if (fillerRatio < 0.05) return 7.0;
  if (fillerRatio < 0.08) return 6.0;
  if (fillerRatio < 0.12) return 5.0;
  return 4.0;
}

function scoreGrammar(text: string): number {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return 0;
  const lengths = sentences.map(s => countWords(s)).filter(l => l > 0);
  if (lengths.length < 2) return 4.0;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const rangeScore = Math.min(2.0, stdDev / 5.0);
  return round1(Math.max(0, Math.min(9.0, 5.0 + rangeScore)));
}

function scoreLexical(text: string): number {
  const words = text.toLowerCase().split(/[^a-z\-'']+/).filter(t => t.length > 1);
  if (words.length < 5) return 0;
  const sample = words.slice(0, 100);
  const ttr = new Set(sample).size / Math.max(1, sample.length);
  return round1(Math.min(9.0, (ttr / 0.7) * 7.0 + 2.0));
}

function scoreCoherence(text: string): number {
  if (text.trim() === '') return 0;
  const lower = ' ' + text.toLowerCase() + ' ';
  const markers = ['first', 'second', 'then', 'next', 'finally', 'because', 'so', 'but', 'however', 'for example'];
  let hits = 0;
  for (const m of markers) {
    if (lower.includes(' ' + m + ' ') || lower.includes(' ' + m + ',')) hits++;
  }
  return round1(Math.min(9.0, 4.0 + hits * 0.8));
}

function scoreConfidence(text: string, fluency: number): number {
  if (text.trim() === '') return 0;
  const lower = text.toLowerCase();
  const hedging = ['maybe', 'perhaps', 'i think', 'i guess', "i'm not sure", 'sort of', 'kind of'];
  let hedgeCount = 0;
  for (const h of hedging) {
    if (lower.includes(h)) hedgeCount++;
  }
  return round1(Math.max(0, Math.min(9.0, fluency - hedgeCount * 0.8)));
}

function aggregateBand(f: number, p: number, g: number, l: number, c: number): number {
  return round1((f + p + g + l + c) / 5);
}

function computeConfidence(wc: number, dur: number, f: number, p: number, g: number, l: number, c: number, conf: number): number {
  if (wc === 0 || dur === 0) return 0.20;
  const dimAvg = (f + p + g + l + c + conf) / 6.0 / 9.0;
  const lengthRatio = Math.min(1.0, wc / 100);
  return Math.round(Math.max(0, Math.min(1, dimAvg * 0.6 + lengthRatio * 0.4)) * 100) / 100;
}

function confidenceLevelFromScore(score: number): 'high' | 'medium' | 'low' {
  const low = parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD || '0.45');
  const med = parseFloat(process.env.MEDIUM_CONFIDENCE_THRESHOLD || '0.70');
  if (score >= med) return 'high';
  if (score >= low) return 'medium';
  return 'low';
}

function buildTips(f: number, p: number, g: number, l: number, c: number): string[] {
  const tips: string[] = [];
  if (f < 6.0) tips.push('Practice speaking at a steady pace — aim for 120+ words per minute.');
  if (p < 6.0) tips.push('Reduce filler words (um, uh, like) to improve clarity.');
  if (g < 6.0) tips.push('Vary your sentence structures — mix simple and complex sentences.');
  if (l < 6.0) tips.push('Use more specific vocabulary instead of general words.');
  if (c < 6.0) tips.push('Add linking words (first, then, because, for example) to structure your response.');
  if (tips.length === 0) tips.push('Strong response. Continue practising with varied topics.');
  return tips;
}

function clamp(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (isNaN(n)) return 0;
  return Math.round(Math.max(0, Math.min(9, n)) * 10) / 10;
}
function round1(v: number): number { return Math.round(v * 10) / 10; }

async function enhanceWithGroq(transcript: string, baseline: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  if (transcript.length < 20) return null;
  const prompt = `Evaluate this original PRACTICE speaking response transcript for an English exam.
Duration: ${baseline.duration}s · Word count: ${baseline.wordCount}
Rule-based baseline scores (0-9 band, refine these):
  fluency: ${baseline.fluency}
  pronunciation: ${baseline.pronunciation}
  grammar: ${baseline.grammar}
  lexical: ${baseline.lexical}
  coherence: ${baseline.coherence}

TRANSCRIPT:
"""
${transcript.slice(0, 4000)}
"""

Provide your refined PRACTICE evaluation as JSON. Remember: this is a practice estimate, NOT an official score. Never claim to be an official examiner.`;

  const schema = `{
  "fluency": <number 0-9, one decimal>,
  "pronunciation": <number 0-9, one decimal>,
  "grammar": <number 0-9, one decimal>,
  "lexical_resource": <number 0-9, one decimal>,
  "coherence": <number 0-9, one decimal>,
  "improvement_tips": "<one specific, actionable sentence>"
}`;
  return GroqClient.evaluate(prompt, schema);
}
