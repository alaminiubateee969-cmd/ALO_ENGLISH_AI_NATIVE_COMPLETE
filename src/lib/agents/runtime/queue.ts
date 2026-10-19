/**
 * src/lib/agents/runtime/queue.ts
 *
 * The durable job queue.
 *
 * WHY A SQLITE QUEUE AND NOT BULLMQ
 * ────────────────────────────────
 * BullMQ needs Redis. The production deployment is a single Hostinger node
 * with a SQLite database and no Redis, and adding a Redis service to it would
 * mean a second thing that can be down. The queue therefore lives in the same
 * database as everything else, and it keeps the properties that actually
 * matter for correctness:
 *
 *   - a claimed job is leased, so a crashed worker cannot lose it;
 *   - a failing job is retried with exponential backoff, then dead-lettered;
 *   - an enqueue can be made idempotent, so a retried request does not do the
 *     work twice;
 *   - every transition is a row, so the admin monitor can show what happened.
 *
 * The interface is deliberately close to BullMQ's (enqueue / claim / complete
 * / fail / retry) so that swapping in Redis later is a contained change and
 * not a rewrite of every agent.
 *
 * ATOMICITY
 * ─────────
 * SQLite gives one writer at a time. A claim is a single UPDATE whose WHERE
 * clause names the job id *and* requires the status to still be QUEUED, so
 * exactly one worker can win the race; the loser sees zero affected rows and
 * moves on. There is no read-then-write window.
 */

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { EnqueueOptions, JobErrorKind } from "./types";

/** How long a claimed job stays leased before it is considered abandoned. */
const DEFAULT_LEASE_MS = 60_000;

/** The longest a job may wait between attempts. */
const MAX_BACKOFF_MS = 15 * 60_000;

/** The first backoff step. */
const BASE_BACKOFF_MS = 5_000;

export type ClaimedJob = {
  id: string;
  agentId: string;
  agentCode: string;
  queue: string;
  payload: string;
  attempts: number;
  maxAttempts: number;
};

export type QueueStats = {
  queued: number;
  running: number;
  retryWait: number;
  succeeded: number;
  failed: number;
  deadLetter: number;
};

/**
 * Exponential backoff with jitter.
 *
 * The jitter matters: without it, every job that failed during an outage
 * comes back at the same instant and re-creates the outage.
 */
export function backoffMs(attempt: number): number {
  const base = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempt - 1), MAX_BACKOFF_MS);
  const jitter = Math.floor(Math.random() * Math.min(base * 0.25, 2_000));
  return base + jitter;
}

/**
 * Enqueue a job for an agent.
 *
 * When `options.idempotencyKey` is supplied together with
 * `options.idempotencyScope`, a second enqueue of the same pair returns the
 * original job instead of creating a duplicate.
 */
export async function enqueueJob(
  agentId: string,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {},
): Promise<{ id: string; deduplicated: boolean }> {
  const scope = options.idempotencyScope ?? null;
  const key = options.idempotencyKey ?? null;
  const serialized = JSON.stringify(payload ?? {});

  if (scope && key) {
    const existing = await db.agentJob.findFirst({
      where: { idempotencyScope: scope, idempotencyKey: key },
      select: { id: true },
    });
    if (existing) return { id: existing.id, deduplicated: true };
  }

  try {
    const job = await db.agentJob.create({
      data: {
        agentId,
        queue: options.queue ?? "default",
        idempotencyScope: scope,
        idempotencyKey: key,
        status: "QUEUED",
        payload: serialized,
        maxAttempts: options.maxAttempts ?? 3,
        runAfter: options.runAfter ?? new Date(),
      },
      select: { id: true },
    });
    return { id: job.id, deduplicated: false };
  } catch (error) {
    // A concurrent enqueue of the same idempotency key wins the unique
    // constraint. Return that job rather than failing the caller.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (scope && key) {
        const existing = await db.agentJob.findFirst({
          where: { idempotencyScope: scope, idempotencyKey: key },
          select: { id: true },
        });
        if (existing) return { id: existing.id, deduplicated: true };
      }
    }
    throw error;
  }
}

/**
 * Claim the next runnable job.
 *
 * @param agentCodes restrict the claim to these agent codes. An empty array
 *                   means "any agent".
 */
export async function claimJob(
  agentCodes: string[] = [],
  leaseMs: number = DEFAULT_LEASE_MS,
): Promise<ClaimedJob | null> {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + leaseMs);

  const candidates = await db.agentJob.findMany({
    where: {
      status: "QUEUED",
      runAfter: { lte: now },
      ...(agentCodes.length > 0 ? { agent: { code: { in: agentCodes } } } : {}),
    },
    orderBy: [{ runAfter: "asc" }, { createdAt: "asc" }],
    take: 50,
    include: { agent: { select: { code: true, maxConcurrency: true, enabled: true } } },
  });

  for (const candidate of candidates) {
    if (!candidate.agent.enabled) continue;

    // Respect the per-agent concurrency limit.
    const running = await db.agentJob.count({
      where: { agentId: candidate.agentId, status: "RUNNING" },
    });
    if (running >= candidate.agent.maxConcurrency) continue;

    // Atomic claim. Exactly one worker can win this statement.
    const affected = await db.$executeRaw`
      UPDATE "AgentJob"
      SET "status" = 'RUNNING',
          "startedAt" = ${now},
          "leaseUntil" = ${leaseUntil},
          "attempts" = "attempts" + 1,
          "updatedAt" = ${now}
      WHERE "id" = ${candidate.id} AND "status" = 'QUEUED'
    `;

    if (affected === 1) {
      return {
        id: candidate.id,
        agentId: candidate.agentId,
        agentCode: candidate.agent.code,
        queue: candidate.queue,
        payload: candidate.payload,
        attempts: candidate.attempts + 1,
        maxAttempts: candidate.maxAttempts,
      };
    }
  }

  return null;
}

