#!/usr/bin/env node
/**
 * scripts/agent-worker.mjs — the host-side agent worker.
 *
 * WHAT THIS IS
 * ────────────
 * The agent workforce runs inside the platform's own Next.js process, and the
 * job queue lives in the platform's own SQLite database. This script is the
 * thing that makes the queue move on a schedule: it asks the running platform
 * to drain a bounded number of jobs, and reports what happened.
 *
 * It is deliberately a thin client. All the logic — claiming, leasing,
 * retrying, backoff, dead-lettering, logging — is in the platform, where it
 * is covered by the same tests as everything else. Duplicating it here would
 * create a second implementation that could drift.
 *
 * HOW TO RUN IT
 * ─────────────
 *   node scripts/agent-worker.mjs                 # drain up to 20 jobs
 *   node scripts/agent-worker.mjs --max 50        # drain up to 50
 *   node scripts/agent-worker.mjs --agent AGENT-ANALYTICS-10
 *   node scripts/agent-worker.mjs --once          # exit after one pass
 *
 * On the host, run it from cron:
 *   (cron, every five minutes)
 *   cd /opt/alo-english/current && node scripts/agent-worker.mjs --once
 *     >> /opt/alo-english/shared/logs/agent-worker.log 2>&1
 *
 * CONFIGURATION
 * ─────────────
 *   AGENT_WORKER_URL     the platform's base URL (default http://127.0.0.1:3000)
 *   AGENT_WORKER_TOKEN   the shared secret from the host's environment panel;
 *                        must match the platform's own AGENT_WORKER_TOKEN
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

function parseArgs(argv) {
  const args = { max: 20, agent: null, once: false, waitMs: 0 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--max") {
      args.max = Number.parseInt(argv[i + 1] ?? "20", 10) || 20;
      i += 1;
    } else if (arg === "--agent") {
      args.agent = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === "--once") {
      args.once = true;
    } else if (arg === "--wait") {
      args.waitMs = Number.parseInt(argv[i + 1] ?? "0", 10) || 0;
      i += 1;
    }
  }
  return args;
}

function loadDotEnv() {
  const path = join(process.cwd(), ".env");
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf8");
  for (const line of contents.split("\n")) {
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

async function drain(baseUrl, token, max, agent) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/agents/worker/run`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-agent-worker-token": token } : {}),
    },
    body: JSON.stringify({ maxJobs: max, ...(agent ? { agentCode: agent } : {}) }),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text.slice(0, 500) };
  }

  if (!response.ok) {
    throw new Error(
      `the platform answered HTTP ${response.status}: ${payload?.message ?? text.slice(0, 200)}`,
    );
  }
  return payload?.data ?? payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadDotEnv();

  const baseUrl = (process.env.AGENT_WORKER_URL || "http://127.0.0.1:3000").trim();
  const token = (process.env.AGENT_WORKER_TOKEN || "").trim();

  if (!token) {
    console.error(
      "AGENT_WORKER_TOKEN is not set. The worker needs the same shared secret as the platform. " +
        "Set it in the host's environment panel; do not put it in the repository.",
    );
    process.exitCode = 1;
    return;
  }

  const logPath = process.env.AGENT_WORKER_LOG || "";
  const line = (message) => {
    const stamp = new Date().toISOString();
    const text = `[${stamp}] ${message}`;
    console.log(text);
    if (logPath) {
      try {
        mkdirSync(dirname(logPath), { recursive: true });
        appendFileSync(logPath, `${text}\n`);
      } catch (error) {
        console.error(`could not write to ${logPath}: ${error.message}`);
      }
    }
  };

  do {
    try {
      const result = await drain(baseUrl, token, args.max, args.agent);
      const queue = result?.queue ?? {};
      line(
        `processed=${result?.processed ?? 0} queued=${queue.queued ?? 0} running=${queue.running ?? 0} ` +
          `retry=${queue.retryWait ?? 0} dead=${queue.deadLetter ?? 0}`,
      );
      if (args.once) break;
      if ((result?.processed ?? 0) === 0) {
        if (args.waitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, args.waitMs));
          continue;
        }
        break;
      }
    } catch (error) {
      line(`error: ${error instanceof Error ? error.message : String(error)}`);
      if (args.once) {
        process.exitCode = 1;
        break;
      }
      if (args.waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, args.waitMs));
        continue;
      }
      process.exitCode = 1;
      break;
    }
  } while (!args.once);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
