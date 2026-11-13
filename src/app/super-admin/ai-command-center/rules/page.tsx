"use client";

/**
 * /super-admin/ai-command-center/rules
 *
 * The Constitutional Rule registry: the platform-wide guard rails every
 * AI employee must obey.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Rule = {
  name: string;
  category: string;
  description: string;
  enforcement: string;
  version: string;
  active: boolean;
};

type Overview = {
  lists: {
    rules: Rule[];
  };
  registry: {
    rules: { total: number; active: number; block: number; warn: number; log: number };
  };
};

function enforcementBadge(enforcement: string) {
  switch (enforcement) {
    case "BLOCK":
      return {
        icon: ShieldAlert,
        className: "bg-red-100 text-red-800",
        label: "BLOCK",
      };
    case "WARN":
      return {
        icon: ShieldQuestion,
        className: "bg-amber-100 text-amber-800",
        label: "WARN",
      };
    case "LOG":
      return {
        icon: ShieldCheck,
        className: "bg-slate-100 text-slate-700",
        label: "LOG",
      };
    default:
      return {
        icon: ShieldCheck,
        className: "bg-slate-100 text-slate-700",
        label: enforcement,
      };
  }
}

function RulesContent() {
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
      .catch(() => setError("Network error while loading rules."))
      .finally(() => setLoading(false));
  }, []);

  const rules = data?.lists.rules ?? [];
  const stats = data?.registry.rules ?? { total: 0, active: 0, block: 0, warn: 0, log: 0 };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Constitutional Rules" value={stats.total} desc="Platform-wide" icon={ShieldCheck} />
        <DashboardCard title="Active" value={stats.active} desc="In force" />
        <DashboardCard title="Blocking" value={stats.block} desc="Hard stop on violation" icon={ShieldAlert} />
        <DashboardCard title="Warn" value={stats.warn} desc="Logged but not blocked" />
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Rule</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Enforcement</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Version</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading constitutional rules...
                  </td>
                </tr>
              ) : rules.length > 0 ? (
                rules.map((r) => {
                  const badge = enforcementBadge(r.enforcement);
                  const Icon = badge.icon;
                  return (
                    <tr key={`${r.name}-${r.category}`} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3 text-slate-600">{r.category}</td>
                      <td className="max-w-md px-4 py-3 text-xs text-slate-600">{r.description}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.version}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No constitutional rules found.
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

export default function RulesPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Constitutional Rules</h2>
        <p className="mt-1 text-slate-600">
          The platform-wide guard rails. Every AI employee, in every department,
          must obey these rules regardless of its task.
        </p>
      </div>
      <RulesContent />
    </DashboardShell>
  );
}
