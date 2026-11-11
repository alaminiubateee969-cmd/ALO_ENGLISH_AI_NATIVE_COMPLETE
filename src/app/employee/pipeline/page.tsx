"use client";

/**
 * /employee/pipeline — leads by stage, with how long the oldest has waited.
 *
 * The board exists to answer one question for a counsellor: who has been sitting
 * in the same stage for too long. It is deliberately not a drag-and-drop: moving a
 * lead is a status change in the CRM with its own audit entry, and a board that
 * rewrote status on a mis-drop would be a worse tool than a list. Each card links
 * to the lead record, where the change is made and recorded.
 *
 * Leads whose status is not one of the known stages appear in their own column
 * rather than disappearing. That column should always be empty; when it is not,
 * somebody added a status without adding a stage, which is exactly the kind of
 * silent gap a pipeline view is supposed to expose.
 */

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { buildPipeline, type Pipeline, type PipelineLead } from "@/lib/crm/pipeline";

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Pipeline", href: "/employee/pipeline" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Logout", href: "/login" },
];

function PipelineScreen() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crm/leads?limit=200", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.success) {
          setError(payload.message || "The pipeline could not be loaded.");
          return;
        }
        const leads: PipelineLead[] = (payload.data.leads ?? []).map((lead: PipelineLead) => ({
          id: lead.id,
          name: lead.name,
          status: lead.status,
          source: lead.source,
          country: lead.country,
          intake: lead.intake,
          createdAt: lead.createdAt,
        }));
        setError("");
        setPipeline(buildPipeline(leads));
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Lead pipeline</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {pipeline?.note ?? "Leads by stage, oldest first in each column."} Moving a lead is done on the lead record,
            where the change is recorded.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {pipeline?.hasUnrecognised && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          Some leads have a status the pipeline stage list does not know. They are shown in their own column rather than
          hidden; either the stage list or the status needs updating.
        </div>
      )}

      {pipeline && (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {pipeline.columns.map((column) => (
            <section
              key={column.status}
              aria-label={`${column.label}: ${column.count} leads`}
              className={`rounded-xl border bg-white p-4 ${column.unexpected ? "border-amber-300" : "border-slate-200"}`}
            >
              <h3 className="text-sm font-bold text-slate-900">{column.label}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{column.meaning}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{column.count}</p>
              <p className="text-xs text-slate-500">
                {column.oldestAgeDays === null
                  ? "no leads"
                  : `oldest waiting ${column.oldestAgeDays} day${column.oldestAgeDays === 1 ? "" : "s"}`}
              </p>

              <ul className="mt-3 space-y-2">
                {column.leads.slice(0, 8).map((lead) => (
                  <li key={lead.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                    <p className="truncate text-xs font-semibold text-slate-800">{lead.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {[lead.country, lead.intake, lead.source].filter(Boolean).join(" · ") || "no details yet"}
                    </p>
                  </li>
                ))}
                {column.leads.length > 8 && (
                  <li className="text-[11px] text-slate-500">and {column.leads.length - 8} more</li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {pipeline && pipeline.total === 0 && !loading && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No leads are in the pipeline right now.
        </p>
      )}
    </div>
  );
}

export default function EmployeePipelinePage() {
  return (
    <DashboardShell
      title="Lead pipeline"
      nav={NAV}
      roles={["COUNSELOR", "FRONT_DESK", "MARKETING_MANAGER", "BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"]}
    >
      <PipelineScreen />
    </DashboardShell>
  );
}
