"use client";

/**
 * /super-admin/ai-command-center/governance
 *
 * The governance dashboard. Surfaces the constitutional-rule set, the
 * workflow registry, the live approval queue and the audit-posture counts.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Gavel, AlertTriangle, CheckCircle2 } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Overview = {
  registry: {
    rules: { total: number; active: number; block: number; warn: number; log: number };
    workflows: { total: number; active: number; testing: number };
  };
  live: {
    pendingApprovals: number;
    auditLogsToday: number;
  };
  lists: {
    rules: Array<{
      name: string;
      category: string;
      description: string;
      enforcement: string;
      version: string;
      active: boolean;
    }>;
    workflows: Array<{
      name: string;
      department: string | null;
      trigger: string;
      status: string;
      steps: string;
    }>;
  };
};

function GovernanceContent() {
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
      .catch(() => setError("Network error while loading governance data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Loading governance data...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Failed to load governance data.</p>
        <p className="mt-1 text-sm">{error ?? "Unknown error."}</p>
      </div>
    );
  }

  const { registry, live, lists } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Constitutional Rules" value={registry.rules.total} desc="Platform-wide" icon={Gavel} />
        <DashboardCard title="Active Rules" value={registry.rules.active} desc="In force" />
        <DashboardCard title="Pending Approvals" value={live.pendingApprovals} desc="Awaiting a human" icon={AlertTriangle} />
        <DashboardCard title="Audit Logs (24h)" value={live.auditLogsToday} desc="Today" icon={CheckCircle2} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">Constitutional rules in force</h3>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rule</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Enforcement</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {lists.rules.map((r) => (
                <tr key={`${r.name}-${r.category}`} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.enforcement === "BLOCK"
                          ? "bg-red-100 text-red-800"
                          : r.enforcement === "WARN"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {r.enforcement}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs text-slate-600">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">Cross-department workflows</h3>
          <p className="mt-1 text-xs text-slate-500">
            {registry.workflows.total} workflows · {registry.workflows.active} active · {registry.workflows.testing} testing
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Workflow</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Trigger</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Steps</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {lists.workflows.map((w) => (
                <tr key={w.name} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{w.name}</td>
                  <td className="px-4 py-3 text-slate-600">{w.department ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{w.trigger}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {JSON.parse(w.steps).length} steps
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        w.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : w.status === "TESTING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {w.status}
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

export default function GovernancePage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Governance Actions</h2>
        <p className="mt-1 text-slate-600">
          The constitutional-rule set, the workflow registry and the live
          approval queue — everything a super admin needs to govern the AI
          workforce.
        </p>
      </div>
      <GovernanceContent />
    </DashboardShell>
  );
}
