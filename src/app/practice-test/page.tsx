"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ExamType = { id: string; code: string; name: string; category: string };
type PracticeSet = { id: string; title: string; description: string; durationMin: number; examType: { code: string; name: string } };

export default function PracticeTestPage() {
  const router = useRouter();
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [practiceSets, setPracticeSets] = useState<PracticeSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Test-taking state
  const [activeSet, setActiveSet] = useState<PracticeSet | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [writingText, setWritingText] = useState("");
  const [speakingText, setSpeakingText] = useState("");
  const [readingCorrect, setReadingCorrect] = useState(0);
  const [listeningCorrect, setListeningCorrect] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Fetch exam types on load
  useEffect(() => {
    fetch("/api/exam-types")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setExamTypes(data.data.examTypes);
        else setError(data.message);
      })
      .catch((e) => setError(e.message))
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
      .catch((e) => setError(e.message));
  }, [selectedExam]);

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
      } else {
        setError(data.message || "Failed to start test");
      }
    } catch {
      setError("Network error. Are you logged in?");
      router.push("/login");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitTest() {
    if (!attemptId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: {
            writing: writingText,
            speaking: speakingText,
            readingCorrect,
            readingTotal: 40,
            listeningCorrect,
            listeningTotal: 40,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data.result);
      } else {
        setError(data.message || "Failed to submit test");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setActiveSet(null);
    setAttemptId("");
    setWritingText("");
    setSpeakingText("");
    setReadingCorrect(0);
    setListeningCorrect(0);
    setResult(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-slate-500">Loading practice tests...</p>
      </div>
    );
  }

  if (error && !activeSet) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <p className="mt-2 text-sm text-red-600">Please login first to take practice tests.</p>
          <a href="/login" className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Result Screen */}
      {result && (
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

          {/* Section scores */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Listening</p><p className="text-2xl font-bold">{result.listening}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Reading</p><p className="text-2xl font-bold">{result.reading}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Writing</p><p className="text-2xl font-bold">{result.writing}</p></div>
            <div className="rounded-lg border p-4 text-center"><p className="text-xs text-slate-500">Speaking</p><p className="text-2xl font-bold">{result.speaking}</p></div>
          </div>

          {/* Writing feedback */}
          {result.writingEvaluation && (
            <div className="mb-4 rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Writing Evaluation (AI Agent)</h3>
              <p className="text-sm text-slate-600 mb-2">Word count: {result.writingEvaluation.wordCount} / Target: {result.writingEvaluation.targetWordCount}</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.writingEvaluation.improvementPlan?.map((tip: string, i: number) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Speaking feedback */}
          {result.speakingEvaluation && (
            <div className="mb-4 rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Speaking Evaluation (AI Agent)</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                {result.speakingEvaluation.improvementTips?.map((tip: string, i: number) => (
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
      )}

      {/* Test-taking screen */}
      {activeSet && !result && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{activeSet.title}</h1>
              <p className="text-sm text-slate-500">{activeSet.examType.name} · {activeSet.durationMin} minutes</p>
            </div>
            <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700">
              Attempt: {attemptId.slice(-8)}
            </span>
          </div>

          <div className="space-y-6">
            {/* Writing Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold mb-2">Writing Section</h2>
              <p className="text-sm text-slate-500 mb-3">Write a short essay (150+ words) on the topic below:</p>
              <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm">Topic: "Some people believe that studying abroad is essential for career success. To what extent do you agree or disagree?"</p>
              <textarea
                value={writingText}
                onChange={(e) => setWritingText(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-slate-300 p-3 text-sm"
                placeholder="Write your essay here... (minimum 150 words for full score)"
              />
              <p className="mt-1 text-xs text-slate-400">{writingText.trim().split(/\s+/).filter(Boolean).length} words</p>
            </div>

            {/* Speaking Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold mb-2">Speaking Section</h2>
              <p className="text-sm text-slate-500 mb-3">Type your spoken response transcript below (or record and paste):</p>
              <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm">Question: "Describe a challenge you faced and how you overcame it."</p>
              <textarea
                value={speakingText}
                onChange={(e) => setSpeakingText(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-slate-300 p-3 text-sm"
                placeholder="Type your speaking response transcript..."
              />
            </div>

            {/* Reading + Listening (correct count) */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold mb-2">Reading Section</h2>
                <p className="text-sm text-slate-500 mb-3">How many reading questions did you answer correctly? (out of 40)</p>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={readingCorrect}
                  onChange={(e) => setReadingCorrect(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold mb-2">Listening Section</h2>
                <p className="text-sm text-slate-500 mb-3">How many listening questions did you answer correctly? (out of 40)</p>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={listeningCorrect}
                  onChange={(e) => setListeningCorrect(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                onClick={submitTest}
                disabled={submitting}
                className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "AI agents evaluating..." : "Submit & Get AI Score"}
              </button>
              <button
                onClick={reset}
                className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      )}

      {/* Selection screen */}
      {!activeSet && !result && (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Take a Practice Test</h1>
            <p className="text-slate-600">AI agents will evaluate your writing, speaking, and interview responses</p>
          </div>

          {/* Step 1: Select exam type */}
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

          {/* Step 2: Select practice set */}
          {selectedExam && (
            <div>
              <label className="block text-sm font-medium mb-2">2. Choose a practice set</label>
              {practiceSets.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-slate-500">No practice sets available for this exam type yet.</p>
                  <p className="text-sm text-slate-400 mt-1">The admin can add practice sets via the CRM API.</p>
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

          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
