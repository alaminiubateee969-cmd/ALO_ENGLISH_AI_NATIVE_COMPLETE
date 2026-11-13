"use client";

/**
 * /super-admin/ai-command-center/prompts
 *
 * The prompt-template registry: every department has a shared system
 * instruction and a workforce-manager instruction. The page renders the
 * full template text for inspection.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { FileText } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Prompt = {
  department: string;
  agent: string | null;
  purpose: string;
  variables: string | null;
  systemInstructions: string;
  status: string;
  version: string;
};

type Overview = {
  lists: {
    prompts: Prompt[];
  };
};

function statusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "TESTING":
      return "bg-amber-100 text-amber-800";
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    case "DEPRECATED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function PromptsContent() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDept, setOpenDept] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Failed to load");
      })
      .catch(() => setError("Network error while loading prompts."))
      .finally(() => setLoading(false));
  }, []);

  const prompts = data?.lists.prompts ?? [];
  const byDepartment = new Map<string, Prompt[]>();
  for (const p of prompts) {
    const arr = byDepartment.get(p.department) ?? [];
    arr.push(p);
    byDepartment.set(p.department, arr);
  }
  const departments = [...byDepartment.keys()].sort();

  const counts = {
    total: prompts.length,
    approved: prompts.filter((p) => p.status === "APPROVED").length,
    draft: prompts.filter((p) => p.status === "DRAFT").length,
    testing: prompts.filter((p) => p.status === "TESTING").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Prompt Templates" value={counts.total} desc="Across all departments" icon={FileText} />
        <DashboardCard title="Approved" value={counts.approved} desc="Production-ready" />
        <DashboardCard title="Draft" value={counts.draft} desc="Not yet reviewed" />
        <DashboardCard title="Testing" value={counts.testing} desc="In evaluation" />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading prompt templates...</div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No prompt templates found.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const items = byDepartment.get(dept)!;
                const isOpen = openDept === dept;
                return (
                  <li key={dept} className="p-4">
                    <button
                      type="button"
                      onClick={() => setOpenDept(isOpen ? null : dept)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{dept}</p>
                        <p className="text-xs text-slate-500">
                          {items.length} template{items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {isOpen ? "Collapse" : "Expand"}
                      </span>
                    </button>
                    {isOpen ? (
                      <ul className="mt-3 space-y-3">
                        {items.map((p) => (
                          <li key={`${p.department}-${p.agent ?? "shared"}-${p.purpose}`}>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{p.purpose}</p>
                                  <p className="text-xs text-slate-500">
                                    Agent: <span className="font-mono">{p.agent ?? "shared"}</span> · v{p.version}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                                    p.status,
                                  )}`}
                                >
                                  {p.status}
                                </span>
                              </div>
                              <pre className="mt-2 whitespace-pre-wrap rounded bg-white p-3 text-xs text-slate-700 border border-slate-200">
                                {p.systemInstructions}
                              </pre>
                              {p.variables ? (
                                <p className="mt-2 text-xs text-slate-500">
                                  Variables: <span className="font-mono">{p.variables}</span>
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PromptsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Prompt Template Registry</h2>
        <p className="mt-1 text-slate-600">
          Every department&apos;s approved system instructions. Click a department
          to read the full prompt an AI employee boots with.
        </p>
      </div>
      <PromptsContent />
    </DashboardShell>
  );
}
