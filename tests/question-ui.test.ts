/**
 * tests/question-ui.test.ts
 *
 * The exam player must be able to render an answer control for EVERY
 * canonical question type. This regressed once: the page hard-coded the
 * types used by the original seeds, so questions published through the
 * daily/agent pipeline (READING_MCQ, LISTEN_AND_SELECT, WRITING_TASK1, …)
 * rendered with no input at all. The mapping now derives from the shared
 * question-types.json vocabulary; this test fails if a future type is
 * added to the vocabulary without UI coverage.
 */
import { describe, expect, test } from "bun:test";
import {
  ALL_QUESTION_TYPES,
  longTextWordTarget,
  parseQuestionOptions,
  questionInputKind,
} from "../src/lib/exam/question-ui";
import { isObjective, isSubjective } from "../src/lib/exam/grading";

describe("Question UI coverage", () => {
  test("the canonical vocabulary is non-trivial", () => {
    expect(ALL_QUESTION_TYPES.length).toBeGreaterThanOrEqual(19);
  });

  test("every canonical type maps to a concrete answer control", () => {
    for (const type of ALL_QUESTION_TYPES) {
      const kind = questionInputKind(type);
      expect(["options", "text", "long-text", "speaking"]).toContain(kind);
    }
  });

  test("objective index/set types use options; objective text types use a text box", () => {
    for (const type of ["MULTIPLE_CHOICE", "TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "READING_MCQ", "READ_AND_SELECT", "LISTEN_AND_SELECT", "MATCHING", "LABELING"]) {
      expect(questionInputKind(type)).toBe("options");
    }
    for (const type of ["FILL_BLANK", "SHORT_ANSWER", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "WRITE_FROM_DICTATION", "COMPLETE_THE_SENTENCE"]) {
      expect(questionInputKind(type)).toBe("text");
    }
  });

  test("subjective types use long-text or speaking controls", () => {
    expect(questionInputKind("ESSAY")).toBe("long-text");
    expect(questionInputKind("CHART_DESCRIPTION")).toBe("long-text");
    expect(questionInputKind("WRITING_TASK1")).toBe("long-text");
    expect(questionInputKind("WRITING_TASK2")).toBe("long-text");
    expect(questionInputKind("SPEAKING")).toBe("speaking");
  });

  test("grader classification and UI classification agree", () => {
    for (const type of ALL_QUESTION_TYPES) {
      const kind = questionInputKind(type);
      if (isObjective({ type })) {
        expect(["options", "text"]).toContain(kind);
      }
      if (isSubjective({ type })) {
        expect(["long-text", "speaking"]).toContain(kind);
      }
    }
  });

  test("an unknown type still gets an input (never an unanswerable question)", () => {
    expect(questionInputKind("SOME_FUTURE_TYPE")).toBe("text");
    expect(questionInputKind("")).toBe("text");
  });

  test("type matching is case/hyphen tolerant", () => {
    expect(questionInputKind("reading-mcq")).toBe("options");
    expect(questionInputKind("Writing-Task2")).toBe("long-text");
  });
});

describe("Question UI helpers", () => {
  test("options parsing never throws", () => {
    expect(parseQuestionOptions('["a","b"]')).toEqual(["a", "b"]);
    expect(parseQuestionOptions("not json")).toEqual([]);
    expect(parseQuestionOptions(null)).toEqual([]);
    expect(parseQuestionOptions('{"a":1}')).toEqual([]);
    expect(parseQuestionOptions("[1,2]")).toEqual(["1", "2"]);
  });

  test("long-text word targets respect an explicit word limit", () => {
    expect(longTextWordTarget("ESSAY", null)).toBe(250);
    expect(longTextWordTarget("WRITING_TASK1", null)).toBe(150);
    expect(longTextWordTarget("ESSAY", 300)).toBe(300);
  });
});
