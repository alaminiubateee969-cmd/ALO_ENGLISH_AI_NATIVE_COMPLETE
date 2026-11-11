/**
 * POST /api/linkis/jobs — submit a computation job to Apache Linkis (opt-in, ADMIN only)
 * GET  /api/linkis/jobs?execID=xxx — poll status
 *
 * Body: { code:string, runType:"sql"|"python"|"shell"|"jdbc"|..., engineType? }
 * Example: { "code":"SELECT count(*) FROM Question", "runType":"sql", "engineType":"spark-3.2.1" }
 * Upstream gateway: https://github.com/apache/linkis
 */

import { getCurrentUser } from "@/lib/auth";
import { isLinkisEnabled } from "@/lib/linkis/config";
import { submitJob, getJobStatus } from "@/lib/linkis/client";
import type { EngineType, RunType } from "@/lib/linkis/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(user: unknown): boolean {
  const role = (user as { role?: string } | null)?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!isLinkisEnabled()) {
    return Response.json({ enabled: false, message: "Linkis disabled. Set LINKIS_ENABLED=true" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const execID = searchParams.get("execID");
  if (!execID) return Response.json({ error: "execID query param required" }, { status: 400 });

  const r = await getJobStatus(execID);
  if (!r.enabled) return Response.json(r, { status: 503 });
  return Response.json({ enabled: true, ...r.data });
}

export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!isLinkisEnabled()) {
    return Response.json(
      { enabled: false, message: "Linkis disabled. Set LINKIS_ENABLED=true, LINKIS_GATEWAY_URL, LINKIS_TOKEN." },
      { status: 503 }
    );
  }

  let body: { code?: string; runType?: string; engineType?: string; scriptPath?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = String(body.code || "").trim();
  const runType = String(body.runType || "sql") as RunType;
  const engineType = body.engineType ? (String(body.engineType) as EngineType) : undefined;
  const scriptPath = body.scriptPath ? String(body.scriptPath) : "alo-english/api-job";

  if (!code) return Response.json({ error: "code is required" }, { status: 400 });
  if (code.length > 20000) return Response.json({ error: "code too large (max 20000 chars)" }, { status: 400 });

  const allowedRunTypes: RunType[] = ["sql", "py", "python", "scala", "hql", "shell", "jdbc", "psql"];
  if (!allowedRunTypes.includes(runType)) {
    return Response.json({ error: `runType must be one of ${allowedRunTypes.join(", ")}` }, { status: 400 });
  }

  // Basic injection guard: block DDL/DCL on this proxy (Linkis itself can allow it per user label)
  const lower = code.toLowerCase();
  const blocked = ["drop ", "truncate ", "grant ", "revoke "];
  for (const b of blocked) {
    if (lower.includes(b)) return Response.json({ error: `Code contains blocked statement: ${b.trim()}` }, { status: 400 });
  }

  try {
    const r = await submitJob({ code, runType, engineType, scriptPath });
    if (!r.enabled) return Response.json(r, { status: 503 });
    return Response.json({ enabled: true, execID: r.data.execID, taskID: r.data.taskID }, { status: 202 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
