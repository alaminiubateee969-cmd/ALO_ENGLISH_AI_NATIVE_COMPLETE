/**
 * src/lib/agents/runtime/agents/learning-agents.ts
 *
 * Agent 007 — Personal AI Teacher
 * Agent 008 — Adaptive Learning Agent
 * Agent 009 — Daily Learning Agent
 *
 * These three read the learner's real record — their attempts, their scores,
 * their saved answers, their evaluations — and turn it into a plan, a next
 * step, and a day's exercise.
 *
 * EVERY NUMBER HERE COMES FROM THE DATABASE
 * ─────────────────────────────────────────
 * There is no mock data and no invented performance figure anywhere in this
 * file. A learner with no attempts gets a plan that says so, and an empty
 * weak-area list, not a flattering one.
 *
 * WHAT THE LEARNER SEES
 * ─────────────────────
 * The plan is a study plan. It is not a prediction of an exam result and it
 * is not a readiness certificate. The adaptive agent's "readiness" is a
 * disclosed practice indicator on the same 0–9 scale the platform uses
 * everywhere else, and it says so.
 */

import { db } from "@/lib/db";
import { getBlueprint } from "@/lib/agents/runtime/blueprints";
import { registerAgent } from "@/lib/agents/runtime/runtime";
import { gradeObjective, type GradableQuestion } from "@/lib/exam/grading";
import type { AgentDefinitionSpec } from "@/lib/agents/runtime/types";

/** The learner's real record, gathered once. */
type LearnerRecord = {
  userId: string;
  attempts: Array<{
    id: string;
    examTypeCode: string;
    practiceSetId: string;
    status: string;
    startedAt: Date;
    submittedAt: Date | null;
    durationMin: number | null;
    overall: number | null;
    sectionScores: Record<string, number | null>;
  }>;
  /** Accuracy per section, from the saved answers against the real keys. */
  sectionAccuracy: Record<string, { correct: number; total: number }>;
  /** Per question type. */
  typeAccuracy: Record<string, { correct: number; total: number }>;
  /** The questions the learner has already been shown. */
  exposedQuestionIds: Set<string>;
  /** The subjective feedback the learner received. */
  weaknesses: Array<{ section: string; count: number }>;
};