/** Extend the lease on a running job. */
export async function heartbeatJob(jobId: string, leaseMs: number = DEFAULT_LEASE_MS): Promise<void> {
  const leaseUntil = new Date(Date.now() + leaseMs);
  await db.agentJob.updateMany({
    where: { id: jobId, status: "RUNNING" },
    data: { leaseUntil, updatedAt: new Date() },
  });
}

/** Mark a job as successfully finished. */
export async function completeJob(
  jobId: string,
  result: unknown,
  usage: { inputTokens?: number; outputTokens?: number } = {},
  durationMs?: number,
): Promise<void> {
  await db.agentJob.updateMany({
    where: { id: jobId, status: "RUNNING" },
    data: {
      status: "SUCCEEDED",
      result: JSON.stringify(result ?? null),
      finishedAt: new Date(),
      leaseUntil: null,
      durationMs: durationMs ?? 0,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      error: null,
      errorKind: null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Record a failure.
 *
 * The job is retried while it has attempts left, and dead-lettered when it
 * does not. A dead-lettered job keeps its payload and its event log, so an
 * operator can see exactly what was tried.
 */
export async function failJob(
  jobId: string,
  error: string,
  kind: JobErrorKind = "unknown",
  durationMs = 0,
): Promise<{ status: "RETRY_WAIT" | "DEAD_LETTER" | "FAILED"; nextRunAt?: Date }> {
  const job = await db.agentJob.findUnique({
    where: { id: jobId },
    select: { attempts: true, maxAttempts: true, status: true },
  });
  if (!job) return { status: "FAILED" };

  const now = new Date();
  const canRetry = job.attempts < job.maxAttempts && kind !== "validation";

  if (canRetry) {
    const nextRunAt = new Date(now.getTime() + backoffMs(job.attempts));
    await db.agentJob.updateMany({
      where: { id: jobId },
      data: {
        status: "RETRY_WAIT",
        error: error.slice(0, 2000),
        errorKind: kind,
        runAfter: nextRunAt,
        leaseUntil: null,
        durationMs,
        updatedAt: now,
      },
    });
    return { status: "RETRY_WAIT", nextRunAt };
  }

  await db.agentJob.updateMany({
    where: { id: jobId },
    data: {
      status: kind === "validation" ? "FAILED" : "DEAD_LETTER",
      error: error.slice(0, 2000),
      errorKind: kind,
      finishedAt: now,
      leaseUntil: null,
      durationMs,
      updatedAt: now,
    },
  });
  return { status: kind === "validation" ? "FAILED" : "DEAD_LETTER" };
}

/**
 * Return abandoned jobs to the queue.
 *
 * A job whose lease expired was being worked on by a process that died. It
 * goes back to QUEUED so another worker can pick it up; the attempt it
 * already consumed still counts, so a job that kills its worker repeatedly
 * eventually dead-letters instead of looping forever.
 */
export async function recoverExpiredLeases(limit = 50): Promise<number> {
  const now = new Date();
  const expired = await db.agentJob.findMany({
    where: { status: "RUNNING", leaseUntil: { lt: now } },
    select: { id: true, attempts: true, maxAttempts: true },
    take: limit,
  });

  let recovered = 0;
  for (const job of expired) {
    if (job.attempts >= job.maxAttempts) {
      await db.agentJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: {
          status: "DEAD_LETTER",
          error: "lease expired and the retry budget was exhausted",
          errorKind: "unknown",
          finishedAt: now,
          leaseUntil: null,
          updatedAt: now,
        },
      });
    } else {
      await db.agentJob.updateMany({
        where: { id: job.id, status: "RUNNING" },
        data: {
          status: "QUEUED",
          runAfter: now,
          leaseUntil: null,
          updatedAt: now,
        },
      });
    }
    recovered += 1;
  }
  return recovered;
}

/** Move jobs whose retry window has arrived back into the runnable state. */
export async function promoteRetries(limit = 100): Promise<number> {
  const now = new Date();
  const result = await db.agentJob.updateMany({
    where: { status: "RETRY_WAIT", runAfter: { lte: now } },
    data: { status: "QUEUED", updatedAt: now },
  });
  void limit;
  return result.count;
}

/** Cancel a job that has not started yet. */
export async function cancelJob(jobId: string): Promise<boolean> {
  const result = await db.agentJob.updateMany({
    where: { id: jobId, status: { in: ["QUEUED", "RETRY_WAIT"] } },
    data: { status: "CANCELLED", finishedAt: new Date(), updatedAt: new Date() },
  });
  return result.count > 0;
}

/** Counts per status, for the admin monitor. */
export async function queueStats(): Promise<QueueStats> {
  const rows = await db.agentJob.groupBy({ by: ["status"], _count: { _all: true } });
  const stats: QueueStats = {
    queued: 0,
    running: 0,
    retryWait: 0,
    succeeded: 0,
    failed: 0,
    deadLetter: 0,
  };
  for (const row of rows) {
    switch (row.status) {
      case "QUEUED":
        stats.queued = row._count._all;
        break;
      case "RUNNING":
        stats.running = row._count._all;
        break;
      case "RETRY_WAIT":
        stats.retryWait = row._count._all;
        break;
      case "SUCCEEDED":
        stats.succeeded = row._count._all;
        break;
      case "FAILED":
        stats.failed = row._count._all;
        break;
      case "DEAD_LETTER":
        stats.deadLetter = row._count._all;
        break;
      default:
        break;
    }
  }
  return stats;
}
