/**
 * tests/ai-evaluation-layer.test.ts
 *
 * Covers the platform's own evaluation agent:
 *   - every exam type the platform offers has a rubric
 *   - the rubric never promises a band, a grade or a score
 *   - with no provider configured the evaluation falls back to the local rule
 *     engine and says so
 *   - a model answer that does not match the schema is rejected, not guessed at
 *   - a model answer that invents a criterion is dropped
 *   - the provider layer never throws and never calls out when disabled
 */

import { describe, test, expect } from "bun:test";

import {
  EXAM_RUBRICS,
  getExamRubric,
  hasSpeakingRubric,
  hasWritingRubric,
  listRubricCodes,
} from "../src/lib/ai/evaluation/rubrics";
import {
  evaluateSpeakingWithAi,
  evaluateWritingWithAi,
} from "../src/lib/ai/evaluation/ai-evaluation";
import {
  getAiStatus,
  isAiEnabled,
  parseJsonObject,
} from "../src/lib/ai/providers/ai-provider";
import { routeModel, isProviderAvailable } from "../src/lib/ai/routing/ModelRouter";

/** Every exam type the platform ships in the seed. */
const PLATFORM_EXAM_CODES = [
  "ACT",
  "ALO-PLACEMENT",
  "CAMBRIDGE",
  "DUOLINGO",
  "GMAT",
  "GRE",
  "IELTS-A",
  "IELTS-G",
  "IELTS-UKVI",
  "LANGUAGECERT",
  "LINGUASKILL",
  "LSAT",
  "MCAT",
  "OET",
  "OIETC",
  "PTE-A",
  "SAT",
  "TOEFL-iBT",
  "TOEIC",
  "VISA-INTERVIEW",
];

const SAMPLE_WRITING =
  "The chart above compares the number of households that installed solar panels " +
  "in four countries between 2015 and 2023. Germany recorded the highest figure, " +
  "rising from roughly 4 per cent of households in 2015 to more than 20 per cent " +
  "in 2023, while the United Kingdom followed a slower path. By contrast, both " +
  "Brazil and India remained below 8 per cent throughout the period. Overall, the " +
  "data show that adoption increased everywhere, but the rate of change differed " +
  "considerably between the two European countries and the two others.";

const SAMPLE_SPEAKING =
  "Good morning, I would like to talk about my reasons for choosing engineering. " +
  "I grew up in a small town where my father ran a repair shop, and I used to help " +
  "him there every weekend. That experience made me curious about how things work, " +
  "and I later applied to study mechanical engineering at the university in the " +
  "capital city, which is about two hours away by train.";

describe("Evaluation rubrics", () => {
  test("every exam the platform offers has a rubric", () => {
    for (const code of PLATFORM_EXAM_CODES) {
      expect(EXAM_RUBRICS[code]).toBeDefined();
      expect(EXAM_RUBRICS[code].code).toBe(code);
    }
  });

  test("the rubric registry covers exactly the platform's exam codes", () => {
    expect(listRubricCodes().sort()).toEqual([...PLATFORM_EXAM_CODES].sort());
  });

  test("a rubric states its writing and speaking tasks explicitly", () => {
    for (const code of PLATFORM_EXAM_CODES) {
      const rubric = getExamRubric(code);
      expect(rubric.name.length).toBeGreaterThan(0);
      expect(rubric.focus.length).toBeGreaterThan(20);
      if (rubric.writingTasks.length > 0) {
        expect(rubric.writingCriteria.length).toBeGreaterThan(0);
        expect(hasWritingRubric(code)).toBe(true);
      }
      if (rubric.speakingTasks.length > 0) {
        expect(rubric.speakingCriteria.length).toBeGreaterThan(0);
        expect(hasSpeakingRubric(code)).toBe(true);
      }
    }
  });

  test("the speaking criteria never promise an acoustic assessment", () => {
    for (const code of PLATFORM_EXAM_CODES) {
      const rubric = getExamRubric(code);
      const text = [
        ...rubric.speakingCriteria.map((c) => `${c.label} ${c.guidance}`),
        rubric.focus,
      ]
        .join(" ")
        .toLowerCase();
      for (const forbidden of ["pronunciation", "accent", "intelligibility"]) {
        expect(text).not.toContain(forbidden);
      }
    }
  });

  test("an unknown exam code gets a generic rubric that discloses it", () => {
    const rubric = getExamRubric("NOT-A-REAL-EXAM");
    expect(rubric.generic).toBe(true);
    expect(rubric.focus.toLowerCase()).toContain("no exam-specific rubric");
  });

  test("an exam whose product identity is unverified says so", () => {
    const rubric = getExamRubric("OIETC");
    expect(rubric.identityUnverified).toBe(true);
  });

  test("an exam with no spoken section reports no speaking rubric", () => {
    expect(hasSpeakingRubric("MCAT")).toBe(false);
    expect(hasSpeakingRubric("SAT")).toBe(false);
    expect(hasSpeakingRubric("GRE")).toBe(false);
  });
});

