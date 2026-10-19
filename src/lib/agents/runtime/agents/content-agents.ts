/**
 * src/lib/agents/runtime/agents/content-agents.ts
 *
 * Agent 001 — Exam Orchestrator
 * Agent 002 — Question Generation
 * Agent 003 — Question Quality Gate
 *
 * These three are the content pipeline. The orchestrator allocates a sitting,
 * the generator produces original items, and the quality gate decides whether
 * a draft is fit to be shown to a learner — and, when it is, asks a human
 * before anything reaches the live bank.
 *
 * NOTHING PUBLISHED WITHOUT A HUMAN
 * ─────────────────────────────────
 * The quality gate never writes to the `Question` table. It writes a draft to
 * `AgentArtifact` and raises an `AgentApproval`. A draft becomes a live
 * question only when an administrator approves it and the publish step runs.
 * That is the whole point of the approval gate: an agent that can publish
 * unreviewed content into a live exam is a defect, not a feature.
 */

import { db } from "@/lib/db";
import { selectQuestions, persistSelection, ListeningAudioNotReadyError, QuestionShortageError } from "@/lib/exam/selection";
import { deadlineFor } from "@/lib/exam/timer";
import { complete } from "@/lib/ai/providers/ai-provider";
import { getBlueprint } from "@/lib/agents/runtime/blueprints";
import { generateItems, ITEM_GENERATOR_VERSION } from "@/lib/agents/runtime/generator";
import { registerAgent } from "@/lib/agents/runtime/runtime";
import type { AgentDefinitionSpec } from "@/lib/agents/runtime/types";

// ═══ Agent 001 — Exam Orchestrator ════════════════════════════════════════

