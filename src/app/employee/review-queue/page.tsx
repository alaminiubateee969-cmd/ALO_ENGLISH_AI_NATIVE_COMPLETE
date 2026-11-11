"use client";

/**
 * /employee/review-queue — everything the pipeline refused to guess about.
 *
 * This is the answer to the whole automation: the hub creates records rather
 * than merging people, marks documents PENDING_REVIEW rather than verifying
 * them, and flags ambiguous matches rather than attaching them. All of that
 * produces exactly one obligation — a human has to look — and this is where the
 * looking happens.
 *
 * Deliberate choices on this screen:
 *
 *   * **Oldest first.** A queue sorted by newest buries the student who has
 *     waited longest.
 *   * **The reason is always shown.** "Flagged" without why is unresolvable.
 *   * **Dismissing needs a note.** Linking is self-documenting; dismissing a
 *     possible duplicate is the decision that could quietly lose two people's
 *     files, so it needs words.
 *   * **Documents are verified here too, one at a time.** A bulk "verify all"
 *     button would turn a human decision into a click, which is what the rule
 *     against automatic verification exists to prevent.
 */

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { RefreshCw, Clock, Link2, XCircle, FileText, MessageSquare, UserRound, CheckCircle2 } from "lucide-react";

type ReviewItem = {
  kind: "CONVERSATION" | "DOCUMENT" | "STUDENT";
  id: string;
  ageHours: number;
  studentId: string | null;
  studentCode: string | null;
  studentName: string | null;
  title: string;
  detail: string;
  reasons: string[];
  needsIdentityLink: boolean;
  channel: string | null;
  preview: string | null;
};

type ReviewQueue = {
  generatedAt: string;
  items: ReviewItem[];
  totals: { total: number; conversations: number; documents: number; students: number; unlinked: number; oldestAgeHours: number };
};

type StudentResult = { id: string; name: string; studentCode: string | null; phone: string | null; email: string | null };

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Logout", href: "/login" },
];

const KIND_ICON = {
  CONVERSATION: MessageSquare,
  DOCUMENT: FileText,
  STUDENT: UserRound,
};

