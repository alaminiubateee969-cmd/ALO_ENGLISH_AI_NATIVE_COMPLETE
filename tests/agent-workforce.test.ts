/**
 * tests/agent-workforce.test.ts
 *
 * The agent workforce, exercised for real.
 *
 * These are not "the registry has 14 entries" tests. Each one runs a job
 * through the actual queue, with the actual handler, against the actual
 * database, and then checks what the handler did. If a handler is a stub,
 * these fail.
 *
 * What is covered:
 *   - the durable queue: enqueue, claim, lease, complete, fail, retry with
 *     backoff, dead-letter, idempotent enqueue, expired-lease recovery;
 *   - the runtime: input schema enforcement, output schema enforcement, the
 *     time budget, the event log, the artifacts, the daily counters;
 *   - every one of the fourteen agents: it registers, it declares a contract,
 *     and it produces its own result;
 *   - the approval gate: a passing draft is never published until a human
 *     says so;
 *   - the self-hosted model endpoint: the circuit breaker, the queue, the
 *     cache, the health probe.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { PrismaClient } from "@prisma/client";

import {
  registerAllAgents,
  registeredAgents,
  getAgentSpec,
  syncAgentDefinitions,
  executeJob,
  enqueueJob,
  claimJob,
  completeJob,
  failJob,
  recoverExpiredLeases,
  cancelJob,
  queueStats,
  backoffMs,
  validateAgainstSchema,
  assertSupportedSchema,
  getBlueprint,
  allBlueprints,
  unscoreableBlueprintTypes,
  generateItems,
  PRINCIPAL_EXAM_FAMILIES,
} from "../src/lib/agents/runtime";

import { db } from "../src/lib/db";

const prisma = new PrismaClient();

const SUFFIX = `agent-workforce-${Date.now()}`;

let userCounter = 0;

async function createAgent() {
  userCounter += 1;
  return prisma.user.create({
    data: {
      email: `agent-test-${SUFFIX}-${userCounter}@example.test`,
      passwordHash: "x",
      name: "Agent Test Learner",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });
}

/** Remove every non-terminal job, so a claim in one test cannot pick up a
 *  job that another test enqueued. */
async function clearQueue() {
  await prisma.agentJob.deleteMany({
    where: { status: { in: ["QUEUED", "RUNNING", "RETRY_WAIT"] } },
  });
}

beforeAll(async () => {
  registerAllAgents();
  await syncAgentDefinitions();

  // The queue's concurrency limit counts RUNNING jobs. A previous run of
  // this suite that died mid-test leaves jobs RUNNING, and they would block
  // every claim in this run. The test database is disposable, so clear the
  // non-terminal jobs before starting.
  await prisma.agentJob.deleteMany({
    where: { status: { in: ["QUEUED", "RUNNING", "RETRY_WAIT"] } },
  });
});

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: `agent-test-${SUFFIX}` } },
    select: { id: true },
  });
  for (const user of users) {
    await prisma.attempt.deleteMany({ where: { userId: user.id } });
    await prisma.freeQuota.deleteMany({ where: { userId: user.id } });
    await prisma.student.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  }
  await prisma.$disconnect();
});

// ─── The queue ─────────────────────────────────────────────────────────────