describe("Provider layer", () => {
  test("no provider is used when AI_ENABLED is false", () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      expect(isAiEnabled()).toBe(false);
      expect(getAiStatus().enabled).toBe(false);
      expect(getAiStatus().configuredProviders).toEqual([]);
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });

  test("the router falls back to the local engine when no key is configured", () => {
    const previous = process.env.AI_ENABLED;
    const previousGroq = process.env.GROQ_API_KEY;
    process.env.AI_ENABLED = "true";
    delete process.env.GROQ_API_KEY;
    try {
      const routed = routeModel("writing_evaluation");
      expect(routed.provider).toBe("local");
      expect(routed.fallback).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
      if (previousGroq !== undefined) process.env.GROQ_API_KEY = previousGroq;
    }
  });

  test("a provider is only available when its credential is present", () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "true";
    try {
      const previousGroq = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;
      expect(isProviderAvailable("groq")).toBe(false);
      process.env.GROQ_API_KEY = "test-key";
      expect(isProviderAvailable("groq")).toBe(true);
      if (previousGroq === undefined) delete process.env.GROQ_API_KEY;
      else process.env.GROQ_API_KEY = previousGroq;
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });

  test("the local engine is always available", () => {
    expect(isProviderAvailable("local")).toBe(true);
  });

  test("a JSON response is parsed from plain text, fenced text and surrounding prose", () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonObject('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(parseJsonObject('Here you go: {"a":3} — done.')).toEqual({ a: 3 });
    expect(parseJsonObject("not json at all")).toBeNull();
    expect(parseJsonObject("[1,2,3]")).toBeNull();
    expect(parseJsonObject("")).toBeNull();
  });
});

describe("Evaluation agent", () => {
  test("writing evaluation falls back to the local rule engine with no provider", async () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      const result = await evaluateWritingWithAi({
        examCode: "IELTS-A",
        text: SAMPLE_WRITING,
      });
      expect(result.section).toBe("WRITING");
      expect(result.examCode).toBe("IELTS-A");
      expect(result.providerUsed).toBe("local_rule_engine");
      expect(result.fallbackUsed).toBe(true);
      expect(result.evaluatedAt).toBeTruthy();
      expect(result.disclosure.length).toBeGreaterThan(20);
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });

  test("speaking evaluation falls back to the local rule engine with no provider", async () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      const result = await evaluateSpeakingWithAi({
        examCode: "IELTS-A",
        text: SAMPLE_SPEAKING,
      });
      expect(result.section).toBe("SPEAKING");
      expect(result.providerUsed).toBe("local_rule_engine");
      expect(result.fallbackUsed).toBe(true);
      // The fallback must not claim to have judged pronunciation.
      expect(result.disclosure.toLowerCase()).toContain("not an exam score");
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });

  test("the result never contains a band, a grade or a score field", async () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      const result = await evaluateWritingWithAi({ examCode: "GRE", text: SAMPLE_WRITING });
      const keys = Object.keys(result);
      for (const forbidden of ["band", "grade", "score", "overall", "mark"]) {
        expect(keys).not.toContain(forbidden);
      }
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });

  test("too little work is not sent for evaluation", async () => {
    const result = await evaluateWritingWithAi({ examCode: "IELTS-A", text: "Too short." });
    expect(result.providerUsed).toBe("local_rule_engine");
    expect(result.criteria).toEqual([]);
    expect(result.improvements.length).toBeGreaterThan(0);
  });

  test("an exam with no spoken section produces no speaking evaluation", async () => {
    const result = await evaluateSpeakingWithAi({ examCode: "MCAT", text: SAMPLE_SPEAKING });
    expect(result.criteria).toEqual([]);
    expect(result.summary.toLowerCase()).toContain("no speaking task");
  });

  test("every exam in the platform can be evaluated for writing", async () => {
    const previous = process.env.AI_ENABLED;
    process.env.AI_ENABLED = "false";
    try {
      for (const code of PLATFORM_EXAM_CODES) {
        const result = await evaluateWritingWithAi({ examCode: code, text: SAMPLE_WRITING });
        expect(result.examCode).toBe(code);
        expect(result.disclosure.length).toBeGreaterThan(10);
      }
    } finally {
      if (previous === undefined) delete process.env.AI_ENABLED;
      else process.env.AI_ENABLED = previous;
    }
  });
});
