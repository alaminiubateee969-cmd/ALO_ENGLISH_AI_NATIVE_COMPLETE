"use client";

/**
 * /super-admin/ai-command-center/departments
 *
 * The 100-department registry. Each row shows a department's name, category,
 * mission, employee count, skill count, DCC status and DCC score.
 * Filterable by category and free-text.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Building2, Filter, Search } from "lucide-react";
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

function statusColor(status: string): string {
  switch (status) {
    case "CERTIFIED":
      return "bg-emerald-100 text-emerald-800";
    case "CONDITIONALLY_CERTIFIED":
      return "bg-amber-100 text-amber-800";
    case "UNDER_REVIEW":
      return "bg-slate-100 text-slate-700";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "EXPIRED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function DepartmentsContent() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    try {
      const res = await fetch(
        `/api/super-admin/departments${params.size ? `?${params}` : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Failed to load");
    } catch {
      setError("Network error while loading departments.");
    } finally {
      setLoading(false);
    }
  }, [category, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    if (!data) return { total: 0, certified: 0, conditional: 0, avgScore: 0 };
    const certified = data.departments.filter((d) => d.dccStatus === "CERTIFIED").length;
    const conditional = data.departments.filter(
      (d) => d.dccStatus === "CONDITIONALLY_CERTIFIED",
    ).length;
    const avgScore =
      data.departments.length === 0
        ? 0
        : Math.round(
            data.departments.reduce((a, b) => a + b.dccScore, 0) /
              data.departments.length,
          );
    return { total: data.total, certified, conditional, avgScore };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Departments" value={totals.total} desc="In current filter" icon={Building2} />
        <DashboardCard title="Certified" value={totals.certified} desc="DCC CERTIFIED" />
        <DashboardCard title="Conditionally Certified" value={totals.conditional} desc="DCC CONDITIONAL" />
        <DashboardCard title="Avg DCC Score" value={`${totals.avgScore}%`} desc="In current filter" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All categories</option>
              {(data?.categories ?? []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or mission..."
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Mission</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Employees</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Skills</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">DCC Score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">DCC Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading departments...
                  </td>
                </tr>
              ) : data && data.departments.length > 0 ? (
                data.departments.map((d) => (
                  <tr key={d.slug} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                    <td className="px-4 py-3 text-slate-600">{d.category}</td>
                    <td className="max-w-md px-4 py-3 text-xs text-slate-600">
                      {d.mission}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {d.employeeCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {d.skillCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                      {d.dccScore}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          d.dccStatus,
                        )}`}
                      >
                        {d.dccStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No departments match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Department Registry</h2>
        <p className="mt-1 text-slate-600">
          100 ALO Education departments, each with its mission, AI workforce size,
          skill coverage and Dynamic Capability Certification status.
        </p>
      </div>
      <DepartmentsContent />
    </DashboardShell>
  );
}
