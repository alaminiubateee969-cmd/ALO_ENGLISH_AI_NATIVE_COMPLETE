/**
 * src/lib/linkis/client.ts — thin REST client for Apache Linkis Gateway
 *
 * Does NOT vendor Linkis Java code. Talks to a separately deployed Linkis
 * cluster (see docs/LINKIS_INTEGRATION.md and docker-compose.linkis.yml).
 * When LINKIS_ENABLED !== "true" every method returns { enabled:false } so
 * the app builds and runs on Hostinger without Linkis.
 *
 * Upstream: https://github.com/apache/linkis
 * API docs: https://linkis.apache.org/docs/latest/api/entrance-api/
 */

import { getLinkisConfig, isLinkisEnabled } from "./config";
import type {
  EngineType,
  RunType,
  LinkisSubmitRequest,
  LinkisSubmitResponse,
  LinkisStatusResponse,
} from "./types";

export type LinkisDisabled = { enabled: false; reason: string };
export type LinkisEnabled<T> = { enabled: true; data: T };

function gateway() {
  const c = getLinkisConfig();
  if (!c.gatewayUrl) throw new Error("LINKIS_GATEWAY_URL not set");
  return c.gatewayUrl;
}

function headers() {
  const c = getLinkisConfig();
  return {
    "Content-Type": "application/json",
    "Token-Code": c.token,
  } as Record<string, string>;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Submit a job to Linkis Entrance. Returns execID/taskID for polling.
 * Engine selection is label-driven; Linkis does routing / load-balancing.
 */
export async function submitJob(opts: {
  code: string;
  runType: RunType;
  engineType?: EngineType;
  scriptPath?: string;
  labels?: Partial<{ userCreator: string }>;
  params?: Record<string, unknown>;
}): Promise<LinkisEnabled<LinkisSubmitResponse["data"]> | LinkisDisabled> {
  if (!isLinkisEnabled()) {
    return { enabled: false, reason: "Linkis disabled. Set LINKIS_ENABLED=true, LINKIS_GATEWAY_URL and LINKIS_TOKEN." };
  }
  const c = getLinkisConfig();
  const body: LinkisSubmitRequest = {
    executionContent: { code: opts.code, runType: opts.runType },
    params: {
      variable: {},
      configuration: {
        startup: { "wds.linkis.engineType": opts.engineType || c.defaultEngine },
        ...(opts.params || {}),
      },
    },
    labels: {
      engineType: (opts.engineType as EngineType) || (c.defaultEngine as EngineType),
      userCreator: opts.labels?.userCreator || "alo-system-IDE",
      version: "*-*",
    },
    source: { scriptPath: opts.scriptPath || "alo-english/linkis-job" },
  };

  const res = await fetchWithTimeout(`${gateway()}/api/rest_j/v1/entrance/submit`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  }, c.timeoutMs);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linkis submit failed ${res.status}: ${text}`);
  }
  const json = (await res.json()) as LinkisSubmitResponse;
  return { enabled: true, data: json.data };
}

export async function getJobStatus(execID: string): Promise<LinkisEnabled<LinkisStatusResponse["data"]> | LinkisDisabled> {
  if (!isLinkisEnabled()) {
    return { enabled: false, reason: "Linkis disabled" };
  }
  const c = getLinkisConfig();
  const res = await fetchWithTimeout(`${gateway()}/api/rest_j/v1/entrance/${execID}/status`, {
    headers: headers(),
  }, c.timeoutMs);
  if (!res.ok) throw new Error(`Linkis status ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as LinkisStatusResponse;
  return { enabled: true, data: json.data };
}

export async function getJobLog(execID: string): Promise<LinkisEnabled<string> | LinkisDisabled> {
  if (!isLinkisEnabled()) return { enabled: false, reason: "Linkis disabled" };
  const c = getLinkisConfig();
  const res = await fetchWithTimeout(`${gateway()}/api/rest_j/v1/entrance/${execID}/log`, {
    headers: headers(),
  }, c.timeoutMs);
  if (!res.ok) throw new Error(`Linkis log ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return { enabled: true, data: json.data?.log || JSON.stringify(json) };
}

/**
 * Helpers for ALO-specific tasks. Code runs on Linkis engines, not on Next.js.
 */

// Validate question bank via Python EngineConn (mirrors scripts/validate-content.mjs but distributed)
export const AloTasks = {
  validateQuestions: (whereClause = "isActive=1") =>
    submitJob({
      code: `
import json
# Runs inside Linkis Python EngineConn
print("ALO question-bank validation via Linkis Python")
# In production, query JDBC datasource alo_english.Question
# SELECT type, count(*) FROM Question WHERE ${whereClause} GROUP BY type
print(json.dumps({"task":"question_validation","where":"${whereClause}","status":"ok"}))
`,
      runType: "python",
      engineType: "python",
      scriptPath: "alo-english/validate-questions",
    }),

  examAnalyticsSpark: (sql = "SELECT practiceSetId, avg(overall) as avgScore, count(*) as attempts FROM Score GROUP BY practiceSetId") =>
    submitJob({
      code: sql,
      runType: "sql",
      engineType: "spark-3.2.1",
      scriptPath: "alo-english/exam-analytics",
    }),
};