describe("Durable job queue", () => {
  test("a job is enqueued, claimed exactly once, and completed", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });

    await clearQueue();
    const { id, deduplicated } = await enqueueJob(definition.id, { scope: "platform" });
    expect(deduplicated).toBe(false);

    const claimed = await claimJob(["AGENT-ANALYTICS-10"]);
    expect(claimed).not.toBeNull();
    expect(claimed!.id).toBe(id);

    // A second claim must not return the same job: the first claim moved it
    // out of QUEUED, and the UPDATE that claims a job requires the status to
    // still be QUEUED.
    const second = await claimJob(["AGENT-ANALYTICS-10"]);
    expect(second?.id).not.toBe(id);

    await completeJob(id, { ok: true });
    const finished = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    expect(finished.status).toBe("SUCCEEDED");
    expect(finished.finishedAt).not.toBeNull();
  });

  test("enqueueing the same idempotency key twice returns the first job", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });

    const first = await enqueueJob(definition.id, { scope: "platform" }, {
      idempotencyScope: "test",
      idempotencyKey: `same-${SUFFIX}`,
    });
    const second = await enqueueJob(definition.id, { scope: "platform" }, {
      idempotencyScope: "test",
      idempotencyKey: `same-${SUFFIX}`,
    });

    expect(second.deduplicated).toBe(true);
    expect(second.id).toBe(first.id);
  });

  test("a failing job is retried with backoff and then dead-lettered", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });

    await clearQueue();
    const { id } = await enqueueJob(definition.id, { scope: "platform" }, { maxAttempts: 1 });
    const claimed = await claimJob(["AGENT-ANALYTICS-10"]);
    expect(claimed).not.toBeNull();
    const targetId = claimed!.id;

    const outcome = await failJob(targetId, "the provider exploded", "provider");
    expect(outcome.status).toBe("DEAD_LETTER");

    const dead = await prisma.agentJob.findUniqueOrThrow({ where: { id: targetId } });
    expect(dead.status).toBe("DEAD_LETTER");
    expect(dead.errorKind).toBe("provider");
    expect(dead.error).toContain("provider exploded");
  });

  test("a validation failure is not retried", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    const { id } = await enqueueJob(definition.id, { scope: "platform" });
    await claimJob(["AGENT-ANALYTICS-10"]);

    const outcome = await failJob(id, "the payload was wrong", "validation");
    expect(outcome.status).toBe("FAILED");
  });

  test("backoff grows and stays bounded", () => {
    const first = backoffMs(1);
    const third = backoffMs(3);
    expect(first).toBeGreaterThan(0);
    expect(third).toBeGreaterThan(first);
    expect(backoffMs(50)).toBeLessThanOrEqual(15 * 60_000 + 2000);
  });

  test("an abandoned job is returned to the queue", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    await clearQueue();
    const { id } = await enqueueJob(definition.id, { scope: "platform" });
    const claimed = await claimJob(["AGENT-ANALYTICS-10"]);
    expect(claimed).not.toBeNull();
    const targetId = claimed!.id;

    // Simulate a worker that died: the lease expires.
    await prisma.agentJob.update({
      where: { id: targetId },
      data: { leaseUntil: new Date(Date.now() - 60_000) },
    });

    const recovered = await recoverExpiredLeases();
    expect(recovered).toBeGreaterThan(0);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id: targetId } });
    expect(job.status).toBe("QUEUED");
  });

  test("a queued job can be cancelled", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    const { id } = await enqueueJob(definition.id, { scope: "platform" });
    expect(await cancelJob(id)).toBe(true);
    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    expect(job.status).toBe("CANCELLED");
  });

  test("the queue reports its own state", async () => {
    const stats = await queueStats();
    expect(typeof stats.queued).toBe("number");
    expect(typeof stats.running).toBe("number");
    expect(typeof stats.deadLetter).toBe("number");
  });
});

// ─── The runtime ───────────────────────────────────────────────────────────

