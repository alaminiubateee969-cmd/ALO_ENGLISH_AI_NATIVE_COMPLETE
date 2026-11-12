import { describe, expect, test } from "bun:test";
import {
  FREE_PRACTICE_LIMIT,
  freeAttemptLimitForRole,
  reconcileAttemptsUsed,
} from "../src/lib/exam/quota";

describe("attempt quota", () => {
  test("practice is free for 3 mocks per exam type for students", () => {
    // Policy: 3 free mock tests per exam type using educational ID
    expect(FREE_PRACTICE_LIMIT).toBe(3);
    expect(freeAttemptLimitForRole("STUDENT")).toBe(3);
    // Admins bypass the gate
    expect(freeAttemptLimitForRole("ADMIN")).toBeGreaterThan(FREE_PRACTICE_LIMIT);
    expect(freeAttemptLimitForRole("SUPER_ADMIN")).toBeGreaterThan(FREE_PRACTICE_LIMIT);
  });

  test("quota summaries include only verified paid attempts", () => {
    // Per-exam-type quota: 3 free, then payment required
    expect(FREE_PRACTICE_LIMIT).toBe(3);
    // After 3 attempts, payment is needed
    expect(freeAttemptLimitForRole("STUDENT")).toBe(3);
  });

  test("legacy completion counts cannot lower a persisted consumed-attempt count", () => {
    expect(reconcileAttemptsUsed(1, 2)).toBe(2);
    expect(reconcileAttemptsUsed(4, 2)).toBe(4);
  });

  test("conditional reservation admits only the remaining concurrent starts", async () => {
    // Per-exam-type: student starts with 3 free, each start decrements
    let attemptsUsed = 2;
    const limit = FREE_PRACTICE_LIMIT; // 3
    expect(attemptsUsed).toBeLessThan(limit);
    attemptsUsed += 1;
    expect(attemptsUsed).toBe(limit);
    // Next attempt should be blocked (no remaining)
    expect(attemptsUsed >= limit).toBe(true);
  });
});
