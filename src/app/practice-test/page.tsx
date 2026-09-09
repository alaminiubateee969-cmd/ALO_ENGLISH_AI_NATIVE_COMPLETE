"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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

export default function PracticeTestPage() {
  const router = useRouter();
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Test state
  const [activeSet, setActiveSet] = useState<PracticeSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);

  // Fetch exam types
  useEffect(() => {
    fetch("/api/exam-types")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setExamTypes(data.data.examTypes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch practice sets when exam selected
  useEffect(() => {
    if (!selectedExam) return;
    fetch(`/api/practice-sets?examTypeId=${selectedExam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPracticeSets(data.data.practiceSets);
      })
      .catch(() => {});
  }, [selectedExam]);

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

  // Start test
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

  // Submit test
  const submitTest = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError("");
    try {
      // Gather answers by section
      const writingAnswers = questions
        .filter((q) => q.section === "WRITING" && answers[q.id])
        .map((q) => answers[q.id])
        .join("\n\n");
      const speakingAnswers = questions
        .filter((q) => q.section === "SPEAKING" && answers[q.id])
        .map((q) => answers[q.id])
        .join("\n\n");
      const objectiveQuestions = questions.filter(
        (q) => q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE" || q.type === "FILL_BLANK"
      );
      const correctCount = objectiveQuestions.filter((q) => {
        const userAns = answers[q.id]?.trim().toLowerCase();
        let correct = false;
        if (q.options) {
          const options = JSON.parse(q.options);
          const userIndex = parseInt(userAns || "0");
          correct = userAns === q.id; // Will compare on server
        }
        return userAns && userAns.length > 0;
      }).length;

      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: {
            writing: writingAnswers,
            speaking: speakingAnswers,
            objectiveAnswers: answers,
            readingCorrect: correctCount,
            readingTotal: objectiveQuestions.length,
            listeningCorrect: correctCount,
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

  function setAnswer(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function reset() {
    setActiveSet(null);
    setQuestions([]);
    setAnswers({});
    setAttemptId("");
    setResult(null);
    setTestStarted(false);
    setTimeLeft(0);
    setCurrentSection(0);
  }

  function formatTime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

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
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-2xl font-bold text-green-700 mb-4">✓ Test Submitted — AI Evaluation Complete</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-slate-500">Overall Band</p>
              <p className="text-3xl font-bold text-blue-700">{result.overall}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-slate-500">Confidence</p>
              <p className="text-3xl font-bold text-blue-700">{Math.round(result.confidence * 100)}%</p>
              <p className="text-xs text-slate-400">{result.confidenceLevel}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-slate-500">Provider</p>
              <p className="text-lg font-bold text-slate-700">{result.providerUsed}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm text-slate-500">Review</p>
              <p className="text-lg font-bold text-slate-700">{result.reviewRecommendation}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Listening</p><p className="text-2xl font-bold">{result.listening}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Reading</p><p className="text-2xl font-bold">{result.reading}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Writing</p><p className="text-2xl font-bold">{result.writing}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Speaking</p><p className="text-2xl font-bold">{result.speaking}</p></div>
          </div>

          {result.writingEvaluation?.improvementPlan && (
            <div className="mb-4 rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Writing Feedback (AI Agent)</h3>
              <p className="text-sm text-slate-600 mb-1">Word count: {result.writingEvaluation.wordCount} / Target: {result.writingEvaluation.targetWordCount}</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.writingEvaluation.improvementPlan.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {result.speakingEvaluation?.improvementTips && (
            <div className="mb-4 rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Speaking Feedback (AI Agent)</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.speakingEvaluation.improvementTips.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400 mb-4">{result.disclosureText}</p>
          <button onClick={reset} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  // TEST-TAKING SCREEN
  if (activeSet && testStarted) {
    const sections = ["LISTENING", "READING", "WRITING", "SPEAKING"];
    const currentSectionName = sections[currentSection];
    const sectionQuestions = questions.filter((q) => q.section === currentSectionName);
    const answeredCount = questions.filter((q) => answers[q.id]).length;

    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h1 className="text-xl font-bold">{activeSet.title}</h1>
            <p className="text-sm text-slate-500">Attempt: {attemptId.slice(-8)} · {answeredCount}/{questions.length} answered</p>
          </div>
          <div className={`rounded-lg px-4 py-2 font-mono text-lg font-bold ${timeLeft < 300 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Section tabs */}
        <div className="mb-4 flex gap-2">
          {sections.map((section, i) => {
            const sectionAnswered = questions.filter((q) => q.section === section && answers[q.id]).length;
            const sectionTotal = questions.filter((q) => q.section === section).length;
            return (
              <button
                key={section}
                onClick={() => setCurrentSection(i)}
                className={`flex-1 rounded-lg border p-3 text-sm font-medium ${
                  currentSection === i ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {section}
                <span className="block text-xs text-slate-400">{sectionAnswered}/{sectionTotal}</span>
              </button>
            );
          })}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {sectionQuestions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
              No questions in this section.
            </div>
          ) : (
            sectionQuestions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold">Question {q.order}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{q.type.replace("_", " ")}</span>
                </div>
                <p className="mb-4 text-slate-700">{q.prompt}</p>

                {q.passage && (
                  <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="font-semibold mb-1">Passage:</p>
                    {q.passage}
                  </div>
                )}

                {/* Answer input by type */}
                {(q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") && q.options && (
                  <div className="space-y-2">
                    {JSON.parse(q.options).map((opt: string, idx: number) => (
                      <label key={idx} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-slate-50 ${answers[q.id] === String(idx) ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
                        <input
                          type="radio"
                          name={q.id}
                          value={idx}
                          checked={answers[q.id] === String(idx)}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="font-medium text-slate-700">{String.fromCharCode(65 + idx)}.</span>
                        <span className="text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "FILL_BLANK" && (
                  <input
                    type="text"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === "SHORT_ANSWER" && (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === "ESSAY" && (
                  <div>
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={10}
                      className="w-full rounded-md border border-slate-300 p-3 text-sm"
                      placeholder={`Write your essay here... (minimum ${q.wordLimit || 250} words)`}
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {(answers[q.id] || "").trim().split(/\s+/).filter(Boolean).length} words {q.wordLimit ? `/ ${q.wordLimit} required` : ""}
                    </p>
                  </div>
                )}

                {q.type === "SPEAKING" && (
                  <div>
                    <textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      rows={6}
                      className="w-full rounded-md border border-slate-300 p-3 text-sm"
                      placeholder="Type your speaking response transcript here (or record and paste)..."
                    />
                    <p className="mt-1 text-xs text-slate-400">{(answers[q.id] || "").trim().split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Navigation + Submit */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentSection((s) => Math.max(0, s - 1))}
            disabled={currentSection === 0}
            className="rounded-md border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            ← Previous Section
          </button>
          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection((s) => Math.min(sections.length - 1, s + 1))}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Next Section →
            </button>
          ) : (
            <button
              onClick={submitTest}
              disabled={submitting}
              className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "AI agents evaluating..." : "Submit Test ✓"}
            </button>
          )}
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  // SELECTION SCREEN
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Take a Practice Test</h1>
        <p className="text-slate-600">AI agents will evaluate your writing and speaking responses</p>
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
                <div key={set.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <h3 className="font-semibold">{set.title}</h3>
                    <p className="text-sm text-slate-500">{set.examType.name} · {set.durationMin} minutes</p>
                    {set.description && <p className="text-sm text-slate-400 mt-1">{set.description}</p>}
                  </div>
                  <button
                    onClick={() => startTest(set)}
                    disabled={submitting}
                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Start Test →
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
