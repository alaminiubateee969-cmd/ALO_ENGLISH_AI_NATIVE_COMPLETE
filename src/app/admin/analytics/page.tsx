"use client";

/**
 * /admin/analytics — the aggregate counters, with the limits stated on screen.
 *
 * The point of this page is to be readable *and* honest: total counts, the
 * busiest pages, a per-day series and the newest counters, plus a permanent
 * sentence explaining why there is no funnel, no returning-visitor figure and no
 * per-person breakdown. Those are absent because the platform never stored an
 * identifier for a visitor, not because they were forgotten — and a dashboard
 * that quietly omitted that explanation would invite somebody to add one.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard, DashboardTable } from "@/components/site/dashboard-shell";
import { BarChart3, Eye, MousePointerClick, RefreshCw, AlertTriangle } from "lucide-react";

type Analytics = {
  window: { days: number; from: string };
  total: number;
  byEvent: Array<{ event: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
  recent: Array<{ day: string; event: string; path: string | null; label: string | null; count: number }>;
  retentionDays: number;
  methodology: string;
};

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "SEO audit", href: "/admin/seo" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Logout", href: "/login" },
];

function AnalyticsScreen() {
  const [days, setDays] = useState(30);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Same shape as `useApi` in dashboard-shell: a promise chain, so the first
  // render is not immediately invalidated by a state write inside the effect.
  // Changing the window re-runs it; the refresh button bumps `attempt`.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/analytics?days=${days}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.success) {
          setError(payload.message || "The counters could not be read.");
          setData(null);
          return;
        }
        setError("");
        setData(payload.data);
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
  }, [days, attempt]);

  const peakDay = data?.byDay.reduce((best, row) => (best === null || row.count > best.count ? row : best), null as null | { day: string; count: number });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {data?.methodology ??
              "Aggregate counts only: how many times a page was seen, never by whom."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {[7, 30, 90, 365].map((option) => (
              <option key={option} value={option}>
                Last {option} days
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="Counted events" value={data.total} desc={`${data.window.days}-day window`} icon={Eye} />
            <DashboardCard title="Event types" value={data.byEvent.length} desc="From a fixed list" icon={BarChart3} />
            <DashboardCard title="Pages seen" value={data.topPaths.length} desc="Distinct paths with a view" icon={MousePointerClick} />
            <DashboardCard
              title="Busiest day"
              value={peakDay ? peakDay.count : 0}
              desc={peakDay ? peakDay.day : "nothing counted yet"}
              icon={Eye}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Why there is no funnel, no bounce rate and no returning visitors</p>
            <p className="mt-1 leading-6">
              This platform stores no identifier for a visitor: no cookie, no session, no address, no user-agent, no
              referrer. A counter therefore cannot be joined back to a person, which is what makes a funnel impossible —
              and that impossibility is the privacy property, not a missing feature. If a deployment needs per-visitor
              analytics, it adds an external service (see <code>src/lib/integrations/registry.ts</code>) rather than
              widening this schema. Counters are kept for {data.retentionDays} days.
            </p>
          </div>

          <section>
            <h3 className="mb-2 text-lg font-bold">By event</h3>
            <DashboardTable
              headers={["Event", "Count"]}
              rows={data.byEvent.map((row) => [<code key="e" className="text-xs">{row.event}</code>, row.count])}
            />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-bold">Busiest pages</h3>
            <DashboardTable
              headers={["Page", "Views"]}
              rows={data.topPaths.map((row) => [<code key="p" className="text-xs">{row.path}</code>, row.count])}
            />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-bold">Per day</h3>
            <DashboardTable
              headers={["Day", "Count"]}
              rows={data.byDay.map((row) => [row.day, row.count])}
            />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-bold">Newest counters</h3>
            <DashboardTable
              headers={["Day", "Event", "Path", "Label", "Count"]}
              rows={data.recent.map((row) => [
                row.day,
                <code key="e" className="text-xs">{row.event}</code>,
                row.path ? <code key="p" className="text-xs">{row.path}</code> : <span className="text-slate-400">—</span>,
                row.label ?? <span className="text-slate-400">—</span>,
                row.count,
              ])}
            />
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <DashboardShell title="Analytics" nav={NAV} roles={["ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"]}>
      <AnalyticsScreen />
    </DashboardShell>
  );
}
