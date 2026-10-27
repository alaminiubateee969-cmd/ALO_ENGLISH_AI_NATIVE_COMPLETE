/**
 * tests/ai-teachers.test.ts
 *
 * The AI teacher faculty: persona integrity and the grounded fallback
 * (answers must work with zero AI providers configured).
 */

import { describe, expect, test } from "bun:test";
import { AI_TEACHERS } from "../src/lib/agents/AITeachers";
import { answerQuestion } from "../src/lib/ai/teachers/TeacherEngine";

describe("AI teachers — personas", () => {
  test("twelve specialists with unique ids and honest disclosure", () => {
    expect(AI_TEACHERS).toHaveLength(12);
    const ids = AI_TEACHERS.map((t) => t.id);
    expect(new Set(ids).size).toBe(12);
    for (const t of AI_TEACHERS) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.subject.length).toBeGreaterThan(0);
      expect(t.greeting).toMatch(/AI teacher/i);
      expect(t.defaultAdvice.length).toBeGreaterThan(80);
      expect(t.tips.length).toBeGreaterThan(0);
    }
  });

  test("every major exam subject is covered", () => {
    const subjects = AI_TEACHERS.map((t) => t.subject).join(" | ").toLowerCase();
    for (const expected of ["grammar", "vocabulary", "listening", "reading", "writing", "speaking", "toefl", "pte", "duolingo", "oet", "gre", "planning"]) {
      expect(subjects).toContain(expected);
    }
  });
});

describe("AI teachers — grounded fallback (no provider configured)", () => {
  test("a keyword question gets the teacher's subject tip, never a 500", async () => {
    const answer = await answerQuestion("teacher-grammar", "I keep mixing tenses, help");
    expect(answer.usedAi).toBe(false);
    expect(answer.text).toMatch(/tense|Tense/);
    expect(answer.text).toMatch(/Next step/i);
  });

  test("an unmatched question falls back to default guidance", async () => {
    const answer = await answerQuestion("teacher-studyplan", "zzqxjwv completely unrelated gibberish");
    expect(answer.usedAi).toBe(false);
    expect(answer.text.length).toBeGreaterThan(80);
  });

  test("an unknown teacher id falls back to the first teacher", async () => {
    const answer = await answerQuestion("teacher-does-not-exist", "articles a an the?");
    expect(answer.usedAi).toBe(false);
    expect(answer.text).toMatch(/article|Article/);
  });
});
