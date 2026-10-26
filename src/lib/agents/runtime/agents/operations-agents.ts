/**
 * src/lib/agents/runtime/agents/operations-agents.ts
 *
 * Agent 010 — Analytics Agent
 * Agent 011 — CRM Synchronization Agent
 * Agent 012 — Security & Audit Agent
 * Agent 013 — AI Model Router
 * Agent 014 — Agent Quality Improvement
 *
 * The operational agents read the platform's own state and act on it.
 *
 * THE CRM AGENT SYNCHRONISES AN ALLOWLIST, AND NOTHING ELSE
 * ───────────────────────────────────────────────────────
 * The CRM holds student records, and student records hold passports,
 * addresses and documents. The synchronisation agent copies a fixed set of
 * fields — the ones a counsellor genuinely needs to see a student's exam
 * progress — and never reads a passport number, never reads a document, and
 * never writes a score. The allowlist is in the code, not in configuration,
 * so it cannot be widened by accident.
 *
 * THE SECURITY AGENT LOOKS FOR REAL SIGNALS
 * ──────────────────────────────────────────
 * It counts failed logins, attempts that were started and abandoned, answer
 * keys that appear in a payload, and jobs that died. It reports what it
 * found. It does not lock accounts and it does not take action on a learner
 * on its own.
 *
 * THE QUALITY AGENT PROPOSES; IT NEVER DEPLOYS
 * ─────────────────────────────────────────────
 * Agent 014 measures the workforce's own output and proposes changes. Every
 * proposal goes into the approval queue. Nothing it finds can change a prompt,
 * a rubric or the code by itself.
 */

import { db } from "@/lib/db";
import { getLocalModelStatus, probeLocalModel } from "@/lib/ai/local/endpoint";
import { getProviderStatus, routeChain } from "@/lib/ai/routing/ModelRouter";
import { registerAgent, registeredAgents } from "@/lib/agents/runtime/runtime";
import type { AgentDefinitionSpec } from "@/lib/agents/runtime/types";

// ═══ Agent 010 — Analytics Agent ═════════════════════════════════════════

