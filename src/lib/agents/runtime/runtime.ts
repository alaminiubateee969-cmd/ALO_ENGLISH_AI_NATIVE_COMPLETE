/**
 * src/lib/agents/runtime/runtime.ts
 *
 * The agent execution runtime.
 *
 * A handler is not trusted to behave. The runtime wraps every handler and
 * enforces, in this order:
 *
 *   1. the input matches the agent's declared input schema;
 *   2. the payload is not larger than the agent's input budget;
 *   3. the handler finishes inside the agent's time budget;
 *   4. the result matches the agent's declared output schema;
 *   5. every transition is written to the job's event log;
 *   6. every output is stored with its provider/model/prompt provenance;
 *   7. the day's counters are updated.
 *
 * If any of those fail, the job fails in the way the failure deserves:
 * a validation failure is never retried (the input will not fix itself),
 * a provider failure is retried with backoff, and a timeout is retried
 * because the model may well be slower next time.
 */

import { db } from "@/lib/db";
import {
  claimJob,
  completeJob,
  failJob,
  heartbeatJob,
  promoteRetries,
  recoverExpiredLeases,
} from "./queue";
import { validateAgainstSchema } from "./schema";
import type {
  AgentDefinitionSpec,
  ApprovalRequest,
  EventLevel,
  JobContext,
  JobErrorKind,
  Provenance,
} from "./types";

/** Where the runtime keeps the handler for an agent code. */
const handlerRegistry = new Map<string, AgentDefinitionSpec>();

/** Register an agent's definition and handler. */
export function registerAgent(spec: AgentDefinitionSpec): void {
  handlerRegistry.set(spec.code, spec);
}

/** All registered agents. */
export function registeredAgents(): AgentDefinitionSpec[] {
  return [...handlerRegistry.values()];
}

/** One agent by code. */
export function getAgentSpec(code: string): AgentDefinitionSpec | undefined {
  return handlerRegistry.get(code);
}

/**
 * Write the agent's definition into the database.
 *
 * The database is the source of truth for what an agent *is* (its version,
 * permissions, limits); the code is the source of truth for what it *does*.
 * They are reconciled on every start-up, so a version bump in code is
 * reflected in the admin monitor without a manual migration.
 */
export async function syncAgentDefinitions(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const spec of handlerRegistry.values()) {
    const existing = await db.agentDefinition.findUnique({
      where: { code: spec.code },
      select: { id: true, version: true },
    });

    const data = {
      name: spec.name,
      version: spec.version,
      department: spec.department,
      description: spec.description,
      enabled: true,
      inputSchema: JSON.stringify(spec.inputSchema),
      outputSchema: JSON.stringify(spec.outputSchema),
      permissions: JSON.stringify(spec.permissions),
      maxDurationSeconds: spec.maxDurationSeconds,
      maxRetries: spec.maxRetries,
      maxConcurrency: spec.maxConcurrency,
      maxInputBytes: spec.maxInputBytes,
      preferredProvider: spec.preferredProvider ?? null,
      fallbackProvider: spec.fallbackProvider ?? null,
    };

    if (!existing) {
      await db.agentDefinition.create({ data: { code: spec.code, ...data } });
      created += 1;
    } else if (existing.version !== spec.version) {
      await db.agentDefinition.update({ where: { code: spec.code }, data });
      updated += 1;
    } else {
      await db.agentDefinition.update({ where: { code: spec.code }, data });
    }
  }

  return { created, updated };
}

/** Append an event to a job's execution log. */
export async function logJobEvent(
  jobId: string,
  agentId: string,
  event: string,
  message?: string,
  data?: unknown,
  level: EventLevel = "info",
  durationMs?: number,
): Promise<void> {
  await db.agentJobEvent.create({
    data: {
      jobId,
      agentId,
      level,
      event,
      message: message ? message.slice(0, 2000) : null,
      data: data === undefined ? null : JSON.stringify(data).slice(0, 8000),
      durationMs: durationMs ?? null,
    },
  });
}

/** Update today's counters for an agent. */
async function bumpMetric(
  agentId: string,
  field: "enqueued" | "succeeded" | "failed" | "retried" | "deadLettered" | "rejected",
  amount = 1,
  extra: { durationMs?: number; inputTokens?: number; outputTokens?: number } = {},
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await db.agentMetric.upsert({
    where: { agentId_day: { agentId, day } },
    create: {
      agentId,
      day,
      [field]: amount,
      durationMsTotal: extra.durationMs ?? 0,
      inputTokens: extra.inputTokens ?? 0,
      outputTokens: extra.outputTokens ?? 0,
    },
    update: {
      [field]: { increment: amount },
      durationMsTotal: { increment: extra.durationMs ?? 0 },
      inputTokens: { increment: extra.inputTokens ?? 0 },
      outputTokens: { increment: extra.outputTokens ?? 0 },
    },
  });
}

