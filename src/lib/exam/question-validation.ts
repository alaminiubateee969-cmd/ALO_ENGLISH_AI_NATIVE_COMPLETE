/**
 * src/lib/exam/question-validation.ts
 *
 * Structural validation for admin-authored questions. Mirrors the grading
 * semantics in grading.ts (same canonical vocabulary from
 * question-types.json) so anything that passes this validator is serviceable
 * by the exam engine: objective items always carry an answer key the grader
 * can use, subjective items never pretend to have one.
 *
 * Pure module — no I/O — so both the admin API routes and the client editor
 * can share it.
 */

import QUESTION_TYPES from "./question-types.json";

export const INDEX_TYPES = new Set<string>(QUESTION_TYPES.indexTypes);
export const TEXT_TYPES = new Set<string>(QUESTION_TYPES.textTypes);
export const SET_TYPES = new Set<string>(QUESTION_TYPES.setTypes);
export const SUBJECTIVE_TYPES = new Set<string>(QUESTION_TYPES.subjectiveTypes);
export const ALL_QUESTION_TYPES = new Set<string>([
  ...INDEX_TYPES,
  ...TEXT_TYPES,
  ...SET_TYPES,
  ...SUBJECTIVE_TYPES,
]);

export type QuestionDraft = {
  section?: unknown;
  type?: unknown;
  prompt?: unknown;
  passage?: unknown;
  audioUrl?: unknown;
  imageUrl?: unknown;
  options?: unknown;
  correctIndex?: unknown;
  correctAnswer?: unknown;
  correctIndices?: unknown;
  wordLimit?: unknown;
  points?: unknown;
  order?: unknown;
};

export type NormalisedQuestion = {
  section: string;
  type: string;
  prompt: string;
  passage: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  options: string | null; // JSON string, as stored in the DB
  correctIndex: number | null;
  correctAnswer: string | null;
  correctIndices: string | null; // JSON string, as stored in the DB
  wordLimit: number | null;
  points: number;
  order: number;
};

export type ValidationResult =
  | { ok: true; value: NormalisedQuestion }
  | { ok: false; issues: string[] };

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asOptionalText(v: unknown): string | null {
  const s = asString(v);
  return s !== null && s.trim().length > 0 ? s : null;
}

function asStringArray(v: unknown): string[] | null {
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v as string[];
  if (typeof v === "string" && v.trim().length > 0) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function asIndexArray(v: unknown): number[] | null {
  if (Array.isArray(v) && v.every((x) => Number.isInteger(x))) return v as number[];
  if (typeof v === "string" && v.trim().length > 0) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed) && parsed.every((x) => Number.isInteger(x))) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Validate and normalise a question draft. Unknown/garbage fields fail closed
 * with a list of human-readable issues rather than being silently coerced.
 */