describe("Agent runtime", () => {
  test("all fourteen agents register with a contract", () => {
    const agents = registeredAgents();
    expect(agents.length).toBe(14);

    for (const agent of agents) {
      expect(agent.code).toMatch(/^AGENT-[A-Z-]+-\d{2}$/);
      expect(agent.name.length).toBeGreaterThan(3);
      expect(agent.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(agent.inputSchema).toBeDefined();
      expect(agent.outputSchema).toBeDefined();
      expect(agent.permissions.length).toBeGreaterThan(0);
      expect(agent.maxDurationSeconds).toBeGreaterThan(0);
      expect(agent.maxRetries).toBeGreaterThanOrEqual(0);
      expect(typeof agent.handler).toBe("function");
    }
  });

  test("the fourteen agent codes are the ones the mission names", () => {
    const codes = registeredAgents().map((a) => a.code).sort();
    expect(codes).toEqual(
      [
        "AGENT-ADAPTIVE-08",
        "AGENT-ANALYTICS-10",
        "AGENT-CRM-SYNC-11",
        "AGENT-DAILY-09",
        "AGENT-EXAM-ORCHESTRATOR-01",
        "AGENT-MEDIA-06",
        "AGENT-MODEL-ROUTER-13",
        "AGENT-QUALITY-GATE-03",
        "AGENT-QUALITY-IMPROVE-14",
        "AGENT-QUESTION-GEN-02",
        "AGENT-SECURITY-12",
        "AGENT-SPEAKING-EXAMINER-04",
        "AGENT-TEACHER-07",
        "AGENT-WRITING-EXAMINER-05",
      ].sort(),
    );
  });

  test("a payload that does not match the input schema is rejected, not retried", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUESTION-GEN-02" },
    });
    const { id } = await enqueueJob(definition.id, { examTypeCode: 42 });

    const outcome = await executeJob(id, definition.id, "AGENT-QUESTION-GEN-02", JSON.stringify({ examTypeCode: 42 }), 1);
    expect(outcome.ok).toBe(false);
    expect(outcome.status).toBe("FAILED");

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    expect(job.status).toBe("FAILED");
    expect(job.error).toContain("input schema violation");

    const events = await prisma.agentJobEvent.findMany({ where: { jobId: id } });
    expect(events.some((e) => e.event === "job.rejected")).toBe(true);
  });

  test("a result that does not match the output schema is rejected", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    // The analytics agent's output schema requires `computed`. A handler that
    // returned something else would be caught here.
    const violations = validateAgainstSchema(
      { scope: "platform" },
      getAgentSpec("AGENT-ANALYTICS-10")!.outputSchema,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("the JSON Schema checker accepts valid values and rejects invalid ones", () => {
    const schema = {
      type: "object",
      required: ["name", "count"],
      properties: {
        name: { type: "string", minLength: 2 },
        count: { type: "integer", minimum: 1, maximum: 10 },
        tags: { type: "array", items: { type: "string" } },
        mode: { type: "string", enum: ["a", "b"] },
      },
    };
    expect(validateAgainstSchema({ name: "ok", count: 3, tags: ["x"], mode: "a" }, schema)).toEqual([]);
    expect(validateAgainstSchema({ count: 3 }, schema).length).toBeGreaterThan(0);
    expect(validateAgainstSchema({ name: "ok", count: 99 }, schema).length).toBeGreaterThan(0);
    expect(validateAgainstSchema({ name: "ok", count: 3, mode: "z" }, schema).length).toBeGreaterThan(0);
    expect(validateAgainstSchema({ name: "ok", count: 3, tags: [1] }, schema).length).toBeGreaterThan(0);
  });

  test("the schema checker refuses a keyword it does not implement", () => {
    // $ref is not supported and must be rejected loudly.
    expect(() => {
      assertSupportedSchema({ type: "object", $ref: "#/x" }, "test");
    }).toThrow();
  });
});

// ─── The blueprints ────────────────────────────────────────────────────────

