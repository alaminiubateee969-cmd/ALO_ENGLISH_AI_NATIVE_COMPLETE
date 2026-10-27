"use client";

/**
 * /employee/lead-priority — the scored call list.
 *
 * The API ranks leads by computed score (then longest waiting) on every read.
 * This screen adds the band filter and the refresh control around it, so a
 * counsellor opens one page and knows who to call first.
 */

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/site/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Leads", href: "/employee/crm/leads" },
  { label: "Lead priority", href: "/employee/lead-priority" },
  { label: "Pipeline board", href: "/employee/pipeline" },
  { label: "Students", href: "/employee/crm/students" },
  { label: "Applications", href: "/employee/crm/applications" },
  { label: "Tasks", href: "/employee/crm/tasks" },
  { label: "Appointments", href: "/employee/crm/appointments" },
  { label: "Messages", href: "/employee/crm/messages" },
  { label: "Documents", href: "/employee/crm/documents" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
];

type RankedLead = {
  id: string;
  name: string;
  status: string | null;
  source: string | null;
  createdAt: string;
  score: number;
  band: string;
  contributions?: { label: string; points: number }[];
  nextActions?: string[];
  disclaimer?: string;
};

const BANDS = ["ALL", "HOT", "WARM", "COLD", "CLOSED"] as const;

const BAND_STYLES: Record<string, string> = {
  HOT: "bg-red-50 text-red-700 border-red-200",
  WARM: "bg-amber-50 text-amber-700 border-amber-200",
  COLD: "bg-blue-50 text-blue-700 border-blue-200",
  CLOSED: "bg-slate-100 text-slate-500 border-slate-200",
};

function LeadPriorityContent() {
  const [leads, setLeads] = useState<RankedLead[]>([]);
  const [band, setBand] = useState<(typeof BANDS)[number]>("ALL");
  const [note, setNote] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPriority = useCallback(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (band !== "ALL") params.set("band", band);
    return fetch(`/api/crm/leads/priority?${params.toString()}`, { cache: "no-store" }).then((response) => response.json());
  }, [band]);

  const applyPriority = useCallback(
    (body: { success: boolean; message?: string; data?: { leads?: RankedLead[]; note?: string; disclaimer?: string } }) => {
      if (!body.success) {
        setError(body.message || "Could not load the priority list.");
        return;
      }
      setError("");
      setLeads(body.data?.leads ?? []);
      setNote(body.data?.note ?? "");
      setDisclaimer(body.data?.disclaimer ?? "");
    },
    [],
  );

  // Promise chain in the effect: no synchronous state writes. Re-runs when the
  // band filter changes.
  useEffect(() => {
    let cancelled = false;
    fetchPriority()
      .then((body) => {
        if (!cancelled) applyPriority(body);
      })
      .catch(() => {
        if (!cancelled) setError("Network error while loading the priority list.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPriority, applyPriority]);

  /** Event-handler path (Refresh button). */
  const load = useCallback(() => {
    setLoading(true);
    fetchPriority()
      .then(applyPriority)
      .catch(() => setError("Network error while loading the priority list."))
      .finally(() => setLoading(false));
  }, [fetchPriority, applyPriority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead priority</h2>
          <p className="text-sm text-slate-600">Who to contact first, ranked by score then by longest waiting.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {BANDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setBand(value)}
              aria-pressed={band === value}
              className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                band === value ? "border-[#0057B8] bg-[#0057B8] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {value}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {note ? <p className="text-xs text-slate-500">{note}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">#</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Lead</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Band</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Score</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Next actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Ranking leads…</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No leads in this band.</td>
              </tr>
            ) : (
              leads.map((lead, index) => (
                <tr key={lead.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{lead.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${BAND_STYLES[lead.band] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {lead.band}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">{lead.score}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.status ?? "—"}</td>
                  <td className="max-w-72 px-4 py-3 text-xs text-slate-600">{(lead.nextActions ?? []).join(" · ") || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {disclaimer ? <p className="text-xs text-slate-400">{disclaimer}</p> : null}
    </div>
  );
}

export default function EmployeeLeadPriorityPage() {
  return (
    <DashboardShell title="Employee Portal" nav={NAV} roles={["COUNSELOR", "BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
      <LeadPriorityContent />
    </DashboardShell>
  );
}