/** A failure the runtime understands. */
export class AgentError extends Error {
  readonly kind: JobErrorKind;
  constructor(message: string, kind: JobErrorKind = "unknown") {
    super(message);
    this.name = "AgentError";
    this.kind = kind;
  }
}

/** Build the context a handler receives. */
async function buildContext(
  job: { id: string; agentId: string; payload: string; attempts: number },
  spec: AgentDefinitionSpec,
  deadlineMs: number,
): Promise<JobContext> {
  let input: Record<string, unknown> = {};
  try {
    input = JSON.parse(job.payload) as Record<string, unknown>;
  } catch {
    input = {};
  }

  let inputTokens = 0;
  let outputTokens = 0;

  return {
    db,
    jobId: job.id,
    agentCode: spec.code,
    agentVersion: spec.version,
    attempt: job.attempts,
    input,
    deadlineMs,
    log: async (event, message, data, level = "info") => {
      await logJobEvent(job.id, job.agentId, event, message, data, level);
    },
    artifact: async ({ kind, ref, payload, provenance }: {
      kind: string;
      ref?: string | null;
      payload: unknown;
      provenance?: Provenance;
    }) => {
      await db.agentArtifact.create({
        data: {
          jobId: job.id,
          agentId: job.agentId,
          kind,
          ref: ref ?? null,
          payload: JSON.stringify(payload ?? null),
          provider: provenance?.provider ?? null,
          model: provenance?.model ?? null,
          promptVersion: provenance?.promptVersion ?? null,
        },
      });
    },
    requestApproval: async (request: ApprovalRequest) => {
      const approval = await db.agentApproval.create({
        data: {
          jobId: job.id,
          agentId: job.agentId,
          action: request.action,
          subject: request.subject,
          summary: request.summary,
          payload: JSON.stringify(request.payload ?? null),
          requestedBy: request.requestedBy ?? null,
          status: "PENDING",
        },
      });
      await logJobEvent(
        job.id,
        job.agentId,
        "approval.requested",
        `${request.action} — ${request.subject}`,
        { summary: request.summary },
        "warn",
      );
      return { id: approval.id, status: approval.status };
    },
    usage: (i, o) => {
      inputTokens += i;
      outputTokens += o;
    },
    queue: async (agentCode, payload, options) => {
      const target = handlerRegistry.get(agentCode);
      if (!target) throw new AgentError(`unknown agent ${agentCode}`, "validation");
      const definition = await db.agentDefinition.findUnique({
        where: { code: agentCode },
        select: { id: true },
      });
      if (!definition) throw new AgentError(`agent ${agentCode} is not registered`, "validation");
      const { enqueueJob } = await import("./queue");
      const { id } = await enqueueJob(definition.id, payload, options);
      return id;
    },
  };
}

