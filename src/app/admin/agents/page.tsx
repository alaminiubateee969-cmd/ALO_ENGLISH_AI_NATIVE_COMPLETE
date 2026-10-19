"use client";

/**
 * src/app/admin/agents/page.tsx
 *
 * The agent workforce's monitoring page.
 *
 * Every number on this page comes from the platform's own job table: jobs
 * that ran, jobs that failed, jobs that were dead-lettered, the approvals
 * waiting for a human, and which model servers answered. Nothing here is
 * hard-coded and nothing here is aspirational — an agent that has never run
 * says so.
 */

import { useEffect, useState } from "react";
import { Bot, Activity, AlertTriangle, CheckCircle2, Clock, Play, ShieldAlert } from "lucide-react";

import { DashboardShell, DashboardCard, useApi } from "@/components/site/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Exam Centre", href: "/admin/exam-center" },
  { label: "Learning", href: "/admin/learning" },
  { label: "AI Agents", href: "/admin/agents" },
  { label: "Agent Status", href: "/api/agents/status" },
  { label: "Health Check", href: "/api/health" },
];

type AgentRow = {
  code: string;
  name: string;
  version: string;
  department: string;
  responsibility: string;
  status: string;
  requiresAdminApproval: boolean;
  permissions: string[];
  limits: { maxDurationSeconds: number; maxRetries: number; maxConcurrency: number };
  measured: {
    jobs: number;
    succeeded: number;
    failed: number;
    successRate: number | null;
    averageDurationMs: number | null;
  };
};

type MetricsResponse = {
  windowDays: number;
  registeredAgents: number;
  definitions: AgentRow[];
  queue: {
    queued: number;
    running: number;
    retryWait: number;
    succeeded: number;
    failed: number;
    deadLetter: number;
  };
  approvalsPending: number;
  recentFailures: Array<{
    id: string;
    status: string;
    errorKind: string | null;
    error: string | null;
    attempts: number;
    agent: { code: string; name: string };
  }>;
  localModel: {
    enabled: boolean;
    configured: boolean;
    available: boolean;
    model: string | null;
    latencyMs: number | null;
    circuitOpen: boolean;
    lastError: string | null;
    queued: number;
    inFlight: number;
  };
};

type Approval = {
  id: string;
  action: string;
  status: string;
  subject: string;
  summary: string;
  createdAt: string;
  agent: { code: string; name: string };
};

const STATUS_STYLE: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  running: "bg-sky-100 text-sky-800",
  registered: "bg-slate-100 text-slate-700",
  failed: "bg-rose-100 text-rose-800",
  waiting_for_approval: "bg-amber-100 text-amber-900",
};

export default function AgentWorkforcePage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: metrics, loading } = useApi<MetricsResponse>("/api/agents/metrics?days=30");
  const [approvals, setApprovals] = useState<Approval[]>([]);

  async function loadApprovals() {
    try {
      const response = await fetch("/api/agents/approvals?status=PENDING", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload?.data?.approvals) setApprovals(payload.data.approvals);
    } catch {
      // the page still works without the list
    }
  }

  useEffect(() => {
    // Fetching in an effect is correct here: the approval list is server
    // state, and it must be re-read after every decision.
    const timer = setTimeout(() => {
      void loadApprovals();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function runWorker() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/agents/worker/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxJobs: 20 }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload?.message ?? "The worker could not be started.");
      } else {
        setMessage(
          `Processed ${payload?.data?.processed ?? 0} job(s). ` +
            `${payload?.data?.queue?.queued ?? 0} still queued.`,
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function decide(approvalId: string, decision: "APPROVE" | "REJECT") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/agents/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, decision }),
      });
      const payload = await response.json();
      setMessage(
        response.ok
          ? decision === "APPROVE"
            ? "Approved. The publish job has been queued."
            : "Rejected."
          : payload?.message ?? "The decision could not be recorded.",
      );
      void loadApprovals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="AI Agent Workforce" nav={NAV} role="ADMIN">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">AI Agent Workforce</h2>
          <p className="text-slate-600">
            Fourteen agents with real execution handlers. Every figure below is measured from
            the platform&apos;s own job log.
          </p>
        </div>
        <button
          type="button"
          onClick={runWorker}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-alo-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Play className="h-4 w-4" /> Run the worker now
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {loading || !metrics ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Loading the workforce…
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="Registered agents" value={String(metrics.registeredAgents)} icon={Bot} />
            <DashboardCard
              title="Queue"
              value={`${metrics.queue.queued} queued · ${metrics.queue.running} running`}
              icon={Activity}
            />
            <DashboardCard
              title="Dead-lettered"
              value={String(metrics.queue.deadLetter)}
              icon={ShieldAlert}
            />
            <DashboardCard
              title="Awaiting approval"
              value={String(metrics.approvalsPending)}
              icon={Clock}
            />
          </div>

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Self-hosted model server
            </h3>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <span className="text-slate-500">Configured</span>
                <p className="font-semibold">{metrics.localModel.configured ? "Yes" : "No"}</p>
              </div>
              <div>
                <span className="text-slate-500">Reachable</span>
                <p className="font-semibold">
                  {metrics.localModel.available
                    ? `Yes (${metrics.localModel.latencyMs ?? "?"} ms)`
                    : "No"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Circuit</span>
                <p className="font-semibold">
                  {metrics.localModel.circuitOpen ? "Open" : "Closed"}
                </p>
              </div>
            </div>
            {metrics.localModel.lastError && (
              <p className="mt-3 text-xs text-rose-700">{metrics.localModel.lastError}</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              The platform tries this server first. With no server configured, the deterministic
              rule engine is used and nothing is sent to a third party.
            </p>
          </section>

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Agents
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Agent</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Jobs</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2 pr-3">Avg ms</th>
                    <th className="py-2">What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.definitions.map((agent) => (
                    <tr key={agent.code} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-xs text-slate-500">
                          {agent.code} · v{agent.version}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            STATUS_STYLE[agent.status] ?? "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {agent.status.replace(/_/g, " ")}
                        </span>
                        {agent.requiresAdminApproval && (
                          <p className="mt-1 text-[10px] text-amber-700">needs approval</p>
                        )}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{agent.measured.jobs}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {agent.measured.successRate === null ? "—" : `${agent.measured.successRate}%`}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">
                        {agent.measured.averageDurationMs === null
                          ? "—"
                          : agent.measured.averageDurationMs}
                      </td>
                      <td className="py-3 text-xs text-slate-600">{agent.responsibility}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Waiting for a human decision
            </h3>
            {approvals.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nothing is waiting. Agents propose; they do not publish on their own.
              </p>
            ) : (
              <ul className="space-y-3">
                {approvals.map((approval) => (
                  <li key={approval.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{approval.subject}</p>
                        <p className="text-xs text-slate-500">
                          {approval.agent.name} · {approval.action} ·{" "}
                          {new Date(approval.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(approval.id, "APPROVE")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => decide(approval.id, "REJECT")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-60"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">{approval.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {metrics.recentFailures.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Recent failures
              </h3>
              <ul className="space-y-2">
                {metrics.recentFailures.map((failure) => (
                  <li key={failure.id} className="text-xs">
                    <span className="font-semibold">{failure.agent.name}</span>{" "}
                    <span className="text-rose-700">
                      {failure.status}
                      {failure.errorKind ? ` (${failure.errorKind})` : ""}
                    </span>
                    <span className="text-slate-600"> — {failure.error}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </DashboardShell>
  );
}
