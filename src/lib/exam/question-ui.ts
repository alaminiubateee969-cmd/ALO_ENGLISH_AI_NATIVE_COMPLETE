/**
 * src/lib/exam/question-ui.ts
 *
 * Which answer control the exam player renders for each question type.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The practice-test page used to hard-code the type lists for its radio,
 * text-input and textarea branches. The lists covered only the types the
 * original hand-written seeds used. The daily/agent pipeline legitimately
 * publishes the rest of the canonical vocabulary (READING_MCQ,
 * LISTEN_AND_SELECT, SUMMARY_COMPLETION, WRITING_TASK1, …) — and every one
 * of those questions rendered with NO answer control at all: visible,
 * timed, and impossible to answer.
 *
 * This module derives the control from the same canonical vocabulary the
 * grader uses (./question-types.json), so "the grader can grade it" and
 * "the student can answer it" can never drift apart again. A unit test
 * asserts every canonical type maps to a real control.
 */

import QUESTION_TYPES from "./question-types.json";

export type QuestionInputKind = "options" | "text" | "long-text" | "speaking";

const INDEX_TYPES = new Set<string>(QUESTION_TYPES.indexTypes);
const TEXT_TYPES = new Set<string>(QUESTION_TYPES.textTypes);
const SET_TYPES = new Set<string>(QUESTION_TYPES.setTypes);

/**
 * The answer control for a question type.
 *
 * - "options"   pick one of the published options (index-graded and the
 *               single-answer matching/labeling forms the banks use)
 * - "text"      short free-text answer (text-graded)
 * - "long-text" essay-style response with a word counter (subjective)
 * - "speaking"  spoken-response transcript box (subjective)
 *
 * Unknown types fall back to "text" so the student is never faced with a
 * question that has no input. (Selection already fail-closes unknown
 * objective types out of an attempt; this is defence in depth.)
 */
export function questionInputKind(type: string): QuestionInputKind {
  const t = String(type ?? "").toUpperCase().replace(/-/g, "_");
  if (INDEX_TYPES.has(t) || SET_TYPES.has(t)) return "options";
  if (TEXT_TYPES.has(t)) return "text";
  if (t === "SPEAKING") return "speaking";
  if (t === "ESSAY" || t === "CHART_DESCRIPTION" || t === "WRITING_TASK1" || t === "WRITING_TASK2") {
    return "long-text";
  }
  return "text";
}

/** Every canonical question type the platform recognises. */
export const ALL_QUESTION_TYPES: string[] = [
  ...QUESTION_TYPES.indexTypes,
  ...QUESTION_TYPES.textTypes,
  ...QUESTION_TYPES.setTypes,
  ...QUESTION_TYPES.subjectiveTypes,
];

/** Parse the stored JSON options column; never throws. */
export function parseQuestionOptions(options: string | null | undefined): string[] {
  if (!options) return [];
  try {
    const parsed: unknown = JSON.parse(options);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value));
  } catch {
    return [];
  }
}

/** Suggested minimum word target shown for long-text (subjective) tasks. */
export function longTextWordTarget(type: string, wordLimit?: number | null): number {
  if (wordLimit && wordLimit > 0) return wordLimit;
  const t = String(type ?? "").toUpperCase().replace(/-/g, "_");
  return t === "WRITING_TASK2" || t === "ESSAY" ? 250 : 150;
}

/** Human-readable label for the type chip in the exam player. */
export function questionTypeLabel(type: string): string {
  return String(type ?? "").replace(/_/g, " ").trim().toLowerCase();
}
