"use client";

/**
 * /super-admin/ai-command-center/security
 *
 * The security status page. Surfaces the security-relevant constitutional
 * rules, the AI-model roster (with PII-safe flags), the prompt-injection
 * guard, and the live failed/dead-letter job counts.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle } from "lucide-react";
import { COMMAND_CENTER_NAV } from "../nav";

type Overview = {
  registry: {
    rules: { total: number; active: number; block: number; warn: number; log: number };
    models: { total: number; approved: number; evaluating: number; deprecated: number; rejected: number };
  };
  live: {
    failedJobs: number;
    deadLetterJobs: number;
    auditLogsToday: number;
  };
  lists: {
    rules: Array<{
      name: string;
      category: string;
      description: string;
      enforcement: string;
      version: string;
      active: boolean;
    }>;
    models: Array<{
      name: string;
      provider: string;
      version: string;
      status: string;
      capabilities: string;
    }>;
  };
};

function SecurityContent() {
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
      .catch(() => setError("Network error while loading security data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
        Loading security status...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Failed to load security status.</p>
        <p className="mt-1 text-sm">{error ?? "Unknown error."}</p>
      </div>
    );
  }

  const { registry, live, lists } = data;
  const securityRules = lists.rules.filter((r) =>
    ["Security", "Privacy", "Multi-Tenancy"].includes(r.category),
  );
  const piiSafeModels = lists.models.filter((m) => {
    try {
      return (JSON.parse(m.capabilities) as string[]).includes("pii-safe");
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Security Rules" value={securityRules.length} desc="In force" icon={ShieldCheck} />
        <DashboardCard title="Blocking Rules" value={registry.rules.block} desc="Hard-stop on violation" icon={ShieldAlert} />
        <DashboardCard title="PII-Safe Models" value={piiSafeModels.length} desc="Approved for PII" icon={Lock} />
        <DashboardCard title="Dead-Lettered Jobs" value={live.deadLetterJobs} desc="Require triage" icon={AlertTriangle} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-800">Security posture</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-semibold">No-PII-to-Provider</span> — passport numbers,
            financial-account numbers and biometric data are redacted before any external model call.
          </li>
          <li>
            <span className="font-semibold">Prompt-Injection-Guard</span> — learner-supplied
            content is treated as untrusted. Embedded instructions cannot override an agent&apos;s
            system instruction.
          </li>
          <li>
            <span className="font-semibold">No-Cross-Tenant-Access</span> — an AI employee may
            only access data within its tenant scope unless it carries an explicit cross-tenant
            permission recorded in the audit trail.
          </li>
          <li>
            <span className="font-semibold">Consent-Envelope</span> — no AI employee may contact
            a learner on a channel the learner has not consented to.
          </li>
          <li>
            <span className="font-semibold">Dead-Letter-Triage</span> — an AI employee whose job
            enters DEAD_LETTER is disabled until a human reviews the failure.
          </li>
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-semibold text-slate-800">Security-relevant rules</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {securityRules.map((r) => (
                <li key={r.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.enforcement === "BLOCK"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {r.enforcement}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{r.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-semibold text-slate-800">Model roster</h3>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Model</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Provider</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">PII-safe</th>
                </tr>
              </thead>
              <tbody>
                {lists.models.map((m) => {
                  let piiSafe = false;
                  try {
                    piiSafe = (JSON.parse(m.capabilities) as string[]).includes("pii-safe");
                  } catch {
                    piiSafe = false;
                  }
                  return (
                    <tr key={m.name} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{m.name}</td>
                      <td className="px-4 py-3 text-slate-600">{m.provider}</td>
                      <td className="px-4 py-3 text-slate-600">{m.status}</td>
                      <td className="px-4 py-3">
                        {piiSafe ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            yes
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            no
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(live.failedJobs > 0 || live.deadLetterJobs > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h3 className="font-semibold text-amber-900">Failures need triage</h3>
          </div>
          <p className="mt-2 text-sm text-amber-800">
            {live.failedJobs} failed jobs and {live.deadLetterJobs} dead-lettered jobs in the
            agent queue. The constitutional rule <span className="font-mono">Dead-Letter-Triage</span>{" "}
            requires human review before any of those agents can run again.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <DashboardShell title="AI Command Center" nav={COMMAND_CENTER_NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Security Status</h2>
        <p className="mt-1 text-slate-600">
          The AI workforce&apos;s security posture: PII handling, prompt-injection
          defence, tenant isolation and the dead-letter triage queue.
        </p>
      </div>
      <SecurityContent />
    </DashboardShell>
  );
}
