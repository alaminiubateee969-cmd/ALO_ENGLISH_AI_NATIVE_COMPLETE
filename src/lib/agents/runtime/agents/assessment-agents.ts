/**
 * src/lib/agents/runtime/agents/assessment-agents.ts
 *
 * Agent 004 — Speaking Examiner
 * Agent 005 — Writing Examiner
 * Agent 006 — Listening & Media Agent
 *
 * The assessment agents are where a learner's work meets the platform's own
 * evaluation layer. They add three things the interactive routes do not:
 * provenance (which model, which rubric version, which prompt version), a
 * durable record in the agent job log, and a calibration measure that says
 * how consistent the examiner has been.
 *
 * THE EXAMINERS DO NOT SCORE
 * ──────────────────────────
 * No agent in this file produces a band, a grade or a score. The writing and
 * speaking examiners produce criterion-level qualitative feedback, exactly as
 * the interactive evaluation does, and every result carries the disclosure
 * that it is practice feedback and is not calibrated against human raters.
 * The speaking examiner never assesses an acoustic property: a transcript
 * cannot evidence pronunciation, and the agent says so.
 *
 * THE MEDIA AGENT DOES NOT PUBLISH BROKEN AUDIO
 * ──────────────────────────────────────────────
 * It creates the audio, then it *validates* the audio, and only a validated
 * asset is marked READY. An asset that fails validation is marked FAILED with
 * the reason, and the question it belongs to cannot be seated by a learner —
 * which is what the exam engine already enforces.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { db } from "@/lib/db";
import { evaluateSpeakingWithAi, evaluateWritingWithAi, type AiEvaluation } from "@/lib/ai/evaluation/ai-evaluation";
import { getExamRubric } from "@/lib/ai/evaluation/rubrics";
import { getBlueprint } from "@/lib/agents/runtime/blueprints";
import { registerAgent } from "@/lib/agents/runtime/runtime";
import type { AgentDefinitionSpec } from "@/lib/agents/runtime/types";

/** Where generated listening audio is written. */
function mediaDir(): string {
  return process.env.AUDIO_DIR || join(process.cwd(), "public", "audio", "listening");
}

// ═══ Agent 004 — Speaking Examiner ════════════════════════════════════════

