
/**
 * Official exam rules — section-level time limits per exam type.
 * Source: official exam websites (ielts.org, ets.org, collegeboard.org, etc.)
 */
export type SectionRule = {
  section: string;
  durationMin: number;
  questionCount: number;
};

export const EXAM_SECTION_RULES: Record<string, SectionRule[]> = {
  "IELTS-A": [
    { section: "LISTENING", durationMin: 30, questionCount: 40 },
    { section: "READING", durationMin: 60, questionCount: 40 },
    { section: "WRITING", durationMin: 60, questionCount: 2 },
    { section: "SPEAKING", durationMin: 14, questionCount: 3 },
  ],
  "IELTS-G": [
    { section: "LISTENING", durationMin: 30, questionCount: 40 },
    { section: "READING", durationMin: 60, questionCount: 40 },
    { section: "WRITING", durationMin: 60, questionCount: 2 },
    { section: "SPEAKING", durationMin: 14, questionCount: 3 },
  ],
  "IELTS-UKVI": [
    { section: "LISTENING", durationMin: 30, questionCount: 40 },
    { section: "READING", durationMin: 60, questionCount: 40 },
    { section: "WRITING", durationMin: 60, questionCount: 2 },
    { section: "SPEAKING", durationMin: 14, questionCount: 3 },
  ],
  "TOEFL-iBT": [
    { section: "READING", durationMin: 35, questionCount: 20 },
    { section: "LISTENING", durationMin: 36, questionCount: 28 },
    { section: "SPEAKING", durationMin: 17, questionCount: 4 },
    { section: "WRITING", durationMin: 29, questionCount: 2 },
  ],
  "PTE-A": [
    { section: "SPEAKING", durationMin: 30, questionCount: 15 },
    { section: "WRITING", durationMin: 25, questionCount: 5 },
    { section: "READING", durationMin: 30, questionCount: 15 },
    { section: "LISTENING", durationMin: 23, questionCount: 13 },
  ],
  "DUOLINGO": [
    { section: "LITERACY", durationMin: 15, questionCount: 10 },
    { section: "COMPREHENSION", durationMin: 15, questionCount: 10 },
    { section: "CONVERSATION", durationMin: 10, questionCount: 8 },
    { section: "PRODUCTION", durationMin: 5, questionCount: 5 },
  ],
  "GRE": [
    { section: "WRITING", durationMin: 30, questionCount: 1 },
    { section: "VERBAL", durationMin: 41, questionCount: 27 },
    { section: "QUANTITATIVE", durationMin: 47, questionCount: 27 },
  ],
  "GMAT": [
    { section: "QUANTITATIVE", durationMin: 45, questionCount: 21 },
    { section: "VERBAL", durationMin: 45, questionCount: 23 },
    { section: "DATA_INSIGHTS", durationMin: 45, questionCount: 20 },
  ],
  "SAT": [
    { section: "READING_WRITING_1", durationMin: 32, questionCount: 27 },
    { section: "MATH_1", durationMin: 35, questionCount: 22 },
    { section: "READING_WRITING_2", durationMin: 32, questionCount: 27 },
    { section: "MATH_2", durationMin: 35, questionCount: 22 },
  ],
  "ACT": [
    { section: "ENGLISH", durationMin: 45, questionCount: 75 },
    { section: "MATH", durationMin: 60, questionCount: 60 },
    { section: "READING", durationMin: 35, questionCount: 40 },
    { section: "SCIENCE", durationMin: 35, questionCount: 40 },
  ],
  "OET": [
    { section: "LISTENING", durationMin: 45, questionCount: 42 },
    { section: "READING", durationMin: 60, questionCount: 42 },
    { section: "WRITING", durationMin: 45, questionCount: 1 },
    { section: "SPEAKING", durationMin: 20, questionCount: 2 },
  ],
};

/**
 * Get section rules for an exam type code.
 * Returns undefined if no specific rules are defined (fallback to overall timer).
 */
export function getSectionRules(examTypeCode: string): SectionRule[] | undefined {
  const code = examTypeCode.toUpperCase();
  // Try exact match first
  if (EXAM_SECTION_RULES[code]) return EXAM_SECTION_RULES[code];
  // Try prefix match (e.g., IELTS-A matches IELTS-A)
  for (const key of Object.keys(EXAM_SECTION_RULES)) {
    if (code.startsWith(key) || key.startsWith(code.split("-")[0])) {
      return EXAM_SECTION_RULES[key];
    }
  }
  return undefined;
}

/**
 * Whether this exam type uses section-level timers.
 */
export function hasSectionTimers(examTypeCode: string): boolean {
  return getSectionRules(examTypeCode) !== undefined;
}

/**
 * Camera proctoring requirement per exam type.
 */
export const EXAM_CAMERA_REQUIREMENT: Record<string, boolean> = {
  "DUOLINGO": true,
  "IELTS-A": false,
  "IELTS-G": false,
  "TOEFL-iBT": false,
};

export function requiresCamera(examTypeCode: string): boolean {
  return EXAM_CAMERA_REQUIREMENT[examTypeCode.toUpperCase()] ?? false;
}