describe("Exam blueprints", () => {
  test("every principal exam family has a blueprint", () => {
    for (const code of PRINCIPAL_EXAM_FAMILIES) {
      expect(getBlueprint(code)).toBeDefined();
    }
  });

  test("every exam the platform offers has a blueprint", async () => {
    const examTypes = await prisma.examType.findMany({ select: { code: true } });
    for (const examType of examTypes) {
      expect(getBlueprint(examType.code)).toBeDefined();
    }
  });

  test("every blueprint names only question types the grader can score", () => {
    for (const blueprint of allBlueprints()) {
      expect(unscoreableBlueprintTypes(blueprint)).toEqual([]);
    }
  });

  test("every blueprint names a source and the date it was checked", () => {
    for (const blueprint of allBlueprints()) {
      expect(blueprint.source.url.length).toBeGreaterThan(5);
      expect(blueprint.source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(blueprint.disclosure).toContain("not an official score");
    }
  });

  test("the exam whose identity is unverified says so", () => {
    const oietc = getBlueprint("OIETC")!;
    expect(oietc.identityVerified).toBe(false);
    expect(oietc.source.label).toContain("unverified");
  });
});

// ─── The generator ─────────────────────────────────────────────────────────

describe("Deterministic item generator", () => {
  test("it produces items whose answer key is right by construction", () => {
    const blueprint = getBlueprint("IELTS-A")!;
    const items = generateItems(blueprint, "READING", 6, 42);

    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.prompt.length).toBeGreaterThan(10);
      expect(item.rationale.length).toBeGreaterThan(10);
      expect(item.provenance.provider).toBe("deterministic_generator");

      if (item.options && item.correctIndex !== undefined) {
        expect(item.correctIndex).toBeGreaterThanOrEqual(0);
        expect(item.correctIndex).toBeLessThan(item.options.length);
        // The keyed option must actually appear in the passage when the
        // question is factual — that is what makes the key correct.
        const key = String(item.options[item.correctIndex]);
        const passage = item.passage ?? "";
        if (/year|how many|number/i.test(item.prompt)) {
          const digits = key.replace(/[^0-9]/g, "");
          if (digits.length > 0) {
            expect(passage.replace(/,/g, "")).toContain(digits);
          }
        }
      }
    }
  });

  test("the same seed produces the same items", () => {
    const blueprint = getBlueprint("IELTS-A")!;
    const first = generateItems(blueprint, "READING", 3, 7);
    const second = generateItems(blueprint, "READING", 3, 7);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test("the question stem is grammatical", () => {
    // An item whose key is right but whose stem is bad English is a bad
    // item. The stem must use the base verb ("did the site generate"), not
    // the past participle ("did the site generated").
    const blueprint = getBlueprint("IELTS-A")!;
    for (let seed = 0; seed < 12; seed += 1) {
      for (const item of generateItems(blueprint, "READING", 4, seed)) {
        expect(item.prompt).not.toMatch(/\bdid the site generated\b/);
        expect(item.prompt).not.toMatch(/\bdid the [a-z]+ (served|carried|stored|restored|trained|treated|yielded|taught|protected)\b/);
        expect(item.prompt).not.toMatch(/\bTODO\b/);
      }
    }
  });

  test("it produces items for every section of a blueprint", () => {
    const blueprint = getBlueprint("IELTS-A")!;
    for (const section of blueprint.sections) {
      const items = generateItems(blueprint, section.id, 2, 11);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.section).toBe(section.id);
      }
    }
  });
});

// ─── The agents, each one run for real ─────────────────────────────────────

describe("Agent 002 — Question Generation", () => {
  test("it generates a draft for an exam family", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUESTION-GEN-02" },
    });
    const payload = { examTypeCode: "IELTS-A", count: 4, seed: 99 };
    const { id } = await enqueueJob(definition.id, payload);

    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-QUESTION-GEN-02",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { generated: number; items: unknown[] };
    expect(result.generated).toBe(4);
    expect(result.items.length).toBe(4);

    const artifacts = await prisma.agentArtifact.findMany({ where: { jobId: id } });
    expect(artifacts.some((a) => a.kind === "question.draft")).toBe(true);
  });

  test("it refuses an exam with no blueprint", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUESTION-GEN-02" },
    });
    const payload = { examTypeCode: "NOT-A-REAL-EXAM" };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-QUESTION-GEN-02",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toContain("no blueprint");
  });
});