export function validateQuestionDraft(draft: QuestionDraft): ValidationResult {
  const issues: string[] = [];

  const type = (asString(draft.type) ?? "").trim().toUpperCase();
  if (!ALL_QUESTION_TYPES.has(type)) {
    issues.push(`type "${asString(draft.type) ?? ""}" is not a canonical question type`);
  }

  const section = (asString(draft.section) ?? "").trim();
  if (section.length === 0) issues.push("section is required");

  const prompt = (asString(draft.prompt) ?? "").trim();
  if (prompt.length < 3) issues.push("prompt must be at least 3 characters");

  const points = draft.points === undefined || draft.points === null ? 1 : Number(draft.points);
  if (!Number.isInteger(points) || points < 1 || points > 100) {
    issues.push("points must be an integer between 1 and 100");
  }

  const order = draft.order === undefined || draft.order === null ? 0 : Number(draft.order);
  if (!Number.isInteger(order) || order < 0) issues.push("order must be a non-negative integer");

  const wordLimitRaw = draft.wordLimit === undefined || draft.wordLimit === null ? null : Number(draft.wordLimit);
  if (wordLimitRaw !== null && (!Number.isInteger(wordLimitRaw) || wordLimitRaw < 1 || wordLimitRaw > 10000)) {
    issues.push("wordLimit must be an integer between 1 and 10000");
  }

  const optionsArr = draft.options === undefined || draft.options === null ? null : asStringArray(draft.options);
  if (draft.options !== undefined && draft.options !== null && optionsArr === null) {
    issues.push("options must be an array of strings");
  }
  const trimmedOptions = optionsArr?.map((o) => o.trim()) ?? null;
  if (trimmedOptions && trimmedOptions.some((o) => o.length === 0)) {
    issues.push("options must not contain empty entries");
  }

  const correctIndexRaw =
    draft.correctIndex === undefined || draft.correctIndex === null ? null : Number(draft.correctIndex);
  if (correctIndexRaw !== null && !Number.isInteger(correctIndexRaw)) {
    issues.push("correctIndex must be an integer");
  }

  const correctIndicesArr =
    draft.correctIndices === undefined || draft.correctIndices === null
      ? null
      : asIndexArray(draft.correctIndices);
  if (draft.correctIndices !== undefined && draft.correctIndices !== null && correctIndicesArr === null) {
    issues.push("correctIndices must be an array of integers");
  }

  const correctAnswer = asOptionalText(draft.correctAnswer);

  // ── Per-kind key rules, mirroring grading.hasAnswerKey ──────────────────
  if (INDEX_TYPES.has(type)) {
    if (!trimmedOptions || trimmedOptions.length < 2) {
      issues.push(`${type} requires at least 2 options`);
    }
    const hasIndexKey = correctIndexRaw !== null && Number.isInteger(correctIndexRaw);
    const hasTextKeyForTf =
      (type === "TRUE_FALSE" || type === "TRUE_FALSE_NOT_GIVEN") && correctAnswer !== null;
    if (!hasIndexKey && !hasTextKeyForTf) {
      issues.push(
        type === "TRUE_FALSE" || type === "TRUE_FALSE_NOT_GIVEN"
          ? `${type} requires correctIndex or a correctAnswer of True/False${type === "TRUE_FALSE_NOT_GIVEN" ? "/Not Given" : ""}`
          : `${type} requires correctIndex`,
      );
    }
    if (hasIndexKey && trimmedOptions && (correctIndexRaw! < 0 || correctIndexRaw! >= trimmedOptions.length)) {
      issues.push("correctIndex is out of range for the supplied options");
    }
  } else if (TEXT_TYPES.has(type)) {
    if (correctAnswer === null) issues.push(`${type} requires a non-empty correctAnswer`);
  } else if (SET_TYPES.has(type)) {
    if (!trimmedOptions || trimmedOptions.length < 2) {
      issues.push(`${type} requires at least 2 options`);
    }
    const hasSetKey = correctIndicesArr !== null && correctIndicesArr.length > 0;
    const hasIndexKey = correctIndexRaw !== null && Number.isInteger(correctIndexRaw);
    if (!hasSetKey && !hasIndexKey) {
      issues.push(`${type} requires correctIndices (or correctIndex for a single match)`);
    }
    if (hasSetKey && trimmedOptions) {
      const unique = new Set(correctIndicesArr!);
      if (unique.size !== correctIndicesArr!.length) issues.push("correctIndices must not contain duplicates");
      if (correctIndicesArr!.some((i) => i < 0 || i >= trimmedOptions.length)) {
        issues.push("correctIndices contains an index outside the options range");
      }
    }
    if (hasIndexKey && trimmedOptions && (correctIndexRaw! < 0 || correctIndexRaw! >= trimmedOptions.length)) {
      issues.push("correctIndex is out of range for the supplied options");
    }
  } else if (SUBJECTIVE_TYPES.has(type)) {
    // No key required; keys are ignored by the grader for subjective work.
  }

  if (issues.length > 0) return { ok: false, issues };

  const isObjective = INDEX_TYPES.has(type) || TEXT_TYPES.has(type) || SET_TYPES.has(type);
  return {
    ok: true,
    value: {
      section,
      type,
      prompt,
      passage: asOptionalText(draft.passage),
      audioUrl: asOptionalText(draft.audioUrl),
      imageUrl: asOptionalText(draft.imageUrl),
      options: trimmedOptions && trimmedOptions.length > 0 ? JSON.stringify(trimmedOptions) : null,
      correctIndex: isObjective ? correctIndexRaw : null,
      correctAnswer: isObjective ? correctAnswer : asOptionalText(draft.correctAnswer),
      correctIndices:
        correctIndicesArr && correctIndicesArr.length > 0 ? JSON.stringify(correctIndicesArr) : null,
      wordLimit: wordLimitRaw,
      points,
      order,
    },
  };
}
