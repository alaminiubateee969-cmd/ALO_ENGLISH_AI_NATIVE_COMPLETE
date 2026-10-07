/**
 * src/lib/exam/grading.ts
 *
 * Server-side grading for objective questions.
 *
 * Correct answers are read from the database and compared against the
 * student's persisted answers. The client can never influence the expected
 * answer: it only ever supplies the student's own response.
 *
 * IMPORTANT: the legacy grader only matched the literal type "TRUE_FALSE",
 * which never appears in the seeded bank ("TRUE_FALSE_NOT_GIVEN" is used).
 * Those questions were silently skipped and dragged scores down. The type
 * sets below cover every type present in the schema and the seeds.
 */

export type GradableQuestion = {
  id: string;
  section: string;
  type: string;
  correctAnswer: string | null;
  correctIndex: number | null;
  correctIndices: string | null;
  options: string | null;
  points: number;
};

export type QuestionGrade = {
  questionId: string;
  section: string;
  type: string;
  answered: boolean;
  correct: boolean;
  awardedPoints: number;
  maxPoints: number;
};

export type SectionGrade = {
  section: string;
  correct: number;
  total: number;
  awardedPoints: number;
  maxPoints: number;
};

export type ObjectiveGradeResult = {
  perQuestion: QuestionGrade[];
  sections: SectionGrade[];
  bySection: Record<string, SectionGrade>;
  correctTotal: number;
  objectiveTotal: number;
};

/** Types graded automatically from stored correct answers. */
const INDEX_TYPES = new Set(["MULTIPLE_CHOICE", "TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "READING_MCQ", "READ_AND_SELECT", "LISTEN_AND_SELECT"]);
const TEXT_TYPES = new Set(["FILL_BLANK", "SHORT_ANSWER", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "WRITE_FROM_DICTATION", "COMPLETE_THE_SENTENCE"]);
const SET_TYPES = new Set(["MATCHING", "LABELING"]);

/** Types that require a human/AI evaluator and are never scored here. */
export const SUBJECTIVE_TYPES = new Set(["ESSAY", "SPEAKING", "CHART_DESCRIPTION", "WRITING_TASK1", "WRITING_TASK2"]);

export function isObjective(q: { type: string }): boolean {
  const t = q.type.toUpperCase();
  return INDEX_TYPES.has(t) || TEXT_TYPES.has(t) || SET_TYPES.has(t);
}

export function isSubjective(q: { type: string }): boolean {
  return SUBJECTIVE_TYPES.has(q.type.toUpperCase());
}

/** Normalise free-text answers: case, whitespace and trailing punctuation. */
export function normaliseText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/, "");
}

function parseIndices(json: string | null): number[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map((v) => Number(v)).filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function gradeOne(q: GradableQuestion, rawAnswer: unknown): QuestionGrade {
  const maxPoints = q.points > 0 ? q.points : 1;
  const base = { questionId: q.id, section: q.section, type: q.type, maxPoints };

  if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === "") {
    return { ...base, answered: false, correct: false, awardedPoints: 0 };
  }

  const answer = String(rawAnswer);
  const type = q.type.toUpperCase();
  let correct = false;

  if (INDEX_TYPES.has(type)) {
    const given = Number.parseInt(answer, 10);
    correct = Number.isInteger(given) && q.correctIndex !== null && given === q.correctIndex;
  } else if (TEXT_TYPES.has(type)) {
    const expected = q.correctAnswer;
    if (expected === null) {
      correct = false;
    } else {
      // A question may publish several acceptable answers separated by "|".
      const acceptable = expected.split("|").map(normaliseText);
      correct = acceptable.includes(normaliseText(answer));
    }
  } else if (SET_TYPES.has(type)) {
    const expected = parseIndices(q.correctIndices).slice().sort((a, b) => a - b);
    let given: number[] = [];
    try {
      const parsed = JSON.parse(answer);
      given = (Array.isArray(parsed) ? parsed : [parsed]).map((v: unknown) => Number(v)).filter((n) => Number.isInteger(n));
    } catch {
      given = answer.split(",").map((v) => Number.parseInt(v.trim(), 10)).filter((n) => Number.isInteger(n));
    }
    given.sort((a, b) => a - b);
    correct = expected.length > 0 && given.length === expected.length && given.every((v, i) => v === expected[i]);
  }

  return { ...base, answered: true, correct, awardedPoints: correct ? maxPoints : 0 };
}

/**
 * Grade every objective question in an attempt.
 *
 * `answers` must come from the persisted AttemptAnswer rows (or, for a
 * legacy client, the answer map it posts — either way the *expected* values
 * come from the database, never from the request).
 */
export function gradeObjective(
  questions: GradableQuestion[],
  answers: Record<string, unknown>
): ObjectiveGradeResult {
  const perQuestion: QuestionGrade[] = [];

  for (const q of questions) {
    if (!isObjective(q)) continue;
    perQuestion.push(gradeOne(q, answers[q.id]));
  }

  const sectionMap = new Map<string, SectionGrade>();
  for (const g of perQuestion) {
    const key = (g.section || "GENERAL").toUpperCase();
    const entry = sectionMap.get(key) ?? { section: key, correct: 0, total: 0, awardedPoints: 0, maxPoints: 0 };
    entry.total += 1;
    entry.maxPoints += g.maxPoints;
    if (g.correct) {
      entry.correct += 1;
      entry.awardedPoints += g.awardedPoints;
    }
    sectionMap.set(key, entry);
  }

  const sections = [...sectionMap.values()];
  const bySection: Record<string, SectionGrade> = {};
  for (const s of sections) bySection[s.section] = s;

  return {
    perQuestion,
    sections,
    bySection,
    correctTotal: perQuestion.filter((g) => g.correct).length,
    objectiveTotal: perQuestion.length,
  };
}
