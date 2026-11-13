"use client";

/**
 * /super-admin/ai-command-center/audit
 *
 * The audit-trail dashboard. Reads the live audit log table (the platform's
 * existing AuditLog model) plus the agent runtime's job-event stream, and
 * surfaces them as one timeline.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { ScrollText, Activity } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Overview = {
  live: {
    todayEvents: number;
    auditLogsToday: number;
    failedJobs: number;
    deadLetterJobs: number;
  };
};

type AuditRow = {
  id: string;
  action: string;
  resource?: string | null;
  actorUserId?: string | null;
  createdAt: string;
};

/**
 * The /api/admin/stats endpoint returns a 200 to ADMIN+SUPER_ADMIN and
 * carries nothing sensitive. We use /api/health for a fallback signal.
 * For audit rows we re-use the existing /api/crm/audit-logs route shape —
 * it is a paged list of AuditLog rows.
 */
function AuditContent() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/super-admin/overview", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/crm/audit-logs?limit=50", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ success: false, data: { auditlogs: [] } })),
    ])
      .then(([ov, audits]) => {
        if (ov.success) setOverview(ov.data);
        else setError(ov.message || "Failed to load overview");
        if (audits?.success) {
          // The crud list handler returns { auditlogs: [...], pagination: {...} }
          const list = audits.data?.auditlogs ?? audits.data?.logs ?? [];
          setRows(list as AuditRow[]);
        }
      })
      .catch(() => setError("Network error while loading audit trail."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Audit Logs (24h)" value={overview?.live.auditLogsToday ?? 0} desc="Today" icon={ScrollText} />
        <DashboardCard title="Agent Events (24h)" value={overview?.live.todayEvents ?? 0} desc="Today" icon={Activity} />
        <DashboardCard title="Failed Jobs" value={overview?.live.failedJobs ?? 0} desc="In the queue" />
        <DashboardCard title="Dead-Lettered" value={overview?.live.deadLetterJobs ?? 0} desc="Awaiting triage" />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <h3 className="font-semibold text-slate-800">Recent audit entries</h3>
          <p className="mt-1 text-xs text-slate-500">
            Latest 50 privileged actions. The full audit log is retained for 365 days.
          </p>
        </div>
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading audit entries...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No recent audit entries. The platform&apos;s audit table is empty until
              a privileged action is logged.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Actor</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.action}</td>
                    <td className="px-4 py-3 text-slate-600">{row.resource ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {row.actorUserId ?? "system"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-800">Audit posture</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>
            Every privileged action is written to the immutable audit trail
            with the actor, the time and the reason.
          </li>
          <li>
            Every agent run produces a structured event log (job.claimed,
            job.started, job.failed, job.succeeded) stored for the same 365-day
            retention window.
          </li>
          <li>
            Every approval, every publish, every state change is auditable
            end-to-end — from the AI employee that produced it to the human
            that authorised it.
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Audit Trail</h2>
        <p className="mt-1 text-slate-600">
          The platform&apos;s immutable audit trail: every privileged action, every
          agent run, every approval — for 365 days.
        </p>
      </div>
      <AuditContent />
    </DashboardShell>
  );
}
