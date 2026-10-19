"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Clock, Flag, ArrowLeft, ArrowRight, Check } from "lucide-react";

/** Key used to survive a page refresh within the same browser tab session. */
const ATTEMPT_STORAGE_KEY = "alo.activeAttemptId";

type Question = {
  id: string;
  section: string;
  type: string;
  prompt: string;
  passage?: string | null;
  /** Listening audio asset. Served by SAFE_QUESTION_SELECT; absent when a question has no audio. */
  audioUrl?: string | null;
  options?: string | null;
  wordLimit?: number | null;
  points: number;
  order: number;
};

type ExamType = { id: string; code: string; name: string };
type PracticeSet = { id: string; title: string; description?: string; durationMin: number; examType: { code: string; name: string } };


export default function PracticeTestPage() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Exam state
  const [activeSet, setActiveSet] = useState<PracticeSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);

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

  // Listening audio is rendered as a native <audio controls> element keyed to
  // the question id (see the LISTENING block below). `audioUrl` comes from the
  // question row via SAFE_QUESTION_SELECT — never from the client — and
  // playback state is presentation only: it has no bearing on grading, the
  // server clock, or attempt completion. Keying the element means React
  // replaces it on question change, so a clip cannot carry over.

  // Fetch exam types
  useEffect(() => {
    fetch("/api/exam-types")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const availableTypes: ExamType[] = data.data.examTypes;
        setExamTypes(availableTypes);
        const requestedCode = new URLSearchParams(window.location.search).get("examType");
        const requestedType = requestedCode
          ? availableTypes.find((examType) => examType.code.toLowerCase() === requestedCode.toLowerCase())
          : undefined;
        if (requestedType) setSelectedExam(requestedType.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Recover an in-progress attempt from this tab or the authenticated API.
  // The API fallback also handles a lost start response or cleared sessionStorage.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const restoreAttempt = async () => {
      const storedAttemptId = window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
      setResuming(true);
      try {
        const endpoint = storedAttemptId
          ? `/api/attempts/${encodeURIComponent(storedAttemptId)}`
          : "/api/attempts/active";
        const response = await fetch(endpoint, { cache: "no-store" });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          if (storedAttemptId && (response.status === 403 || response.status === 404)) {
            window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
          }
          return;
        }

        const restored = payload.data;
        const restoredAttempt = restored?.attempt;
        if (!restoredAttempt?.id) {
          if (storedAttemptId) window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
          return;
        }
        if (restoredAttempt.status !== "IN_PROGRESS") {
          window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
          return;
        }

        const restoredQuestions: Question[] = Array.isArray(restored.questions) ? restored.questions : [];
        if (restoredQuestions.length === 0) {
          setError("This saved attempt has no frozen questions. It cannot be resumed; contact support before starting another attempt.");
          return;
        }

        const set = restoredAttempt.practiceSet;
        const restoredAnswers = Object.fromEntries(
          Object.entries(restored.answers ?? {}).map(([questionId, answer]) => [
            questionId,
            typeof answer === "string" ? answer : String(answer ?? ""),
          ]),
        ) as Record<string, string>;
        if (cancelled) return;

        setAttemptId(restoredAttempt.id);
        window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, restoredAttempt.id);
        setActiveSet({
          id: set.id,
          title: set.title,
          durationMin: set.durationMin,
          examType: set.examType,
        });
        setQuestions(restoredQuestions);
        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;
        setSaveStatus(Object.fromEntries(Object.keys(restoredAnswers).map((questionId) => [questionId, "saved"])) as Record<string, "saved">);
        setCurrentSection(0);
        setCurrentQuestion(0);
        setExpiresAt(restored.clock.expiresAt);
        setTimeLeft(restored.clock.remainingSec);
        skewRef.current = new Date(restored.clock.serverNow).getTime() - Date.now();
        setTestStarted(true);
        const matchingExam = examTypes.find((examType) => examType.code === set.examType.code);
        if (matchingExam) setSelectedExam(matchingExam.id);
      } catch {
        if (!cancelled) setError("Could not restore the saved attempt. Check your connection and reload to retry.");
      } finally {
        if (!cancelled) setResuming(false);
      }
    };

    void restoreAttempt();
    return () => { cancelled = true; };
  }, [loading, examTypes]);

  // Fetch practice sets when exam selected
  useEffect(() => {
    if (!selectedExam) return;
    fetch(`/api/practice-sets?examTypeId=${selectedExam}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setPracticeSets(data.data.practiceSets); })
      .catch(() => {});
  }, [selectedExam]);

  const submitTest = useCallback(async () => {
    if (!attemptId) return;
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
    } catch {
      setError("Network error. Please try again.");
      submittingRef.current = false;
    } finally {
      setSubmitting(false);
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
      }
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
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
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
  }

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Keep section navigation data-driven: academic exam sections such as
  // VERBAL or QUANTITATIVE must not disappear behind a fixed four-skill list.
  const sections = useMemo(
    () => Array.from(new Set(questions.map((question) => question.section))),
    [questions]
  );
  const sectionQuestions = useMemo(
    () => questions.filter((question) => question.section === sections[currentSection]),
    [questions, sections, currentSection]
  );
  const currentQ = sectionQuestions[currentQuestion];

  if (loading || resuming) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-slate-500">
          {resuming ? "Restoring your attempt..." : "Loading practice tests..."}
        </p>
      </div>
    );
  }

  // RESULT SCREEN
  if (result) {
    const hasSpeakingEvaluation =
      Array.isArray(result.evaluations) &&
      result.evaluations.some((evaluation: any) => evaluation?.section === "SPEAKING");
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {result.status === "SCORED" ? "Practice feedback ready" : "Attempt submitted — no numeric result"}
          </h1>
          <p className="text-slate-600 mb-6">
            Listening and reading indicators reflect answer accuracy only. Writing suggestions are non-scored and unvalidated. Speaking is not scored because this attempt does not attach a recording for acoustic assessment.
          </p>

          {/* Overall Score */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Practice indicator (0–9)</p>
              <p className="text-5xl font-bold text-blue-700">{result.overall ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Calibration</p>
              <p className="text-lg font-bold text-slate-700">Not validated</p>
              <p className="text-xs text-slate-400">No confidence percentage shown</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Scoring method</p>
              <p className="text-lg font-bold text-slate-700">{result.providerUsed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Human review</p>
              <p className="text-lg font-bold text-slate-700">Not performed</p>
            </div>
          </div>

          {/* Section results */}
          <h2 className="text-xl font-bold mb-4">Objective practice indicators (0–9; not official scores)</h2>
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Listening</p><p className="text-3xl font-bold">{result.listening ?? "—"}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Reading</p><p className="text-3xl font-bold">{result.reading ?? "—"}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Writing</p><p className="text-lg font-semibold">Feedback only</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Speaking</p><p className="text-lg font-semibold">{hasSpeakingEvaluation ? "Feedback only" : "Not scored"}</p></div>
          </div>

          {/* The platform's own evaluation of the subjective sections. */}
          {Array.isArray(result.evaluations) && result.evaluations.length > 0 && (
            <div className="mb-6 space-y-4">
              {result.evaluations.map((evaluation: any) => (
                <div key={evaluation.section} className="rounded-xl border p-6">
                  <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">
                      {evaluation.section === "WRITING" ? "Writing" : "Speaking"} evaluation
                      {evaluation.taskType ? ` — ${evaluation.taskType}` : ""}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {evaluation.fallbackUsed
                        ? "Built-in rule engine"
                        : `Assessed by the ALO evaluation agent (${evaluation.providerUsed})`}
                    </span>
                  </div>

                  <p className="mb-4 text-sm text-slate-700">{evaluation.summary}</p>

                  {Array.isArray(evaluation.criteria) && evaluation.criteria.length > 0 && (
                    <dl className="mb-4 space-y-3">
                      {evaluation.criteria.map((criterion: any) => (
                        <div key={criterion.key}>
                          <dt className="text-sm font-medium text-slate-800">{criterion.label}</dt>
                          <dd className="text-sm text-slate-600">{criterion.comment}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-800">What worked</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {evaluation.strengths.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(evaluation.improvements) && evaluation.improvements.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-800">What to improve</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {evaluation.improvements.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(evaluation.nextSteps) && evaluation.nextSteps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-800">Next steps</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        {evaluation.nextSteps.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-4 text-xs text-slate-400">{evaluation.disclosure}</p>
                </div>
              ))}
            </div>
          )}

          {/* Writing guidance only; no heuristic/model band is exposed. */}
          {result.writingFeedback && (!Array.isArray(result.evaluations) || result.evaluations.length === 0) && (
            <div className="mb-6 rounded-xl border p-6">
              <h3 className="font-semibold mb-2">Writing suggestions (not a score)</h3>
              <p className="text-sm text-slate-600 mb-3">Response word count: {result.writingFeedback.wordCount}. Suggestions are generic and have not been validated against an exam-specific rubric.</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.writingFeedback.improvementPlan?.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-400">{result.writingFeedback.disclaimer}</p>
            </div>
          )}

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">Speaking is not scored</h3>
            <p className="mt-1 text-sm text-amber-800">
              Any speaking feedback above comes from the transcript only. Typing a transcript cannot measure spoken fluency or pronunciation, so no speaking score is produced.
            </p>
          </div>

          <p className="text-xs text-slate-400 mb-4">{result.disclosureText}</p>
          <button onClick={reset} className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  // TEST-TAKING SCREEN
  if (activeSet && testStarted && currentQ) {
    const answeredInSection = sectionQuestions.filter((q) => answers[q.id]).length;
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top bar */}
        <div className="sticky top-0 z-40 border-b bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">{activeSet.title}</h1>
              <p className="text-xs text-slate-500">
                Attempt: {attemptId.slice(-8)} · {answeredInSection}/{sectionQuestions.length} answered in section
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

        <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4">
          {/* Left: Question area */}
          <div className="flex-1">
            {/* Section tabs */}
            <div className="mb-4 flex gap-2">
              {sections.map((section, i) => {
                const sectionCount = questions.filter((q) => q.section === section).length;
                const sectionAnswered = questions.filter((q) => q.section === section && answers[q.id]).length;
                return (
                  <button
                    key={section}
                    onClick={() => { setCurrentSection(i); setCurrentQuestion(0); }}
                    className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
                      currentSection === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {section}
                    <span className="block text-xs text-slate-400">{sectionAnswered}/{sectionCount}</span>
                  </button>
                );
              })}
            </div>

            {/* Listening audio — only when the question actually has an asset */}
            {currentQ.section === "LISTENING" && currentQ.audioUrl && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Listening Audio</p>
                <audio
                  key={currentQ.id}
                  src={currentQ.audioUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                  aria-label={`Listening audio for question ${currentQuestion + 1}`}
                >
                  Your browser cannot play this audio. The transcript is shown below.
                </audio>
              </div>
            )}

            {/* Passage (reading) / transcript (listening) */}
            {currentQ.passage && (
              <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="mb-2 font-semibold text-slate-700">
                  {currentQ.section === "LISTENING"
                    ? currentQ.audioUrl
                      ? "Audio Transcript:"
                      : "Listening Script (no audio for this question):"
                    : "Reading Passage:"}
                </p>
                <p className="whitespace-pre-line">{currentQ.passage}</p>
              </div>
            )}

            {/* Chart/image (if writing task 1) */}
            {currentQ.passage && currentQ.type === "CHART_DESCRIPTION" && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-slate-700">Chart Data:</p>
                <p className="text-sm text-slate-600">{currentQ.passage}</p>
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
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
                    flagged.has(currentQ.id) ? "bg-yellow-100 text-yellow-700" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Flag className="h-4 w-4" /> {flagged.has(currentQ.id) ? "Flagged" : "Flag"}
                </button>
              </div>

              <p className="mb-4 text-slate-700">{currentQ.prompt}</p>

              {/* Answer input by type */}
              {(currentQ.type === "MULTIPLE_CHOICE" || currentQ.type === "TRUE_FALSE_NOT_GIVEN" || currentQ.type === "MATCHING") && currentQ.options && (
                <div className="space-y-2">
                  {JSON.parse(currentQ.options).map((opt: string, idx: number) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
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

              {(currentQ.type === "FILL_BLANK" || currentQ.type === "SENTENCE_COMPLETION" || currentQ.type === "SHORT_ANSWER") && (
                <input
                  type="text"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm"
                  placeholder="Type your answer..."
                />
              )}

              {currentQ.type === "ESSAY" && (
                <div>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                    rows={12}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder={`Write your essay here... (minimum ${currentQ.wordLimit || 250} words)`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {(answers[currentQ.id] || "").trim().split(/\s+/).filter(Boolean).length} words {currentQ.wordLimit ? `/ ${currentQ.wordLimit} required` : ""}
                  </p>
                </div>
              )}

              {currentQ.type === "CHART_DESCRIPTION" && (
                <div>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                    rows={10}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder={`Describe the chart... (minimum ${currentQ.wordLimit || 150} words)`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {(answers[currentQ.id] || "").trim().split(/\s+/).filter(Boolean).length} words {currentQ.wordLimit ? `/ ${currentQ.wordLimit} required` : ""}
                  </p>
                </div>
              )}

              {currentQ.type === "SPEAKING" && (
                <div>
                  <p className="mb-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                    Type your speaking response transcript below (in a real exam, you would speak aloud):
                  </p>
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                    rows={6}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder="Type your response here..."
                  />
                  <p className="mt-1 text-xs text-slate-400">{(answers[currentQ.id] || "").trim().split(/\s+/).filter(Boolean).length} words</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-1 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              {currentQuestion < sectionQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion((q) => q + 1)}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : currentSection < sections.length - 1 ? (
                <button
                  onClick={() => { setCurrentSection((s) => s + 1); setCurrentQuestion(0); }}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next Section <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={submitTest}
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit attempt"}
                </button>
              )}
            </div>
          </div>

          {/* Right: Question palette */}
          <div className="hidden w-64 lg:block">
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2">
                {sectionQuestions.map((q, i) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flagged.has(q.id);
                  const isCurrent = i === currentQuestion;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(i)}
                      className={`h-10 w-10 rounded-md text-sm font-medium ${
                        isCurrent
                          ? "ring-2 ring-blue-500"
                          : isAnswered
                          ? "bg-green-100 text-green-700"
                          : isFlagged
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
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
              <button
                onClick={submitTest}
                disabled={submitting}
                className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Evaluating..." : "Submit Test"}
              </button>
              {error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SELECTION SCREEN
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Take a Practice Test</h1>
        <p className="text-slate-600">Full-length exam with AI scoring for writing and speaking</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-red-700">{error}</p>
          <a href="/login" className="mt-2 inline-block text-blue-600 font-semibold hover:underline">Login first →</a>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">1. Choose an exam type</label>
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="w-full rounded-md border border-slate-300 p-3 text-sm"
        >
          <option value="">-- Select --</option>
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.name} ({et.code})</option>
          ))}
        </select>
      </div>

      {selectedExam && (
        <div>
          <label className="block text-sm font-medium mb-2">2. Choose a practice set</label>
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
                  <button
                    onClick={() => startTest(set)}
                    disabled={submitting}
                    className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
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
