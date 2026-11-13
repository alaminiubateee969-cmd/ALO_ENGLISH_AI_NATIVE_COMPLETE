"use client";

/**
 * /super-admin/ai-command-center/evaluation
 *
 * The evaluation dashboard. Surfaces the AI workforce's evaluation
 * posture: model evaluation status (from the AI Models registry), the DCC
 * averages, and live agent-runtime outcomes (succeeded vs failed).
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { ClipboardCheck, Cpu } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Overview = {
  registry: {
    models: { total: number; approved: number; evaluating: number; deprecated: number; rejected: number };
    dcc: {
      averageScore: number;
      averageSkillCoverage: number;
      averageSopCoverage: number;
      averageKnowledgeCoverage: number;
      averageSelfRecovery: number;
      averageHumanEscalation: number;
    };
  };
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
  lists: {
    models: Array<{
      name: string;
      provider: string;
      version: string;
      status: string;
      capabilities: string;
    }>;
  };
};

function statusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "EVALUATING":
      return "bg-amber-100 text-amber-800";
    case "DEPRECATED":
      return "bg-slate-200 text-slate-700";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function EvaluationContent() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Failed to load");
      })
      .catch(() => setError("Network error while loading evaluation data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Loading evaluation data...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Failed to load evaluation data.</p>
        <p className="mt-1 text-sm">{error ?? "Unknown error."}</p>
      </div>
    );
  }

  const { registry, live, lists } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="AI Models" value={registry.models.total} desc="In the roster" icon={Cpu} />
        <DashboardCard title="Approved Models" value={registry.models.approved} desc="Production-ready" />
        <DashboardCard title="Under Evaluation" value={registry.models.evaluating} desc="Pending sign-off" />
        <DashboardCard title="Avg DCC Score" value={`${registry.dcc.averageScore}%`} desc="Across 100 departments" icon={ClipboardCheck} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard title="Avg SOP Coverage" value={`${registry.dcc.averageSopCoverage}%`} />
        <DashboardCard title="Avg Knowledge Coverage" value={`${registry.dcc.averageKnowledgeCoverage}%`} />
        <DashboardCard title="Avg Skill Coverage" value={`${registry.dcc.averageSkillCoverage}%`} />
        <DashboardCard title="Avg Self-Recovery" value={`${registry.dcc.averageSelfRecovery}%`} />
        <DashboardCard title="Avg Human Escalation" value={`${registry.dcc.averageHumanEscalation}%`} />
        <DashboardCard title="Live Failed Jobs" value={live.failedJobs} desc="In the agent queue" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">Model evaluation status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Model</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Version</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Capabilities</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {lists.models.map((m) => (
                <tr key={m.name} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.provider}</td>
                  <td className="px-4 py-3 text-slate-600">{m.version}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(m.capabilities).map((c: string) => (
                        <span
                          key={c}
                          className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                        m.status,
                      )}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function EvaluationPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Evaluation Dashboard</h2>
        <p className="mt-1 text-slate-600">
          The AI workforce&apos;s evaluation posture: model approvals, DCC averages,
          and live agent-runtime outcomes.
        </p>
      </div>
      <EvaluationContent />
    </DashboardShell>
  );
}
