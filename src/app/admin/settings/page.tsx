"use client";

/**
 * /admin/settings — the platform settings editor.
 *
 * GET /api/admin/settings lists every key; POST upserts one key at a time.
 * This screen wires both into a table with inline editing, replacing the
 * raw JSON link the admin dashboard used to ship.
 */

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { DashboardShell } from "@/components/site/dashboard-shell";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/crm/users" },
  { label: "Universities", href: "/admin/crm/universities" },
  { label: "Courses", href: "/admin/crm/courses" },
  { label: "Scholarships", href: "/admin/crm/scholarships" },
  { label: "Countries", href: "/admin/crm/countries" },
  { label: "Branches", href: "/admin/crm/branches" },
  { label: "Departments", href: "/admin/crm/departments" },
  { label: "Partners", href: "/admin/crm/partners" },
  { label: "Commissions", href: "/admin/crm/commissions" },
  { label: "Audit Logs", href: "/admin/crm/audit-logs" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "SEO audit", href: "/admin/seo" },
  { label: "AI Agents", href: "/admin/agents" },
  { label: "Exam center", href: "/admin/exam-center" },
  { label: "Learning", href: "/admin/learning" },
  { label: "Settings", href: "/admin/settings" },
];

type Setting = { id: string; key: string; value: string; updatedAt?: string };

function SettingsContent() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchSettings = useCallback(
    () => fetch("/api/admin/settings", { cache: "no-store" }).then((response) => response.json()),
    [],
  );

  const applySettings = useCallback((body: { success: boolean; message?: string; data?: { settings?: Setting[] } }) => {
    if (!body.success) {
      setError(body.message || "Could not load settings.");
      return;
    }
    const list: Setting[] = body.data?.settings ?? [];
    setError("");
    setSettings(list);
    setDrafts(Object.fromEntries(list.map((setting) => [setting.key, setting.value])));
  }, []);

  // Promise chain in the effect: no synchronous state writes.
  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((body) => {
        if (!cancelled) applySettings(body);
      })
      .catch(() => {
        if (!cancelled) setError("Network error while loading settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSettings, applySettings]);

  /** Event-handler path (Refresh button). */
  const load = useCallback(() => {
    setLoading(true);
    fetchSettings()
      .then(applySettings)
      .catch(() => setError("Network error while loading settings."))
      .finally(() => setLoading(false));
  }, [fetchSettings, applySettings]);

  async function save(key: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: drafts[key] ?? "" }),
      });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "The server rejected this value.");
        return;
      }
      setNotice(`Saved “${key}”.`);
      load();
    } catch {
      setError("Network error while saving.");
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey.trim(), value: newValue }),
      });
      const body = await res.json();
      if (!body.success) {
        setError(body.message || "The server rejected this setting.");
        return;
      }
      setNewKey("");
      setNewValue("");
      setNotice("Setting created.");
      load();
    } catch {
      setError("Network error while creating the setting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-sm text-slate-600">Key/value configuration the application reads at runtime.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="size-4" aria-hidden="true" /> Refresh
        </button>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Key</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Value</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Loading settings…</td>
              </tr>
            ) : settings.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">No settings yet.</td>
              </tr>
            ) : (
              settings.map((setting) => (
                <tr key={setting.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{setting.key}</td>
                  <td className="px-4 py-3">
                    <input
                      value={drafts[setting.key] ?? ""}
                      onChange={(event) => setDrafts((current) => ({ ...current, [setting.key]: event.target.value }))}
                      aria-label={`Value for ${setting.key}`}
                      className="w-full min-h-9 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void save(setting.key)}
                      disabled={busy}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#0057B8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
                    >
                      <Save className="size-3.5" aria-hidden="true" /> Save
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-slate-800">Add a setting</h3>
        <p className="mt-1 text-xs text-slate-500">Keys are lowercase snake_case (a–z and _ only).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder="new_setting_key"
            aria-label="New setting key"
            className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder="value"
            aria-label="New setting value"
            className="min-h-10 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void create()}
            disabled={busy || !newKey.trim()}
            className="min-h-10 rounded-lg bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <DashboardShell title="Admin Portal" nav={NAV} roles={["ADMIN", "SUPER_ADMIN"]}>
      <SettingsContent />
    </DashboardShell>
  );
}