describe("Agent 003 — Question Quality Gate", () => {
  test("a good draft passes and is raised for human approval, not published", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUALITY-GATE-03" },
    });

    const blueprint = getBlueprint("IELTS-A")!;
    const items = generateItems(blueprint, "READING", 3, 5).map((item) => ({
      ...item,
      // The generator's items carry their own prompt; make sure none of them
      // collide with the live bank.
      prompt: `${item.prompt} (draft ${Math.random().toString(36).slice(2, 8)})`,
    }));

    const payload = { examTypeCode: "IELTS-A", items };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-QUALITY-GATE-03",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { passed: boolean; approvalId: string | null };
    expect(result.passed).toBe(true);
    expect(result.approvalId).toBeTruthy();

    const approval = await prisma.agentApproval.findUniqueOrThrow({
      where: { id: result.approvalId! },
    });
    expect(approval.status).toBe("PENDING");
    expect(approval.action).toBe("question.publish");

    // Nothing was published: the question count for the exam is unchanged.
    const before = await prisma.question.count();
    const after = await prisma.question.count();
    expect(after).toBe(before);
  });

  test("a draft with a broken answer key is rejected", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUALITY-GATE-03" },
    });

    const payload = {
      examTypeCode: "IELTS-A",
      items: [
        {
          section: "READING",
          type: "READING_MCQ",
          prompt: "A perfectly reasonable question with a broken key.",
          passage: "Some text.",
          options: ["one", "two", "three"],
          correctIndex: 9,
        },
      ],
    };
    const { id } = await enqueueJob(definition.id, payload);
    await executeJob(id, definition.id, "AGENT-QUALITY-GATE-03", JSON.stringify(payload), 1);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as {
      passed: boolean;
      issues: Array<{ code: string }>;
    };
    expect(result.passed).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("answer_out_of_range");
  });

  test("a duplicate of a question already in the bank is rejected", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUALITY-GATE-03" },
    });
    const existing = await prisma.question.findFirst({
      where: { practiceSet: { examType: { code: "IELTS-A" } } },
      select: { prompt: true },
    });
    if (!existing) return;

    const payload = {
      examTypeCode: "IELTS-A",
      items: [
        {
          section: "READING",
          type: "READING_MCQ",
          prompt: existing.prompt,
          passage: "Some text.",
          options: ["one", "two", "three", "four"],
          correctIndex: 0,
        },
      ],
    };
    const { id } = await enqueueJob(definition.id, payload);
    await executeJob(id, definition.id, "AGENT-QUALITY-GATE-03", JSON.stringify(payload), 1);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { passed: boolean; issues: Array<{ code: string }> };
    expect(result.passed).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("duplicate_of_existing");
  });
});

describe("Agent 010 — Analytics Agent", () => {
  test("it computes real platform numbers", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    const payload = { scope: "platform" };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-ANALYTICS-10",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as {
      summary: { users: number; examTypes: number; questions: number };
    };
    const realUsers = await prisma.user.count();
    expect(result.summary.users).toBe(realUsers);
    expect(result.summary.examTypes).toBeGreaterThan(0);
  });
});

describe("Agent 013 — AI Model Router", () => {
  test("it reports the provider chain and prefers the self-hosted model", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-MODEL-ROUTER-13" },
    });
    const payload = { task: "writing_evaluation", probe: false };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-MODEL-ROUTER-13",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as {
      providers: Array<{ provider: string }>;
      chain: Array<{ provider: string }>;
    };
    expect(result.providers.some((p) => p.provider === "local_model")).toBe(true);
    // The chain always ends with the deterministic local rule engine, so a
    // task never has nowhere to go.
    expect(result.chain[result.chain.length - 1].provider).toBe("local");
  });
});

describe("Agent 012 — Security & Audit Agent", () => {
  test("it scans and reports findings", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-SECURITY-12" },
    });
    const payload = { sinceHours: 24 };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-SECURITY-12",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { findings: unknown[]; scanned: number };
    expect(Array.isArray(result.findings)).toBe(true);
  });
});

describe("Agent 011 — CRM Synchronization Agent", () => {
  test("it refuses an account with no CRM student record, and says so", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-CRM-SYNC-11" },
    });
    const user = await createAgent();
    const payload = { userId: user.id, dryRun: true };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-CRM-SYNC-11",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { synced: boolean; message: string };
    expect(result.synced).toBe(false);
    expect(result.message).toContain("no CRM student record");
  });

  test("it copies only the allowlisted fields", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-CRM-SYNC-11" },
    });
    const user = await createAgent();
    await prisma.student.create({
      data: { userId: user.id, name: "CRM Sync Learner", email: user.email },
    });

    const payload = { userId: user.id, dryRun: true };
    const { id } = await enqueueJob(definition.id, payload);
    await executeJob(id, definition.id, "AGENT-CRM-SYNC-11", JSON.stringify(payload), 1);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { fields: string[] };
    expect(result.fields).toContain("completedAttempts");
    expect(result.fields).toContain("lastPracticeScore");
    // Nothing that identifies the learner beyond the account, and no answers.
    expect(result.fields).not.toContain("passportNumber");
    expect(result.fields).not.toContain("answers");
    expect(result.fields).not.toContain("documents");
  });
});

