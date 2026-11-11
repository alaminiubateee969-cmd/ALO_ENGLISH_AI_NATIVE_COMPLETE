import { describe, expect, test } from "bun:test";
import { evaluateWriting } from "../src/lib/agents/WritingEvaluationAgent";
import { evaluateSpeaking } from "../src/lib/agents/SpeakingEvaluationAgent";
import { evaluateInterview } from "../src/lib/agents/InterviewSimulationAgent";

describe("Writing feedback disclosure and output", () => {
  test("returns generic suggestions without a band, dimension scores, or confidence", () => {
    const result = evaluateWriting(
      "Many students use online learning. However, careful planning can help them study effectively.\n\nFor example, learners can set a regular schedule and review their progress."
    );

    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.improvementPlan.length).toBeGreaterThan(0);
    expect(result.providerUsed).toBe("local_rule_engine");
    expect(result.disclaimer.toLowerCase()).toContain("not an exam score");
    expect(result).not.toHaveProperty("estimatedBand");
    expect(result).not.toHaveProperty("grammar");
    expect(result).not.toHaveProperty("confidenceScore");
  });

  test("empty writing returns a prompt without fabricating an assessment", () => {
    const result = evaluateWriting("   ");
    expect(result.wordCount).toBe(0);
    expect(result.improvementPlan).toEqual(["Write a response before requesting text-only feedback."]);
  });
});

describe("Interview practice disclosure and output", () => {
  test("returns topic prompts without eligibility, risk, confidence, or score fields", () => {
    const result = evaluateInterview([
      { question: "Why this course?", answer: "I reviewed the course modules and my career goals." },
    ], "visa");

    expect(result.topicsMentioned).toContain("course");
    expect(result.disclaimer).toContain("does not assess eligibility, risk, or likely outcomes");
    expect(result).not.toHaveProperty("riskLevel");
    expect(result).not.toHaveProperty("confidenceScore");
    expect(result).not.toHaveProperty("financialExplanationQuality");
  });
});

describe("Speaking transcript feedback disclosure and output", () => {
  test("does not return acoustic, pronunciation, fluency, or numeric scores", () => {
    const result = evaluateSpeaking("I think education can be useful. For example, students can practise every day.");

    expect(result.transcriptWordCount).toBeGreaterThan(0);
    expect(result.improvementTips.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain("No speaking score");
    expect(result).not.toHaveProperty("pronunciation");
    expect(result).not.toHaveProperty("fluency");
    expect(result).not.toHaveProperty("estimatedBand");
    expect(result).not.toHaveProperty("confidenceScore");
  });

  test("empty transcript explicitly reports no transcript-only feedback", () => {
    const result = evaluateSpeaking("");
    expect(result.transcriptWordCount).toBe(0);
    expect(result.improvementTips[0]).toContain("No transcript was provided");
  });
});
