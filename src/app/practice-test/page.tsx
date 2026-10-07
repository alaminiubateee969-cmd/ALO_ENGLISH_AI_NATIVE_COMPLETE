"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flag, ArrowLeft, ArrowRight, Check } from "lucide-react";

type Question = {
  id: string;
  section: string;
  type: string;
  prompt: string;
  passage?: string | null;
  options?: string | null;
  wordLimit?: number | null;
  points: number;
  order: number;
};

type ExamType = { id: string; code: string; name: string };
type PracticeSet = { id: string; title: string; description: string; durationMin: number; examType: { code: string; name: string } };

const SECTIONS = ["LISTENING", "READING", "WRITING", "SPEAKING"];

export default function PracticeTestPage() {
  const router = useRouter();
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

  const submitTest = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError("");
    try {
      const writingAnswers = questions
        .filter((q) => q.section === "WRITING" && answers[q.id])
        .map((q) => answers[q.id])
        .join("\n\n");
      const speakingAnswers = questions
        .filter((q) => q.section === "SPEAKING" && answers[q.id])
        .map((q) => answers[q.id])
        .join("\n\n");
      const objectiveQuestions = questions.filter(
        (q) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE_NOT_GIVEN" || q.type === "FILL_BLANK" || q.type === "MATCHING" || q.type === "SENTENCE_COMPLETION"
      );

      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: {
            writing: writingAnswers,
            speaking: speakingAnswers,
            objectiveAnswers: answers,
            readingCorrect: objectiveQuestions.filter((q) => answers[q.id]).length,
            readingTotal: objectiveQuestions.length,
            listeningCorrect: objectiveQuestions.filter((q) => answers[q.id]).length,
            listeningTotal: objectiveQuestions.length,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data.result);
        setTestStarted(false);
      } else {
        setError(data.message || "Failed to submit test");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, questions]);

  // Timer
  useEffect(() => {
    if (!testStarted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]);

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
        setActiveSet(set);
        setAttemptId(data.data.attempt.id);
        setTimeLeft(set.durationMin * 60);
        setTestStarted(true);
        setCurrentSection(0);
        setCurrentQuestion(0);

        // Fetch questions
        const qRes = await fetch(`/api/questions?practiceSetId=${set.id}`);
        const qData = await qRes.json();
        if (qData.success) {
          setQuestions(qData.data.questions);
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

  function setAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
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
    setActiveSet(null);
    setQuestions([]);
    setAnswers({});
    setFlagged(new Set());
    setAttemptId("");
    setResult(null);
    setTestStarted(false);
    setTimeLeft(0);
    setCurrentSection(0);
    setCurrentQuestion(0);
  }

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Get questions for current section
  const sectionQuestions = useMemo(
    () => questions.filter((q) => q.section === SECTIONS[currentSection]),
    [questions, currentSection]
  );
  const currentQ = sectionQuestions[currentQuestion];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-slate-500">Loading practice tests...</p>
      </div>
    );
  }

  // RESULT SCREEN
  if (result) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <h1 className="text-3xl font-bold text-green-700 mb-2">Test Complete — AI Evaluation</h1>
          <p className="text-slate-500 mb-6">Your test has been evaluated by AI agents</p>

          {/* Overall Score */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Overall Band</p>
              <p className="text-5xl font-bold text-blue-700">{result.overall}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Confidence</p>
              <p className="text-3xl font-bold text-slate-700">{Math.round(result.confidence * 100)}%</p>
              <p className="text-xs text-slate-400">{result.confidenceLevel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Provider</p>
              <p className="text-lg font-bold text-slate-700">{result.providerUsed}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 text-center">
              <p className="text-sm font-medium text-slate-500">Review</p>
              <p className="text-lg font-bold text-slate-700 capitalize">{result.reviewRecommendation}</p>
            </div>
          </div>

          {/* Section Scores */}
          <h2 className="text-xl font-bold mb-4">Section Scores</h2>
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Listening</p><p className="text-3xl font-bold">{result.listening}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Reading</p><p className="text-3xl font-bold">{result.reading}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Writing</p><p className="text-3xl font-bold">{result.writing}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Speaking</p><p className="text-3xl font-bold">{result.speaking}</p></div>
          </div>

          {/* Writing Feedback */}
          {result.writingEvaluation && (
            <div className="mb-6 rounded-xl border p-6">
              <h3 className="font-semibold mb-2">Writing Feedback (AI Agent)</h3>
              <p className="text-sm text-slate-600 mb-2">Word count: {result.writingEvaluation.wordCount} / Target: {result.writingEvaluation.targetWordCount}</p>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Task Achievement</p><p className="font-bold">{result.writingEvaluation.taskAchievement}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Coherence</p><p className="font-bold">{result.writingEvaluation.coherence}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Lexical</p><p className="font-bold">{result.writingEvaluation.lexical}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Grammar</p><p className="font-bold">{result.writingEvaluation.grammar}</p></div>
              </div>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.writingEvaluation.improvementPlan?.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Speaking Feedback */}
          {result.speakingEvaluation && (
            <div className="mb-6 rounded-xl border p-6">
              <h3 className="font-semibold mb-2">Speaking Feedback (AI Agent)</h3>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Fluency</p><p className="font-bold">{result.speakingEvaluation.fluency}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Pronunciation</p><p className="font-bold">{result.speakingEvaluation.pronunciation}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Grammar</p><p className="font-bold">{result.speakingEvaluation.grammar}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Lexical</p><p className="font-bold">{result.speakingEvaluation.lexical}</p></div>
                <div className="rounded border p-2 text-center"><p className="text-xs text-slate-400">Coherence</p><p className="font-bold">{result.speakingEvaluation.coherence}</p></div>
              </div>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.speakingEvaluation.improvementTips?.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

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
              <p className="text-xs text-slate-500">Attempt: {attemptId.slice(-8)} · {answeredInSection}/{sectionQuestions.length} answered in section</p>
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
              {SECTIONS.map((section, i) => {
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

            {/* Passage (if reading/listening) */}
            {currentQ.passage && (
              <div className="mb-4 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="mb-2 font-semibold text-slate-700">
                  {currentQ.section === "LISTENING" ? "Audio Transcript:" : "Reading Passage:"}
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
              ) : currentSection < SECTIONS.length - 1 ? (
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
                  <Check className="h-4 w-4" /> {submitting ? "AI evaluating..." : "Submit Test"}
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