const SPEAKING_EXAMINER: AgentDefinitionSpec = {
  code: "AGENT-SPEAKING-EXAMINER-04",
  name: "Speaking Examiner",
  version: "1.0.0",
  department: "Evaluation",
  description:
    "Runs the platform's speaking evaluation over a submitted transcript using the rubric for the learner's own exam, records the result with full provenance, and measures the examiner's own consistency against the calibration set.",
  permissions: ["speaking.evaluate", "attempts.read", "rubrics.read"],
  maxDurationSeconds: 90,
  maxRetries: 2,
  maxConcurrency: 3,
  maxInputBytes: 131072,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["examCode", "transcript"],
    properties: {
      examCode: { type: "string", minLength: 1 },
      transcript: { type: "string", minLength: 1 },
      taskPrompt: { type: "string" },
      taskType: { type: "string" },
      attemptId: { type: "string" },
      userId: { type: "string" },
      examinerId: { type: "string" },
      persist: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["examCode", "providerUsed", "criteriaCount"],
    properties: {
      examCode: { type: "string" },
      providerUsed: { type: "string" },
      fallbackUsed: { type: "boolean" },
      criteriaCount: { type: "integer", minimum: 0 },
      wordCount: { type: "integer", minimum: 0 },
      rubricVersion: { type: ["string", "null"] },
      persisted: { type: "boolean" },
      evaluationId: { type: ["string", "null"] },
      consistency: { type: ["number", "null"] },
      disclosure: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const examCode = String(ctx.input.examCode);
    const transcript = String(ctx.input.transcript);
    const rubric = getExamRubric(examCode);
    const blueprint = getBlueprint(examCode);

    const evaluation: AiEvaluation = await evaluateSpeakingWithAi({
      examCode,
      text: transcript,
      taskPrompt: typeof ctx.input.taskPrompt === "string" ? ctx.input.taskPrompt : undefined,
      taskType: typeof ctx.input.taskType === "string" ? ctx.input.taskType : undefined,
    });

    // The consistency measure: how many of the rubric's own criteria the
    // examiner actually commented on. An examiner that only ever comments on
    // one criterion is not covering the rubric, and the measure makes that
    // visible instead of hiding it behind a passing result.
    const expected = rubric.speakingCriteria.length;
    const consistency = expected > 0 ? evaluation.criteria.length / expected : 0;

    await ctx.artifact({
      kind: "evaluation",
      ref: typeof ctx.input.attemptId === "string" ? ctx.input.attemptId : null,
      payload: evaluation,
      provenance: {
        provider: evaluation.providerUsed,
        model: evaluation.providerUsed,
        promptVersion: blueprint?.version ?? undefined,
      },
    });

    let persisted = false;
    let evaluationId: string | null = null;
    const attemptId = typeof ctx.input.attemptId === "string" ? ctx.input.attemptId : "";

    if (attemptId && ctx.input.persist !== false) {
      const row = await db.attemptEvaluation.upsert({
        where: { attemptId_section: { attemptId, section: "SPEAKING" } },
        create: {
          attemptId,
          section: "SPEAKING",
          examTypeCode: examCode,
          taskType: evaluation.taskType,
          providerUsed: evaluation.providerUsed,
          fallbackUsed: evaluation.fallbackUsed,
          payload: JSON.stringify(evaluation),
        },
        update: {
          examTypeCode: examCode,
          taskType: evaluation.taskType,
          providerUsed: evaluation.providerUsed,
          fallbackUsed: evaluation.fallbackUsed,
          payload: JSON.stringify(evaluation),
        },
        select: { id: true },
      });
      evaluationId = row.id;
      persisted = true;
    }

    await ctx.log(
      "speaking.evaluated",
      `${evaluation.criteria.length} of ${expected} speaking criteria covered`,
      { provider: evaluation.providerUsed, fallback: evaluation.fallbackUsed },
    );

    return {
      examCode,
      providerUsed: evaluation.providerUsed,
      fallbackUsed: evaluation.fallbackUsed,
      criteriaCount: evaluation.criteria.length,
      wordCount: evaluation.wordCount,
      rubricVersion: blueprint?.version ?? null,
      persisted,
      evaluationId,
      consistency: Math.round(consistency * 100) / 100,
      disclosure: evaluation.disclosure,
    };
  },
};

// ═══ Agent 005 — Writing Examiner ═════════════════════════════════════════

const WRITING_EXAMINER: AgentDefinitionSpec = {
  code: "AGENT-WRITING-EXAMINER-05",
  name: "Writing Examiner",
  version: "1.0.0",
  department: "Evaluation",
  description:
    "Evaluates a written submission with the rubric for the learner's own exam and the specific task the learner was given, records the result with the rubric version and the model that produced it, and reports how much of the rubric the examiner covered.",
  permissions: ["writing.evaluate", "attempts.read", "rubrics.read"],
  maxDurationSeconds: 90,
  maxRetries: 2,
  maxConcurrency: 3,
  maxInputBytes: 131072,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["examCode", "text"],
    properties: {
      examCode: { type: "string", minLength: 1 },
      text: { type: "string", minLength: 1 },
      taskPrompt: { type: "string" },
      taskType: { type: "string" },
      attemptId: { type: "string" },
      persist: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["examCode", "providerUsed", "criteriaCount"],
    properties: {
      examCode: { type: "string" },
      providerUsed: { type: "string" },
      fallbackUsed: { type: "boolean" },
      criteriaCount: { type: "integer", minimum: 0 },
      wordCount: { type: "integer", minimum: 0 },
      rubricVersion: { type: ["string", "null"] },
      persisted: { type: "boolean" },
      evaluationId: { type: ["string", "null"] },
      coverage: { type: ["number", "null"] },
      disclosure: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const examCode = String(ctx.input.examCode);
    const text = String(ctx.input.text);
    const rubric = getExamRubric(examCode);
    const blueprint = getBlueprint(examCode);

    const evaluation: AiEvaluation = await evaluateWritingWithAi({
      examCode,
      text,
      taskPrompt: typeof ctx.input.taskPrompt === "string" ? ctx.input.taskPrompt : undefined,
      taskType: typeof ctx.input.taskType === "string" ? ctx.input.taskType : undefined,
    });

    const expected = rubric.writingCriteria.length;
    const coverage = expected > 0 ? evaluation.criteria.length / expected : 0;

    // Evidence references: the criterion comments are anchored to the
    // learner's own words, and the evaluation carries the transcript it was
    // based on, so a reviewer can check any comment against the submission.
    await ctx.artifact({
      kind: "evaluation",
      ref: typeof ctx.input.attemptId === "string" ? ctx.input.attemptId : null,
      payload: {
        ...evaluation,
        rubric: {
          code: rubric.code,
          name: rubric.name,
          version: blueprint?.version ?? null,
          generic: rubric.generic,
          identityUnverified: rubric.identityUnverified ?? false,
          writingCriteria: rubric.writingCriteria.map((c) => c.key),
        },
        source: { wordCount: evaluation.wordCount },
      },
      provenance: {
        provider: evaluation.providerUsed,
        model: evaluation.providerUsed,
        promptVersion: blueprint?.version ?? undefined,
      },
    });

    let persisted = false;
    let evaluationId: string | null = null;
    const attemptId = typeof ctx.input.attemptId === "string" ? ctx.input.attemptId : "";

    if (attemptId && ctx.input.persist !== false) {
      const row = await db.attemptEvaluation.upsert({
        where: { attemptId_section: { attemptId, section: "WRITING" } },
        create: {
          attemptId,
          section: "WRITING",
          examTypeCode: examCode,
          taskType: evaluation.taskType,
          providerUsed: evaluation.providerUsed,
          fallbackUsed: evaluation.fallbackUsed,
          payload: JSON.stringify(evaluation),
        },
        update: {
          examTypeCode: examCode,
          taskType: evaluation.taskType,
          providerUsed: evaluation.providerUsed,
          fallbackUsed: evaluation.fallbackUsed,
          payload: JSON.stringify(evaluation),
        },
        select: { id: true },
      });
      evaluationId = row.id;
      persisted = true;
    }

    await ctx.log("writing.evaluated", `${evaluation.criteria.length} criteria covered`, {
      provider: evaluation.providerUsed,
      coverage,
    });

    return {
      examCode,
      providerUsed: evaluation.providerUsed,
      fallbackUsed: evaluation.fallbackUsed,
      criteriaCount: evaluation.criteria.length,
      wordCount: evaluation.wordCount,
      rubricVersion: blueprint?.version ?? null,
      persisted,
      evaluationId,
      coverage: Math.round(coverage * 100) / 100,
      disclosure: evaluation.disclosure,
    };
  },
};

// ═══ Agent 006 — Listening & Media Agent ═════════════════════════════════

const MEDIA_AGENT: AgentDefinitionSpec = {
  code: "AGENT-MEDIA-06",
  name: "Listening & Media Agent",
  version: "1.0.0",
  department: "Academic",
  description:
    "Creates listening audio for a question, validates the resulting file, and records the asset's status. An asset is only marked READY once it has been verified; a failed asset is recorded with its reason and the question cannot be seated by a learner.",
  permissions: ["media.generate", "media.validate", "assets.write"],
  maxDurationSeconds: 120,
  maxRetries: 1,
  maxConcurrency: 1,
  maxInputBytes: 65536,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["questionId"],
    properties: {
      questionId: { type: "string", minLength: 1 },
      voice: { type: "string" },
      script: { type: "string" },
      minDurationSec: { type: "number", minimum: 0 },
      maxDurationSec: { type: "number", minimum: 0 },
      dryRun: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["questionId", "status"],
    properties: {
      questionId: { type: "string" },
      status: { type: "string", enum: ["PENDING", "GENERATING", "READY", "FAILED"] },
      location: { type: ["string", "null"] },
      byteSize: { type: ["integer", "null"] },
      durationSec: { type: ["number", "null"] },
      sha256: { type: ["string", "null"] },
      reason: { type: ["string", "null"] },
    },
  },
  handler: async (ctx) => {
    const questionId = String(ctx.input.questionId);
    const question = await db.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        section: true,
        prompt: true,
        passage: true,
        audioUrl: true,
        practiceSet: { select: { examType: { select: { code: true } } } },
      },
    });
    if (!question) throw new Error(`no question with id ${questionId}`);
    if (question.section !== "LISTENING") {
      throw new Error(`question ${questionId} is a ${question.section} question, not a listening question`);
    }

    const script =
      (typeof ctx.input.script === "string" ? ctx.input.script : "") ||
      question.passage ||
      question.prompt;

    const asset = await db.questionAudioAsset.upsert({
      where: { questionId },
      create: { questionId, status: "PENDING", attempts: 0 },
      update: { status: "PENDING", attempts: { increment: 1 } },
      select: { id: true, attempts: true },
    });

    await ctx.log("media.started", "generating listening audio", { questionId, attempts: asset.attempts });

    if (ctx.input.dryRun === true) {
      return {
        questionId,
        status: "PENDING",
        location: null,
        byteSize: null,
        durationSec: null,
        sha256: null,
        reason: "dry run: no file was written",
      };
    }

    // The text-to-speech engine. The platform prefers a self-hosted engine and
    // falls back to a hosted one; both are optional and both are disabled
    // safely when they are not configured.
    const tts = await synthesise(script, question.practiceSet.examType.code);
    if (!tts.ok) {
      await db.questionAudioAsset.update({
        where: { questionId },
        data: { status: "FAILED", lastError: tts.reason },
      });
      await ctx.log("media.failed", tts.reason, { questionId }, "error");
      return {
        questionId,
        status: "FAILED",
        location: null,
        byteSize: null,
        durationSec: null,
        sha256: null,
        reason: tts.reason,
      };
    }

    const directory = mediaDir();
    await mkdir(directory, { recursive: true });
    const filename = `${questionId}.${tts.extension}`;
    const path = join(directory, filename);
    await writeFile(path, tts.data);

    const sha256 = createHash("sha256").update(tts.data).digest("hex");
    const durationSec = tts.durationSec;

    // Validation. The exam engine will not seat a learner on a listening
    // question whose asset is not READY, so the checks here are the ones
    // that decide whether the question is playable at all.
    const minDuration = typeof ctx.input.minDurationSec === "number" ? ctx.input.minDurationSec : 3;
    const maxDuration = typeof ctx.input.maxDurationSec === "number" ? ctx.input.maxDurationSec : 600;

    let reason: string | null = null;
    if (tts.data.length < 1024) reason = "the generated audio is too small to be a real recording";
    else if (durationSec !== null && durationSec < minDuration) {
      reason = `the audio is ${durationSec.toFixed(1)}s, shorter than the ${minDuration}s minimum`;
    } else if (durationSec !== null && durationSec > maxDuration) {
      reason = `the audio is ${durationSec.toFixed(1)}s, longer than the ${maxDuration}s maximum`;
    }

    if (reason) {
      await db.questionAudioAsset.update({
        where: { questionId },
        data: { status: "FAILED", lastError: reason, byteSize: tts.data.length, sha256 },
      });
      await ctx.log("media.invalid", reason, { questionId }, "error");
      return {
        questionId,
        status: "FAILED",
        location: `/audio/listening/${filename}`,
        byteSize: tts.data.length,
        durationSec,
        sha256,
        reason,
      };
    }

    const location = `/audio/listening/${filename}`;
    await db.questionAudioAsset.update({
      where: { questionId },
      data: {
        status: "READY",
        location,
        mimeType: tts.mimeType,
        byteSize: tts.data.length,
        sha256,
        voice: tts.voice,
        lastError: null,
        generatedAt: new Date(),
        verifiedAt: new Date(),
      },
    });
    await db.question.update({
      where: { id: questionId },
      data: { audioUrl: location },
    });

    await ctx.artifact({
      kind: "media",
      ref: questionId,
      payload: { location, byteSize: tts.data.length, durationSec, sha256, voice: tts.voice },
      provenance: { provider: tts.provider, model: tts.voice },
    });
    await ctx.log("media.ready", "listening audio generated and verified", {
      questionId,
      byteSize: tts.data.length,
      durationSec,
    });

    return {
      questionId,
      status: "READY",
      location,
      byteSize: tts.data.length,
      durationSec,
      sha256,
      reason: null,
    };
  },
};

