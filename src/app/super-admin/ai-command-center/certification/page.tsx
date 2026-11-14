"use client";

/**
 * /super-admin/ai-command-center/certification
 *
 * The Dynamic Capability Certification (DCC) dashboard. Reads the DCC
 * endpoint, surfaces the status counts, the averages, and the full
 * per-department assessment table.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { Award, Filter } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type DCC = {
  departmentId: string;
  departmentName: string;
  category: string;
  mission: string;
  sopCoverage: number;
  knowledgeCoverage: number;
  skillCoverage: number;
  testPassRate: number;
  kpiAchievement: number;
  securityCompliance: number;
  auditCompliance: number;
  selfRecoverySuccess: number;
  humanEscalationRate: number;
  status: string;
};

type Response = {
  total: number;
  statusCounts: Record<string, number>;
  averages: Record<string, number>;
  statuses: string[];
  assessments: DCC[];
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

function CertificationContent() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    try {
      const res = await fetch(
        `/api/super-admin/dcc${params.size ? `?${params}` : ""}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || "Failed to load");
    } catch {
      setError("Network error while loading DCC assessments.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    if (!data) return { total: 0, certified: 0, conditional: 0, avg: 0 };
    const visible = data.assessments;
    const avg =
      visible.length === 0
        ? 0
        : Math.round(
            visible.reduce((a, b) => a + b.testPassRate, 0) / visible.length,
          );
    return {
      total: data.statusCounts.CERTIFIED + data.statusCounts.CONDITIONALLY_CERTIFIED,
      certified: data.statusCounts.CERTIFIED,
      conditional: data.statusCounts.CONDITIONALLY_CERTIFIED,
      avg,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Certified Departments" value={totals.certified} desc="DCC CERTIFIED" icon={Award} />
        <DashboardCard title="Conditionally Certified" value={totals.conditional} desc="DCC CONDITIONAL" />
        <DashboardCard title="Avg DCC Score" value={`${data?.averages.testPassRate ?? 0}%`} desc="Across 100 departments" />
        <DashboardCard title="Avg Self-Recovery" value={`${data?.averages.selfRecoverySuccess ?? 0}%`} desc="Across 100 departments" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="Avg SOP Coverage" value={`${data?.averages.sopCoverage ?? 0}%`} />
        <DashboardCard title="Avg Knowledge Coverage" value={`${data?.averages.knowledgeCoverage ?? 0}%`} />
        <DashboardCard title="Avg Skill Coverage" value={`${data?.averages.skillCoverage ?? 0}%`} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {(data?.statuses ?? []).map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
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
                <th className="px-4 py-3 text-right font-semibold text-slate-700">SOP</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Knowledge</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Skills</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Tests</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">KPIs</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Security</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Audit</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Self-Recov</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Escalation</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Loading DCC assessments...
                  </td>
                </tr>
              ) : data && data.assessments.length > 0 ? (
                data.assessments.map((a) => (
                  <tr key={a.departmentId} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{a.departmentName}</p>
                      <p className="text-xs text-slate-500">{a.category}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.sopCoverage}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.knowledgeCoverage}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.skillCoverage}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">{a.testPassRate}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.kpiAchievement}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{a.securityCompliance}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{a.auditCompliance}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.selfRecoverySuccess}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{a.humanEscalationRate}%</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          a.status,
                        )}`}
                      >
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    No DCC assessments match the current filter.
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

export default function CertificationPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">DCC Certification Dashboard</h2>
        <p className="mt-1 text-slate-600">
          The Dynamic Capability Certification scores for every department:
          SOP coverage, knowledge coverage, skill coverage, test pass rate, KPI
          achievement, security &amp; audit compliance, self-recovery success and
          human-escalation rate.
        </p>
      </div>
      <CertificationContent />
    </DashboardShell>
  );
}