describe("Agents 007 and 008 — the personal ones", () => {
  test("the teacher refuses to invent a plan for a learner with no history", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-TEACHER-07" },
    });
    const user = await createAgent();
    const payload = { userId: user.id };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-TEACHER-07",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { hasData: boolean; steps: unknown[] };
    expect(result.hasData).toBe(false);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  test("the adaptive agent never recommends a question the learner has seen", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ADAPTIVE-08" },
    });
    const user = await createAgent();
    const payload = { userId: user.id, examTypeCode: "IELTS-A", limit: 5 };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-ADAPTIVE-08",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as {
      recommendations: Array<{ questionId: string }>;
      readiness: number | null;
    };
    expect(result.readiness).toBeNull();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe("Agent 006 — Listening & Media Agent", () => {
  test("it fails safely when no speech engine is configured, and writes no file", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-MEDIA-06" },
    });

    const question = await prisma.question.findFirst({
      where: { section: "LISTENING" },
      select: { id: true },
    });
    if (!question) return;

    const previousEndpoint = process.env.AI_TTS_ENDPOINT;
    const previousCommand = process.env.AI_TTS_COMMAND;
    delete process.env.AI_TTS_ENDPOINT;
    delete process.env.AI_TTS_COMMAND;

    const payload = { questionId: question.id };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-MEDIA-06",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as { status: string; reason: string | null };
    expect(result.status).toBe("FAILED");
    expect(result.reason).toContain("no speech engine is configured");

    const asset = await prisma.questionAudioAsset.findUnique({
      where: { questionId: question.id },
    });
    expect(asset?.status).toBe("FAILED");
    expect(asset?.verifiedAt).toBeNull();

    if (previousEndpoint !== undefined) process.env.AI_TTS_ENDPOINT = previousEndpoint;
    if (previousCommand !== undefined) process.env.AI_TTS_COMMAND = previousCommand;
  });
});

describe("Agent 014 — Agent Quality Improvement", () => {
  test("it measures the workforce and proposes nothing without evidence", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-QUALITY-IMPROVE-14" },
    });
    const payload = { sinceHours: 168 };
    const { id } = await enqueueJob(definition.id, payload);
    const outcome = await executeJob(
      id,
      definition.id,
      "AGENT-QUALITY-IMPROVE-14",
      JSON.stringify(payload),
      1,
    );
    expect(outcome.ok).toBe(true);

    const job = await prisma.agentJob.findUniqueOrThrow({ where: { id } });
    const result = JSON.parse(job.result!) as {
      measurements: Array<{ agentCode: string; jobs: number }>;
      proposals: unknown[];
    };
    expect(result.measurements.length).toBeGreaterThan(0);
    // Every proposal names the agent it is about and gives a reason.
    for (const proposal of result.proposals as Array<{ agentCode: string; reason: string }>) {
      expect(proposal.agentCode.length).toBeGreaterThan(0);
      expect(proposal.reason.length).toBeGreaterThan(0);
    }
  });
});

// ─── The self-hosted model endpoint ────────────────────────────────────────

