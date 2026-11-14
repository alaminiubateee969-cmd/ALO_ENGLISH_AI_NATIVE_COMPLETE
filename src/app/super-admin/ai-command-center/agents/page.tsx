"use client";

/**
 * /super-admin/ai-command-center/agents
 *
 * The AI workforce registry: 2000 AI employees across the 100 departments.
 * Filterable by department, role, provider and free-text.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Users, Filter, Search } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Agent = {
  code: string;
  name: string;
  role: string;
  department: string;
  departmentName: string;
  category: string;
  skills: string[];
  permissions: string[];
  accountability: string;
  preferredProvider: string;
};

type Response = {
  total: number;
  workforceTotal: number;
  roles: string[];
  providers: string[];
  agents: Agent[];
};

function AgentsContent() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [provider, setProvider] = useState("");
  const [q, setQ] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (role) params.set("role", role);
    if (provider) params.set("provider", provider);
    if (q.trim()) params.set("q", q.trim());
    params.set("limit", "500");
    try {
      const res = await fetch(
        `/api/super-admin/agents${params.size ? `?${params}` : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Failed to load");
    } catch {
      setError("Network error while loading the AI workforce.");
    } finally {
      setLoading(false);
    }
  }, [department, role, provider, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    if (!data) return { shown: 0, total: 0, providers: 0 };
    return {
      shown: data.total,
      total: data.workforceTotal,
      providers: data.providers.length,
    };
  }, [data]);

  // Stable list of departments — derive from the agents response (which has
  // department + departmentName on every row) so we don't need a second
  // API call.
  const departments = useMemo(() => {
    if (!data) return [] as Array<{ slug: string; name: string }>;
    const map = new Map<string, string>();
    for (const a of data.agents) {
      if (!map.has(a.department)) map.set(a.department, a.departmentName);
    }
    return [...map.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Workforce" value={totals.total} desc="Across 100 departments" icon={Users} />
        <DashboardCard title="Showing" value={totals.shown} desc="With current filters" />
        <DashboardCard title="Roles" value={data?.roles.length ?? 0} desc="Distinct role types" />
        <DashboardCard title="Providers" value={totals.providers} desc="Model providers in use" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All roles</option>
              {(data?.roles ?? []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All providers</option>
              {(data?.providers ?? []).map((p) => (
                <option key={p} value={p}>
                  {p}
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
              placeholder="Search by code, name, skill..."
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Skills</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading the AI workforce...
                  </td>
                </tr>
              ) : data && data.agents.length > 0 ? (
                data.agents.map((a) => (
                  <tr key={a.code} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-slate-700">{a.departmentName}</td>
                    <td className="px-4 py-3 text-slate-600">{a.role}</td>
                    <td className="px-4 py-3 text-slate-600">{a.preferredProvider}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                          >
                            {s}
                          </span>
                        ))}
                        {a.skills.length > 3 ? (
                          <span className="text-xs text-slate-400">
                            +{a.skills.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No AI employees match the current filters.
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

export default function AgentsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">AI Workforce Registry</h2>
        <p className="mt-1 text-slate-600">
          Every AI employee across the 100 departments, with their role,
          department, preferred provider and declared skills.
        </p>
      </div>
      <AgentsContent />
    </DashboardShell>
  );
}