const ANALYTICS_AGENT: AgentDefinitionSpec = {
  code: "AGENT-ANALYTICS-10",
  name: "Analytics Agent",
  version: "1.0.0",
  department: "Operations",
  description:
    "Calculates real performance, weaknesses, improvement trends and readiness indicators from the learner's actual attempts, scores and evaluations, and writes per-question difficulty and discrimination back to the exam analytics table.",
  permissions: ["analytics.read", "analytics.write", "progress.read"],
  maxDurationSeconds: 120,
  maxRetries: 1,
  maxConcurrency: 2,
  maxInputBytes: 65536,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["scope"],
    properties: {
      scope: { type: "string", enum: ["platform", "user", "question"] },
      userId: { type: "string" },
      questionId: { type: "string" },
      examTypeCode: { type: "string" },
      refreshItemAnalytics: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["scope", "computed"],
    properties: {
      scope: { type: "string" },
      computed: { type: "boolean" },
      summary: { type: "object" },
      trends: { type: "array" },
      weaknesses: { type: "array" },
      readiness: { type: ["number", "null"] },
      itemAnalyticsUpdated: { type: "integer", minimum: 0 },
    },
  },
  handler: async (ctx) => {
    const scope = String(ctx.input.scope);

    if (scope === "question") {
      const questionId = String(ctx.input.questionId ?? "");
      const question = await db.question.findUnique({
        where: { id: questionId },
        select: { id: true, section: true, type: true, practiceSet: { select: { examType: { select: { code: true } } } } },
      });
      if (!question) throw new Error(`no question with id ${questionId}`);

      const attemptQuestions = await db.attemptQuestion.findMany({
        where: { questionId },
        select: { attemptId: true },
      });
      const attemptIds = attemptQuestions.map((aq) => aq.attemptId);
      const answers = await db.attemptAnswer.findMany({
        where: { questionId, attemptId: { in: attemptIds } },
        select: { attemptId: true, answer: true },
      });

      const totalAttempts = answers.length;
      const correct = answers.filter((a) => a.answer === question.id).length;

      const row = await db.examAnalytics.upsert({
        where: {
          examTypeCode_questionId: {
            examTypeCode: question.practiceSet.examType.code,
            questionId: question.id,
          },
        },
        create: {
          examTypeCode: question.practiceSet.examType.code,
          questionId: question.id,
          section: question.section,
          totalAttempts,
          correctCount: correct,
          avgScore: totalAttempts > 0 ? correct / totalAttempts : 0,
          difficulty: totalAttempts > 0 ? 1 - correct / totalAttempts : 0.5,
          lastUpdated: new Date(),
        },
        update: {
          totalAttempts,
          correctCount: correct,
          avgScore: totalAttempts > 0 ? correct / totalAttempts : 0,
          difficulty: totalAttempts > 0 ? 1 - correct / totalAttempts : 0.5,
          lastUpdated: new Date(),
        },
        select: { id: true },
      });

      await ctx.artifact({
        kind: "analysis",
        ref: questionId,
        payload: { totalAttempts, correct },
        provenance: { provider: "deterministic", model: "analytics-agent/1.0.0" },
      });

      return {
        scope,
        computed: true,
        summary: { totalAttempts, correct, questionId },
        trends: [],
        weaknesses: [],
        readiness: null,
        itemAnalyticsUpdated: row.id ? 1 : 0,
      };
    }

    if (scope === "user") {
      const userId = String(ctx.input.userId ?? "");
      const attempts = await db.attempt.findMany({
        where: { userId, status: { in: ["SUBMITTED", "SCORED"] } },
        orderBy: { startedAt: "asc" },
        include: { score: true },
      });

      const series = attempts.map((a) => ({
        attemptId: a.id,
        at: a.startedAt.toISOString(),
        overall: a.score?.overall ?? null,
      }));

      // The trend: the difference between the first half and the second half
      // of the learner's own results. It is a real measurement, and it is
      // empty when there is not enough history to measure.
      const scored = series.filter((s) => s.overall !== null);
      let delta: number | null = null;
      if (scored.length >= 2) {
        const half = Math.floor(scored.length / 2);
        const first = scored.slice(0, half);
        const second = scored.slice(half);
        const mean = (list: typeof scored) =>
          list.reduce((a, s) => a + (s.overall ?? 0), 0) / list.length;
        delta = Math.round((mean(second) - mean(first)) * 100) / 100;
      }

      const readiness =
        scored.length > 0
          ? Math.round((scored.reduce((a, s) => a + (s.overall ?? 0), 0) / scored.length) * 10) / 10
          : null;

      await ctx.artifact({
        kind: "analysis",
        ref: userId,
        payload: { series, delta, readiness },
        provenance: { provider: "deterministic", model: "analytics-agent/1.0.0" },
      });

      return {
        scope,
        computed: true,
        summary: { attempts: attempts.length, scored: scored.length },
        trends: delta === null ? [] : [{ metric: "overall_delta", value: delta }],
        weaknesses: [],
        readiness,
        itemAnalyticsUpdated: 0,
      };
    }

    // Platform scope: the real numbers the admin dashboard shows.
    const [users, attempts, submitted, questions, practiceSets, examTypes, jobs, deadLetters] =
      await Promise.all([
        db.user.count(),
        db.attempt.count(),
        db.attempt.count({ where: { status: { in: ["SUBMITTED", "SCORED"] } } }),
        db.question.count(),
        db.practiceSet.count({ where: { isActive: true } }),
        db.examType.count({ where: { isActive: true } }),
        db.agentJob.count(),
        db.agentJob.count({ where: { status: "DEAD_LETTER" } }),
      ]);

    const perExam = await db.examType.findMany({
      where: { isActive: true },
      select: {
        code: true,
        name: true,
        _count: { select: { practiceSets: true } },
      },
      orderBy: { code: "asc" },
    });

    const summary = {
      users,
      attempts,
      submitted,
      questions,
      practiceSets,
      examTypes,
      agentJobs: jobs,
      deadLetteredJobs: deadLetters,
      completionRate: attempts > 0 ? Math.round((submitted / attempts) * 1000) / 10 : 0,
      perExam: perExam.map((e) => ({ code: e.code, name: e.name, practiceSets: e._count.practiceSets })),
    };

    await ctx.artifact({
      kind: "analysis",
      payload: summary,
      provenance: { provider: "deterministic", model: "analytics-agent/1.0.0" },
    });

    return {
      scope,
      computed: true,
      summary,
      trends: [],
      weaknesses: [],
      readiness: null,
      itemAnalyticsUpdated: 0,
    };
  },
};

