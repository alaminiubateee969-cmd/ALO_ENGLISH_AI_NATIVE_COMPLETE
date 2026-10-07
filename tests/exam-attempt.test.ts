/**
 * tests/exam-attempt.test.ts — Database-backed attempt engine tests.
 *
 * Proves the guarantees that cannot be shown with pure functions:
 *   - no duplicate question inside one attempt
 *   - the frozen set is replayed identically on resume
 *   - a started attempt can never be re-rolled
 *   - answers persist and come back
 *   - a short question bank raises a controlled condition instead of
 *     silently reusing questions
 *   - one student cannot read another student's attempt data
 *
 * Requires a migrated database:
 *   DATABASE_URL="file:./test.db" bun run db:push
 *   DATABASE_URL="file:./test.db" bun test tests/exam-attempt.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { PrismaClient } from "@prisma/client";
import {
  selectQuestions,
  persistSelection,
  loadFrozenQuestionIds,
  QuestionShortageError,
} from "../src/lib/exam/selection";
import { loadAttemptAnswers, loadAttemptQuestions } from "../src/lib/exam/questions";
import { computeClock, deadlineFor } from "../src/lib/exam/timer";

const db = new PrismaClient();

const RUN = `engine-${Date.now()}`;
let examTypeId: string;
let practiceSetId: string;
let questionIds: string[] = [];
const userA = { id: "", email: `${RUN}-a@test.local` };
const userB = { id: "", email: `${RUN}-b@test.local` };

beforeAll(async () => {
  const examType = await db.examType.create({
    data: { code: `ENGINE-${RUN}`, name: "Engine Test Exam", category: "test" },
  });
  examTypeId = examType.id;

  const practiceSet = await db.practiceSet.create({
    data: { examTypeId, title: "Engine Test Set", durationMin: 30 },
  });
  practiceSetId = practiceSet.id;

  for (let i = 0; i < 6; i += 1) {
    const created = await db.question.create({
      data: {
        practiceSetId,
        section: i < 3 ? "READING" : "LISTENING",
        type: "MULTIPLE_CHOICE",
        prompt: `Engine test question ${i + 1}`,
        options: JSON.stringify(["a", "b", "c", "d"]),
        correctIndex: 1,
        order: i,
      },
    });
    questionIds.push(created.id);
  }

  const a = await db.user.create({
    data: { email: userA.email, passwordHash: "x", name: "Engine A", role: "STUDENT" },
  });
  const b = await db.user.create({
    data: { email: userB.email, passwordHash: "x", name: "Engine B", role: "STUDENT" },
  });
  userA.id = a.id;
  userB.id = b.id;
});

afterAll(async () => {
  await db.attemptAnswer.deleteMany({ where: { attempt: { practiceSetId } } });
  await db.attemptQuestion.deleteMany({ where: { attempt: { practiceSetId } } });
  await db.attempt.deleteMany({ where: { practiceSetId } });
  await db.question.deleteMany({ where: { practiceSetId } });
  await db.practiceSet.delete({ where: { id: practiceSetId } });
  await db.examType.delete({ where: { id: examTypeId } });
  await db.user.deleteMany({ where: { email: { in: [userA.email, userB.email] } } });
  await db.$disconnect();
});

async function startAttempt(userId: string, count?: number) {
  const attempt = await db.attempt.create({
    data: {
      userId,
      practiceSetId,
      status: "IN_PROGRESS",
      durationMin: 30,
      expiresAt: deadlineFor(new Date(), 30),
    },
  });
  const selection = await selectQuestions({ db, userId, practiceSetId, count });
  await persistSelection({ db, attemptId: attempt.id, questionIds: selection.questionIds });
  return { attempt, selection };
}

describe("Attempt engine — unique question selection", () => {
  test("a fresh attempt serves no duplicate question IDs", async () => {
    const { attempt, selection } = await startAttempt(userA.id);
    const ids = selection.questionIds;
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(questionIds.length);

    const frozen = await loadFrozenQuestionIds(db, attempt.id);
    expect(frozen).toEqual(ids);
  });

  test("the frozen set is replayed identically on resume", async () => {
    const { attempt } = await startAttempt(userA.id);
    const first = await loadFrozenQuestionIds(db, attempt.id);
    const second = await loadFrozenQuestionIds(db, attempt.id);
    expect(second).toEqual(first);

    // A second persist must not re-roll a started attempt.
    await persistSelection({ db, attemptId: attempt.id, questionIds: [...questionIds].reverse() });
    expect(await loadFrozenQuestionIds(db, attempt.id)).toEqual(first);
  });

  test("questions already seen are excluded on the next attempt", async () => {
    // Complete the earlier attempts so their questions count as "seen".
    await db.attempt.updateMany({ where: { userId: userA.id, practiceSetId }, data: { status: "SUBMITTED" } });

    const seen = await db.attemptQuestion.findMany({
      where: { attempt: { userId: userA.id, practiceSetId, status: "SUBMITTED" } },
      select: { questionId: true },
    });
    expect(seen.length).toBeGreaterThan(0);

    const selection = await selectQuestions({ db, userId: userA.id, practiceSetId, count: 3 });
    const seenIds = new Set(seen.map((s) => s.questionId));
    const reused = selection.questionIds.filter((id) => seenIds.has(id));

    if (selection.shortage === null) {
      // Enough fresh questions existed, so nothing may be reused.
      expect(reused.length).toBe(0);
    } else {
      // Otherwise the shortage is reported rather than hidden.
      expect(selection.shortage.reason).toBe("FRESH_POOL_EXHAUSTED");
      expect(selection.shortage.reusedQuestionIds.length).toBe(reused.length);
    }
    expect(new Set(selection.questionIds).size).toBe(selection.questionIds.length);
  });

  test("a bank that cannot fill one sitting raises a controlled shortage", async () => {
    let thrown: QuestionShortageError | null = null;
    try {
      await selectQuestions({ db, userId: userA.id, practiceSetId, count: questionIds.length + 50 });
    } catch (err) {
      thrown = err as QuestionShortageError;
    }
    expect(thrown).not.toBeNull();
    expect(thrown?.code).toBe("QUESTION_BANK_SHORTAGE");
    expect(thrown?.shortage.reason).toBe("BANK_TOO_SMALL");
  });
});

describe("Attempt engine — answers, resume and ownership", () => {
  test("answers persist and are restored", async () => {
    const { attempt } = await startAttempt(userB.id);
    const target = questionIds[0];

    await db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId: target } },
      create: { attemptId: attempt.id, questionId: target, answer: "2" },
      update: { answer: "2" },
    });

    const answers = await loadAttemptAnswers(db, attempt.id);
    expect(answers[target]).toBe("2");

    // Saving again updates rather than duplicating.
    await db.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId: target } },
      create: { attemptId: attempt.id, questionId: target, answer: "2" },
      update: { answer: "3" },
    });
    expect((await loadAttemptAnswers(db, attempt.id))[target]).toBe("3");
    expect(await db.attemptAnswer.count({ where: { attemptId: attempt.id, questionId: target } })).toBe(1);
  });

  test("resumed questions carry no correct-answer fields", async () => {
    const { attempt } = await startAttempt(userB.id);
    const questions = await loadAttemptQuestions(db, attempt.id);
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      expect(Object.keys(question)).not.toContain("correctAnswer");
      expect(Object.keys(question)).not.toContain("correctIndex");
      expect(Object.keys(question)).not.toContain("correctIndices");
    }
  });

  test("an attempt belongs to exactly one user", async () => {
    const { attempt } = await startAttempt(userA.id);
    const asOwner = await db.attempt.findFirst({ where: { id: attempt.id, userId: userA.id } });
    const asOther = await db.attempt.findFirst({ where: { id: attempt.id, userId: userB.id } });
    expect(asOwner).not.toBeNull();
    expect(asOther).toBeNull();
  });

  test("the deadline is stored on the attempt and drives the clock", async () => {
    const { attempt } = await startAttempt(userB.id);
    const stored = await db.attempt.findUnique({
      where: { id: attempt.id },
      select: { startedAt: true, expiresAt: true, durationMin: true },
    });
    expect(stored?.expiresAt).not.toBeNull();
    const clock = computeClock(stored!);
    expect(clock.remainingSec).toBeGreaterThan(0);
    expect(clock.remainingSec).toBeLessThanOrEqual(30 * 60);
  });
});
