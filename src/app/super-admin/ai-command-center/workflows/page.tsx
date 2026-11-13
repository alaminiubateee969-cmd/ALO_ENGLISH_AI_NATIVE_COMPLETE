"use client";

/**
 * /super-admin/ai-command-center/workflows
 *
 * The workflow-orchestration page. Renders the workflow registry with
 * trigger, status, and the full step list (parsed from JSON).
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Workflow as WorkflowIcon } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Workflow = {
  name: string;
  department: string | null;
  trigger: string;
  status: string;
  steps: string;
};

type Overview = {
  registry: {
    workflows: { total: number; active: number; testing: number };
  };
  lists: {
    workflows: Workflow[];
  };
};

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800";
    case "TESTING":
      return "bg-amber-100 text-amber-800";
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "PAUSED":
      return "bg-slate-200 text-slate-700";
    case "FAILED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function WorkflowsContent() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openName, setOpenName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Failed to load");
      })
      .catch(() => setError("Network error while loading workflows."))
      .finally(() => setLoading(false));
  }, []);

  const workflows = data?.lists.workflows ?? [];
  const stats = data?.registry.workflows ?? { total: 0, active: 0, testing: 0 };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Workflows" value={stats.total} desc="Total" icon={WorkflowIcon} />
        <DashboardCard title="Active" value={stats.active} desc="In production" />
        <DashboardCard title="Testing" value={stats.testing} desc="In evaluation" />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
          <ul className="divide-y divide-slate-100">
            {loading ? (
              <li className="p-8 text-center text-slate-400">Loading workflows...</li>
            ) : workflows.length === 0 ? (
              <li className="p-8 text-center text-slate-400">No workflows found.</li>
            ) : (
              workflows.map((w) => {
                let steps: string[] = [];
                try {
                  steps = JSON.parse(w.steps) as string[];
                } catch {
                  steps = [];
                }
                const isOpen = openName === w.name;
                return (
                  <li key={w.name} className="p-4">
                    <button
                      type="button"
                      onClick={() => setOpenName(isOpen ? null : w.name)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-500">
                          {w.department ?? "cross-department"} · {w.trigger} · {steps.length} steps
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          w.status,
                        )}`}
                      >
                        {w.status}
                      </span>
                    </button>
                    {isOpen ? (
                      <ol className="mt-3 space-y-2 text-sm">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="flex size-6 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                              {i + 1}
                            </span>
                            <span className="text-slate-700">{step}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Workflow Orchestration</h2>
        <p className="mt-1 text-slate-600">
          The cross-department workflow registry. Click a workflow to read its
          full step list.
        </p>
      </div>
      <WorkflowsContent />
    </DashboardShell>
  );
}