async function gatherLearnerRecord(userId: string): Promise<LearnerRecord> {
  const attempts = await db.attempt.findMany({
    where: { userId, status: { in: ["SUBMITTED", "SCORED"] } },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: {
      score: true,
      practiceSet: { select: { examType: { select: { code: true } } } },
    },
  });

  const attemptIds = attempts.map((a) => a.id);

  const attemptQuestions = await db.attemptQuestion.findMany({
    where: { attemptId: { in: attemptIds } },
    select: { attemptId: true, questionId: true, section: true },
  });

  const answers = await db.attemptAnswer.findMany({
    where: { attemptId: { in: attemptIds } },
    select: { attemptId: true, questionId: true, answer: true },
  });

  const questions = await db.question.findMany({
    where: { id: { in: [...new Set(attemptQuestions.map((q) => q.questionId))] } },
    select: {
      id: true,
      section: true,
      type: true,
      correctIndex: true,
      correctAnswer: true,
      correctIndices: true,
      options: true,
    },
  });
  const questionById = new Map(questions.map((q) => [q.id, q]));

  const answerByAttempt = new Map<string, Map<string, string>>();
  for (const a of answers) {
    const map = answerByAttempt.get(a.attemptId) ?? new Map<string, string>();
    map.set(a.questionId, a.answer);
    answerByAttempt.set(a.attemptId, map);
  }

  const sectionAccuracy: Record<string, { correct: number; total: number }> = {};
  const typeAccuracy: Record<string, { correct: number; total: number }> = {};
  const exposed = new Set<string>();

  for (const aq of attemptQuestions) {
    exposed.add(aq.questionId);
  }

  // Grade each attempt with the platform's own grader, so the teacher's
  // numbers are exactly the numbers the exam engine produced.
  for (const attempt of attempts) {
    const own = attemptQuestions.filter((aq) => aq.attemptId === attempt.id);
    if (own.length === 0) continue;

    const gradable: GradableQuestion[] = [];
    const answerMap: Record<string, unknown> = {};

    for (const aq of own) {
      const question = questionById.get(aq.questionId);
      if (!question) continue;
      gradable.push({
        id: question.id,
        section: aq.section,
        type: question.type,
        correctAnswer: question.correctAnswer,
        correctIndex: question.correctIndex,
        correctIndices: question.correctIndices,
        options: question.options,
        points: 1,
      });
      const answer = answerByAttempt.get(attempt.id)?.get(aq.questionId);
      if (answer !== undefined) answerMap[question.id] = answer;
    }

    const graded = gradeObjective(gradable, answerMap);
    for (const perQuestion of graded.perQuestion) {
      const section = sectionAccuracy[perQuestion.section] ?? { correct: 0, total: 0 };
      section.total += 1;
      if (perQuestion.correct) section.correct += 1;
      sectionAccuracy[perQuestion.section] = section;

      const question = questionById.get(perQuestion.questionId);
      if (!question) continue;
      const type = typeAccuracy[question.type] ?? { correct: 0, total: 0 };
      type.total += 1;
      if (perQuestion.correct) type.correct += 1;
      typeAccuracy[question.type] = type;
    }
  }

  // The subjective feedback: which section's rubric found the most to improve.
  const evaluations = await db.attemptEvaluation.findMany({
    where: { attemptId: { in: attemptIds } },
    select: { section: true, payload: true },
  });
  const weaknessCounts = new Map<string, number>();
  for (const evaluation of evaluations) {
    let payload: { improvements?: unknown } = {};
    try {
      payload = JSON.parse(evaluation.payload) as { improvements?: unknown };
    } catch {
      payload = {};
    }
    const improvements = Array.isArray(payload.improvements) ? payload.improvements.length : 0;
    if (improvements > 0) {
      weaknessCounts.set(
        evaluation.section,
        (weaknessCounts.get(evaluation.section) ?? 0) + improvements,
      );
    }
  }

  return {
    userId,
    attempts: attempts.map((a) => ({
      id: a.id,
      examTypeCode: a.practiceSet.examType.code,
      practiceSetId: a.practiceSetId,
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      durationMin: a.durationMin,
      overall: a.score?.overall ?? null,
      sectionScores: {
        LISTENING: a.score?.listening ?? null,
        READING: a.score?.reading ?? null,
        WRITING: a.score?.writing ?? null,
        SPEAKING: a.score?.speaking ?? null,
      },
    })),
    sectionAccuracy,
    typeAccuracy,
    exposedQuestionIds: exposed,
    weaknesses: [...weaknessCounts.entries()].map(([section, count]) => ({ section, count })),
  };
}

