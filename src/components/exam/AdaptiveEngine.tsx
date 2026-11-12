"use client";

/**
 * src/components/exam/AdaptiveEngine.tsx
 *
 * Duolingo-English-Test-practice-style adaptive tracker.
 *
 * The DET adapts question difficulty in real time: a correct answer pulls
 * the next question up a band, a wrong one pulls it down. The platform
 * cannot replicate true computerised-adaptive testing from the client
 * (the correct answers never leave the server), so this component is a
 * *practice* affordance that mirrors the DET's visible behaviour:
 *
 *   - Per-question difficulty label (Easy / Medium / Hard), derived from
 *     surface features of the question (prompt length, passage length,
 *     option count, word target).
 *   - A running "next question" target difficulty that shifts up/down
 *     based on a confidence proxy computed from the candidate's answer
 *     (length relative to the word target, or answer-completeness).
 *   - An estimated score range that narrows as more questions are
 *     answered, using the published DET 10–160 scale (or the matching
 *     scale for the exam family — see examScoreRange).
 *
 * The component is read-only presentation: it takes the questions, the
 * answers map, and the current question id, and renders the panel.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Gauge,
  MinusCircle,
  TrendingUp,
} from "lucide-react";
import {
  answerConfidence,
  estimateQuestionDifficulty,
  examScoreRange,
  longTextWordTargetFallback,
  nextDifficulty,
  narrowScoreRange,
  type Difficulty,
} from "@/lib/exam/band-score";
import { cn } from "@/lib/utils";

type EngineQuestion = {
  id: string;
  section: string;
  type: string;
  prompt: string;
  passage?: string | null;
  options?: string | null;
  wordLimit?: number | null;
  order: number;
};

type AdaptiveEngineProps = {
  questions: EngineQuestion[];
  answers: Record<string, string>;
  currentQuestionId: string;
  examCode: string;
};

const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string }> = {
  EASY: { label: "Easy", color: "text-emerald-700", bg: "bg-emerald-100" },
  MEDIUM: { label: "Medium", color: "text-amber-700", bg: "bg-amber-100" },
  HARD: { label: "Hard", color: "text-rose-700", bg: "bg-rose-100" },
};

/**
 * Tiny pure helper kept in this file to avoid coupling the engine to the
 * practice-test page's question-ui module (which the page already
 * imports). If `longTextWordTarget` is unavailable for some reason, we
 * fall back to a sensible default per type.
 */
function wordTargetFor(q: EngineQuestion): number {
  if (q.wordLimit && q.wordLimit > 0) return q.wordLimit;
  return longTextWordTargetFallback(q.type);
}