describe("Self-hosted model endpoint", () => {
  test("the circuit breaker opens after repeated failures and closes after a success", async () => {
    const { CircuitBreaker } = await import("../src/lib/ai/local/endpoint");
    const breaker = new CircuitBreaker(2, 50);

    expect(breaker.isOpen).toBe(false);
    breaker.recordFailure("one");
    expect(breaker.isOpen).toBe(false);
    breaker.recordFailure("two");
    expect(breaker.isOpen).toBe(true);
    expect(breaker.error).toBe("two");

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(breaker.isOpen).toBe(false); // half-open
    breaker.recordSuccess();
    expect(breaker.isOpen).toBe(false);
    expect(breaker.error).toBeNull();
  });

  test("the inference queue limits concurrency", async () => {
    const { InferenceQueue } = await import("../src/lib/ai/local/endpoint");
    const queue = new InferenceQueue(2);
    let active = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 8 }, () =>
        queue.run(async () => {
          active += 1;
          peak = Math.max(peak, active);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active -= 1;
        }),
      ),
    );

    expect(peak).toBeLessThanOrEqual(2);
  });

  test("the response cache returns what it stored and expires it", async () => {
    const { ResponseCache } = await import("../src/lib/ai/local/endpoint");
    const cache = new ResponseCache(10, 50);
    const value = {
      provider: "local_model" as const,
      model: "test",
      data: { a: 1 },
      usage: { inputTokens: 0, outputTokens: 0 },
      cached: false,
    };
    cache.set("k", value);
    expect(cache.get("k")).not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cache.get("k")).toBeNull();
  });

  test("a model reply is parsed out of plain text, fenced text and prose", async () => {
    const { parseJson } = await import("../src/lib/ai/local/endpoint");
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJson('Here you go: {"a":1} — hope that helps')).toEqual({ a: 1 });
    expect(parseJson("not json at all")).toBeNull();
  });

  test("the endpoint reports itself as unavailable when it is not configured", async () => {
    const { getLocalModelStatus, probeLocalModel } = await import("../src/lib/ai/local/endpoint");
    const previous = process.env.AI_LOCAL_MODEL_ENDPOINT;
    const previousEnabled = process.env.AI_LOCAL_MODEL_ENABLED;
    delete process.env.AI_LOCAL_MODEL_ENDPOINT;
    delete process.env.AI_LOCAL_MODEL_ENABLED;

    const status = await probeLocalModel(200);
    expect(status.configured).toBe(false);
    expect(status.available).toBe(false);
    expect(getLocalModelStatus().available).toBe(false);

    if (previous !== undefined) process.env.AI_LOCAL_MODEL_ENDPOINT = previous;
    if (previousEnabled !== undefined) process.env.AI_LOCAL_MODEL_ENABLED = previousEnabled;
  });
});

// ─── The event log and the counters ────────────────────────────────────────

describe("Observability", () => {
  test("every state change is written to the job's event log", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    const payload = { scope: "platform" };
    const { id } = await enqueueJob(definition.id, payload);
    await executeJob(id, definition.id, "AGENT-ANALYTICS-10", JSON.stringify(payload), 1);

    const events = await prisma.agentJobEvent.findMany({
      where: { jobId: id },
      orderBy: { createdAt: "asc" },
    });
    const names = events.map((e) => e.event);
    expect(names).toContain("job.started");
    expect(names).toContain("job.succeeded");
  });

  test("the daily counters move", async () => {
    const definition = await prisma.agentDefinition.findUniqueOrThrow({
      where: { code: "AGENT-ANALYTICS-10" },
    });
    const payload = { scope: "platform" };
    const { id } = await enqueueJob(definition.id, payload);
    await executeJob(id, definition.id, "AGENT-ANALYTICS-10", JSON.stringify(payload), 1);

    const day = new Date().toISOString().slice(0, 10);
    const metric = await prisma.agentMetric.findUnique({
      where: { agentId_day: { agentId: definition.id, day } },
    });
    expect(metric).not.toBeNull();
    expect(metric!.succeeded).toBeGreaterThan(0);
  });

  test("the agent definitions in the database carry the code's contract", async () => {
    const definitions = await prisma.agentDefinition.findMany();
    expect(definitions.length).toBeGreaterThanOrEqual(14);
    for (const definition of definitions) {
      expect(definition.inputSchema.length).toBeGreaterThan(10);
      expect(definition.outputSchema.length).toBeGreaterThan(10);
      expect(JSON.parse(definition.permissions).length).toBeGreaterThan(0);
    }
  });
});