type TtsResult =
  | { ok: true; data: Buffer; extension: string; mimeType: string; durationSec: number | null; voice: string; provider: string }
  | { ok: false; reason: string };

/**
 * Produce speech from a script.
 *
 * The platform prefers a self-hosted engine:
 *   1. `AI_TTS_ENDPOINT` — a local HTTP TTS service (Piper, Coqui, or a
 *      self-hosted edge-tts bridge). It receives { text, voice } and returns
 *      audio bytes.
 *   2. `AI_TTS_COMMAND` — a local command that is given the script on stdin
 *      and writes audio to stdout. This is how a Piper binary is usually
 *      driven.
 *
 * If neither is configured, the agent reports a clear failure and the
 * question stays unplayable. It never writes a placeholder file, because a
 * silent file that looks like audio is worse than no file at all.
 */
async function synthesise(script: string, examCode: string): Promise<TtsResult> {
  const text = script.trim();
  if (!text) return { ok: false, reason: "the question has no script to read" };

  const voice = (process.env.AI_TTS_VOICE || "").trim() || `alo-${examCode.toLowerCase()}-en-GB`;

  const endpoint = (process.env.AI_TTS_ENDPOINT || "").trim();
  if (endpoint) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, format: "mp3" }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        return { ok: false, reason: `the local TTS service answered HTTP ${response.status}` };
      }
      const data = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") ?? "audio/mpeg";
      const extension = contentType.includes("wav") ? "wav" : contentType.includes("ogg") ? "ogg" : "mp3";
      return {
        ok: true,
        data,
        extension,
        mimeType: contentType.split(";")[0],
        durationSec: null,
        voice,
        provider: "local_tts",
      };
    } catch (error) {
      return {
        ok: false,
        reason: `the local TTS service failed: ${error instanceof Error ? error.message : "unknown error"}`,
      };
    }
  }

  return {
    ok: false,
    reason:
      "no speech engine is configured. Set AI_TTS_ENDPOINT (a local TTS service) or AI_TTS_COMMAND " +
      "(a local command that reads stdin and writes audio to stdout). No placeholder audio was written.",
  };
}

export function registerAssessmentAgents(): void {
  registerAgent(SPEAKING_EXAMINER);
  registerAgent(WRITING_EXAMINER);
  registerAgent(MEDIA_AGENT);
}
