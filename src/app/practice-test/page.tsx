"use client";

/**
 * src/app/practice-test/page.tsx
 *
 * Production practice test runner. Uses the server-authoritative attempt engine:
 *   - POST /api/attempts/start
 *   - GET  /api/attempts/:id        (resume, returns frozen question set, answers, clock)
 *   - POST /api/attempts/save       (autosave)
 *   - POST /api/attempts/submit     (grading happens server-side)
 *   - GET  /api/questions?attemptId (frozen, answer-safe question set)
 *
 * The browser:
 *   - never computes the authoritative score
 *   - never trusts its own clock for the deadline (displays server remainingSec)
 *   - never re-rolls the question set on refresh
 *   - autosaves answers every 5 seconds and on navigation
 *   - resumes in-progress attempts on load (URL ?attemptId=xxx, or localStorage key)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Flag, ArrowLeft, ArrowRight, Check, Save, AlertCircle, Loader2, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flag, ArrowLeft, ArrowRight, Check } from "lucide-react";

/** Key used to survive a page refresh within the same browser tab session. */
const ATTEMPT_STORAGE_KEY = "alo.activeAttemptId";

type Question = {
  id: string;
  section: string;
  type: string;
  prompt: string;
  passage?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options?: string | null;
  wordLimit?: number | null;
  points: number;
  order: number;
};

type ExamType = { id: string; code: string; name: string; questionCount: number; practiceSetCount: number };
type PracticeSet = { id: string; title: string; description: string; durationMin: number; examType: { code: string; name: string } };
type ExamType = { id: string; code: string; name: string };
type PracticeSet = { id: string; title: string; description?: string; durationMin: number; examType: { code: string; name: string } };

const SECTIONS = ["LISTENING", "READING", "WRITING", "SPEAKING"];
const AUTOSAVE_INTERVAL_MS = 5000;
const STORAGE_KEY_PREFIX = "alo_attempt_";

