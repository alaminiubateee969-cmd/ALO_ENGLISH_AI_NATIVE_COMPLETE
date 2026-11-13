"use client";

/**
 * /super-admin/ai-command-center/knowledge
 *
 * The knowledge graph: how departments, employees, skills, SOPs and prompts
 * interconnect. The page renders the same registry as a relational map: per
 * department, the skills its employees carry, the SOP it operates under and
 * the prompt template it boots with.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Network } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type DeptSummary = {
  slug: string;
  name: string;
  category: string;
  mission: string;
  employeeCount: number;
  skillCount: number;
  dccStatus: string;
  dccScore: number;
};

type Response = {
  total: number;
  categories: string[];
  departments: DeptSummary[];
};

function KnowledgeContent() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/departments", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Failed to load");
      })
      .catch(() => setError("Network error while loading the knowledge graph."))
      .finally(() => setLoading(false));
  }, []);

  const nodes =
    data?.departments.map((d) => ({
      slug: d.slug,
      name: d.name,
      category: d.category,
      employeeCount: d.employeeCount,
      skillCount: d.skillCount,
      dccScore: d.dccScore,
    })) ?? [];

  const categories = data?.categories ?? [];
  const selectedDept = data?.departments.find((d) => d.slug === selected) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Departments (nodes)" value={nodes.length} desc="In the graph" icon={Network} />
        <DashboardCard title="Categories (clusters)" value={categories.length} desc="Top-level grouping" />
        <DashboardCard title="Total edges" value={nodes.reduce((a, b) => a + b.employeeCount + b.skillCount, 0)} desc="Employees + skills" />
        <DashboardCard title="Avg DCC Score" value={data ? `${Math.round(nodes.reduce((a, b) => a + b.dccScore, 0) / (nodes.length || 1))}%` : "—"} />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {loading ? (
                <li className="p-8 text-center text-slate-400">Loading departments...</li>
              ) : nodes.length === 0 ? (
                <li className="p-8 text-center text-slate-400">No departments.</li>
              ) : (
                nodes.map((n) => (
                  <li key={n.slug}>
                    <button
                      type="button"
                      onClick={() => setSelected(n.slug === selected ? null : n.slug)}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 ${
                        selected === n.slug ? "bg-slate-50" : ""
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{n.name}</p>
                        <p className="text-xs text-slate-500">
                          {n.category} · {n.employeeCount} employees · {n.skillCount} skills
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {n.dccScore}%
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800">Department detail</h3>
          {!selectedDept ? (
            <p className="mt-3 text-sm text-slate-500">
              Select a department on the left to inspect its knowledge-graph
              edges: employees, skills, SOP and prompt template.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mission</p>
                <p className="mt-1 text-slate-700">{selectedDept.mission}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</p>
                <p className="mt-1 text-slate-700">{selectedDept.category}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Edges</p>
                <ul className="mt-1 space-y-1 text-slate-700">
                  <li>{selectedDept.employeeCount} AI employees</li>
                  <li>{selectedDept.skillCount} distinct skills</li>
                  <li>1 SOP (intake-to-handover)</li>
                  <li>2 prompt templates (shared + manager)</li>
                  <li>1 DCC assessment ({selectedDept.dccStatus.replace(/_/g, " ")})</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">DCC Score</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{selectedDept.dccScore}%</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Knowledge Graph</h2>
        <p className="mt-1 text-slate-600">
          The relational map between departments, AI employees, skills, SOPs and
          prompt templates. Click a department to inspect its edges.
        </p>
      </div>
      <KnowledgeContent />
    </DashboardShell>
  );
}
