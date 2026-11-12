/**
 * src/lib/exam/band-score.ts
 *
 * Official-style band score conversion tables for the auto-graded objective
 * sections (Listening, Reading). Used by the post-submit BandScoreReport and
 * by the live AdaptiveEngine to estimate a band while the test is in
 * progress.
 *
 * The tables mirror the public IELTS raw-score → band conversion published
 * by the British Council and IDP. They are NOT a substitute for the
 * official scoring algorithm — they only convert "X out of 40 correct" into
 * a 0–9 practice indicator. The platform never exposes this number as an
 * official score (see the result-screen disclosure).
 *
 * For non-IELTS families (TOEFL, DET, SAT, GRE, GMAT) we expose a parallel
 * "estimated score range" so the AdaptiveEngine has something to render in
 * the same panel — but again, it is a *practice* indicator, not an official
 * score.
 */

/** A raw-score → band lookup for one section (out of 40). */
export type BandTable = ReadonlyArray<{ readonly min: number; readonly band: number }>;

/**
 * IELTS Academic + General Training Listening (out of 40).
 * Same table is used for both Academic and General Training.
 */
export const IELTS_LISTENING_BANDS: BandTable = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 32, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 26, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 18, band: 5.5 },
  { min: 16, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 11, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 3, band: 2.0 },
  { min: 2, band: 1.5 },
  { min: 1, band: 1.0 },
  { min: 0, band: 0 },
];

/**
 * IELTS Academic Reading (out of 40).
 */
export const IELTS_ACADEMIC_READING_BANDS: BandTable = [
  { min: 39, band: 9.0 },
  { min: 37, band: 8.5 },
  { min: 35, band: 8.0 },
  { min: 33, band: 7.5 },
  { min: 30, band: 7.0 },
  { min: 27, band: 6.5 },
  { min: 23, band: 6.0 },
  { min: 19, band: 5.5 },
  { min: 15, band: 5.0 },
  { min: 13, band: 4.5 },
  { min: 10, band: 4.0 },
  { min: 8, band: 3.5 },
  { min: 6, band: 3.0 },
  { min: 4, band: 2.5 },
  { min: 3, band: 2.0 },
  { min: 2, band: 1.5 },
  { min: 1, band: 1.0 },
  { min: 0, band: 0 },
];

/**
 * IELTS General Training Reading (out of 40).
 * A candidate needs more raw correct answers for the same band because the
 * General Training texts are simpler.
 */
export const IELTS_GENERAL_READING_BANDS: BandTable = [
  { min: 40, band: 9.0 },
  { min: 39, band: 8.5 },
  { min: 37, band: 8.0 },
  { min: 36, band: 7.5 },
  { min: 34, band: 7.0 },
  { min: 32, band: 6.5 },
  { min: 30, band: 6.0 },
  { min: 27, band: 5.5 },
  { min: 23, band: 5.0 },
  { min: 19, band: 4.5 },
  { min: 15, band: 4.0 },
  { min: 12, band: 3.5 },
  { min: 9, band: 3.0 },
  { min: 6, band: 2.5 },
  { min: 4, band: 2.0 },
  { min: 3, band: 1.5 },
  { min: 2, band: 1.0 },
  { min: 1, band: 0 },
  { min: 0, band: 0 },
];

/**
 * Resolve a band from a raw score (out of 40) using one of the tables.
 *
 * Scores above the table maximum clamp to the top band; below-zero clamps
 * to 0. A non-40 denominator scales the result proportionally before
 * looking up the band, so a 5-question Listening practice clip can still
 * produce a band indicator.
 */
export function rawToBand(rawCorrect: number, total: number, table: BandTable): number {
  if (total <= 0) return 0;
  const scaled = Math.max(0, Math.min(40, Math.round((rawCorrect / total) * 40)));
  for (const row of table) {
    if (scaled >= row.min) return row.band;
  }
  return 0;
}

/**
 * Pick the right Reading band table for the exam family.
 *
 * The General Training variant only applies to the IELTS General Training
 * paper; everything else (Academic IELTS, TOEFL, DET, etc.) falls back to
 * the Academic table, which is the more conservative of the two.
 */
