"use client";

/**
 * /super-admin/ai-command-center/observability
 *
 * The system-health observability page. Combines the platform's own
 * /api/health, the agent-runtime status, and the command-center overview
 * into a single live view.
 */

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, HeartPulse, Cpu, AlertTriangle } from "lucide-react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { COMMAND_CENTER_NAV } from "../nav";

type Health = {
  status: string;
  version: string;
  timestamp: string;
  checks: { database: string; examTypes: number };
};

type Overview = {
  live: {
    registeredAgents: number;
    queuedJobs: number;
    runningJobs: number;
    failedJobs: number;
    deadLetterJobs: number;
    pendingApprovals: number;
    todayEvents: number;
    auditLogsToday: number;
  };
};

function ObservabilityContent() {
  const [health, setHealth] = useState<Health | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/super-admin/overview", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([h, ov]) => {
        if (h) setHealth(h);
        if (ov?.success) setOverview(ov.data);
        else setError(ov?.message || "Failed to load overview");
        setCheckedAt(new Date().toLocaleTimeString());
      })
      .catch(() => setError("Network error while loading system health."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Promise chain in the effect: no synchronous state writes.
    let cancelled = false;
    Promise.all([
      fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/super-admin/overview", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([h, ov]) => {
        if (cancelled) return;
        if (h) setHealth(h);
        if (ov?.success) setOverview(ov.data);
        else setError(ov?.message || "Failed to load overview");
        setCheckedAt(new Date().toLocaleTimeString());
      })
      .catch(() => {
        if (!cancelled) setError("Network error while loading system health.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const live = overview?.live;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Live system health</h3>
          <p className="text-sm text-slate-600">
            Service status, agent runtime and audit posture on one screen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="size-4" aria-hidden="true" /> Re-check
        </button>
      </div>

      {checkedAt ? (
        <p className="text-xs text-slate-500">Last checked at {checkedAt}.</p>
      ) : null}

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Service"
          value={health?.status ?? "—"}
          desc={`v${health?.version ?? "?"}`}
          icon={HeartPulse}
        />
        <DashboardCard
          title="Database"
          value={health?.checks?.database ?? "—"}
          desc={`${health?.checks?.examTypes ?? 0} exam types`}
        />
        <DashboardCard
          title="Registered Agents"
          value={live?.registeredAgents ?? 0}
          desc="In the agent runtime"
          icon={Cpu}
        />
        <DashboardCard
          title="Pending Approvals"
          value={live?.pendingApprovals ?? 0}
          desc="Awaiting a human"
          icon={AlertTriangle}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-800">Agent runtime telemetry</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Queued</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live?.queuedJobs ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Running</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live?.runningJobs ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failed</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live?.failedJobs ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dead-lettered</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{live?.deadLetterJobs ?? 0}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Re-checking system health...
        </div>
      ) : null}
    </div>
  );
}

export default function ObservabilityPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Observability</h2>
        <p className="mt-1 text-slate-600">
          Live system health: service status, agent-runtime telemetry and
          audit-posture counts on a single screen.
        </p>
      </div>
      <ObservabilityContent />
    </DashboardShell>
  );
}