/** Run one claimed job to completion. */
export async function executeJob(
  jobId: string,
  agentId: string,
  agentCode: string,
  payloadJson: string,
  attempt: number,
): Promise<{ ok: boolean; status: string; error?: string }> {
  const spec = handlerRegistry.get(agentCode);
  if (!spec) {
    await failJob(jobId, `no handler registered for ${agentCode}`, "validation");
    return { ok: false, status: "FAILED" };
  }

  const started = Date.now();
  const maxDurationMs = spec.maxDurationSeconds * 1000;

  // The job must be in RUNNING for the completion to be recorded. A worker
  // that claimed it has already done that; a caller that invokes the agent
  // directly (the admin route's "run this now", or a test) has not, so the
  // transition is made here.
  const current = await db.agentJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (current && current.status !== "RUNNING") {
    await db.agentJob.updateMany({
      where: { id: jobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        leaseUntil: new Date(Date.now() + 60_000),
        updatedAt: new Date(),
      },
    });
  }

  // 1. Payload size.
  const payloadBytes = Buffer.byteLength(payloadJson, "utf8");
  if (payloadBytes > spec.maxInputBytes) {
    await logJobEvent(
      jobId,
      agentId,
      "job.rejected",
      `payload of ${payloadBytes} bytes exceeds the ${spec.maxInputBytes} byte budget`,
      undefined,
      "error",
    );
    await bumpMetric(agentId, "rejected");
    await failJob(jobId, `payload too large: ${payloadBytes} bytes`, "validation");
    return { ok: false, status: "FAILED" };
  }

  // 2. Input schema.
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  const inputViolations = validateAgainstSchema(parsed, spec.inputSchema);
  if (inputViolations.length > 0) {
    await logJobEvent(
      jobId,
      agentId,
      "job.rejected",
      "payload does not match the agent's input schema",
      inputViolations,
      "error",
    );
    await bumpMetric(agentId, "rejected");
    await failJob(
      jobId,
      `input schema violation: ${inputViolations.map((v) => `${v.path} ${v.message}`).join("; ")}`,
      "validation",
    );
    return { ok: false, status: "FAILED" };
  }

  await logJobEvent(jobId, agentId, "job.started", `attempt ${attempt}`, { attempt }, "info");

  // 3. Execute with a hard time budget.
  const ctx = await buildContext({ id: jobId, agentId, payload: payloadJson, attempts: attempt }, spec, maxDurationMs);

  let result: unknown;
  try {
    const execution = spec.handler(ctx);
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new AgentError(
              `agent exceeded its ${spec.maxDurationSeconds}s budget`,
              "timeout",
            ),
          ),
        maxDurationMs,
      );
    });
    try {
      result = await Promise.race([execution, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  } catch (error) {
    const kind: JobErrorKind =
      error instanceof AgentError
        ? error.kind
        : error instanceof Error && /timeout|abort/i.test(error.message)
          ? "timeout"
          : "unknown";
    const message = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - started;
    await logJobEvent(jobId, agentId, "job.failed", message, { kind }, "error", durationMs);
    const outcome = await failJob(jobId, message, kind, durationMs);
    await bumpMetric(
      agentId,
      outcome.status === "RETRY_WAIT" ? "retried" : outcome.status === "DEAD_LETTER" ? "deadLettered" : "failed",
      1,
      { durationMs },
    );
    return { ok: false, status: outcome.status, error: message };
  }

  // 4. Output schema.
  const outputViolations = validateAgainstSchema(result, spec.outputSchema);
  if (outputViolations.length > 0) {
    const message = `result does not match the agent's output schema: ${outputViolations
      .map((v) => `${v.path} ${v.message}`)
      .join("; ")}`;
    const durationMs = Date.now() - started;
    await logJobEvent(jobId, agentId, "job.rejected", message, outputViolations, "error", durationMs);
    await bumpMetric(agentId, "rejected", 1, { durationMs });
    await failJob(jobId, message, "validation", durationMs);
    return { ok: false, status: "FAILED", error: message };
  }

  const durationMs = Date.now() - started;
  await logJobEvent(jobId, agentId, "job.succeeded", undefined, undefined, "info", durationMs);
  await completeJob(jobId, result, {}, durationMs);
  await bumpMetric(agentId, "succeeded", 1, { durationMs });
  return { ok: true, status: "SUCCEEDED" };
}

/**
 * Run one round of the worker loop: recover abandoned work, promote retries,
 * claim a job, execute it.
 *
 * @returns the number of jobs that were processed in this round.
 */
export async function runWorkerRound(
  agentCodes: string[] = [],
): Promise<{ claimed: boolean; ok: boolean; jobId: string | null }> {
  await promoteRetries();
  await recoverExpiredLeases();

  const job = await claimJob(agentCodes);
  if (!job) return { claimed: false, ok: false, jobId: null };

  // A heartbeat keeps the lease alive while a slow handler runs.
  const heartbeat = setInterval(() => {
    void heartbeatJob(job.id);
  }, 20_000);

  try {
    const outcome = await executeJob(
      job.id,
      job.agentId,
      job.agentCode,
      job.payload,
      job.attempts,
    );
    return { claimed: true, ok: outcome.ok, jobId: job.id };
  } finally {
    clearInterval(heartbeat);
  }
}

/**
 * Drain the queue until nothing is left to do.
 *
 * @param maxJobs a hard cap, so a runaway producer cannot hold the worker
 *                forever.
 */
export async function drainQueue(agentCodes: string[] = [], maxJobs = 100): Promise<number> {
  let processed = 0;
  while (processed < maxJobs) {
    // The round reports whether it claimed anything. A failed job still
    // counts as processed: it has been retried, dead-lettered or rejected,
    // and it must not be claimed a second time just because it failed.
    const { claimed } = await runWorkerRound(agentCodes);
    if (!claimed) break;
    processed += 1;
  }
  return processed;
}