export function readingBandTable(examCode: string): BandTable {
  const code = String(examCode ?? "").toUpperCase();
  if (code.includes("IELTS") && (code.includes("GT") || code.includes("GENERAL"))) {
    return IELTS_GENERAL_READING_BANDS;
  }
  return IELTS_ACADEMIC_READING_BANDS;
}

/**
 * IELTS overall band (0–9) — the mean of the four section bands rounded to
 * the nearest 0.5, matching the official rule: x.25 → x.0, x.75 → x+1.0,
 * otherwise round to nearest 0.5.
 *
 * If a section is missing (e.g. speaking was not scored), the average is
 * taken over the available bands so a partial report still produces a
 * number — clearly labelled as a partial indicator by the caller.
 */
export function ieltsOverallBand(bands: number[]): number {
  const valid = bands.filter((b) => typeof b === "number" && !Number.isNaN(b));
  if (valid.length === 0) return 0;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  // Snap to the nearest 0.5 using the official IELTS rounding rule.
  const lower = Math.floor(mean);
  const frac = mean - lower;
  if (frac < 0.25) return lower;
  if (frac < 0.75) return lower + 0.5;
  return lower + 1;
}

/**
 * Per-section band for an IELTS-style paper.
 *
 * Returns null if the section name is not a band-graded skill (e.g. WRITING
 * / SPEAKING — those are subjective and produce no band here).
 */
