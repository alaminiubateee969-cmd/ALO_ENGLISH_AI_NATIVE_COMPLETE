/**
 * tests/exam-engine.test.ts — Exam grading + timer engine.
 *
 * These tests need no database: grading and the exam clock are pure
 * functions, so they run everywhere (locally and in CI) and prove the
 * scoring rules are real and the timer cannot be tricked by a client clock.
 *
 * Run:  bun test tests/exam-engine.test.ts
 */

import { describe, test, expect } from "bun:test";
import {
  gradeObjective,
  hasAnswerKey,
  isObjective,
  isSubjective,
  normaliseText,
  type GradableQuestion,
} from "../src/lib/exam/grading";
import { computeClock, deadlineFor, resolveExpiry } from "../src/lib/exam/timer";
import { QuestionShortageError } from "../src/lib/exam/selection";

const q = (over: Partial<GradableQuestion> & { id: string }): GradableQuestion => ({
  section: "READING",
  type: "MULTIPLE_CHOICE",
  correctAnswer: null,
  correctIndex: null,
  correctIndices: null,
  options: null,
  points: 1,
  ...over,
});

describe("Grading — objective questions", () => {
  test("multiple choice is graded against the stored correctIndex", () => {
    const questions = [q({ id: "q1", type: "MULTIPLE_CHOICE", correctIndex: 2 })];
    const right = gradeObjective(questions, { q1: "2" });
    const wrong = gradeObjective(questions, { q1: "1" });
    expect(right.correctTotal).toBe(1);
    expect(wrong.correctTotal).toBe(0);
  });

  test("TRUE_FALSE_NOT_GIVEN is graded (regression: was silently skipped)", () => {
    const questions = [
      q({ id: "q1", type: "TRUE_FALSE_NOT_GIVEN", correctIndex: 1 }),
      q({ id: "q2", type: "TRUE_FALSE", correctIndex: 0 }),
    ];
    const result = gradeObjective(questions, { q1: "1", q2: "0" });
    // Both types are recognised, so both count toward the objective total.
    expect(result.objectiveTotal).toBe(2);
    expect(result.correctTotal).toBe(2);
  });

  test("fill-in-the-blank ignores case, spacing and trailing punctuation", () => {
    const questions = [q({ id: "q1", type: "FILL_BLANK", correctAnswer: "Climate Change" })];
    expect(gradeObjective(questions, { q1: "  climate  change. " }).correctTotal).toBe(1);
    expect(gradeObjective(questions, { q1: "climate" }).correctTotal).toBe(0);
  });

  test("fill-in-the-blank accepts every published alternative answer", () => {
    const questions = [q({ id: "q1", type: "FILL_BLANK", correctAnswer: "colour|color" })];
    expect(gradeObjective(questions, { q1: "color" }).correctTotal).toBe(1);
    expect(gradeObjective(questions, { q1: "colour" }).correctTotal).toBe(1);
    expect(gradeObjective(questions, { q1: "paint" }).correctTotal).toBe(0);
  });

  test("listening and reading are scored as separate sections", () => {
    const questions = [
      q({ id: "l1", section: "LISTENING", type: "MULTIPLE_CHOICE", correctIndex: 1 }),
      q({ id: "l2", section: "LISTENING", type: "MULTIPLE_CHOICE", correctIndex: 1 }),
      q({ id: "r1", section: "READING", type: "MULTIPLE_CHOICE", correctIndex: 3 }),
    ];
    const result = gradeObjective(questions, { l1: "1", l2: "0", r1: "3" });
    expect(result.bySection.LISTENING).toEqual({
      section: "LISTENING",
      correct: 1,
      total: 2,
      awardedPoints: 1,
      maxPoints: 2,
    });
    expect(result.bySection.READING.correct).toBe(1);
    // Regression: the old submit route copied the reading count into
    // listening, so the two sections could never differ.
    expect(result.bySection.LISTENING.correct).not.toBe(result.bySection.READING.correct + 1);
  });

  test("unanswered questions count as incorrect, never as correct", () => {
    const questions = [q({ id: "q1", type: "MULTIPLE_CHOICE", correctIndex: 0 })];
    const result = gradeObjective(questions, { q1: "   " });
    expect(result.perQuestion[0]?.answered).toBe(false);
    expect(result.correctTotal).toBe(0);
  });

  test("essay and speaking are routed to the AI evaluator, not scored here", () => {
    expect(isSubjective({ type: "ESSAY" })).toBe(true);
    expect(isSubjective({ type: "SPEAKING" })).toBe(true);
    expect(isObjective({ type: "ESSAY" })).toBe(false);
    expect(isObjective({ type: "SPEAKING" })).toBe(false);
  });

  test("question weights are honoured", () => {
    const questions = [q({ id: "q1", points: 3, correctIndex: 1 })];
    expect(gradeObjective(questions, { q1: "1" }).perQuestion[0]?.awardedPoints).toBe(3);
  });

  test("normaliseText collapses whitespace, case and trailing punctuation", () => {
    expect(normaliseText("  Hello   World. ")).toBe("hello world");
  });
});

