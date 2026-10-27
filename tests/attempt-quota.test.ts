import { describe, expect, test } from "bun:test";
import {
  FREE_PRACTICE_LIMIT,
  freeAttemptLimitForRole,
  quotaSummary,
  reconcileAttemptsUsed,
  reserveQuotaAttempt,
} from "../src/lib/exam/quota";

describe("attempt quota", () => {
  test("practice is free and unlimited for every role (24/7 policy)", () => {
    // Policy since 2026-10-27: no paid tier, no attempt ceiling. The limit is
    // a number no learner can reach, and it must stay below Prisma's Int32
    // ceiling (2,147,483,647).
    expect(FREE_PRACTICE_LIMIT).toBeLessThanOrEqual(2_147_483_647);
    expect(freeAttemptLimitForRole("STUDENT")).toBe(FREE_PRACTICE_LIMIT);
    expect(freeAttemptLimitForRole("ADMIN")).toBe(FREE_PRACTICE_LIMIT);
    expect(freeAttemptLimitForRole("COUNSELOR")).toBe(FREE_PRACTICE_LIMIT);
    expect(freeAttemptLimitForRole("PARTNER")).toBe(FREE_PRACTICE_LIMIT);
  });

  test("quota summaries include only verified paid attempts", () => {
    expect(quotaSummary({ attemptsUsed: 3, attemptsLimit: 3, paidAttempts: 2 })).toEqual({
      attemptsUsed: 3,
      freeLimit: 3,
      paidAttempts: 2,
      totalAllowed: 5,
      remaining: 2,
      needsPayment: false,
    });
    expect(quotaSummary({ attemptsUsed: 5, attemptsLimit: 3, paidAttempts: 2 }).needsPayment).toBe(true);
  });

  test("legacy completion counts cannot lower a persisted consumed-attempt count", () => {
    expect(reconcileAttemptsUsed(1, 2)).toBe(2);
    expect(reconcileAttemptsUsed(4, 2)).toBe(4);
  });

  test("conditional reservation admits only the remaining concurrent starts", async () => {
    let attemptsUsed = 2;
    const fakeDb = {
      freeQuota: {
        async updateMany({ where, data }: { where: { userId: string; attemptsUsed: { lt: number } }; data: { attemptsUsed: { increment: number } } }) {
          expect(where.userId).toBe("user-1");
          if (attemptsUsed >= where.attemptsUsed.lt) return { count: 0 };
          attemptsUsed += data.attemptsUsed.increment;
          return { count: 1 };
        },
      },
    };

    const reservations = await Promise.all(
      Array.from({ length: 8 }, () => reserveQuotaAttempt(fakeDb as never, "user-1", 3)),
    );
    expect(reservations.filter(Boolean)).toHaveLength(1);
    expect(attemptsUsed).toBe(3);
  });
});