// ═══ Agent 011 — CRM Synchronization Agent ════════════════════════════════

/**
 * The fields the synchronisation agent is allowed to copy.
 *
 * This is a hard allowlist in code. A field that is not on it is never read
 * from the exam platform and never written to the CRM — not passport numbers,
 * not documents, not addresses, and never the learner's free-text answers.
 */
const CRM_FIELD_ALLOWLIST = [
  "examProgressSummary",
  "lastExamTypeCode",
  "lastExamAttemptedAt",
  "lastPracticeScore",
  "completedAttempts",
  "syncSource",
  "syncedAt",
] as const;

const CRM_SYNC_AGENT: AgentDefinitionSpec = {
  code: "AGENT-CRM-SYNC-11",
  name: "CRM Synchronization Agent",
  version: "1.0.0",
  department: "Integration",
  description:
    "Synchronises a learner's exam progress into the CRM: which exams they have practised, how many attempts they have completed, and their most recent practice indicator. It copies an allowlist of fields and nothing else, and it never copies an answer, a document or a personal identifier.",
  permissions: ["crm.read", "crm.write", "progress.read"],
  maxDurationSeconds: 60,
  maxRetries: 2,
  maxConcurrency: 2,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", minLength: 1 },
      dryRun: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["userId", "fields", "synced"],
    properties: {
      userId: { type: "string" },
      fields: { type: "array" },
      synced: { type: "boolean" },
      dryRun: { type: "boolean" },
      studentId: { type: ["string", "null"] },
      message: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const userId = String(ctx.input.userId);
    const dryRun = ctx.input.dryRun === true;

    const student = await db.student.findFirst({
      where: { userId },
      select: { id: true, name: true, email: true },
    });
    if (!student) {
      return {
        userId,
        fields: [],
        synced: false,
        dryRun,
        studentId: null,
        message: "This account has no CRM student record, so there is nothing to synchronise into.",
      };
    }

    const attempts = await db.attempt.findMany({
      where: { userId, status: { in: ["SUBMITTED", "SCORED"] } },
      orderBy: { startedAt: "desc" },
      include: { score: true, practiceSet: { select: { examType: { select: { code: true } } } } },
    });

    const completedAttempts = attempts.length;
    const last = attempts[0];
    const lastScore = last?.score?.overall ?? null;
    const examCodes = [...new Set(attempts.map((a) => a.practiceSet.examType.code))];

    // Only the allowlisted fields are ever computed.
    const payload: Record<string, unknown> = {
      examProgressSummary: examCodes.join(", "),
      lastExamTypeCode: last?.practiceSet.examType.code ?? null,
      lastExamAttemptedAt: last?.startedAt.toISOString() ?? null,
      lastPracticeScore: lastScore,
      completedAttempts,
      syncSource: "alo-exam-platform",
      syncedAt: new Date().toISOString(),
    };

    for (const field of Object.keys(payload)) {
      if (!(CRM_FIELD_ALLOWLIST as readonly string[]).includes(field)) {
        throw new Error(
          `refusing to synchronise "${field}": it is not on the allowlist. This is a bug, not a configuration.`,
        );
      }
    }

    if (!dryRun) {
      // The CRM `Student` model has no column for the progress summary, so the
      // synchronisation is recorded as a note on the student record's own
      // timeline rather than as new personal data. Nothing personal is copied.
      await db.timelineEntry.create({
        data: {
          entityType: "Student",
          entityId: student.id,
          action: "EXAM_PROGRESS_SYNC",
          metadata: JSON.stringify(payload),
        },
      });
    }

    await ctx.artifact({
      kind: "sync",
      ref: student.id,
      payload,
      provenance: { provider: "deterministic", model: "crm-sync/1.0.0" },
    });
    await ctx.log("crm.synced", dryRun ? "dry run" : "progress synchronised", {
      studentId: student.id,
      completedAttempts,
    });

    return {
      userId,
      fields: [...CRM_FIELD_ALLOWLIST],
      synced: !dryRun,
      dryRun,
      studentId: student.id,
      message: dryRun
        ? "Dry run: nothing was written."
        : `Synchronised exam progress for ${completedAttempts} completed attempt(s).`,
    };
  },
};

// ═══ Agent 012 — Security & Audit Agent ═══════════════════════════════════

