/**
 * src/lib/agents/runtime/types.ts
 *
 * The vocabulary of the agent workforce.
 *
 * The point of these types is that an agent is not a label. An agent is a
 * registered identity with a version, a contract, a permission list, a
 * resource budget and a real handler. Everything in this file exists to make
 * "the agent ran" a checkable statement rather than a claim.
 */

import type { PrismaClient } from "@prisma/client";

/** The lifecycle of a job. Every transition is persisted. */
export type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "RETRY_WAIT"
  | "DEAD_LETTER"
  | "CANCELLED";

/** Why a job failed. Used to decide whether a retry could possibly help. */
export type JobErrorKind = "validation" | "provider" | "timeout" | "limit" | "unknown";

/** The levels a job event can carry. */
export type EventLevel = "debug" | "info" | "warn" | "error";

/** Where a piece of output came from. Never guess this. */
export type Provenance = {
  provider: string;
  model: string;
  promptVersion?: string;
};

/** An artifact is the output of a job: a question draft, an evaluation, a plan. */
export type AgentArtifactInput = {
  kind: string;
  ref?: string | null;
  payload: unknown;
  provenance?: Provenance;
};

/** A request for a human to approve something an agent wants to do. */
export type ApprovalRequest = {
  action: string;
  subject: string;
  summary: string;
  payload: unknown;
  requestedBy?: string | null;
};

/** Options accepted when enqueuing a job. */
export type EnqueueOptions = {
  /** The queue key. Jobs in the same queue run in order. */
  queue?: string;
  /** Run the job no earlier than this. */
  runAfter?: Date;
  /**
   * A key that makes the enqueue idempotent. Enqueuing the same
   * (scope, key) twice returns the first job instead of creating a second
   * one. This is what stops a retried HTTP request from generating the same
   * question twice.
   */
  idempotencyKey?: string;
  /** The namespace for the idempotency key. Use the agent code by default. */
  idempotencyScope?: string;
  /** Overrides the agent's configured retry budget. */
  maxAttempts?: number;
  /** A user id, when a human triggered the job. */
  requestedBy?: string | null;
};

/**
 * The context every handler receives.
 *
 * `db` is the live Prisma client. `log` appends to the job's execution log.
 * `artifact` stores an output with its provenance. `requestApproval` pauses
 * the job's high-impact step behind a human. `deadlineMs` is the remaining
 * time before the runtime will abort the handler.
 */
export type JobContext = {
  db: PrismaClient;
  jobId: string;
  agentCode: string;
  agentVersion: string;
  attempt: number;
  /** The parsed job payload. */
  input: Record<string, unknown>;
  /** Remaining milliseconds before the handler is aborted. */
  deadlineMs: number;
  /** Append a line to the job's execution log. */
  log: (event: string, message?: string, data?: unknown, level?: EventLevel) => Promise<void>;
  /** Store an output of this job. */
  artifact: (input: AgentArtifactInput) => Promise<void>;
  /** Ask a human to approve something. The job is not blocked by this. */
  requestApproval: (request: ApprovalRequest) => Promise<{ id: string; status: string }>;
  /** Record token usage for cost accounting. */
  usage: (inputTokens: number, outputTokens: number) => void;
  /** The job's own record, for handlers that need to enqueue follow-up work. */
  queue: (agentCode: string, payload: Record<string, unknown>, options?: EnqueueOptions) => Promise<string>;
};

/**
 * A handler is the real work an agent does.
 *
 * It must be deterministic in shape: given a valid input it either returns a
 * result object or throws. It must not perform irreversible, unreviewed
 * changes to production content — those go through `requestApproval`.
 */
export type AgentHandler = (ctx: JobContext) => Promise<unknown>;

/** The static definition of an agent. */
export type AgentDefinitionSpec = {
  code: string;
  name: string;
  version: string;
  department: string;
  description: string;
  /** JSON Schema for the job payload. Checked before the job is enqueued. */
  inputSchema: Record<string, unknown>;
  /** JSON Schema for the handler's result. Checked before the job completes. */
  outputSchema: Record<string, unknown>;
  /** Explicit capabilities, e.g. ["questions.write", "content.publish"]. */
  permissions: string[];
  /** Hard wall-clock budget for one attempt. */
  maxDurationSeconds: number;
  /** How many times a failing job is retried before it is dead-lettered. */
  maxRetries: number;
  /** How many jobs of this agent may run at once. */
  maxConcurrency: number;
  /** Largest accepted payload. */
  maxInputBytes: number;
  /** Which provider this agent prefers, and what it falls back to. */
  preferredProvider?: string;
  fallbackProvider?: string;
  /** The real work. */
  handler: AgentHandler;
};

/** A minimal JSON-Schema checker. Deliberately small and dependency-free. */
export type SchemaViolation = {
  path: string;
  message: string;
};
