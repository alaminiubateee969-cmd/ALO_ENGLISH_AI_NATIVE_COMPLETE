"use client";

/**
 * /employee/consent — the consent register.
 *
 * What this screen is FOR, and what it deliberately is not:
 *
 *   * It is a **capture** screen, not a settings toggle. A grant needs a source
 *     and evidence, because a grant recorded without either is an assertion, and
 *     an assertion is what gets an institute fined.
 *   * It shows the whole grid, including the combinations that have no record.
 *     `UNKNOWN` is the state of not knowing, and showing it honestly is the point:
 *     a grid of friendly green ticks over an empty register is a lie.
 *   * It states why marketing is blocked, in words, and offers the fix. A
 *     blocked send with no explanation is how staff learn to work around a
 *     system instead of using it.
 *   * Withdrawals and refusals need nothing but the decision. Making someone
 *     justify "stop" is its own harm.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, useApi } from "@/components/site/dashboard-shell";
import { ShieldCheck, ShieldAlert, Search, RefreshCw, AlertTriangle } from "lucide-react";

type ConsentEntry = {
  channel: string;
  purpose: string;
  status: string;
  source: string | null;
  evidence: string | null;
  recordedAt: string | null;
};

type ConsentResponse = {
  student: { id: string; name: string; studentCode: string | null };
  matrix: Array<{ channel: string; purpose: string; status: string; source: string | null; evidence: string | null; recordedAt: string | null }>;
  marketingOptOut: boolean;
  marketing: { allowed: boolean; reason: string; grantedChannels: string[] };
  promoted: string[];
};

type StudentResult = { id: string; name: string; studentCode: string | null; phone: string | null; email: string | null };

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Logout", href: "/login" },
];

const STATUS_STYLE: Record<string, string> = {
  GRANTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DENIED: "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-amber-50 text-amber-800 border-amber-200",
  UNKNOWN: "bg-slate-50 text-slate-500 border-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  GRANTED: "Granted",
  DENIED: "Declined",
  WITHDRAWN: "Withdrawn",
  UNKNOWN: "No record",
};

function ConsentRegister() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentResult | null>(null);
  const [register, setRegister] = useState<ConsentResponse | null>(null);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Capture form state.
  const [channel, setChannel] = useState("WHATSAPP");
  const [purpose, setPurpose] = useState("MARKETING");
  const [status, setStatus] = useState("GRANTED");
  const [source, setSource] = useState("STAFF_ENTRY");
  const [evidence, setEvidence] = useState("");
  const [saving, setSaving] = useState(false);

  const loadRegister = useCallback(async (studentId: string) => {
    setLoadingRegister(true);
    try {
      const response = await fetch(`/api/crm/consent?studentId=${encodeURIComponent(studentId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!payload.success) {
        setMessage({ tone: "error", text: payload.message || "Could not read the consent register." });
        setRegister(null);
        return;
      }
      setRegister(payload.data);
      if (payload.data.promoted?.length) {
        setMessage({ tone: "ok", text: `Promoted a form capture into the register: ${payload.data.promoted.join(", ")}.` });
      }
    } finally {
      setLoadingRegister(false);
    }
  }, []);

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(`/api/crm/students?search=${encodeURIComponent(term.trim())}&limit=8`, { cache: "no-store" });
      const payload = await response.json();
      setResults(payload.success ? (payload.data?.students ?? []) : []);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void search(query), 300);
    return () => clearTimeout(handle);
  }, [query, search]);

  // Load nothing until a student is chosen: consent is read per person.

  const grantNeedsEvidence = status === "GRANTED";

  async function record() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/crm/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selected.id,
          channel,
          purpose,
          status,
          source,
          evidence: evidence.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!payload.success) {
        setMessage({ tone: "error", text: payload.message || "The decision was not recorded." });
        return;
      }
      setRegister((current) => (current ? { ...current, matrix: payload.data.matrix, marketing: payload.data.marketing, marketingOptOut: payload.data.marketingOptOut } : current));
      setEvidence("");
      setMessage({ tone: "ok", text: `Recorded: ${purpose} on ${channel} is now ${STATUS_LABEL[payload.data.entry.status] ?? payload.data.entry.status}.` });
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const channels = ["WHATSAPP", "SMS", "EMAIL", "FACEBOOK", "INSTAGRAM"];
    const purposes = ["MARKETING", "SERVICE", "FOLLOW_UP"];
    return channels.map((channelName) => ({
      channel: channelName,
      cells: purposes.map((purposeName) => ({
        purpose: purposeName,
        cell: register?.matrix.find((entry) => entry.channel === channelName && entry.purpose === purposeName) ?? null,
      })),
    }));
  }, [register]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Consent register</h2>
        <p className="text-slate-600">
          What each student agreed to, on what evidence. Marketing stays blocked until a real capture is recorded here — an
          inbound keyword, a form, or a staff entry with evidence.
        </p>
      </div>

      {message && (
        <div className={`mb-4 rounded-xl border p-4 text-sm ${message.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">Find the student</label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, phone, email or ALO-2026-000123"
            className="w-full py-2 text-sm outline-none"
          />
          {searching && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        {results.length > 0 && (
          <ul className="mt-3 divide-y rounded-lg border border-slate-200">
            {results.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(student);
                    setResults([]);
                    setMessage(null);
                    void loadRegister(student.id);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">{student.name}</span>
                  <span className="text-slate-500">
                    {student.studentCode ?? "no code"} · {student.phone ?? student.email ?? "no contact"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <p className="mt-3 text-sm text-slate-600">
            Showing <span className="font-medium text-slate-800">{selected.name}</span>
            {selected.studentCode ? ` (${selected.studentCode})` : ""}
          </p>
        )}
      </div>

      {selected && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                {register?.marketingOptOut ? <ShieldAlert className="h-5 w-5 text-amber-600" /> : <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                <h3 className="font-semibold">Marketing</h3>
              </div>
              {loadingRegister && !register ? (
                <p className="text-sm text-slate-400">Reading the register…</p>
              ) : (
                <>
                  <p className={`text-sm ${register?.marketing.allowed ? "text-emerald-800" : "text-slate-700"}`}>{register?.marketing.reason}</p>
                  {register?.marketingOptOut && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4" /> A withdrawal applies to every channel, not only the one where the student said stop.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Channel</th>
                    {["MARKETING", "SERVICE", "FOLLOW_UP"].map((purposeName) => (
                      <th key={purposeName} className="px-4 py-3 text-left font-semibold text-slate-700">
                        {purposeName.replace("_", " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((row) => (
                    <tr key={row.channel} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-700">{row.channel}</td>
                      {row.cells.map(({ purpose: purposeName, cell }) => (
                        <td key={purposeName} className="px-4 py-3">
                          <span className={`inline-block rounded-md border px-2 py-1 text-xs ${STATUS_STYLE[cell?.status ?? "UNKNOWN"]}`}>
                            {STATUS_LABEL[cell?.status ?? "UNKNOWN"]}
                          </span>
                          {cell?.evidence && <p className="mt-1 text-xs text-slate-500">{cell.evidence}</p>}
                          {cell?.source && <p className="text-xs text-slate-400">via {cell.source}</p>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-1 font-semibold">Record a decision</h3>
            <p className="mb-4 text-xs text-slate-500">
              A grant needs a source and evidence. A refusal or withdrawal is recorded with nothing required — saying stop must
              never need paperwork.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Channel</label>
                <select value={channel} onChange={(event) => setChannel(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {["WHATSAPP", "SMS", "EMAIL", "FACEBOOK", "INSTAGRAM"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Purpose</label>
                <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="MARKETING">Marketing</option>
                  <option value="SERVICE">Service</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Decision</label>
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="GRANTED">Granted</option>
                  <option value="DENIED">Declined</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Source</label>
                <select
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  disabled={!grantNeedsEvidence}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="STAFF_ENTRY">Staff entry (in person, at the desk)</option>
                  <option value="FORM">Form</option>
                  <option value="INBOUND_MESSAGE">Inbound message</option>
                  <option value="IMPORT">Import</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Evidence {grantNeedsEvidence ? <span className="text-red-600">(required for a grant)</span> : <span className="text-slate-400">(optional)</span>}
                </label>
                <textarea
                  value={evidence}
                  onChange={(event) => setEvidence(event.target.value)}
                  rows={3}
                  placeholder={grantNeedsEvidence ? "What the student agreed to, and where: form reference, message id, or the words used." : "Anything worth remembering about the decision."}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => void record()}
                disabled={saving}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Recording…" : "Record decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ConsentPage() {
  return (
    <DashboardShell title="Consent register" nav={NAV} roles={["FRONT_DESK", "COUNSELOR", "SUPPORT", "BRANCH_MANAGER", "MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
      <ConsentRegister />
    </DashboardShell>
  );
}