function age(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h waiting`;
  return `${Math.round(hours / 24)}d waiting`;
}

function ReviewQueueScreen() {
  const [queue, setQueue] = useState<ReviewQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // Per-item resolution state, keyed by item id.
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mode, setMode] = useState<"LINK_STUDENT" | "DISMISS" | "KEEP_PENDING">("LINK_STUDENT");
  const [note, setNote] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [chosenStudent, setChosenStudent] = useState<StudentResult | null>(null);
  const [verifyNote, setVerifyNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/crm/review-queue", { cache: "no-store" });
      const payload = await response.json();
      if (!payload.success) {
        setError(payload.message || "Could not load the review queue.");
        return;
      }
      setError("");
      setQueue(payload.data);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred by a tick so the initial load is a consequence of mounting rather
    // than a synchronous state write inside the effect body.
    const handle = setTimeout(() => void load(), 0);
    return () => clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    const term = studentQuery.trim();
    const handle = setTimeout(async () => {
      // The short-query reset lives inside the debounced callback rather than in
      // the effect body: clearing the list is a consequence of typing, not part
      // of subscribing to the query.
      if (term.length < 2) {
        setStudentResults([]);
        return;
      }
      const response = await fetch(`/api/crm/students?search=${encodeURIComponent(term)}&limit=8`, { cache: "no-store" });
      const payload = await response.json();
      setStudentResults(payload.success ? (payload.data?.students ?? []) : []);
    }, 300);
    return () => clearTimeout(handle);
  }, [studentQuery]);

  function resetEditor() {
    setOpenItem(null);
    setMode("LINK_STUDENT");
    setNote("");
    setStudentQuery("");
    setStudentResults([]);
    setChosenStudent(null);
    setVerifyNote("");
  }

  async function resolveConversation(item: ReviewItem) {
    setBusy(item.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/crm/review-queue/conversations/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, studentId: chosenStudent?.id, note: note.trim() || undefined }),
      });
      const payload = await response.json();
      if (!payload.success) {
        setNotice({ tone: "error", text: payload.message || "The resolution was not applied." });
        return;
      }
      const extra =
        payload.data.action === "LINK_STUDENT"
          ? ` ${payload.data.messagesMoved} message(s) and ${payload.data.documentsMoved} document(s) moved with it.`
          : "";
      setNotice({ tone: "ok", text: `${payload.data.summary}${extra}` });
      resetEditor();
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function verifyDocument(item: ReviewItem, verificationStatus: "VERIFIED" | "REJECTED") {
    setBusy(item.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/crm/documents/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus, reviewNote: verifyNote.trim() || undefined }),
      });
      const payload = await response.json();
      if (!payload.success) {
        setNotice({ tone: "error", text: payload.message || "The document decision was not saved." });
        return;
      }
      setNotice({
        tone: "ok",
        text: verificationStatus === "VERIFIED" ? `${item.title} marked verified by you.` : `${item.title} rejected, with your note.`,
      });
      resetEditor();
      await load();
    } finally {
      setBusy(null);
    }
  }

  const totals = queue?.totals;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Review queue</h2>
          <p className="text-slate-600">
            What the system declined to decide on its own: ambiguous senders, documents that arrived by themselves, and students
            created from an uncertain match.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`mb-4 rounded-xl border p-4 text-sm ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {notice.text}
        </div>
      )}

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: "Waiting", value: totals?.total ?? 0, desc: "items in the queue" },
          { label: "Unidentified", value: totals?.unlinked ?? 0, desc: "no student attached" },
          { label: "Documents", value: totals?.documents ?? 0, desc: "awaiting a human decision" },
          { label: "Oldest", value: totals ? age(totals.oldestAgeHours) : "—", desc: "longest wait" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
          </div>
        ))}
      </div>

      {loading && !queue ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading the queue…</div>
      ) : queue && queue.items.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-emerald-800">
          <CheckCircle2 className="mx-auto mb-2 h-6 w-6" />
          Nothing is waiting. Every message, document and student record has been looked at by a person.
        </div>
      ) : (
        <ul className="space-y-4">
          {queue?.items.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const open = openItem === item.id;
            return (
              <li key={`${item.kind}-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.detail}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.kind.toLowerCase()} · {item.studentCode ?? "no student attached"}
                        {item.studentName ? ` · ${item.studentName}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                    <Clock className="h-3 w-3" /> {age(item.ageHours)}
                  </span>
                </div>

                <ul className="mt-3 space-y-1">
                  {item.reasons.map((reason) => (
                    <li key={reason} className="text-sm text-amber-800">
                      • {reason}
                    </li>
                  ))}
                </ul>

                {item.preview && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">“{item.preview}”</p>}

                {item.needsIdentityLink && !item.studentId && (
                  <p className="mt-2 text-xs text-red-700">
                    This cannot be verified as-is: nothing is attached to a student yet. Say who this is first.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {item.kind === "CONVERSATION" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenItem(open ? null : item.id);
                        setMode(item.needsIdentityLink ? "LINK_STUDENT" : "DISMISS");
                        setNotice(null);
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                    >
                      {open ? "Close" : "Resolve"}
                    </button>
                  )}
                  {item.kind === "DOCUMENT" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenItem(open ? null : item.id);
                        setNotice(null);
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                    >
                      {open ? "Close" : "Review the document"}
                    </button>
                  )}
                  {item.kind === "STUDENT" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenItem(open ? null : item.id);
                        setMode("DISMISS");
                        setNotice(null);
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                    >
                      {open ? "Close" : "Confirm this is a new person"}
                    </button>
                  )}
                </div>

                {open && item.kind === "CONVERSATION" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {(["LINK_STUDENT", "DISMISS", "KEEP_PENDING"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setMode(option)}
                          className={`rounded-lg border px-3 py-1.5 text-xs ${mode === option ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                        >
                          {option === "LINK_STUDENT" ? "This is an existing student" : option === "DISMISS" ? "Not a duplicate" : "Not now"}
                        </button>
                      ))}
                    </div>

                    {mode === "LINK_STUDENT" && (
                      <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">Which student is this?</label>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                          <Link2 className="h-4 w-4 text-slate-400" />
                          <input
                            value={studentQuery}
                            onChange={(event) => setStudentQuery(event.target.value)}
                            placeholder="Name, phone, email or student code"
                            className="w-full py-2 text-sm outline-none"
                          />
                        </div>
                        {chosenStudent && (
                          <p className="mt-2 text-xs text-emerald-700">
                            Linking to {chosenStudent.name} {chosenStudent.studentCode ? `(${chosenStudent.studentCode})` : ""} — their messages and
                            documents move with it.
                          </p>
                        )}
                        {studentResults.length > 0 && (
                          <ul className="mt-2 divide-y rounded-lg border border-slate-200 bg-white">
                            {studentResults.map((student) => (
                              <li key={student.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChosenStudent(student);
                                    setStudentResults([]);
                                  }}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
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
                      </div>
                    )}

                    {mode !== "LINK_STUDENT" && (
                      <div className="mb-3">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Note <span className="text-red-600">(required)</span>
                        </label>
                        <textarea
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          rows={2}
                          placeholder={mode === "DISMISS" ? "What you checked, and why this is not a duplicate." : "What is this waiting for?"}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={busy === item.id}
                      onClick={() => void resolveConversation(item)}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {busy === item.id ? "Applying…" : "Apply"}
                    </button>
                  </div>
                )}

                {open && item.kind === "DOCUMENT" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-xs text-slate-600">
                      Opening a file is itself a sensitive read and is audited. The download route verifies the stored hash before
                      serving it.
                    </p>
                    <a
                      href={`/api/crm/documents/${item.id}/download`}
                      className="mb-3 inline-block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
                    >
                      Open the file (audited)
                    </a>
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Review note</label>
                      <input
                        value={verifyNote}
                        onChange={(event) => setVerifyNote(event.target.value)}
                        placeholder="What you checked, and against what."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === item.id}
                        onClick={() => void verifyDocument(item, "VERIFIED")}
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                      >
                        Mark verified
                      </button>
                      <button
                        type="button"
                        disabled={busy === item.id}
                        onClick={() => void verifyDocument(item, "REJECTED")}
                        className="flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Verification means a named person looked at this file and stands behind it. Type suggestions are never
                      verification.
                    </p>
                  </div>
                )}

                {open && item.kind === "STUDENT" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 text-xs text-slate-600">
                      Confirming this record clears the flag. If it is actually an existing student, resolve the conversation that
                      created it instead — this screen never merges two records, because merging is not reversible by an apology.
                    </p>
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Note <span className="text-red-600">(required)</span>
                      </label>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={2}
                        placeholder="Why this is a distinct person."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy === item.id}
                      onClick={async () => {
                        setBusy(item.id);
                        setNotice(null);
                        try {
                          const response = await fetch(`/api/crm/review-queue/students/${item.id}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "CONFIRM", note: note.trim() }),
                          });
                          const payload = await response.json();
                          if (!payload.success) {
                            setNotice({ tone: "error", text: payload.message || "The record was not updated." });
                            return;
                          }
                          setNotice({ tone: "ok", text: payload.data.summary });
                          resetEditor();
                          await load();
                        } finally {
                          setBusy(null);
                        }
                      }}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {busy === item.id ? "Saving…" : "Confirm"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function ReviewQueuePage() {
  return (
    <DashboardShell title="Review queue" nav={NAV} roles={["FRONT_DESK", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER", "ADMIN", "SUPER_ADMIN"]}>
      <ReviewQueueScreen />
    </DashboardShell>
  );
}
