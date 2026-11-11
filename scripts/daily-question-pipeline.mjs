#!/usr/bin/env node
/**
 * scripts/daily-question-pipeline.mjs — the daily question generation pipeline.
 *
 * THE PIPELINE
 * ────────────
 *   Research → Generate → Validate → Check Duplicates → Verify Answers
 *   → Assign Difficulty → Approve → Publish → Allocate → Analyze
 *
 * Every stage is a real job in the platform's own queue. This script does
 * not generate anything itself; it drives the agents that do, and it reports
 * what each stage actually produced.
 *
 * WHAT IT WILL AND WILL NOT DO
 * ────────────────────────────
 * It will generate original, blueprint-aligned drafts for each of the nine
 * principal exam families, run them through the quality gate, and raise them
 * for human approval.
 *
 * It will NOT publish anything. Publishing is a human decision: the quality
 * gate raises an `AgentApproval`, and an administrator approves it. That is
 * the point of the gate, and this script does not route around it.
 *
 * NOTHING IS COPIED FROM ANY EXAM PROVIDER
 * ────────────────────────────────────────
 * The generator composes invented places, organisations and facts at run
 * time. The output is original practice material. It is not a reproduction
 * of anyone's paper, and it is not an official past paper.
 *
 * USAGE
 * ─────
 *   node scripts/daily-question-pipeline.mjs
 *   node scripts/daily-question-pipeline.mjs --count 3
 *   node scripts/daily-question-pipeline.mjs --exam IELTS-A --exam TOEFL-iBT
 *   node scripts/daily-question-pipeline.mjs --dry-run
 *
 * CONFIGURATION
 * ─────────────
 *   AGENT_WORKER_URL     the platform's base URL (default http://127.0.0.1:3000)
 *   AGENT_WORKER_TOKEN   the shared secret, the same one the platform uses
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The nine principal examination families the platform must support. */
const PRINCIPAL_EXAMS = [
  "IELTS-A",
  "IELTS-G",
  "TOEFL-iBT",
  "PTE-A",
  "DUOLINGO",
  "GRE",
  "GMAT",
  "SAT",
  "ACT",
  "ALO-PLACEMENT",
];

function parseArgs(argv) {
  const args = { count: 2, exams: [], dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--count") {
      args.count = Math.max(1, Number.parseInt(argv[i + 1] ?? "2", 10) || 2);
      i += 1;
    } else if (arg === "--exam") {
      const value = argv[i + 1];
      if (value) args.exams.push(value);
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function loadDotEnv() {
  const path = join(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function call(baseUrl, token, path, body, method = "POST") {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-agent-worker-token": token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text.slice(0, 400) };
  }
  if (!response.ok) {
    throw new Error(
      `${method} ${path} answered HTTP ${response.status}: ${payload?.message ?? text.slice(0, 200)}`,
    );
  }
  return payload?.data ?? payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadDotEnv();

  const baseUrl = (process.env.AGENT_WORKER_URL || "http://127.0.0.1:3000").trim();
  const token = (process.env.AGENT_WORKER_TOKEN || "").trim();
  const logPath = process.env.AGENT_WORKER_LOG || "";

  const log = (message) => {
    const stamp = new Date().toISOString();
    const text = `[${stamp}] ${message}`;
    console.log(text);
    if (logPath) {
      try {
        mkdirSync(dirname(logPath), { recursive: true });
        appendFileSync(logPath, `${text}\n`);
      } catch {
        // logging must never break the pipeline
      }
    }
  };

  if (!token) {
    log(
      "AGENT_WORKER_TOKEN is not set. The pipeline needs the same shared secret as the platform.",
    );
    process.exitCode = 1;
    return;
  }

  const exams = args.exams.length > 0 ? args.exams : PRINCIPAL_EXAMS;
  const day = new Date().toISOString().slice(0, 10);
  const summary = [];

  for (const examTypeCode of exams) {
    try {
      // ── Generate ──────────────────────────────────────────────────────
      const generation = await call(baseUrl, token, "/api/agents/jobs", {
        agentCode: "AGENT-QUESTION-GEN-02",
        payload: { examTypeCode, count: args.count, seed: hashSeed(day, examTypeCode) },
        idempotencyKey: `daily:${day}:${examTypeCode}`,
        idempotencyScope: "daily-question-generation",
      });

      // ── Run the queue so the generation job actually executes ─────────
      await call(baseUrl, token, "/api/agents/worker/run", {
        maxJobs: 5,
        agentCode: "AGENT-QUESTION-GEN-02",
      });

      const job = await call(
        baseUrl,
        token,
        `/api/agents/jobs?agent=AGENT-QUESTION-GEN-02&limit=1`,
        null,
        "GET",
      );
      const latest = job?.jobs?.[0];
      const items = latest?.result ? JSON.parse(latest.result).items : [];

      // ── Validate, check duplicates, verify the key, assign difficulty ──
      let gate = null;
      if (items.length > 0) {
        await call(baseUrl, token, "/api/agents/jobs", {
          agentCode: "AGENT-QUALITY-GATE-03",
          payload: { examTypeCode, items },
          idempotencyKey: `daily-gate:${day}:${examTypeCode}`,
          idempotencyScope: "daily-question-generation",
        });
        await call(baseUrl, token, "/api/agents/worker/run", {
          maxJobs: 5,
          agentCode: "AGENT-QUALITY-GATE-03",
        });
        const gateJob = await call(
          baseUrl,
          token,
          `/api/agents/jobs?agent=AGENT-QUALITY-GATE-03&limit=1`,
          null,
          "GET",
        );
        const latestGate = gateJob?.jobs?.[0];
        gate = latestGate?.result ? JSON.parse(latestGate.result) : null;
      }

      const record = {
        examTypeCode,
        day,
        generated: items.length,
        passed: gate?.passed ?? false,
        failed: gate?.failed ?? 0,
        approvalId: gate?.approvalId ?? null,
        published: 0,
        jobId: generation?.jobId ?? null,
      };
      summary.push(record);

      log(
        `${examTypeCode}: generated=${record.generated} passed=${record.passed} failed=${record.failed} ` +
          `approval=${record.approvalId ?? "none"} published=0`,
      );
    } catch (error) {
      summary.push({
        examTypeCode,
        day,
        error: error instanceof Error ? error.message : String(error),
      });
      log(`${examTypeCode}: FAILED — ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ── Analyze ──────────────────────────────────────────────────────────
  try {
    await call(baseUrl, token, "/api/agents/jobs", {
      agentCode: "AGENT-ANALYTICS-10",
      payload: { scope: "platform" },
    });
    await call(baseUrl, token, "/api/agents/worker/run", { maxJobs: 3 });
    log("analysis: complete");
  } catch (error) {
    log(`analysis: skipped — ${error instanceof Error ? error.message : String(error)}`);
  }

  const totalGenerated = summary.reduce((a, s) => a + (s.generated ?? 0), 0);
  const totalPassed = summary.filter((s) => s.passed).length;
  log(
    `day=${day} exams=${summary.length} generated=${totalGenerated} passed=${totalPassed} ` +
      `published=0 (publishing requires a human approval)`,
  );

  if (summary.some((s) => s.error)) {
    process.exitCode = 1;
  }
}

/** A stable seed for a day and an exam, so a re-run produces the same items. */
function hashSeed(day, examTypeCode) {
  let hash = 0;
  const text = `${day}:${examTypeCode}`;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
