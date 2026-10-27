"use client";

/**
 * /super-admin/health — one screen for "is the platform alive?".
 *
 * Polls the three health surfaces an operator actually needs after an
 * incident: the service health document, the agent-workforce status and the
 * integration configuration. Replaces the raw JSON links the super-admin
 * dashboard used to ship.
 */

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/site/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/super-admin/dashboard" },
  { label: "Admin Panel", href: "/admin/dashboard" },
  { label: "AI Agents", href: "/admin/agents" },
  { label: "Health Check", href: "/super-admin/health" },
  { label: "Audit Logs", href: "/admin/crm/audit-logs" },
  { label: "Settings", href: "/admin/settings" },
];

type Health = {
  status: string;
  version: string;
  timestamp: string;
  checks: { database: string; examTypes: number };
};

type AgentsStatus = {
  stats: { total: number; ready: number; byStatus: Record<string, number> };
  readiness: { status: string; basis: string };
};

type Integration = {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  missingKeys: string[];
};

function HealthContent() {
  const [health, setHealth] = useState<Health | null>(null);
  const [agents, setAgents] = useState<AgentsStatus | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState("");

  const fetchAll = useCallback(
    () =>
      Promise.all([
        fetch("/api/health", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/agents/status", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/integrations", { cache: "no-store" }).then((r) => r.json()),
      ]),
    [],
  );

  const applyAll = useCallback(
    ([healthRes, agentsRes, integrationsRes]: [
      { success: boolean; message?: string; data?: Health },
      { success: boolean; data?: AgentsStatus },
      { success: boolean; data?: { integrations?: Integration[] } },
    ]) => {
      if (healthRes.success && healthRes.data) setHealth(healthRes.data);
      else setError(healthRes.message || "The health endpoint reported a problem.");
      if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data);
      if (integrationsRes.success) setIntegrations(integrationsRes.data?.integrations ?? []);
      setCheckedAt(new Date().toLocaleTimeString());
    },
    [],
  );

  // Promise chain in the effect: no synchronous state writes.
  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((results) => {
        if (!cancelled) applyAll(results);
      })
      .catch(() => {
        if (!cancelled) setError("Network error while checking platform health.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchAll, applyAll]);

  /** Event-handler path (Re-check button). */
  const load = useCallback(() => {
    setLoading(true);
    fetchAll()
      .then(applyAll)
      .catch(() => setError("Network error while checking platform health."))
      .finally(() => setLoading(false));
  }, [fetchAll, applyAll]);

  const configured = integrations.filter((integration) => integration.configured);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform health</h2>
          <p className="text-sm text-slate-600">Service, workforce and integration status on one screen.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="size-4" aria-hidden="true" /> Re-check
        </button>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {checkedAt ? <p className="text-xs text-slate-500">Last checked at {checkedAt}.</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Service</p>
          {loading && !health ? (
            <p className="mt-2 text-sm text-slate-400">Checking…</p>
          ) : health ? (
            <>
              <p className={`mt-2 text-2xl font-extrabold ${health.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
                {health.status}
              </p>
              <p className="mt-1 text-sm text-slate-600">Version {health.version}</p>
              <p className="mt-1 text-xs text-slate-500">Database: {health.checks?.database ?? "unknown"} · {health.checks?.examTypes ?? 0} exam types</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-red-600">No health document.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Agent workforce</p>
          {agents ? (
            <>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {agents.stats.ready}/{agents.stats.total} ready
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {Object.entries(agents.stats.byStatus)
                  .map(([status, count]) => `${count} ${status.toLowerCase()}`)
                  .join(" · ")}
              </p>
              <p className="mt-2 text-xs text-slate-500">Readiness: {agents.readiness.status}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">{loading ? "Checking…" : "Status unavailable (needs an admin session)."}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Integrations</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">
            {configured.length}/{integrations.length} configured
          </p>
          <ul className="mt-2 space-y-1">
            {integrations.slice(0, 5).map((integration) => (
              <li key={integration.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{integration.name}</span>
                <span className={integration.configured ? "font-semibold text-green-600" : "text-slate-400"}>
                  {integration.configured ? "configured" : "off"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-800">Integration detail</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="py-2 font-semibold text-slate-700">Integration</th>
                <th className="py-2 font-semibold text-slate-700">Category</th>
                <th className="py-2 font-semibold text-slate-700">Status</th>
                <th className="py-2 font-semibold text-slate-700">Missing keys</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700">{integration.name}</td>
                  <td className="py-2 text-slate-500">{integration.category}</td>
                  <td className={`py-2 font-semibold ${integration.configured ? "text-green-600" : "text-slate-400"}`}>
                    {integration.configured ? "configured" : "not configured"}
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-500">{integration.missingKeys?.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminHealthPage() {
  return (
    <DashboardShell title="Super Admin" nav={NAV} role="SUPER_ADMIN">
      <HealthContent />
    </DashboardShell>
  );
}