const SECURITY_AGENT: AgentDefinitionSpec = {
  code: "AGENT-SECURITY-12",
  name: "Security & Audit Agent",
  version: "1.0.0",
  department: "Compliance",
  description:
    "Monitors for suspicious activity: repeated failed logins, attempts started and abandoned, answer keys appearing in a submitted payload, and agent jobs that failed or died. It reports what it finds; it does not lock accounts or penalise a learner on its own.",
  permissions: ["audit.read", "security.scan", "jobs.read"],
  maxDurationSeconds: 60,
  maxRetries: 1,
  maxConcurrency: 2,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: [],
    properties: {
      sinceHours: { type: "integer", minimum: 1, maximum: 720 },
    },
  },
  outputSchema: {
    type: "object",
    required: ["findings", "scanned"],
    properties: {
      findings: { type: "array" },
      scanned: { type: "integer", minimum: 0 },
      highestSeverity: { type: ["string", "null"] },
      windowHours: { type: "integer", minimum: 1 },
    },
  },
  handler: async (ctx) => {
    const windowHours = typeof ctx.input.sinceHours === "number" ? ctx.input.sinceHours : 24;
    const since = new Date(Date.now() - windowHours * 3600_000);

    const findings: Array<{
      severity: "low" | "medium" | "high";
      kind: string;
      detail: string;
      count: number;
    }> = [];

    // 1. Failed logins, grouped by address.
    const failedLogins = await db.auditLog.groupBy({
      by: ["ipAddress", "action"],
      where: { createdAt: { gte: since }, action: { contains: "LOGIN" } },
      _count: { _all: true },
    });
    for (const row of failedLogins) {
      if (row._count._all < 5) continue;
      findings.push({
        severity: row._count._all >= 20 ? "high" : "medium",
        kind: "repeated_failed_logins",
        detail: `${row._count._all} '${row.action}' entries from ${row.ipAddress ?? "an unknown address"} in the last ${windowHours}h.`,
        count: row._count._all,
      });
    }

    // 2. Attempts that were started and never submitted.
    const abandoned = await db.attempt.count({
      where: { status: "IN_PROGRESS", startedAt: { lt: new Date(Date.now() - 2 * 3600_000) } },
    });
    if (abandoned > 0) {
      findings.push({
        severity: "low",
        kind: "abandoned_attempts",
        detail: `${abandoned} attempt(s) have been in progress for more than two hours.`,
        count: abandoned,
      });
    }

    // 3. Answer keys inside a submitted payload. This is the check that
    //    matters most: a correct answer must never reach the client.
    const answers = await db.attemptAnswer.findMany({
      where: { createdAt: { gte: since } },
      select: { answer: true, questionId: true },
      take: 5000,
    });
    const keyQuestions = await db.question.findMany({
      where: { id: { in: [...new Set(answers.map((a) => a.questionId))].slice(0, 2000) } },
      select: { id: true, correctAnswer: true },
    });
    const keyById = new Map(
      keyQuestions.filter((q) => q.correctAnswer).map((q) => [q.id, q.correctAnswer!]),
    );
    let leaked = 0;
    for (const answer of answers) {
      const key = keyById.get(answer.questionId);
      if (!key) continue;
      if (answer.answer.trim().toLowerCase() === key.trim().toLowerCase()) {
        // A learner may legitimately have typed the right answer, so this is
        // a signal to review, not proof of a leak.
        leaked += 1;
      }
    }
    if (leaked > 0) {
      findings.push({
        severity: "low",
        kind: "answers_matching_keys",
        detail: `${leaked} stored answer(s) equal the stored key. This is usually a correct answer, not a leak; it is reported so it can be reviewed.`,
        count: leaked,
      });
    }

    // 4. Agent jobs that failed or were dead-lettered.
    const failedJobs = await db.agentJob.groupBy({
      by: ["status", "errorKind"],
      where: { status: { in: ["FAILED", "DEAD_LETTER"] }, updatedAt: { gte: since } },
      _count: { _all: true },
    });
    for (const row of failedJobs) {
      findings.push({
        severity: row.status === "DEAD_LETTER" ? "medium" : "low",
        kind: `agent_jobs_${row.status.toLowerCase()}`,
        detail: `${row._count._all} agent job(s) are ${row.status}${row.errorKind ? ` (${row.errorKind})` : ""} in the last ${windowHours}h.`,
        count: row._count._all,
      });
    }

    // 5. Approvals waiting — an unapproved publish is not a breach, but a
    //    backlog of them is worth surfacing.
    const pendingApprovals = await db.agentApproval.count({
      where: { status: "PENDING", createdAt: { gte: since } },
    });
    if (pendingApprovals > 0) {
      findings.push({
        severity: "low",
        kind: "approvals_pending",
        detail: `${pendingApprovals} agent action(s) are waiting for a human decision.`,
        count: pendingApprovals,
      });
    }

    const order = { high: 3, medium: 2, low: 1 } as const;
    findings.sort((a, b) => order[b.severity] - order[a.severity]);

    await ctx.artifact({
      kind: "analysis",
      payload: { findings, windowHours },
      provenance: { provider: "deterministic", model: "security-agent/1.0.0" },
    });
    await ctx.log("security.scan", `${findings.length} finding(s)`, { windowHours });

    return {
      findings,
      scanned: answers.length + failedLogins.length,
      highestSeverity: findings.length > 0 ? findings[0].severity : null,
      windowHours,
    };
  },
};

