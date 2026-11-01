/**
 * tests/question-validation.test.ts
 *
 * The admin question validator must accept exactly what the grader can grade
 * and fail closed on everything else.
 */

import { describe, expect, test } from "bun:test";
import { ALL_QUESTION_TYPES, validateQuestionDraft } from "../src/lib/exam/question-validation";

describe("validateQuestionDraft", () => {
  test("accepts a well-formed multiple-choice question", () => {
    const r = validateQuestionDraft({
      section: "READING",
      type: "multiple_choice",
      prompt: "Which option is correct?",
      options: ["A", "B", "C"],
      correctIndex: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.type).toBe("MULTIPLE_CHOICE");
      expect(r.value.options).toBe(JSON.stringify(["A", "B", "C"]));
      expect(r.value.correctIndex).toBe(1);
      expect(r.value.points).toBe(1);
    }
  });

  test("rejects an index question without a key or with an out-of-range key", () => {
    expect(
      validateQuestionDraft({ section: "READING", type: "MULTIPLE_CHOICE", prompt: "Pick one?", options: ["A", "B"] }).ok,
    ).toBe(false);
    expect(
      validateQuestionDraft({
        section: "READING",
        type: "MULTIPLE_CHOICE",
        prompt: "Pick one?",
        options: ["A", "B"],
        correctIndex: 2,
      }).ok,
    ).toBe(false);
  });

  test("accepts TRUE_FALSE keyed by correctAnswer text (grader fallback)", () => {
    const r = validateQuestionDraft({
      section: "READING",
      type: "TRUE_FALSE",
      prompt: "The sky is green.",
      options: ["True", "False"],
      correctAnswer: "False",
    });
    expect(r.ok).toBe(true);
  });

  test("requires correctAnswer for text types", () => {
    expect(validateQuestionDraft({ section: "READING", type: "FILL_BLANK", prompt: "Fill ___" }).ok).toBe(false);
    expect(
      validateQuestionDraft({ section: "READING", type: "FILL_BLANK", prompt: "Fill ___", correctAnswer: "word" }).ok,
    ).toBe(true);
  });

  test("requires unique in-range correctIndices for set types", () => {
    const base = { section: "READING", type: "MATCHING", prompt: "Match them", options: ["A", "B", "C"] };
    expect(validateQuestionDraft({ ...base, correctIndices: [0, 2] }).ok).toBe(true);
    expect(validateQuestionDraft({ ...base, correctIndices: [1, 1] }).ok).toBe(false);
    expect(validateQuestionDraft({ ...base, correctIndices: [3] }).ok).toBe(false);
    expect(validateQuestionDraft(base).ok).toBe(false);
  });

  test("subjective types need no key", () => {
    expect(
      validateQuestionDraft({ section: "WRITING", type: "WRITING_TASK2", prompt: "Discuss both views." }).ok,
    ).toBe(true);
  });

  test("rejects unknown types and empty prompts", () => {
    expect(validateQuestionDraft({ section: "READING", type: "DRAG_DROP", prompt: "Do something" }).ok).toBe(false);
    expect(validateQuestionDraft({ section: "READING", type: "ESSAY", prompt: "" }).ok).toBe(false);
  });

  test("canonical vocabulary totals 19 types", () => {
    expect(ALL_QUESTION_TYPES.size).toBe(19);
  });
});