export function AdaptiveEngine({
  questions,
  answers,
  currentQuestionId,
  examCode,
}: AdaptiveEngineProps) {
  // ─── Per-question difficulty (static surface-feature estimate) ────────
  const difficulties = useMemo(() => {
    const map = new Map<string, Difficulty>();
    for (const q of questions) {
      map.set(
        q.id,
        estimateQuestionDifficulty({
          prompt: q.prompt,
          passage: q.passage,
          options: q.options,
          wordLimit: q.wordLimit,
        }),
      );
    }
    return map;
  }, [questions]);

  // ─── Confidence history (drives the adaptive shift display) ───────────
  // Re-derive whenever answers change. Each answered question contributes
  // a confidence value; the engine surfaces the *previous* answer's
  // confidence as the basis for the "next question" target.
  const confidenceHistory = useMemo(() => {
    const ordered = [...questions].sort((a, b) => a.order - b.order);
    const history: { id: string; confidence: number; difficulty: Difficulty }[] = [];
    for (const q of ordered) {
      const ans = answers[q.id];
      if (!ans) continue;
      const target = wordTargetFor(q);
      history.push({
        id: q.id,
        confidence: answerConfidence(ans, target),
        difficulty: difficulties.get(q.id) ?? "MEDIUM",
      });
    }
    return history;
  }, [questions, answers, difficulties]);

  // The "next question" target difficulty. Drifts up/down from the
  // candidate's running confidence. Bumped by ±1 per answer using
  // nextDifficulty(); the engine accumulates the shift so the panel shows
  // a smoothed target rather than a per-question toggle.
  const targetDifficulty = useMemo<Difficulty>(() => {
    if (confidenceHistory.length === 0) return "MEDIUM";
    let current: Difficulty = "MEDIUM";
    for (const entry of confidenceHistory) {
      current = nextDifficulty(current, entry.confidence);
    }
    return current;
  }, [confidenceHistory]);

  // The previous answer's confidence — drives the directional arrow.
  const lastEntry = confidenceHistory[confidenceHistory.length - 1] ?? null;
  const lastDirection: "up" | "down" | "steady" =
    lastEntry === null
      ? "steady"
      : lastEntry.confidence > 0.6
        ? "up"
        : lastEntry.confidence < 0.4
          ? "down"
          : "steady";

  // ─── Estimated score range that narrows with completion ───────────────
  const completion = useMemo(() => {
    if (questions.length === 0) return 0;
    return questions.filter((q) => answers[q.id]?.trim()).length / questions.length;
  }, [questions, answers]);

  const correctnessProxy = useMemo(() => {
    // Without the answer key we cannot know correctness. The proxy is the
    // mean confidence — a UI affordance, not a psychometric estimate.
    if (confidenceHistory.length === 0) return 0.5;
    const sum = confidenceHistory.reduce((a, c) => a + c.confidence, 0);
    return sum / confidenceHistory.length;
  }, [confidenceHistory]);

  const baseRange = useMemo(() => examScoreRange(examCode), [examCode]);
  const narrowedRange = useMemo(
    () => narrowScoreRange(baseRange, correctnessProxy, completion),
    [baseRange, correctnessProxy, completion],
  );

  // ─── Live "score tick" so the panel feels responsive ───────────────────
  // Re-render the score number every few seconds while the test is live;
  // purely cosmetic — the underlying computation is already reactive to
  // the answers map.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);
  // Reference `tick` so the linter treats it as used.
  void tick;

  const currentDifficulty = difficulties.get(currentQuestionId) ?? "MEDIUM";
  const currentMeta = DIFFICULTY_META[currentDifficulty];
  const targetMeta = DIFFICULTY_META[targetDifficulty];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Adaptive engine status"
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-fuchsia-600" />
        <h3 className="text-sm font-semibold text-slate-800">Adaptive engine</h3>
        <span className="ml-auto text-[10px] text-slate-400">practice mode</span>
      </div>

      {/* Current question difficulty */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-slate-500">Current question difficulty</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
            currentMeta.bg,
            currentMeta.color,
          )}
        >
          <Gauge className="h-3 w-3" />
          {currentMeta.label}
        </span>
      </div>

      {/* Next-question target */}
      <div className="mb-3">
        <p className="mb-1 text-xs text-slate-500">Next question target</p>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
              targetMeta.bg,
              targetMeta.color,
            )}
          >
            {targetMeta.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            {lastDirection === "up" && <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600" />}
            {lastDirection === "down" && <ArrowDownCircle className="h-3.5 w-3.5 text-rose-600" />}
            {lastDirection === "steady" && <MinusCircle className="h-3.5 w-3.5 text-slate-400" />}
            <span>
              {lastDirection === "up"
                ? "stepping up"
                : lastDirection === "down"
                  ? "stepping down"
                  : "holding"}
            </span>
          </span>
        </div>
      </div>

      {/* Confidence history bar */}
      {confidenceHistory.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs text-slate-500">
            Confidence trail · {confidenceHistory.length} answered
          </p>
          <div className="flex h-2 items-stretch gap-0.5 overflow-hidden rounded-full bg-slate-100">
            {confidenceHistory.map((entry) => {
              const color =
                entry.confidence > 0.6
                  ? "bg-emerald-500"
                  : entry.confidence < 0.4
                    ? "bg-rose-500"
                    : "bg-amber-500";
              return (
                <div
                  key={entry.id}
                  className={cn("flex-1", color)}
                  title={`${entry.id} · ${(entry.confidence * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Estimated score range */}
      <div className="rounded-lg bg-slate-50 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingUp className="h-3.5 w-3.5" />
          Estimated {baseRange.scale} range
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-bold text-slate-900">
            {narrowedRange.min}
          </span>
          <span className="text-slate-400">–</span>
          <span className="font-mono text-lg font-bold text-slate-900">
            {narrowedRange.max}
          </span>
          <span className="ml-auto text-[10px] text-slate-400">
            {Math.round(completion * 100)}% complete
          </span>
        </div>
        {/* Range bar */}
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="absolute h-full rounded-full bg-fuchsia-500 transition-all"
            style={{
              left: `${((narrowedRange.min - baseRange.min) / (baseRange.max - baseRange.min)) * 100}%`,
              width: `${((narrowedRange.max - narrowedRange.min) / (baseRange.max - baseRange.min)) * 100}%`,
            }}
          />
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-snug text-slate-400">
        The adaptive engine is a practice affordance: it estimates a range from the published
        score scale, narrowed by answer completeness. It is not an official score or a
        computerised-adaptive test.
      </p>
    </div>
  );
}

export default AdaptiveEngine;