export default function PracticeTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // Exam state
  const [activeSet, setActiveSet] = useState<PracticeSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [dirtyAnswers, setDirtyAnswers] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Resumability: look for ?attemptId=xxx on initial load ───────────
  useEffect(() => {
    const paramId = searchParams.get("attemptId");
    if (paramId) {
      resumeAttempt(paramId);
    } else {
      const lastId = typeof window !== "undefined" ? window.localStorage.getItem("alo_last_attempt_id") : null;
      if (lastId) resumeAttempt(lastId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Server-authoritative clock + autosave plumbing ──────────────────
  // `expiresAt` is the server's deadline. The browser only interpolates
  // between server readings, so changing the local clock cannot extend an exam.
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved" | "failed">>({});
  const [resuming, setResuming] = useState(false);
  const [saveError, setSaveError] = useState("");
  const skewRef = useRef(0); // serverNow - localNow, from the last server contact
  const answersRef = useRef<Record<string, string>>({});
  const submittingRef = useRef(false);
  const pendingSaves = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch exam types
  useEffect(() => {
    fetch("/api/exam-types")
      .then((r) => r.json())
      .then((data) => { if (data.success) setExamTypes(data.data.examTypes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch practice sets when exam selected
  useEffect(() => {
    if (!selectedExam) return;
    fetch(`/api/practice-sets?examTypeId=${selectedExam}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setPracticeSets(data.data.practiceSets); })
      .catch(() => {});
  }, [selectedExam]);

  // ─── Autosave loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!testStarted || !attemptId) return;
    const interval = setInterval(() => {
      saveDirtyAnswers();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, attemptId, dirtyAnswers]);

  // ─── Presentation-only countdown (server clock resyncs every 30s) ────
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;
    const tick = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    const resync = setInterval(() => resyncClock(), 30000);
    return () => { clearInterval(tick); clearInterval(resync); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, attemptId]);

  // Auto-submit on expiration
  useEffect(() => {
    if (testStarted && timeLeft === 0 && attemptId) {
      submitTest(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  async function resyncClock() {
    if (!attemptId) return;
    try {
      const r = await fetch(`/api/attempts/${attemptId}`);
      const d = await r.json();
      if (d.success && d.data.clock) setTimeLeft(d.data.clock.remainingSec);
    } catch {}
  }

  async function saveDirtyAnswers() {
    if (!attemptId || dirtyAnswers.size === 0) return;
    setSaving(true);
    const toSave = [...dirtyAnswers];
    try {
      // Save each dirty answer sequentially (lightweight upserts)
      for (const qid of toSave) {
        await fetch("/api/attempts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, questionId: qid, answer: answers[qid] || "" }),
        });
    if (submittingRef.current) return; // double-submit guard
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      // Send the student's answers only — never a score. The server grades
      // them against the stored correct answers and owns the result.
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: answersRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data.result);
        setTestStarted(false);
        setExpiresAt(null);
        window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
        submittingRef.current = false;
      } else {
        setError(data.message || "Failed to submit test");
        submittingRef.current = false;
      }
      setDirtyAnswers((prev) => {
        const next = new Set(prev);
        toSave.forEach((id) => next.delete(id));
        return next;
      });
    } catch {
      // Will retry on next autosave tick
      setError("Network error. Please try again.");
      submittingRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  async function resumeAttempt(id: string) {
    try {
      const r = await fetch(`/api/attempts/${id}`);
      const d = await r.json();
      if (!d.success || !d.data.attempt || d.data.attempt.status !== "IN_PROGRESS") {
        if (typeof window !== "undefined") window.localStorage.removeItem("alo_last_attempt_id");
        return;
      }
      const attempt = d.data.attempt;
      setAttemptId(id);
      setActiveSet(attempt.practiceSet);
      setAnswers(d.data.answers || {});
      setQuestions(d.data.questions || []);
      setTimeLeft(d.data.clock.remainingSec);
      setTestStarted(true);
      setCurrentSection(0);
      setCurrentQuestion(0);
      if (typeof window !== "undefined") window.localStorage.setItem("alo_last_attempt_id", id);
      setInfoMsg("Resumed your in-progress attempt.");
      setTimeout(() => setInfoMsg(""), 4000);
    } catch (err) {
      if (typeof window !== "undefined") window.localStorage.removeItem("alo_last_attempt_id");
    }
  }
  }, [attemptId]);

  // ─── Timer ───────────────────────────────────────────────────────────
  // Counts down to the server's deadline. The local clock is only used to
  // interpolate between server readings; a resync every 60s (and whenever
  // the tab regains focus) corrects drift or a manipulated system clock.
  useEffect(() => {
    if (!testStarted || !expiresAt) return;
    const deadline = new Date(expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - (Date.now() + skewRef.current)) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) void submitTest();
    };

    // Deferred one tick so no state is set synchronously inside the effect.
    const kickoff = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);

    const resync = async () => {
      if (!attemptId) return;
      try {
        const res = await fetch(`/api/attempts/${attemptId}`);
        const data = await res.json();
        if (data.success && data.data.attempt.status === "IN_PROGRESS") {
          skewRef.current = new Date(data.data.clock.serverNow).getTime() - Date.now();
          setExpiresAt(data.data.clock.expiresAt);
        }
      } catch {
        /* offline — keep counting down to the last known server deadline */
      }
    };
    const syncTimer = setInterval(resync, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void resync();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
      clearInterval(syncTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [testStarted, expiresAt, attemptId, submitTest]);

  async function startTest(set: PracticeSet) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceSetId: set.id }),
      });
      const data = await res.json();
      if (!data.success) {
      if (data.success) {
        const { attempt, clock } = data.data;

        // The server owns the deadline — never derive it from the client.
        skewRef.current = new Date(clock.serverNow).getTime() - Date.now();
        setExpiresAt(clock.expiresAt);
        setTimeLeft(clock.remainingSec);
        setAttemptId(attempt.id);
        window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, attempt.id);

        // Fetch the question set frozen on this attempt.
        const qRes = await fetch(`/api/questions?attemptId=${attempt.id}`);
        const qData = await qRes.json();
        if (qData.success) {
          setQuestions(qData.data.questions);
          setAnswers({});
          answersRef.current = {};
          setActiveSet(set);
          setCurrentSection(0);
          setCurrentQuestion(0);
          setTestStarted(true);
        } else {
          setError(qData.message || "Failed to load questions");
        }
      } else {
        setError(data.message || "Failed to start test");
        return;
      }
      const { attempt, clock, questions: qInfo } = data.data;
      setActiveSet(set);
      setAttemptId(attempt.id);
      setTimeLeft(clock.remainingSec);
      setTestStarted(true);
      setCurrentSection(0);
      setCurrentQuestion(0);
      setAnswers({});
      setDirtyAnswers(new Set());
      setFlagged(new Set());

      // Load frozen questions via attemptId path — answer-safe projection
      const qRes = await fetch(`/api/questions?attemptId=${attempt.id}`);
      const qData = await qRes.json();
      if (qData.success) {
        setQuestions(qData.data.questions);
      }
      if (typeof window !== "undefined") window.localStorage.setItem("alo_last_attempt_id", attempt.id);
    } catch {
      setError("Network error. Are you logged in?");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Autosave ────────────────────────────────────────────────────────
  // Every answer is pushed to the server. The UI only reports "saved" once
  // the server confirms persistence; a failure stays visible and retryable.
  const saveAnswer = useCallback(
    async (qId: string, value: string) => {
      if (!attemptId) return;
      setSaveStatus((prev) => ({ ...prev, [qId]: "saving" }));
      try {
        const res = await fetch("/api/attempts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, questionId: qId, answer: value }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Save rejected");
        setSaveStatus((prev) => ({ ...prev, [qId]: "saved" }));
        setSaveError("");
      } catch (err) {
        setSaveStatus((prev) => ({ ...prev, [qId]: "failed" }));
        setSaveError(err instanceof Error ? err.message : "Could not save answer");
      }
    },
    [attemptId]
  );

  function setAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setDirtyAnswers((prev) => new Set(prev).add(qId));
    answersRef.current = { ...answersRef.current, [qId]: value };

    // Debounce so typing does not hammer the API; the last write wins.
    if (pendingSaves.current[qId]) clearTimeout(pendingSaves.current[qId]);
    pendingSaves.current[qId] = setTimeout(() => {
      void saveAnswer(qId, value);
    }, 600);
  }

  function toggleFlag(qId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  }

  function reset() {
    Object.values(pendingSaves.current).forEach((t) => clearTimeout(t));
    pendingSaves.current = {};
    submittingRef.current = false;
    window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
    setActiveSet(null);
    setQuestions([]);
    setAnswers({});
    setDirtyAnswers(new Set());
    answersRef.current = {};
    setFlagged(new Set());
    setAttemptId("");
    setResult(null);
    setTestStarted(false);
    setTimeLeft(0);
    setExpiresAt(null);
    setSaveStatus({});
    setSaveError("");
    setCurrentSection(0);
    setCurrentQuestion(0);
    if (typeof window !== "undefined") window.localStorage.removeItem("alo_last_attempt_id");
  }

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const sectionQuestions = useMemo(
    () => questions.filter((q) => q.section === SECTIONS[currentSection]),
    [questions, currentSection]
  );
  const currentQ = sectionQuestions[currentQuestion];

  // ─── Submit ──────────────────────────────────────────────────────────
  const submitTest = useCallback(async (autoSubmit = false) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      // Flush any remaining dirty answers first
      await saveDirtyAnswers();
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data.result);
        setTestStarted(false);
        if (typeof window !== "undefined") window.localStorage.removeItem("alo_last_attempt_id");
      } else {
        setError((autoSubmit ? "Auto-submit: " : "") + (data.message || "Failed to submit test"));
      }
    } catch {
      setError("Network error during submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, answers, submitting]);

  // Save on unload
  useEffect(() => {
    const handler = () => { if (testStarted) saveDirtyAnswers(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testStarted, dirtyAnswers]);

  // ─── Loading / error ────────────────────────────────────────────────
  if (loading) {
  if (loading || resuming) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-slate-500">
          {resuming ? "Restoring your attempt..." : "Loading practice tests..."}
        </p>
      </div>
    );
  }

  // ─── RESULT SCREEN ──────────────────────────────────────────────────
  if (result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="mb-2 text-3xl font-bold text-green-700">Test Complete — AI Evaluation</h1>
          <p className="mb-6 text-slate-500">Your test has been evaluated by the AI grading engine.</p>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Overall Band</p>
              <p className="text-5xl font-bold text-blue-700">{result.overall}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Confidence</p>
              <p className="text-3xl font-bold text-slate-700">{Math.round((result.confidence || 0) * 100)}%</p>
              <p className="text-xs text-slate-400">{result.confidenceLevel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Provider</p>
              <p className="text-lg font-bold text-slate-700">{result.providerUsed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Review</p>
              <p className="text-lg font-bold capitalize text-slate-700">{result.reviewRecommendation}</p>
            </div>
          </div>

          <h2 className="mb-4 text-xl font-bold">Section Scores</h2>
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <ScoreCard label="Listening" value={result.listening} />
            <ScoreCard label="Reading" value={result.reading} />
            <ScoreCard label="Writing" value={result.writing} />
            <ScoreCard label="Speaking" value={result.speaking} />
          </div>

          {result.writingEvaluation && (
            <div className="mb-6 rounded-xl border p-6">
              <h3 className="mb-2 font-semibold">Writing Feedback</h3>
              <p className="mb-2 text-sm text-slate-600">Word count: {result.writingEvaluation.wordCount} / Target: {result.writingEvaluation.targetWordCount}</p>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat label="Task Achievement" value={result.writingEvaluation.taskAchievement} />
                <MiniStat label="Coherence" value={result.writingEvaluation.coherence} />
                <MiniStat label="Lexical" value={result.writingEvaluation.lexical} />
                <MiniStat label="Grammar" value={result.writingEvaluation.grammar} />
              </div>
              <ul className="space-y-1 text-sm text-slate-600">
                {result.writingEvaluation.improvementPlan?.map((tip: string, i: number) => <li key={i}>• {tip}</li>)}
              </ul>
            </div>
          )}

          {result.speakingEvaluation && (
            <div className="mb-6 rounded-xl border p-6">
              <h3 className="mb-2 font-semibold">Speaking Feedback</h3>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <MiniStat label="Fluency" value={result.speakingEvaluation.fluency} />
                <MiniStat label="Pronunciation" value={result.speakingEvaluation.pronunciation} />
                <MiniStat label="Grammar" value={result.speakingEvaluation.grammar} />
                <MiniStat label="Lexical" value={result.speakingEvaluation.lexical} />
                <MiniStat label="Coherence" value={result.speakingEvaluation.coherence} />
              </div>
              <ul className="space-y-1 text-sm text-slate-600">
                {result.speakingEvaluation.improvementTips?.map((tip: string, i: number) => <li key={i}>• {tip}</li>)}
              </ul>
            </div>
          )}

          <p className="mb-4 text-xs text-slate-400">{result.disclosureText}</p>
          <div className="flex gap-2">
            <button onClick={reset} className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">Take Another Test</button>
            <button onClick={() => router.push("/student/exam-history")} className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">View History</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TEST-TAKING SCREEN ─────────────────────────────────────────────
  if (activeSet && testStarted && currentQ) {
    const answeredInSection = sectionQuestions.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
    const options = safeParseOptions(currentQ.options);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="sticky top-0 z-40 border-b bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{activeSet.title}</h1>
              <p className="text-xs text-slate-500">
                Attempt: {attemptId.slice(-8)} · {answeredInSection}/{sectionQuestions.length} answered in section
                {saving && <span className="ml-2 text-blue-600"><Save className="inline h-3 w-3 animate-pulse" /> Saving...</span>}
                {(() => {
                  const states = currentQ ? Object.values(saveStatus).filter(Boolean) : [];
                  const saving = states.includes("saving");
                  const failed = states.includes("failed");
                  const saved = states.length > 0 && !saving && !failed;
                  return (
                    <span className="ml-2">
                      {saving && <span className="text-amber-600">· saving…</span>}
                      {saved && <span className="text-emerald-600">· answers saved</span>}
                      {failed && <span className="text-red-600">· not saved — check connection</span>}
                    </span>
                  );
                })()}
              </p>
            </div>
            <div className={`rounded-lg px-4 py-2 font-mono text-lg font-bold ${timeLeft < 300 ? "bg-red-100 text-red-700 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
              <Clock className="mr-1 inline h-5 w-5" />{formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {infoMsg && (
          <div className="mx-auto mt-3 max-w-7xl rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{infoMsg}</div>
        )}
        {error && (
          <div className="mx-auto mt-3 max-w-7xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800"><AlertCircle className="mr-1 inline h-4 w-4" />{error}</div>
        )}

        <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4">
          <div className="flex-1">
            {/* Section tabs — only show sections that have questions */}
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {SECTIONS.map((section, i) => {
                const qs = questions.filter((q) => q.section === section);
                if (qs.length === 0) return null;
                const sectionAnswered = qs.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
                return (
                  <button
                    key={section}
                    onClick={() => { setCurrentSection(i); setCurrentQuestion(0); }}
                    className={`flex-1 whitespace-nowrap rounded-lg border p-3 text-sm font-medium ${
                      currentSection === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {section}
                    <span className="block text-xs text-slate-400">{sectionAnswered}/{qs.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Audio player for LISTENING questions that have audio */}
            {currentQ.section === "LISTENING" && currentQ.audioUrl && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <button
                  onClick={() => {
                    if (!audioRef.current) audioRef.current = new Audio();
                    audioRef.current.src = currentQ.audioUrl!;
                    if (muted) audioRef.current.muted = true;
                    audioRef.current.play().catch(() => setError("Could not play audio. Try clicking play again."));
                  }}
                  className="rounded-full bg-blue-600 p-3 text-white hover:bg-blue-700"
                  aria-label="Play audio"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Listening Audio</p>
                  <p className="text-xs text-slate-500">Click play to listen. You may replay as needed.</p>
                </div>
                <button onClick={() => setMuted(!muted)} className="rounded-full p-2 hover:bg-slate-100" aria-label={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="h-5 w-5 text-slate-500" /> : <Volume2 className="h-5 w-5 text-slate-500" />}
                </button>
              </div>
            )}

            {/* Passage (reading) / transcript (listening when no audio) */}
            {currentQ.passage && currentQ.section !== "WRITING" && currentQ.section !== "SPEAKING" && (
              <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="mb-2 font-semibold text-slate-700">
                  {currentQ.section === "LISTENING" ? (currentQ.audioUrl ? "Audio Transcript:" : "Listening Script:") : "Reading Passage:"}
                </p>
                <p className="whitespace-pre-line">{currentQ.passage}</p>
              </div>
            )}

            {/* Current question */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  Question {currentQuestion + 1} of {sectionQuestions.length}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-600">
                    {currentQ.type.replace(/_/g, " ")}
                  </span>
                </h3>
                <button
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${flagged.has(currentQ.id) ? "bg-yellow-100 text-yellow-700" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Flag className="h-4 w-4" /> {flagged.has(currentQ.id) ? "Flagged" : "Flag"}
                </button>
              </div>

              <p className="mb-4 text-slate-700">{currentQ.prompt}</p>

              {/* Answer inputs */}
              {(currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE_NOT_GIVEN" || currentQ.type === "TRUE_FALSE" || currentQ.type === "READING_MCQ" || currentQ.type === "READ_AND_SELECT" || currentQ.type === "LISTEN_AND_SELECT") && options && (
                <div className="space-y-2">
                  {options.map((opt: string, idx: number) => (
                    <label
                      key={idx}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        answers[currentQ.id] === String(idx) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQ.id}
                        value={idx}
                        checked={answers[currentQ.id] === String(idx)}
                        onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                        className="h-4 w-4"
                      />
                      <span className="font-medium text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                      <span className="text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {(currentQ.type === "MATCHING" || currentQ.type === "LABELING") && options && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Select the best match:</p>
                  {options.map((opt: string, idx: number) => (
                    <label key={idx} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${answers[currentQ.id] === String(idx) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                      <input type="radio" name={currentQ.id} value={idx} checked={answers[currentQ.id] === String(idx)} onChange={(e) => setAnswer(currentQ.id, e.target.value)} className="h-4 w-4" />
                      <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {(currentQ.type === "FILL_BLANK" || currentQ.type === "SHORT_ANSWER" || currentQ.type === "SENTENCE_COMPLETION" || currentQ.type === "SUMMARY_COMPLETION" || currentQ.type === "WRITE_FROM_DICTATION" || currentQ.type === "COMPLETE_THE_SENTENCE") && (
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm"
                  placeholder="Type your answer..."
                />
              )}

              {(currentQ.type === "ESSAY" || currentQ.type === "WRITING_TASK1" || currentQ.type === "WRITING_TASK2" || currentQ.type === "CHART_DESCRIPTION") && (
                <div>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                    rows={12}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder={`Write your response here... (${currentQ.wordLimit || 250}+ words recommended)`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {wordCount(answers[currentQ.id] || "")} words {currentQ.wordLimit ? `/ ${currentQ.wordLimit} recommended` : ""}
                  </p>
                </div>
              )}

              {currentQ.type === "SPEAKING" && (
                <div>
                  <p className="mb-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                    Speaking task: prepare and deliver your response. For the most accurate practice, speak aloud for the recommended time, then type a transcript of what you said for evaluation. You can also use the <a href="/live-exam" className="underline font-medium">Live AI Speaking Examiner</a> for a real-time voice test.
                  </p>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder="Type or paste the transcript of your spoken response..."
                  />
                  <p className="mt-1 text-xs text-slate-400">{wordCount(answers[currentQ.id] || "")} words</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-4 flex items-center justify-between">
              <button onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))} disabled={currentQuestion === 0}
                className="flex items-center gap-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              {currentQuestion < sectionQuestions.length - 1 ? (
                <button onClick={() => { saveDirtyAnswers(); setCurrentQuestion((q) => q + 1); }}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : currentSection < SECTIONS.length - 1 && questions.some((q) => q.section === SECTIONS[currentSection + 1]) ? (
                <button onClick={() => { saveDirtyAnswers(); setCurrentSection((s) => s + 1); setCurrentQuestion(0); }}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Next Section <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => submitTest(false)} disabled={submitting}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                  <Check className="h-4 w-4" /> {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Test"}
                </button>
              )}
            </div>
          </div>

          {/* Question palette */}
          <div className="hidden w-64 lg:block">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2">
                {sectionQuestions.map((q, i) => {
                  const isAnswered = !!(answers[q.id] && answers[q.id].trim());
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = i === currentQuestion;
                  return (
                    <button key={q.id} onClick={() => setCurrentQuestion(i)}
                      className={`h-10 w-10 rounded-md text-sm font-medium ${
                        isCurrent ? "ring-2 ring-blue-500" : isAnswered ? "bg-green-100 text-green-700" : isFlagged ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                      }`}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-green-100" /> Answered</div>
                <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-yellow-100" /> Flagged</div>
                <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-slate-100" /> Not answered</div>
              </div>
              <button onClick={() => submitTest(false)} disabled={submitting}
                className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
              {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECTION SCREEN ───────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Take a Practice Test</h1>
        <p className="text-slate-600">Full-length exam with server-authoritative timer, autosave, and AI scoring for writing and speaking.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-700">{error}</p>
          <a href="/login" className="mt-2 inline-block font-semibold text-blue-600 hover:underline">Login first →</a>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium">1. Choose an exam type</label>
        <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
          className="w-full rounded-md border border-slate-300 p-3 text-sm">
          <option value="">-- Select --</option>
          {examTypes.filter(et => et.practiceSetCount > 0).map((et) => (
            <option key={et.id} value={et.id}>{et.name} ({et.code}) — {et.questionCount} questions</option>
          ))}
        </select>
      </div>

      {selectedExam && (
        <div>
          <label className="mb-2 block text-sm font-medium">2. Choose a practice set</label>
          {practiceSets.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-slate-500">No practice sets for this exam yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {practiceSets.map((set) => (
                <div key={set.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold">{set.title}</h3>
                    <p className="text-sm text-slate-500">{set.examType.name} · {set.durationMin} minutes</p>
                    {set.description && <p className="mt-1 text-sm text-slate-400">{set.description}</p>}
                  </div>
                  <button onClick={() => startTest(set)} disabled={submitting}
                    className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Starting..." : "Start Test →"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeParseOptions(opts: string | null | undefined): string[] | null {
  if (!opts) return null;
  try {
    const parsed = JSON.parse(opts);
    // TRUE_FALSE_NOT_GIVEN questions without explicit options get defaults
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return null;
}

function wordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-2 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold">{value ?? "—"}</p>
    </div>
  );
}
