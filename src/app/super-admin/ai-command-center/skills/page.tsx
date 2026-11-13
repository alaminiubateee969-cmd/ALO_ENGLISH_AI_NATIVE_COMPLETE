"use client";

/**
 * /super-admin/ai-command-center/skills
 *
 * The skill registry: every distinct skill the AI workforce may carry.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Cpu, Filter, Search } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Skill = {
  name: string;
  category: string;
  description: string;
  requiredKnowledge: string | null;
  compatibleAgents: string | null;
  version: string;
  status: string;
};

type Response = {
  total: number;
  categories: string[];
  skills: Skill[];
};

function SkillsContent() {
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
        `/api/super-admin/skills${params.size ? `?${params}` : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Failed to load");
    } catch {
      setError("Network error while loading skills.");
    } finally {
      setLoading(false);
    }
  }, [category, q]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const byCategory = useMemo(() => {
    if (!data) return [] as Array<{ category: string; count: number }>;
    const map = new Map<string, number>();
    for (const s of data.skills) {
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Skills" value={data?.total ?? 0} desc="Distinct" icon={Cpu} />
        <DashboardCard title="Categories" value={byCategory.length} desc="Distinct" />
        <DashboardCard title="Active" value={data?.skills.filter((s) => s.status === "ACTIVE").length ?? 0} desc="Status ACTIVE" />
        <DashboardCard title="Showing" value={data?.skills.length ?? 0} desc="With current filters" />
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
              placeholder="Search by name or description..."
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">By category</h3>
          <ul className="space-y-1 text-sm">
            {byCategory.map((c) => (
              <li key={c.category} className="flex items-center justify-between">
                <span className="text-slate-600">{c.category}</span>
                <span className="font-semibold text-slate-900">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Skill</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Version</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Loading skills...
                    </td>
                  </tr>
                ) : data && data.skills.length > 0 ? (
                  data.skills.map((s) => (
                    <tr key={s.name} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">{s.category}</td>
                      <td className="max-w-md px-4 py-3 text-xs text-slate-600">{s.description}</td>
                      <td className="px-4 py-3 text-slate-600">{s.version}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No skills match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Skill Registry</h2>
        <p className="mt-1 text-slate-600">
          Every distinct skill the AI workforce may carry. A skill is a
          capability an agent can be granted, scoped to a domain and governed
          by the constitutional rules.
        </p>
      </div>
      <SkillsContent />
    </DashboardShell>
  );
}