export function ieltsSectionBand(
  section: string,
  rawCorrect: number,
  total: number,
  examCode: string,
): number | null {
  const s = String(section ?? "").toUpperCase();
  if (s === "LISTENING") return rawToBand(rawCorrect, total, IELTS_LISTENING_BANDS);
  if (s === "READING") return rawToBand(rawCorrect, total, readingBandTable(examCode));
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Non-IELTS adaptive / estimated-score ranges
// ────────────────────────────────────────────────────────────────────────────

/** A pair of low / high estimated scores for an exam family. */
export type ScoreRange = {
  readonly min: number;
  readonly max: number;
  /** Human label for the scale (e.g. "IELTS band", "TOEFL iBT", "DET"). */
  readonly scale: string;
};

/**
 * Map an exam code to its published score range.
 *
 * Used by the AdaptiveEngine to render an estimated score range that
 * narrows as the candidate answers more questions. The range is the
 * *published* min–max for each test, not a prediction of the candidate's
 * score; the engine narrows it based on observed correctness.
 */
export function examScoreRange(examCode: string): ScoreRange {
  const code = String(examCode ?? "").toUpperCase();
  if (code.includes("IELTS")) return { min: 0, max: 9, scale: "IELTS band" };
  if (code.includes("TOEFL")) return { min: 0, max: 120, scale: "TOEFL iBT" };
  if (code.includes("DET") || code.includes("DUOLINGO")) return { min: 10, max: 160, scale: "Duolingo English Test" };
  if (code.includes("SAT")) return { min: 200, max: 800, scale: "Digital SAT section" };
  if (code.includes("GRE")) return { min: 130, max: 170, scale: "GRE" };
  if (code.includes("GMAT")) return { min: 200, max: 800, scale: "GMAT" };
  // Fallback: a generic 0–100 percentage-style indicator.
  return { min: 0, max: 100, scale: "Practice indicator" };
}

/**
 * Narrow the published score range based on a correctness ratio (0–1) and
 * an answer-completion ratio (0–1). As the candidate answers more, the
 * range tightens around the correctness-implied point estimate.
 *
 * This is intentionally simple — it is a UI affordance for the "estimated
 * score range that updates as the student progresses" requirement, not a
 * psychometric model.
 */
export function narrowScoreRange(
  base: ScoreRange,
  correctnessRatio: number,
  completionRatio: number,
): ScoreRange {
  const span = base.max - base.min;
  const point = base.min + span * Math.max(0, Math.min(1, correctnessRatio));
  // Shrink the window as completion grows. At 0% answered, the full range;
  // at 100% answered, ±5% of the span around the point estimate.
  const shrink = Math.max(0.05, 1 - completionRatio);
  const half = (span * shrink) / 2;
  const low = Math.max(base.min, Math.round((point - half) * 10) / 10);
  const high = Math.min(base.max, Math.round((point + half) * 10) / 10);
  return { min: low, max: high, scale: base.scale };
}

/**
 * Three-level difficulty label used by the AdaptiveEngine and the
 * ModuleIndicator. The numerical weight lets the engine shift the next
 * question's target difficulty up or down by ±1.
 */
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export function difficultyWeight(d: Difficulty): number {
  return d === "EASY" ? 0 : d === "MEDIUM" ? 1 : 2;
}

export function difficultyFromWeight(w: number): Difficulty {
  if (w <= 0) return "EASY";
  if (w >= 2) return "HARD";
  return "MEDIUM";
}

/**
 * Heuristic difficulty for a single question, derived from its surface
 * features (length of the prompt, presence of a long passage, choice
 * count). Not a psychometric estimate — just enough signal for the
 * AdaptiveEngine's "next question difficulty" affordance.
 */
export function estimateQuestionDifficulty(input: {
  prompt: string;
  passage?: string | null;
  options?: string | null;
  wordLimit?: number | null;
}): Difficulty {
  const promptWords = String(input.prompt ?? "").split(/\s+/).filter(Boolean).length;
  const passageWords = String(input.passage ?? "").split(/\s+/).filter(Boolean).length;
  let optionCount = 0;
  try {
    const parsed = JSON.parse(String(input.options ?? "[]"));
    if (Array.isArray(parsed)) optionCount = parsed.length;
  } catch {
    /* ignore */
  }
  const wordTarget = input.wordLimit ?? 0;

  let score = 0;
  // Long prompts raise difficulty.
  if (promptWords > 60) score += 1;
  // Long passages raise difficulty (Reading section).
  if (passageWords > 250) score += 1;
  // More choices raise difficulty slightly.
  if (optionCount >= 5) score += 1;
  // Long-form writing tasks are weighted as MEDIUM by default.
  if (wordTarget >= 250) score += 1;

  return difficultyFromWeight(score - 1);
}

/**
 * Adaptive shift: given the previous question's difficulty and whether the
 * candidate answered correctly (or a confidence proxy 0–1), return the
 * next question's target difficulty.
 *
 * Mirrors the DET behaviour: correct → step up, wrong → step down.
 */
export function nextDifficulty(prev: Difficulty, confidence: number): Difficulty {
  const w = difficultyWeight(prev);
  // confidence > 0.6 → step up; < 0.4 → step down; otherwise hold.
  const delta = confidence > 0.6 ? 1 : confidence < 0.4 ? -1 : 0;
  return difficultyFromWeight(w + delta);
}

/**
 * Fallback word target for a question type, mirrored from
 * @/lib/exam/question-ui.ts `longTextWordTarget`. Defined inline here so
 * the AdaptiveEngine module can stay decoupled from the question-ui
 * import (which the practice-test page already uses).
 */
export function longTextWordTargetFallback(type: string): number {
  const t = String(type ?? "").toUpperCase().replace(/-/g, "_");
  if (t === "WRITING_TASK2" || t === "ESSAY") return 250;
  if (t === "WRITING_TASK1" || t === "CHART_DESCRIPTION") return 150;
  if (t === "SPEAKING") return 80;
  // Objective question — short answer expected.
  return 0;
}

/**
 * Confidence proxy used when the engine does not have the correct answer
 * (the client never does — only the server grades). Falls back to answer
 * completeness + length signals.
 *
 * Returns a number in [0, 1]: 0 = blank / extremely short, 1 = full,
 * substantial answer. The threshold is intentionally lenient because the
 * engine is a UI affordance, not a real CAT.
 */
export function answerConfidence(answer: string, target: number): number {
  const trimmed = String(answer ?? "").trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (target <= 0) {
    // Short-answer objective question: any non-empty answer counts as 0.5,
    // longer answers nudge higher.
    return Math.min(1, 0.5 + words / 40);
  }
  // Long-form: fraction of the word target reached, capped at 1.
  return Math.min(1, words / target);
}