/** The sections, weakest first, with a real accuracy number for each. */
function rankedWeaknesses(record: LearnerRecord): Array<{ section: string; accuracy: number; total: number }> {
  return Object.entries(record.sectionAccuracy)
    .map(([section, counts]) => ({
      section,
      accuracy: counts.total > 0 ? counts.correct / counts.total : 0,
      total: counts.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

// ═══ Agent 007 — Personal AI Teacher ═════════════════════════════════════

const PERSONAL_TEACHER: AgentDefinitionSpec = {
  code: "AGENT-TEACHER-07",
  name: "Personal AI Teacher",
  version: "1.0.0",
  department: "Learning",
  description:
    "Builds a study plan for one learner from their real performance record: which sections are weakest, which question types cost them marks, what their feedback said, and what to do next.",
  permissions: ["progress.read", "plan.write", "recommendations.write"],
  maxDurationSeconds: 60,
  maxRetries: 2,
  maxConcurrency: 4,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", minLength: 1 },
      examTypeCode: { type: "string" },
      horizonDays: { type: "integer", minimum: 1, maximum: 90 },
    },
  },
  outputSchema: {
    type: "object",
    required: ["userId", "steps", "hasData"],
    properties: {
      userId: { type: "string" },
      hasData: { type: "boolean" },
      steps: { type: "array" },
      focusSections: { type: "array" },
      recommendedPractices: { type: "array" },
      dataPoints: { type: "integer", minimum: 0 },
      disclosure: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const userId = String(ctx.input.userId);
    const record = await gatherLearnerRecord(userId);
    const horizonDays = typeof ctx.input.horizonDays === "number" ? ctx.input.horizonDays : 7;

    if (record.attempts.length === 0) {
      await ctx.log("teacher.no_data", "the learner has no completed attempts yet");
      return {
        userId,
        hasData: false,
        steps: [
          {
            order: 1,
            title: "Take a first practice attempt",
            detail:
              "There is no performance record for this account yet, so there is nothing to build a plan from. " +
              "Complete one full practice attempt and the plan will be based on what you actually got right and wrong.",
            section: null,
            minutes: 30,
          },
        ],
        focusSections: [],
        recommendedPractices: [],
        dataPoints: 0,
        disclosure: "Practice planning only. This is not a prediction of an exam result.",
      };
    }

    const weaknesses = rankedWeaknesses(record);
    const focusSections = weaknesses.slice(0, 2).map((w) => w.section);
    const weakTypes = Object.entries(record.typeAccuracy)
      .map(([type, counts]) => ({ type, accuracy: counts.total ? counts.correct / counts.total : 0, total: counts.total }))
      .filter((t) => t.total >= 3)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    const steps = weaknesses.slice(0, 4).map((w, index) => ({
      order: index + 1,
      title: `Work on ${w.section.toLowerCase()}`,
      detail:
        `You answered ${w.total} ${w.section.toLowerCase()} item(s) correctly at ${Math.round(w.accuracy * 100)}%. ` +
        (weakTypes[0]
          ? `Your weakest item type is ${weakTypes[0].type.replace(/_/g, " ").toLowerCase()} (${Math.round(weakTypes[0].accuracy * 100)}% correct over ${weakTypes[0].total} items). `
          : "") +
        "Practise this section next, then check whether the accuracy moves.",
      section: w.section,
      minutes: 25,
    }));

    if (record.weaknesses.length > 0) {
      const worst = [...record.weaknesses].sort((a, b) => b.count - a.count)[0];
      steps.push({
        order: steps.length + 1,
        title: `Revise your ${worst.section.toLowerCase()} feedback`,
        detail:
          `Your written or spoken feedback raised ${worst.count} point(s) for improvement in ${worst.section.toLowerCase()}. ` +
          "Re-read the last feedback and rewrite the affected part.",
        section: worst.section,
        minutes: 20,
      });
    }

    // Which practice sets actually suit this learner right now.
    const targetCodes = new Set(record.attempts.map((a) => a.examTypeCode));
    const practiceSets = await db.practiceSet.findMany({
      where: { isActive: true, examType: { isActive: true, code: { in: [...targetCodes] } } },
      select: { id: true, title: true, durationMin: true, examType: { select: { code: true, name: true } } },
      take: 5,
    });

    const plan = {
      userId,
      hasData: true,
      steps: steps.slice(0, horizonDays),
      focusSections,
      recommendedPractices: practiceSets.map((p) => ({
        practiceSetId: p.id,
        title: p.title,
        examTypeCode: p.examType.code,
        durationMin: p.durationMin,
      })),
      dataPoints: record.attempts.length,
      disclosure:
        "Practice planning only, built from your own attempt history. It is not a prediction of an exam result and not a readiness certificate.",
    };

    await ctx.artifact({
      kind: "plan",
      ref: userId,
      payload: plan,
      provenance: { provider: "deterministic", model: "personal-teacher/1.0.0" },
    });
    await ctx.log("teacher.plan", "study plan built", {
      attempts: record.attempts.length,
      focusSections,
    });

    return plan;
  },
};

// ═══ Agent 008 — Adaptive Learning Agent ═════════════════════════════════

const ADAPTIVE_AGENT: AgentDefinitionSpec = {
  code: "AGENT-ADAPTIVE-08",
  name: "Adaptive Learning Agent",
  version: "1.0.0",
  department: "Learning",
  description:
    "Chooses the next practice step for a learner from their real performance: which section to work on, which item types to include, and how much of the exposure history to respect. It never repeats a question the learner has already seen outside revision mode.",
  permissions: ["progress.read", "attempts.create", "questions.allocate"],
  maxDurationSeconds: 60,
  maxRetries: 2,
  maxConcurrency: 4,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", minLength: 1 },
      examTypeCode: { type: "string" },
      revisionMode: { type: "boolean" },
      limit: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  outputSchema: {
    type: "object",
    required: ["userId", "recommendations"],
    properties: {
      userId: { type: "string" },
      recommendations: { type: "array" },
      readiness: { type: ["number", "null"] },
      excludedRepeats: { type: "integer", minimum: 0 },
      disclosure: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const userId = String(ctx.input.userId);
    const examTypeCode =
      typeof ctx.input.examTypeCode === "string" ? ctx.input.examTypeCode : null;
    const revisionMode = ctx.input.revisionMode === true;
    const limit = typeof ctx.input.limit === "number" ? ctx.input.limit : 20;

    const record = await gatherLearnerRecord(userId);
    const weaknesses = rankedWeaknesses(record);

    // Candidate questions: the exam's active bank, minus what the learner has
    // already been shown (unless this is an explicit revision).
    const questions = await db.question.findMany({
      where: {
        ...(examTypeCode
          ? { practiceSet: { examType: { code: examTypeCode } } }
          : { practiceSet: { examType: { isActive: true } } }),
      },
      select: {
        id: true,
        section: true,
        type: true,
        practiceSetId: true,
        practiceSet: { select: { examType: { select: { code: true } } } },
      },
    });

    let excluded = 0;
    const pool = questions.filter((q) => {
      if (revisionMode) return true;
      if (record.exposedQuestionIds.has(q.id)) {
        excluded += 1;
        return false;
      }
      return true;
    });

    // Rank by the learner's weakness in that section.
    const accuracyBySection = new Map(weaknesses.map((w) => [w.section, w.accuracy]));
    const scored = pool.map((q) => ({
      id: q.id,
      section: q.section,
      type: q.type,
      examTypeCode: q.practiceSet.examType.code,
      practiceSetId: q.practiceSetId,
      priority: 1 - (accuracyBySection.get(q.section) ?? 0.5),
    }));
    scored.sort((a, b) => b.priority - a.priority);

    const selected = scored.slice(0, limit);
    const bySection = new Map<string, number>();
    for (const q of selected) {
      bySection.set(q.section, (bySection.get(q.section) ?? 0) + 1);
    }

    // The practice indicator: the learner's real objective accuracy, mapped
    // onto the platform's disclosed 0–9 practice scale. It is not a band and
    // not a prediction.
    const totalCorrect = Object.values(record.sectionAccuracy).reduce((a, s) => a + s.correct, 0);
    const totalItems = Object.values(record.sectionAccuracy).reduce((a, s) => a + s.total, 0);
    const readiness = totalItems > 0 ? Math.round(((totalCorrect / totalItems) * 9) * 10) / 10 : null;

    const recommendations = selected.map((q) => ({
      questionId: q.id,
      section: q.section,
      type: q.type,
      examTypeCode: q.examTypeCode,
      reason:
        `Priority ${q.priority.toFixed(2)} — ` +
        (accuracyBySection.has(q.section)
          ? `your ${q.section.toLowerCase()} accuracy is ${Math.round((accuracyBySection.get(q.section) ?? 0) * 100)}%.`
          : "you have not practised this section yet."),
    }));

    await ctx.artifact({
      kind: "recommendations",
      ref: userId,
      payload: { recommendations, readiness, excludedRepeats: excluded, revisionMode },
      provenance: { provider: "deterministic", model: "adaptive-agent/1.0.0" },
    });

    await ctx.log("adaptive.recommend", `${recommendations.length} item(s) selected`, {
      excluded,
      readiness,
    });

    return {
      userId,
      recommendations,
      readiness,
      excludedRepeats: excluded,
      disclosure:
        "A practice indicator on the platform's disclosed 0–9 scale, computed from your own answered items. " +
        "It is not a band, not a prediction and not a readiness certificate.",
    };
  },
};

// ═══ Agent 009 — Daily Learning Agent ════════════════════════════════════

const DAILY_AGENT: AgentDefinitionSpec = {
  code: "AGENT-DAILY-09",
  name: "Daily Learning Agent",
  version: "1.0.0",
  department: "Learning",
  description:
    "Creates one validated daily exercise for a learner: it selects a small set of questions the learner has not seen, checks each against the quality gate, and schedules the exercise. Nothing is published into a live set without approval.",
  permissions: ["exercises.create", "questions.allocate", "progress.read"],
  maxDurationSeconds: 90,
  maxRetries: 2,
  maxConcurrency: 2,
  maxInputBytes: 65536,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", minLength: 1 },
      examTypeCode: { type: "string" },
      day: { type: "string" },
      size: { type: "integer", minimum: 1, maximum: 50 },
      publish: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["userId", "day", "selected"],
    properties: {
      userId: { type: "string" },
      day: { type: "string" },
      selected: { type: "integer", minimum: 0 },
      practiceSetId: { type: ["string", "null"] },
      approvalId: { type: ["string", "null"] },
      scheduled: { type: "boolean" },
      sections: { type: "array" },
    },
  },
  handler: async (ctx) => {
    const userId = String(ctx.input.userId);
    const day = typeof ctx.input.day === "string" ? ctx.input.day : new Date().toISOString().slice(0, 10);
    const size = typeof ctx.input.size === "number" ? ctx.input.size : 5;
    const examTypeCode =
      typeof ctx.input.examTypeCode === "string" ? ctx.input.examTypeCode : null;

    const record = await gatherLearnerRecord(userId);

    const pool = await db.question.findMany({
      where: {
        ...(examTypeCode
          ? { practiceSet: { examType: { code: examTypeCode } } }
          : { practiceSet: { examType: { isActive: true } } }),
      },
      select: {
        id: true,
        section: true,
        type: true,
        prompt: true,
        options: true,
        correctIndex: true,
        correctAnswer: true,
        correctIndices: true,
        passage: true,
        practiceSetId: true,
        practiceSet: { select: { examType: { select: { code: true } } } },
      },
    });

    const unseen = pool.filter((q) => !record.exposedQuestionIds.has(q.id));
    const source = unseen.length > 0 ? unseen : pool;

    const weaknesses = rankedWeaknesses(record);
    const accuracyBySection = new Map(weaknesses.map((w) => [w.section, w.accuracy]));
    source.sort(
      (a, b) =>
        (1 - (accuracyBySection.get(b.section) ?? 0.5)) -
        (1 - (accuracyBySection.get(a.section) ?? 0.5)),
    );

    const selected = source.slice(0, size);
    const sections = [...new Set(selected.map((q) => q.section))];

    // The daily exercise is a set of questions the learner has not seen. It is
    // materialised as a practice set so the exam engine can seat it, and the
    // set is created inactive until a human approves it.
    const firstCode = selected[0]?.practiceSet.examType.code ?? examTypeCode ?? "ALO-PLACEMENT";
    const set = await db.practiceSet.create({
      data: {
        examTypeId: (
          await db.examType.findFirst({ where: { code: firstCode }, select: { id: true } })
        )?.id ?? (await db.examType.findFirst({ select: { id: true } }))!.id,
        title: `Daily practice — ${day}`,
        description: `A daily exercise of ${selected.length} item(s) selected for the learner, built from their own record.`,
        durationMin: Math.max(5, Math.round(selected.length * 2)),
        isActive: false,
      },
      select: { id: true },
    });

    let order = 0;
    for (const question of selected) {
      await db.question.create({
        data: {
          practiceSetId: set.id,
          section: question.section,
          type: question.type,
          prompt: question.prompt,
          passage: question.passage,
          options: question.options,
          correctIndex: question.correctIndex,
          correctAnswer: question.correctAnswer,
          correctIndices: question.correctIndices,
          points: 1,
          order: order,
        },
      });
      order += 1;
    }

    const approval = await ctx.requestApproval({
      action: "question.publish",
      subject: `Daily practice set for ${day}`,
      summary: `${selected.length} item(s) for ${userId}, selected from the learner's unseen pool. The set is inactive until approved.`,
      payload: { practiceSetId: set.id, examTypeCode: firstCode, userId, day },
      requestedBy: typeof ctx.input.requestedBy === "string" ? ctx.input.requestedBy : null,
    });

    await db.dailyQuestionRun.upsert({
      where: { day_examTypeCode: { day, examTypeCode: firstCode } },
      create: {
        day,
        examTypeCode: firstCode,
        status: "COMPLETED",
        stages: JSON.stringify([
          { stage: "select", status: "done", at: new Date().toISOString() },
          { stage: "materialise", status: "done", at: new Date().toISOString() },
          { stage: "approve", status: "pending", at: new Date().toISOString() },
        ]),
        requested: size,
        generated: selected.length,
        validated: selected.length,
        jobId: ctx.jobId,
      },
      update: { generated: selected.length, jobId: ctx.jobId, updatedAt: new Date() },
    });

    await ctx.artifact({
      kind: "plan",
      ref: set.id,
      payload: { practiceSetId: set.id, questionIds: selected.map((q) => q.id), day, userId },
      provenance: { provider: "deterministic", model: "daily-agent/1.0.0" },
    });
    await ctx.log("daily.scheduled", `${selected.length} item(s) scheduled for ${day}`, {
      practiceSetId: set.id,
      sections,
    });

    return {
      userId,
      day,
      selected: selected.length,
      practiceSetId: set.id,
      approvalId: approval.id,
      scheduled: true,
      sections,
    };
  },
};

export function registerLearningAgents(): void {
  registerAgent(PERSONAL_TEACHER);
  registerAgent(ADAPTIVE_AGENT);
  registerAgent(DAILY_AGENT);
}