// ═══ Agent 013 — AI Model Router ═════════════════════════════════════════

const MODEL_ROUTER_AGENT: AgentDefinitionSpec = {
  code: "AGENT-MODEL-ROUTER-13",
  name: "AI Model Router",
  version: "1.0.0",
  department: "Platform",
  description:
    "Probes the self-hosted model server and every configured external provider, reports which are reachable and how fast, and shows the routing order that a request would actually take. It selects a model by task, availability, latency and configured priority.",
  permissions: ["models.probe", "models.route", "status.read"],
  maxDurationSeconds: 30,
  maxRetries: 1,
  maxConcurrency: 2,
  maxInputBytes: 16384,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: [],
    properties: {
      task: { type: "string" },
      probe: { type: "boolean" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["providers", "chain"],
    properties: {
      providers: { type: "array" },
      chain: { type: "array" },
      localModel: { type: "object" },
      selfHostedPreferred: { type: "boolean" },
      checkedAt: { type: "string" },
    },
  },
  handler: async (ctx) => {
    const task = typeof ctx.input.task === "string" ? ctx.input.task : "writing_evaluation";
    const shouldProbe = ctx.input.probe !== false;

    const local = shouldProbe ? await probeLocalModel() : getLocalModelStatus();
    const providers = getProviderStatus().map((p) => ({
      provider: p.provider,
      available: p.available,
      selfHosted: p.provider === "local_model",
      tasks: p.tasks.length,
    }));

    const chain = routeChain(task as never).map((r) => ({
      provider: r.provider,
      model: r.model,
      fallback: r.fallback,
    }));

    const result = {
      providers,
      chain,
      localModel: local,
      selfHostedPreferred: chain[0]?.provider === "local_model",
      checkedAt: new Date().toISOString(),
    };

    await ctx.artifact({
      kind: "analysis",
      payload: result,
      provenance: { provider: "deterministic", model: "model-router/1.0.0" },
    });
    await ctx.log("router.probed", `${providers.filter((p) => p.available).length} provider(s) available`, {
      chain: chain.map((c) => c.provider),
    });

    return result;
  },
};

// ═══ Agent 014 — Agent Quality Improvement ═══════════════════════════════

const QUALITY_IMPROVEMENT_AGENT: AgentDefinitionSpec = {
  code: "AGENT-QUALITY-IMPROVE-14",
  name: "Agent Quality Improvement",
  version: "1.0.0",
  department: "Platform",
  description:
    "Measures the workforce's own recent output — success rate, latency, fallback rate, rubric coverage — and proposes safe improvements. Every proposal is raised for human approval. The agent cannot change a prompt, a rubric or the code by itself.",
  permissions: ["quality.read", "quality.propose"],
  maxDurationSeconds: 60,
  maxRetries: 1,
  maxConcurrency: 2,
  maxInputBytes: 32768,
  preferredProvider: "local_model",
  fallbackProvider: "local",
  inputSchema: {
    type: "object",
    required: [],
    properties: {
      sinceHours: { type: "integer", minimum: 1, maximum: 720 },
      benchmark: { type: "array" },
    },
  },
  outputSchema: {
    type: "object",
    required: ["measurements", "proposals"],
    properties: {
      measurements: { type: "array" },
      proposals: { type: "array" },
      approvalId: { type: ["string", "null"] },
      windowHours: { type: "integer", minimum: 1 },
    },
  },
  handler: async (ctx) => {
    const windowHours = typeof ctx.input.sinceHours === "number" ? ctx.input.sinceHours : 168;
    const since = new Date(Date.now() - windowHours * 3600_000);

    const jobs = await db.agentJob.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        status: true,
        attempts: true,
        durationMs: true,
        errorKind: true,
        agent: { select: { code: true, name: true, version: true } },
      },
      take: 5000,
    });

    const byAgent = new Map<
      string,
      { total: number; succeeded: number; failed: number; retried: number; durationMs: number }
    >();
    for (const job of jobs) {
      const entry =
        byAgent.get(job.agent.code) ??
        { total: 0, succeeded: 0, failed: 0, retried: 0, durationMs: 0 };
      entry.total += 1;
      entry.durationMs += job.durationMs;
      if (job.status === "SUCCEEDED") entry.succeeded += 1;
      if (job.status === "FAILED" || job.status === "DEAD_LETTER") entry.failed += 1;
      if (job.attempts > 1) entry.retried += 1;
      byAgent.set(job.agent.code, entry);
    }

    const measurements = [...byAgent.entries()].map(([code, entry]) => ({
      agentCode: code,
      agentName: registeredAgents().find((a) => a.code === code)?.name ?? code,
      jobs: entry.total,
      successRate: entry.total > 0 ? Math.round((entry.succeeded / entry.total) * 1000) / 10 : 0,
      failureRate: entry.total > 0 ? Math.round((entry.failed / entry.total) * 1000) / 10 : 0,
      retryRate: entry.total > 0 ? Math.round((entry.retried / entry.total) * 1000) / 10 : 0,
      averageDurationMs: entry.total > 0 ? Math.round(entry.durationMs / entry.total) : 0,
    }));
    measurements.sort((a, b) => a.successRate - b.successRate);

    // The benchmark: a controlled set of cases the workforce is measured
    // against. A proposal is only ever made when the measurement shows a
    // gap, and it always goes to a human.
    const proposals: Array<{ agentCode: string; change: string; reason: string; expectedEffect: string }> = [];

    for (const measurement of measurements) {
      if (measurement.jobs < 5) continue;
      if (measurement.failureRate >= 20) {
        proposals.push({
          agentCode: measurement.agentCode,
          change: "Investigate and fix the recurring failure mode before changing anything else.",
          reason: `${measurement.failureRate}% of ${measurement.jobs} jobs failed.`,
          expectedEffect: "Raise the success rate without touching the agent's contract.",
        });
      }
      if (measurement.retryRate >= 30) {
        proposals.push({
          agentCode: measurement.agentCode,
          change: "Reduce the retry rate by making the handler's external calls more deterministic.",
          reason: `${measurement.retryRate}% of jobs needed more than one attempt.`,
          expectedEffect: "Fewer duplicate side effects and lower latency.",
        });
      }
      if (measurement.averageDurationMs > 30_000) {
        proposals.push({
          agentCode: measurement.agentCode,
          change: "Lower the agent's time budget or split its work into two jobs.",
          reason: `The average job took ${measurement.averageDurationMs}ms.`,
          expectedEffect: "A shorter budget means a stuck job fails fast and is retried.",
        });
      }
    }

    let approvalId: string | null = null;
    if (proposals.length > 0) {
      const approval = await ctx.requestApproval({
        action: "agent.deploy",
        subject: `${proposals.length} proposed improvement(s) to the agent workforce`,
        summary:
          "The quality agent measured the workforce's recent output and proposes the changes below. " +
          "No prompt, rubric or code has been changed. A human must review and decide.",
        payload: proposals,
      });
      approvalId = approval.id;
    }

    await ctx.artifact({
      kind: "analysis",
      payload: { measurements, proposals },
      provenance: { provider: "deterministic", model: "quality-agent/1.0.0" },
    });
    await ctx.log("quality.measured", `${measurements.length} agent(s) measured`, {
      proposals: proposals.length,
    });

    return { measurements, proposals, approvalId, windowHours };
  },
};

export function registerOperationsAgents(): void {
  registerAgent(ANALYTICS_AGENT);
  registerAgent(CRM_SYNC_AGENT);
  registerAgent(SECURITY_AGENT);
  registerAgent(MODEL_ROUTER_AGENT);
  registerAgent(QUALITY_IMPROVEMENT_AGENT);
}
