"use client";

/**
 * /student/ai-teachers — the AI teacher faculty for English preparation.
 *
 * One specialist per subject (grammar, vocabulary, every IELTS section,
 * TOEFL, PTE, Duolingo, OET, GRE, study planning). Ask any teacher a
 * question; answers are grounded in the platform's own study-material
 * library and work with or without an AI provider configured — the badge
 * on each reply says which produced it. Free and unlimited, 24/7.
 */

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { BookOpen, Loader2, Send, Sparkles } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/student/dashboard" },
  { label: "AI Teachers", href: "/student/ai-teachers" },
  { label: "Study Materials", href: "/student/materials" },
  { label: "Speaking conversation practice", href: "/live-exam" },
  { label: "Practice Tests", href: "/practice-test" },
  { label: "Logout", href: "/login" },
];

type Teacher = {
  id: string;
  name: string;
  title: string;
  subject: string;
  personality: string;
  greeting: string;
};

type Turn = {
  role: "teacher" | "student";
  text: string;
  usedAi?: boolean;
};

function initials(name: string): string {
  return name
    .replace(/^(Dr\.|Professor|Mr\.|Ms\.|Mrs\.)\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const SUBJECT_COLORS: Record<string, string> = {
  "English Grammar": "bg-indigo-100 text-indigo-700",
  "Vocabulary Building": "bg-amber-100 text-amber-700",
  "IELTS Listening": "bg-sky-100 text-sky-700",
  "IELTS Reading": "bg-emerald-100 text-emerald-700",
  "IELTS Writing": "bg-rose-100 text-rose-700",
  "IELTS Speaking": "bg-fuchsia-100 text-fuchsia-700",
  "TOEFL iBT": "bg-blue-100 text-blue-700",
  "PTE Academic": "bg-orange-100 text-orange-700",
  "Duolingo English Test": "bg-lime-100 text-lime-700",
  "OET (Healthcare)": "bg-teal-100 text-teal-700",
  "GRE Verbal": "bg-violet-100 text-violet-700",
  "Planning & Strategy": "bg-cyan-100 text-cyan-700",
};

function TeachersContent() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Teacher | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  // Promise chain in the effect (the codebase pattern): no state is written
  // synchronously during the effect.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/teachers", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (body.success) {
          setTeachers(body.data.teachers ?? []);
          setError("");
        } else {
          setError(body.message || "Could not load the AI teachers.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error while loading the AI teachers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Event-handler path: safe to set state synchronously here. */
  const chooseTeacher = useCallback((teacher: Teacher) => {
    setActive(teacher);
    setTurns([{ role: "teacher", text: teacher.greeting }]);
    setQuestion("");
  }, []);

  const backToFaculty = useCallback(() => {
    setActive(null);
    setTurns([]);
  }, []);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || !active || busy) return;
    setBusy(true);
    setQuestion("");
    setTurns((prev) => [...prev, { role: "student", text }]);

    try {
      const history = turns.map((t) => ({ role: t.role, text: t.text }));
      const res = await fetch("/api/teachers/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: active.id, question: text, history }),
      });
      const body = await res.json();
      if (body.success) {
        setTurns((prev) => [
          ...prev,
          { role: "teacher", text: body.data.text, usedAi: body.data.usedAi },
        ]);
      } else {
        setTurns((prev) => [
          ...prev,
          { role: "teacher", text: body.message || "Sorry — I could not answer that. Try rephrasing." },
        ]);
      }
    } catch {
      setTurns((prev) => [
        ...prev,
        { role: "teacher", text: "Network error — please try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading the AI teacher faculty…</p>;
  if (error) return <p className="text-rose-600">{error}</p>;

  // ── Chat view ───────────────────────────────────────────────────────────
  if (active) {
    return (
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-600 font-bold text-white">
              {initials(active.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{active.name}</h2>
              <p className="text-sm text-slate-500">{active.title} · {active.subject}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={backToFaculty}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← All teachers
          </button>
        </div>

        <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
          {turns.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "teacher" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  turn.role === "teacher"
                    ? "rounded-tl-sm bg-slate-100 text-slate-800"
                    : "rounded-tr-sm bg-rose-500 text-white"
                }`}
              >
                {turn.role === "teacher" && (
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">
                    {turn.usedAi === undefined ? (
                      <Sparkles className="h-3 w-3" />
                    ) : turn.usedAi ? (
                      <Sparkles className="h-3 w-3" />
                    ) : (
                      <BookOpen className="h-3 w-3" />
                    )}
                    {active.name}
                    {turn.usedAi === false ? " · grounded in the study library" : ""}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{turn.text}</p>
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> thinking…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={ask} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask ${active.name.split(" ")[0] === "Dr." ? active.name.split(" ")[1] : active.name.split(" ")[0]} anything about ${active.subject.toLowerCase()}…`}
            aria-label="Your question"
            maxLength={2000}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || busy}
            className="flex min-h-11 items-center gap-2 rounded-lg bg-rose-500 px-5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> Ask
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          Free and unlimited. Answers ground in the study-material library; with an AI provider
          configured they are fully conversational.
        </p>
      </>
    );
  }

  // ── Faculty grid ────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">AI Teachers</h2>
        <p className="text-slate-600">
          One specialist for every subject — grammar, vocabulary, each IELTS section, TOEFL, PTE,
          Duolingo, OET, GRE and study planning. Ask anything, free and unlimited, 24/7.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => chooseTeacher(t)}
            className="flex flex-col items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex w-full items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rose-600 font-bold text-white">
                {initials(t.name)}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{t.name}</div>
                <div className="truncate text-xs text-slate-500">{t.title}</div>
              </div>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SUBJECT_COLORS[t.subject] || "bg-slate-100 text-slate-600"}`}
            >
              {t.subject}
            </span>
            <p className="line-clamp-2 text-sm text-slate-600">{t.personality}</p>
            <span className="mt-auto text-sm font-medium text-rose-600">Ask a question →</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function AiTeachersPage() {
  return (
    <DashboardShell title="Student Portal" nav={NAV} roles={["STUDENT", "TEACHER", "COUNSELOR", "ADMIN", "SUPER_ADMIN"]}>
      <TeachersContent />
    </DashboardShell>
  );
}
