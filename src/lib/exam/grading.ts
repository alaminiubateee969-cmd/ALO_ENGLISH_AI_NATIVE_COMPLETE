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
 *
 * The vocabulary itself lives in ./question-types.json so the grader, the CI
 * content gate and the bank auditor cannot disagree about what a valid type
 * is. See that file for the history.
 */

import QUESTION_TYPES from "./question-types.json";

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
const INDEX_TYPES = new Set<string>(QUESTION_TYPES.indexTypes);
const TEXT_TYPES = new Set<string>(QUESTION_TYPES.textTypes);
const SET_TYPES = new Set<string>(QUESTION_TYPES.setTypes);

/** Types that require a human/AI evaluator and are never scored here. */
export const SUBJECTIVE_TYPES = new Set<string>(QUESTION_TYPES.subjectiveTypes);

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
    // Prefer correctIndex if available (the canonical MCQ form). Also support
    // legacy TRUE_FALSE_NOT_GIVEN questions that store correctAnswer="TRUE"|"FALSE"|"NOT GIVEN"
    // and ship without an explicit options array / correctIndex.
    const given = Number.parseInt(answer, 10);
    if (Number.isInteger(given) && q.correctIndex !== null && given === q.correctIndex) {
      correct = true;
    } else if (type === "TRUE_FALSE_NOT_GIVEN" || type === "TRUE_FALSE") {
      // Fall back to text match: accept both "0/1/2" (true/false/not-given index) and
      // literal "TRUE"/"FALSE"/"NOT GIVEN" strings.
      const expected = (q.correctAnswer || "").toUpperCase().replace(/-/g, " ").trim();
      if (expected) {
        let givenText: string | null = null;
        if (!Number.isNaN(Number(answer)) && answer.length <= 1) {
          const idx = Number(answer);
          const tfnLabels = ["TRUE", "FALSE", "NOT GIVEN"];
          givenText = tfnLabels[idx] ?? null;
        } else {
          givenText = answer.toUpperCase().replace(/-/g, " ").trim();
        }
        if (givenText) {
          // Map synonyms.
          const norm = (s: string) => s.replace(/[^A-Z]/g, "");
          const map: Record<string, string> = {
            T: "TRUE", TRUE: "TRUE", YES: "TRUE", Y: "TRUE",
            F: "FALSE", FALSE: "FALSE", NO: "FALSE", N: "FALSE",
            NG: "NOTGIVEN", NOTGIVEN: "NOTGIVEN", NOTGIVENNOT: "NOTGIVEN",
          };
          const expNorm = map[norm(expected)] || norm(expected);
          const givNorm = map[norm(givenText)] || norm(givenText);
          correct = expNorm === givNorm && expNorm.length > 0;
        }
      }
    }
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
    // Prefer correctIndices (JSON array of indices). Fall back to a single
    // correctIndex for one-to-one matching questions.
    let expected: number[];
    if (q.correctIndices) {
      expected = parseIndices(q.correctIndices).slice().sort((a, b) => a - b);
    } else if (q.correctIndex !== null && q.correctIndex !== undefined) {
      expected = [q.correctIndex];
    } else {
      expected = [];
    }
    let given: number[] = [];
    try {
      const parsed = JSON.parse(answer);
      given = (Array.isArray(parsed) ? parsed : [parsed]).map((v: unknown) => Number(v)).filter((n) => Number.isInteger(n));
    } catch {
      // Single numeric answer as string.
      const n = Number.parseInt(answer.trim(), 10);
      given = Number.isInteger(n) ? [n] : [];
    }
    given.sort((a, b) => a - b);
    correct = expected.length > 0 && given.length === expected.length && given.every((v, i) => v === expected[i]);
  }

  return { ...base, answered: true, correct, awardedPoints: correct ? maxPoints : 0 };
}

/**
 * Does this question carry a usable answer key?
 *
 * A question with no key can never be marked correct, so it must not be
 * served to a student. Used by the selection step to keep ungradeable items
 * out of an attempt (and reported by the question-bank validator so content
 * authors can fix them).
 */
export function hasAnswerKey(q: {
  type: string;
  correctAnswer?: string | null;
  correctIndex?: number | null;
  correctIndices?: string | null;
}): boolean {
  const type = q.type.toUpperCase();

  if (INDEX_TYPES.has(type)) {
    if (q.correctIndex !== null && q.correctIndex !== undefined) return true;
    return (type === "TRUE_FALSE" || type === "TRUE_FALSE_NOT_GIVEN")
      && typeof q.correctAnswer === "string"
      && q.correctAnswer.trim().length > 0;
  }
  if (TEXT_TYPES.has(type)) return typeof q.correctAnswer === "string" && q.correctAnswer.trim().length > 0;
  if (SET_TYPES.has(type)) {
    if (typeof q.correctIndices === "string" && parseIndices(q.correctIndices).length > 0) return true;
    return q.correctIndex !== null && q.correctIndex !== undefined;
  }

  // Subjective work is deliberately retained for separate human review; an
  // unknown type fails closed so it cannot silently produce an unscored item.
  return SUBJECTIVE_TYPES.has(type);
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
