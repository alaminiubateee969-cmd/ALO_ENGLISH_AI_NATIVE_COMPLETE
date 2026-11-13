"use client";

/**
 * /super-admin/ai-command-center/sops
 *
 * The Standard Operating Procedure registry. Each department has one SOP
 * that defines the intake-to-handover loop.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { ListChecks } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Overview = {
  lists: {
    sops: Array<{
      department: string;
      name: string;
      status: string;
      version: string;
    }>;
  };
  registry: {
    sops: { total: number; active: number };
  };
};

function SopsContent() {
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
      .catch(() => setError("Network error while loading SOPs."))
      .finally(() => setLoading(false));
  }, []);

  const sops = data?.lists.sops ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard title="SOPs" value={data?.registry.sops.total ?? 0} desc="Total" icon={ListChecks} />
        <DashboardCard title="Active" value={data?.registry.sops.active ?? 0} desc="Status ACTIVE" />
        <DashboardCard title="Departments Covered" value={sops.length} desc="Have a documented SOP" />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">SOP</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Version</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Loading SOPs...
                  </td>
                </tr>
              ) : sops.length > 0 ? (
                sops.map((s) => (
                  <tr key={`${s.department}-${s.name}`} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.department}</td>
                    <td className="px-4 py-3 text-slate-700">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600">{s.version}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No SOPs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-slate-800">Standard intake-to-handover loop</h3>
        <p className="mt-1 text-sm text-slate-600">
          Every department&apos;s SOP follows the same eight-step shape, specialised
          by the department&apos;s domain rules. The shape is the contract between
          the AI workforce and the audit trail.
        </p>
        <ol className="mt-4 space-y-2 text-sm">
          {[
            "Receive the work item through the platform's queue.",
            "Verify the learner's consent envelope and identity.",
            "Apply the department's domain rules.",
            "Produce the artefact (plan, draft, decision, report).",
            "If the artefact is irreversible, request human approval.",
            "On approval, persist the artefact with its provenance.",
            "Hand off to the downstream department or close the work item.",
            "Append the daily metric to the department's KPI board.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 flex-none items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function SopsPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">SOP Registry</h2>
        <p className="mt-1 text-slate-600">
          Every department&apos;s Standard Operating Procedure for the
          intake-to-handover loop.
        </p>
      </div>
      <SopsContent />
    </DashboardShell>
  );
}
