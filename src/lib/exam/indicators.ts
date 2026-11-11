/**
 * Convert objective listening/reading answer accuracy into generic 0–9
 * practice indicators. Subjective sections are deliberately unsupported until
 * they have a validated rubric and their underlying evidence is available.
 * These indicators are not official exam score conversions.
 */
export type PracticeIndicators = {
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: null;
  speaking: null;
};

export function calculatePracticeIndicators(input: {
  listeningCorrect: number;
  listeningTotal: number;
  readingCorrect: number;
  readingTotal: number;
}): PracticeIndicators {
  const listening = indicatorFromRatio(input.listeningCorrect, input.listeningTotal);
  const reading = indicatorFromRatio(input.readingCorrect, input.readingTotal);
  const available = [listening, reading].filter(
    (value): value is number => value !== null,
  );

  return {
    overall: available.length > 0
      ? round1(available.reduce((sum, value) => sum + value, 0) / available.length)
      : null,
    listening,
    reading,
    writing: null,
    speaking: null,
  };
}

function indicatorFromRatio(correct: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(correct)) return null;
  const ratio = Math.max(0, Math.min(1, correct / total));
  return round1(ratio * 9);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