describe("Timer — server authoritative", () => {
  const startedAt = new Date("2026-01-01T10:00:00.000Z");

  test("remaining time comes from persisted timestamps, not the browser", () => {
    const expiresAt = deadlineFor(startedAt, 60); // 10:60 -> 11:00
    const clock = computeClock({ startedAt, expiresAt, durationMin: 60 }, new Date("2026-01-01T10:30:00.000Z"));
    expect(clock.remainingSec).toBe(1800);
    expect(clock.durationSec).toBe(3600);
    expect(clock.expired).toBe(false);
  });

  test("an attempt is expired once the server deadline passes", () => {
    const clock = computeClock(
      { startedAt, expiresAt: deadlineFor(startedAt, 60), durationMin: 60 },
      new Date("2026-01-01T11:00:01.000Z")
    );
    expect(clock.expired).toBe(true);
    expect(clock.remainingSec).toBe(0);
  });

  test("remaining time never goes negative", () => {
    const clock = computeClock(
      { startedAt, expiresAt: deadlineFor(startedAt, 5), durationMin: 5 },
      new Date("2026-01-01T23:00:00.000Z")
    );
    expect(clock.remainingSec).toBe(0);
  });

  test("a missing expiresAt falls back to startedAt + duration", () => {
    const expiry = resolveExpiry({ startedAt, expiresAt: null, durationMin: 30 });
    expect(expiry?.toISOString()).toBe("2026-01-01T10:30:00.000Z");
  });

  test("deadlineFor enforces a minimum duration", () => {
    expect(deadlineFor(startedAt, 0).getTime()).toBe(startedAt.getTime() + 60_000);
  });
});

describe("Selection — shortage is a controlled condition", () => {
  test("QuestionShortageError carries machine-readable detail", () => {
    const err = new QuestionShortageError({
      requiredCount: 40,
      eligibleCount: 10,
      poolSize: 12,
      reusedQuestionIds: ["a", "b"],
      reason: "BANK_TOO_SMALL",
    });
    expect(err.code).toBe("QUESTION_BANK_SHORTAGE");
    expect(err.shortage.reason).toBe("BANK_TOO_SMALL");
    expect(err.shortage.requiredCount).toBe(40);
    expect(err.shortage.poolSize).toBe(12);
  });
});

describe("Selection — ungradeable questions are never served", () => {
  test("an objective question with no key is rejected", () => {
    expect(hasAnswerKey({ type: "MULTIPLE_CHOICE", correctIndex: null })).toBe(false);
    expect(hasAnswerKey({ type: "TRUE_FALSE_NOT_GIVEN", correctIndex: null })).toBe(false);
    expect(hasAnswerKey({ type: "FILL_BLANK", correctAnswer: null })).toBe(false);
    expect(hasAnswerKey({ type: "FILL_BLANK", correctAnswer: "   " })).toBe(false);
    expect(hasAnswerKey({ type: "MATCHING", correctIndices: null })).toBe(false);
  });

  test("a keyed objective question is accepted", () => {
    expect(hasAnswerKey({ type: "MULTIPLE_CHOICE", correctIndex: 0 })).toBe(true);
    expect(hasAnswerKey({ type: "FILL_BLANK", correctAnswer: "climate" })).toBe(true);
    expect(hasAnswerKey({ type: "MATCHING", correctIndices: "[1,2]" })).toBe(true);
  });

  test("subjective questions are always served (an evaluator marks them)", () => {
    expect(hasAnswerKey({ type: "ESSAY" })).toBe(true);
    expect(hasAnswerKey({ type: "SPEAKING" })).toBe(true);
  });
});