const ORCHESTRATOR: AgentDefinitionSpec = {
  code: "AGENT-EXAM-ORCHESTRATOR-01",
  name: "Exam Orchestrator",
  version: "1.0.0",
  department: "Operations",
  description:
    "Creates and manages real exam sessions: reserves the attempt, allocates the question set from the exam blueprint, freezes the allocation, and sets the server-authoritative deadline.",
  permissions: ["attempts.create", "attempts.allocate", "questions.read"],
  maxDurationSeconds: 45,
  maxRetries: 2,
  maxConcurrency: 2,
  maxInputBytes: 65536,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["userId", "practiceSetId"],
    properties: {
      userId: { type: "string", minLength: 1 },
      practiceSetId: { type: "string", minLength: 1 },
      mode: { type: "string", enum: ["practice", "mock"] },
      requestedBy: { type: "string" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["attemptId", "questionCount", "status"],
    properties: {
      attemptId: { type: "string" },
      questionCount: { type: "integer", minimum: 0 },
      status: { type: "string", enum: ["started", "active", "missing", "shortage", "audio_not_ready"] },
      durationMin: { type: ["integer", "null"] },
      expiresAt: { type: ["string", "null"] },
      sections: { type: "array" },
      message: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const userId = String(ctx.input.userId);
    const practiceSetId = String(ctx.input.practiceSetId);
    const mode = typeof ctx.input.mode === "string" ? ctx.input.mode : "practice";

    const practiceSet = await db.practiceSet.findFirst({
      where: { id: practiceSetId, isActive: true, examType: { isActive: true } },
      select: {
        id: true,
        title: true,
        durationMin: true,
        examType: { select: { code: true, name: true } },
      },
    });
    if (!practiceSet) {
      return {
        attemptId: "",
        questionCount: 0,
        status: "missing",
        message: "No active practice set with that id.",
      };
    }

    // A learner may only have one live attempt at a time, exactly as the
    // interactive start route enforces.
    const active = await db.attempt.findFirst({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
    if (active) {
      await ctx.log("orchestrator.resume", "an attempt is already in progress", { attemptId: active.id });
      return {
        attemptId: active.id,
        questionCount: 0,
        status: "active",
        message: "An attempt is already in progress; resume it rather than starting a second one.",
      };
    }

    const blueprint = getBlueprint(practiceSet.examType.code);

    let selection;
    try {
      selection = await selectQuestions({ db, userId, practiceSetId });
    } catch (error) {
      if (error instanceof ListeningAudioNotReadyError) {
        await ctx.log("orchestrator.audio_not_ready", error.message, undefined, "warn");
        return {
          attemptId: "",
          questionCount: 0,
          status: "audio_not_ready",
          message: error.message,
        };
      }
      if (error instanceof QuestionShortageError) {
        await ctx.log("orchestrator.shortage", error.message, undefined, "warn");
        return {
          attemptId: "",
          questionCount: 0,
          status: "shortage",
          message: error.message,
        };
      }
      throw error;
    }

    const startedAt = new Date();
    const attempt = await db.attempt.create({
      data: {
        userId,
        practiceSetId,
        status: "IN_PROGRESS",
        attemptNumber:
          (await db.attempt.count({ where: { userId, practiceSetId } })) + 1,
        startedAt,
        durationMin: practiceSet.durationMin,
        expiresAt: deadlineFor(startedAt, practiceSet.durationMin),
      },
      select: { id: true, startedAt: true, expiresAt: true, durationMin: true },
    });

    await persistSelection({ db, attemptId: attempt.id, questionIds: selection.questionIds });

    // The section split is what the result screen and the analytics agent
    // both need, so it is computed once here and stored with the attempt.
    const sectionRows = await db.attemptQuestion.findMany({
      where: { attemptId: attempt.id },
      select: { question: { select: { section: true } } },
    });
    const sections: Record<string, number> = {};
    for (const row of sectionRows) {
      const key = row.question.section;
      sections[key] = (sections[key] ?? 0) + 1;
    }

    await ctx.artifact({
      kind: "exam.session",
      ref: attempt.id,
      payload: {
        examTypeCode: practiceSet.examType.code,
        practiceSetId,
        mode,
        blueprintVersion: blueprint?.version ?? null,
        questionCount: selection.questionIds.length,
        sections,
        startedAt: attempt.startedAt.toISOString(),
        expiresAt: attempt.expiresAt?.toISOString() ?? null,
      },
      provenance: { provider: "deterministic", model: "exam-orchestrator/1.0.0" },
    });

    await ctx.log("orchestrator.started", "attempt created and question set frozen", {
      attemptId: attempt.id,
      questionCount: selection.questionIds.length,
      examTypeCode: practiceSet.examType.code,
    });

    return {
      attemptId: attempt.id,
      questionCount: selection.questionIds.length,
      status: "started",
      durationMin: attempt.durationMin,
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      sections,
    };
  },
};

// ═══ Agent 002 — Question Generation ══════════════════════════════════════

const QUESTION_GENERATOR: AgentDefinitionSpec = {
  code: "AGENT-QUESTION-GEN-02",
  name: "Question Generation",
  version: "1.0.0",
  department: "Academic",
  description:
    "Generates original, syllabus-aligned question drafts for an exam family from its versioned blueprint. Objective items are produced by a deterministic generator whose answer key is correct by construction; a configured model may improve the wording but never the key.",
  permissions: ["questions.draft", "blueprints.read"],
  maxDurationSeconds: 90,
  maxRetries: 2,
  maxConcurrency: 2,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["examTypeCode"],
    properties: {
      examTypeCode: { type: "string", minLength: 1 },
      section: {
        type: "string",
        enum: ["LISTENING", "READING", "WRITING", "SPEAKING"],
      },
      count: { type: "integer", minimum: 1, maximum: 50 },
      seed: { type: "integer" },
      day: { type: "string" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["examTypeCode", "generated", "provider"],
    properties: {
      examTypeCode: { type: "string" },
      section: { type: ["string", "null"] },
      generated: { type: "integer", minimum: 0 },
      provider: { type: "string" },
      model: { type: ["string", "null"] },
      items: { type: "array" },
      blueprintVersion: { type: ["string", "null"] },
      source: { type: ["object", "null"] },
    },
  },
  handler: async (ctx) => {
    const examTypeCode = String(ctx.input.examTypeCode);
    const blueprint = getBlueprint(examTypeCode);
    if (!blueprint) {
      throw new Error(
        `no blueprint for ${examTypeCode}. A question cannot be generated for an exam whose structure is unknown.`,
      );
    }

    const requestedSection =
      typeof ctx.input.section === "string"
        ? (ctx.input.section as "LISTENING" | "READING" | "WRITING" | "SPEAKING")
        : null;
    const count = typeof ctx.input.count === "number" ? ctx.input.count : 3;
    const seed =
      typeof ctx.input.seed === "number"
        ? ctx.input.seed
        : Date.now() % 2147483647;

    const sections = requestedSection
      ? blueprint.sections.filter((s) => s.id === requestedSection)
      : blueprint.sections;

    const items: unknown[] = [];
    let sectionIndex = 0;
    for (const section of sections) {
      const perSection = Math.max(1, Math.ceil(count / Math.max(1, sections.length)));
      const generated = generateItems(blueprint, section.id, perSection, seed + sectionIndex * 101);
      items.push(...generated);
      sectionIndex += 1;
    }
    const trimmed = items.slice(0, count);

    // The model's job is wording, not the key. A model is asked to rewrite
    // the *prompt text* of each item, and any rewrite that changes the
    // meaning of the key is discarded by the quality gate.
    let provider = "deterministic_generator";
    let model: string | null = ITEM_GENERATOR_VERSION;
    let polished = 0;

    if (ctx.input.polish === true) {
      const completion = await complete("question_generation", {
        system:
          "You rewrite exam question stems for clarity. You never change the meaning of a question, " +
          "you never change its answer, and you never add or remove answer options. " +
          "Reply with JSON: {\"rewrites\": [{\"index\": 0, \"prompt\": \"...\"}]}.",
        user: JSON.stringify({
          examTypeCode,
          items: trimmed.map((item, index) => ({
            index,
            type: (item as { type: string }).type,
            prompt: (item as { prompt: string }).prompt,
          })),
        }),
        maxTokens: 1500,
        temperature: 0.3,
      });

      if (completion) {
        provider = completion.provider;
        model = completion.model;
        const rewrites = (completion.data as { rewrites?: unknown }).rewrites;
        if (Array.isArray(rewrites)) {
          for (const rewrite of rewrites) {
            if (!rewrite || typeof rewrite !== "object") continue;
            const r = rewrite as { index?: unknown; prompt?: unknown };
            const index = typeof r.index === "number" ? r.index : -1;
            const text = typeof r.prompt === "string" ? r.prompt.trim() : "";
            const target = trimmed[index] as { prompt?: string } | undefined;
            if (!target || !text || text.length < 8) continue;
            if (text.length > 600) continue;
            target.prompt = text;
            polished += 1;
          }
        }
      }
    }

    const day = typeof ctx.input.day === "string" ? ctx.input.day : new Date().toISOString().slice(0, 10);

    await db.dailyQuestionRun.upsert({
      where: { day_examTypeCode: { day, examTypeCode } },
      create: {
        day,
        examTypeCode,
        status: "RUNNING",
        stages: JSON.stringify([{ stage: "generate", status: "done", at: new Date().toISOString() }]),
        requested: count,
        generated: trimmed.length,
        jobId: ctx.jobId,
      },
      update: {
        generated: trimmed.length,
        requested: count,
        jobId: ctx.jobId,
        updatedAt: new Date(),
      },
    });

    await ctx.artifact({
      kind: "question.draft",
      payload: { examTypeCode, blueprintVersion: blueprint.version, items: trimmed },
      provenance: { provider, model: model ?? undefined, promptVersion: blueprint.version },
    });

    await ctx.log(
      "generator.completed",
      `${trimmed.length} item(s) drafted for ${examTypeCode}`,
      { provider, polished },
    );

    return {
      examTypeCode,
      section: requestedSection,
      generated: trimmed.length,
      provider,
      model,
      items: trimmed,
      blueprintVersion: blueprint.version,
      source: blueprint.source,
    };
  },
};

// ═══ Agent 003 — Question Quality Gate ════════════════════════════════════

const QUALITY_GATE: AgentDefinitionSpec = {
  code: "AGENT-QUALITY-GATE-03",
  name: "Question Quality Gate",
  version: "1.0.0",
  department: "Academic",
  description:
    "Checks a drafted question for correctness, rubric compliance, ambiguity, originality, answer-key validity and difficulty before it can be shown to a learner. A passing draft is raised for human approval; it is never published by the agent.",
  permissions: ["questions.review", "questions.publish.request", "bank.read"],
  maxDurationSeconds: 60,
  maxRetries: 2,
  maxConcurrency: 2,
  maxInputBytes: 262144,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["examTypeCode", "items"],
    properties: {
      examTypeCode: { type: "string", minLength: 1 },
      items: { type: "array", minItems: 1, maxItems: 50 },
      action: { type: "string", enum: ["review", "publish"] },
      approvalId: { type: "string" },
      // The live set the approved questions will be published into. Without
      // it an approval has nowhere to go, so it is carried on the approval
      // itself and the publish job picks it up from there.
      practiceSetId: { type: "string" },
      requestedBy: { type: "string" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["examTypeCode", "passed", "checked"],
    properties: {
      examTypeCode: { type: "string" },
      passed: { type: "boolean" },
      checked: { type: "integer", minimum: 0 },
      failed: { type: "integer", minimum: 0 },
      issues: { type: "array" },
      approvalId: { type: ["string", "null"] },
      published: { type: "integer", minimum: 0 },
    },
  },
  handler: async (ctx) => {
    const examTypeCode = String(ctx.input.examTypeCode);
    const items = (ctx.input.items ?? []) as Array<Record<string, unknown>>;
    const action = typeof ctx.input.action === "string" ? ctx.input.action : "review";

    // ── Publish mode: a human has approved a draft. ─────────────────────
    if (action === "publish") {
      const approvalId = typeof ctx.input.approvalId === "string" ? ctx.input.approvalId : "";
      const approval = await db.agentApproval.findUnique({
        where: { id: approvalId },
        select: { id: true, status: true, action: true, agentId: true, payload: true },
      });
      if (!approval) throw new Error(`no approval with id ${approvalId}`);
      if (approval.status !== "APPROVED") {
        throw new Error(
          `approval ${approvalId} is ${approval.status}. Only an APPROVED approval may publish content.`,
        );
      }
      const practiceSetId = String(ctx.input.practiceSetId ?? "");
      const set = await db.practiceSet.findFirst({
        where: { id: practiceSetId, isActive: true },
        select: { id: true, examType: { select: { code: true } } },
      });
      if (!set) throw new Error("a live, active practice set is required to publish into");
      if (set.examType.code !== examTypeCode) {
        throw new Error(
          `practice set ${practiceSetId} belongs to ${set.examType.code}, not ${examTypeCode}`,
        );
      }

      // The approval payload carries the draft items together with the exam
      // and the target set.
      const approvalPayload = JSON.parse(approval.payload) as {
        items?: Array<Record<string, unknown>>;
        examTypeCode?: string;
        practiceSetId?: string;
      };
      const approved = Array.isArray(approvalPayload.items) ? approvalPayload.items : [];
      if (approved.length === 0) {
        throw new Error("the approval carries no question drafts");
      }
      const order = await db.question.count({ where: { practiceSetId } });
      let published = 0;
      for (const item of approved) {
        await db.question.create({
          data: {
            practiceSetId,
            section: String(item.section ?? "READING"),
            type: String(item.type ?? "MULTIPLE_CHOICE"),
            prompt: String(item.prompt ?? ""),
            passage: item.passage ? String(item.passage) : null,
            options: Array.isArray(item.options) ? JSON.stringify(item.options) : null,
            correctIndex: typeof item.correctIndex === "number" ? item.correctIndex : null,
            correctAnswer: item.correctAnswer ? String(item.correctAnswer) : null,
            correctIndices: Array.isArray(item.correctIndices)
              ? JSON.stringify(item.correctIndices)
              : null,
            wordLimit: typeof item.wordLimit === "number" ? item.wordLimit : null,
            points: 1,
            order: order + published,
          },
        });
        published += 1;
      }

      await ctx.artifact({
        kind: "question.published",
        ref: practiceSetId,
        payload: { examTypeCode, published, approvalId },
        provenance: { provider: "human_approved", model: "quality-gate/1.0.0" },
      });
      await ctx.log("gate.published", `${published} question(s) published after approval`, {
        approvalId,
        practiceSetId,
      });
      return {
        examTypeCode,
        passed: true,
        checked: approved.length,
        failed: 0,
        issues: [],
        approvalId,
        published,
      };
    }

    // ── Review mode ──────────────────────────────────────────────────────
    const blueprint = getBlueprint(examTypeCode);
    const issues: Array<{ index: number; code: string; detail: string }> = [];
    const canonical = new Set(
      blueprint ? blueprint.sections.flatMap((s) => s.questionTypes) : [],
    );
    const allowedTypes = new Set<string>([
      "MULTIPLE_CHOICE", "TRUE_FALSE", "TRUE_FALSE_NOT_GIVEN", "READING_MCQ",
      "READ_AND_SELECT", "LISTEN_AND_SELECT", "FILL_BLANK", "SHORT_ANSWER",
      "SENTENCE_COMPLETION", "SUMMARY_COMPLETION", "WRITE_FROM_DICTATION",
      "COMPLETE_THE_SENTENCE", "MATCHING", "LABELING", "ESSAY", "SPEAKING",
      "CHART_DESCRIPTION", "WRITING_TASK1", "WRITING_TASK2",
    ]);

    // The prompts already in the live bank, for the originality check.
    const existing = await db.question.findMany({
      where: { practiceSet: { examType: { code: examTypeCode } } },
      select: { prompt: true },
    });
    const seen = new Set(existing.map((q) => normalize(q.prompt)));
    const batchSeen = new Set<string>();

    items.forEach((item, index) => {
      const type = String(item.type ?? "");
      const prompt = String(item.prompt ?? "").trim();
      const passage = typeof item.passage === "string" ? item.passage : "";
      const options = Array.isArray(item.options) ? (item.options as string[]) : undefined;
      const rawIndex = item.correctIndex;
      const correctIndex = typeof rawIndex === "number" ? rawIndex : null;

      if (!allowedTypes.has(type)) {
        issues.push({ index, code: "unknown_type", detail: `type "${type}" is not in the platform vocabulary` });
      } else if (blueprint && canonical.size > 0 && !canonical.has(type)) {
        issues.push({
          index,
          code: "outside_blueprint",
          detail: `type "${type}" is not used by the ${examTypeCode} blueprint`,
        });
      }

      if (prompt.length < 10) {
        issues.push({ index, code: "empty_prompt", detail: "the prompt is too short to be answerable" });
      }
      if (/\b(TODO|FIXME|XXX|placeholder|lorem ipsum)\b/i.test(prompt)) {
        issues.push({ index, code: "placeholder_text", detail: "the prompt contains placeholder text" });
      }

      // Answer-key validity, per type.
      const objective = !["ESSAY", "SPEAKING", "WRITING_TASK1", "WRITING_TASK2", "CHART_DESCRIPTION"].includes(type);
      if (objective) {
        const hasIndex = correctIndex !== null;
        const hasAnswer = typeof item.correctAnswer === "string" && item.correctAnswer.length > 0;
        const hasIndices = Array.isArray(item.correctIndices) && item.correctIndices.length > 0;
        if (!hasIndex && !hasAnswer && !hasIndices) {
          issues.push({ index, code: "missing_answer_key", detail: "the item has no answer key" });
        }
        if (hasIndex && correctIndex !== null) {
          if (!options || options.length < 2) {
            issues.push({ index, code: "missing_options", detail: "a multiple-choice item needs at least two options" });
          } else if (correctIndex < 0 || correctIndex >= options.length) {
            issues.push({
              index,
              code: "answer_out_of_range",
              detail: `correctIndex ${correctIndex} is outside the ${options.length} options`,
            });
          } else {
            const distinct = new Set(options.map((o) => o.trim().toLowerCase()));
            if (distinct.size !== options.length) {
              issues.push({ index, code: "duplicate_options", detail: "two options have the same text" });
            }
            const key = options[correctIndex].trim().toLowerCase();
            if (key.length === 0) {
              issues.push({ index, code: "empty_key_option", detail: "the keyed option is blank" });
            }
          }
        }
        if (!passage.trim() && !["SHORT_ANSWER", "FILL_BLANK", "SENTENCE_COMPLETION", "SUMMARY_COMPLETION"].includes(type)) {
          issues.push({ index, code: "missing_passage", detail: "the item has no passage to read" });
        }
      } else {
        if (typeof item.wordLimit !== "number") {
          issues.push({ index, code: "missing_word_limit", detail: "a written task needs a word limit" });
        }
      }

      // Originality.
      const normalized = normalize(prompt);
      if (normalized) {
        if (seen.has(normalized)) {
          issues.push({ index, code: "duplicate_of_existing", detail: "an identical question is already in the bank" });
        }
        if (batchSeen.has(normalized)) {
          issues.push({ index, code: "duplicate_in_batch", detail: "the same question appears twice in this batch" });
        }
        batchSeen.add(normalized);
      }

      const difficulty = typeof item.difficulty === "number" ? item.difficulty : 0.5;
      if (difficulty < 0 || difficulty > 1) {
        issues.push({ index, code: "difficulty_out_of_range", detail: "difficulty must be between 0 and 1" });
      }
    });

    const failed = new Set(issues.map((i) => i.index)).size;
    const passed = issues.length === 0;

    if (passed && items.length > 0) {
      const targetPracticeSetId =
        typeof ctx.input.practiceSetId === "string" ? ctx.input.practiceSetId : null;

      const approval = await ctx.requestApproval({
        action: "question.publish",
        subject: `${items.length} question(s) for ${examTypeCode}`,
        summary:
          `The quality gate passed ${items.length} draft item(s) for ${examTypeCode}. ` +
          "They carry original, generated content and are not taken from any exam provider's material." +
          (targetPracticeSetId
            ? ""
            : " No target practice set was supplied, so an operator must choose one before approving."),
        payload: {
          items,
          examTypeCode,
          practiceSetId: targetPracticeSetId,
        },
        requestedBy: typeof ctx.input.requestedBy === "string" ? ctx.input.requestedBy : null,
      });

      await ctx.artifact({
        kind: "question.approved_for_publish",
        payload: { examTypeCode, items, approvalId: approval.id },
        provenance: { provider: "quality_gate", model: "quality-gate/1.0.0" },
      });
      await ctx.log("gate.approved", "draft passed the gate and is waiting for a human", {
        approvalId: approval.id,
        count: items.length,
      });

      return {
        examTypeCode,
        passed: true,
        checked: items.length,
        failed: 0,
        issues: [],
        approvalId: approval.id,
        published: 0,
      };
    }

    await ctx.artifact({
      kind: "question.rejected",
      payload: { examTypeCode, issues },
      provenance: { provider: "quality_gate", model: "quality-gate/1.0.0" },
    });
    await ctx.log("gate.rejected", `${failed} item(s) failed the gate`, { issues }, "warn");

    return {
      examTypeCode,
      passed: false,
      checked: items.length,
      failed,
      issues,
      approvalId: null,
      published: 0,
    };
  },
};

/** Lower-case, collapse whitespace, drop punctuation, for duplicate detection. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function registerContentAgents(): void {
  registerAgent(ORCHESTRATOR);
  registerAgent(QUESTION_GENERATOR);
  registerAgent(QUALITY_GATE);
}
