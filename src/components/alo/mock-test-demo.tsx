"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Pause,
  Play,
  AlertCircle,
  ListChecks,
  Send,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SAMPLE_QUESTIONS } from "@/lib/alo-data";

export function AloMockTestDemo() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [paused, setPaused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || submitted) return;
    if (paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSubmitted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, paused, submitted]);

  const question = SAMPLE_QUESTIONS[current];
  const total = SAMPLE_QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const reset = () => {
    setStarted(false);
    setSubmitted(false);
    setCurrent(0);
    setAnswers({});
    setFlagged(new Set());
    setTimeLeft(600);
    setPaused(false);
  };

  const score = submitted
    ? SAMPLE_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0)
    : 0;

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-alo-soft-orange">
            <ListChecks className="h-8 w-8 text-alo-orange" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-alo-navy">Practice Report Preview</h3>
          <p className="mt-1 text-sm text-slate-500">Smart Score Engine · practice estimate, not official score</p>

          <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-3xl font-extrabold text-alo-navy">{score}/{total}</div>
              <div className="text-xs text-slate-500 mt-0.5">Correct</div>
            </div>
            <div className="rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-4">
              <div className="text-3xl font-extrabold text-alo-blue">{pct}%</div>
              <div className="text-xs text-slate-500 mt-0.5">Accuracy</div>
            </div>
            <div className="rounded-xl border border-alo-orange/20 bg-alo-soft-orange p-4">
              <div className="text-3xl font-extrabold text-alo-orange">~7.0</div>
              <div className="text-xs text-slate-500 mt-0.5">Band est.</div>
            </div>
          </div>

          <div className="mt-6 w-full text-left space-y-3 max-h-64 overflow-y-auto alo-scroll pr-2">
            {SAMPLE_QUESTIONS.map((q, i) => {
              const userAns = answers[q.id];
              const correct = userAns === q.correct;
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">Q{i + 1} · {q.type}</span>
                    <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", correct ? "bg-emerald-50 text-emerald-600" : userAns === undefined ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-600")}>
                      {correct ? <Check className="h-3 w-3" /> : userAns === undefined ? "Skipped" : <X className="h-3 w-3" />}
                      {correct ? "Correct" : userAns === undefined ? "Skipped" : "Incorrect"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-alo-navy">{q.prompt}</p>
                  <p className="mt-1.5 text-xs text-slate-500"><span className="font-semibold text-alo-blue">Explanation:</span> {q.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
            <Button onClick={reset} variant="outline" className="h-11 rounded-xl flex-1 border-slate-300">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button className="h-11 rounded-xl flex-1 bg-alo-orange text-white hover:bg-[#d2460f]">
              <Send className="mr-2 h-4 w-4" />
              Download Full Report
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center py-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-alo-soft-blue">
            <Clock className="h-8 w-8 text-alo-blue" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-alo-navy">Try the mock test engine</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            A short 4-question interactive demo. Experience the timer, question palette,
            flag-for-review, autosave and instant Smart Score feedback — just like a real attempt.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-md text-left">
            {[
              { icon: Clock, label: "10:00 timer" },
              { icon: Flag, label: "Flag for review" },
              { icon: ListChecks, label: "4 sample Qs" },
            ].map((f) => (
              <div key={f.label} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center">
                <f.icon className="mx-auto h-4 w-4 text-alo-blue" />
                <div className="mt-1 text-[11px] font-medium text-alo-navy">{f.label}</div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => setStarted(true)}
            className="mt-6 h-12 px-8 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Demo Mock Test
          </Button>
          <p className="mt-3 text-[11px] text-slate-400">No login needed for this demo · Practice estimate only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Sticky test header */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-bold text-alo-blue">
              IELTS-style · Reading
            </span>
            <span className="hidden sm:inline text-xs text-slate-500">Question {current + 1} of {total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold", timeLeft < 60 ? "bg-red-50 text-red-600" : "bg-alo-soft-blue text-alo-blue")}>
              <Clock className="h-4 w-4" />
              {mm}:{ss}
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="pause"
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Progress value={progress} className="mt-2.5 h-1.5" />
      </div>

      {paused && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 text-center text-xs font-semibold text-amber-700">
          ⏸ Test paused. Resume to continue the timer.
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-0">
        {/* Question area */}
        <div className="lg:col-span-8 p-4 sm:p-6 lg:p-8 border-r border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{question.type}</span>
            <button
              onClick={() =>
                setFlagged((prev) => {
                  const next = new Set(prev);
                  if (next.has(current)) next.delete(current);
                  else next.add(current);
                  return next;
                })
              }
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold",
                flagged.has(current) ? "bg-alo-soft-orange text-alo-orange" : "text-slate-400 hover:bg-slate-50"
              )}
            >
              <Flag className={cn("h-3.5 w-3.5", flagged.has(current) && "fill-alo-orange")} />
              {flagged.has(current) ? "Flagged" : "Flag for review"}
            </button>
          </div>

          {question.passage && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Passage</div>
              <p className="text-sm text-alo-navy leading-relaxed">{question.passage}</p>
            </div>
          )}

          <h3 className="mt-5 text-lg font-bold text-alo-navy leading-relaxed">{question.prompt}</h3>

          <div className="mt-5 space-y-2.5">
            {question.options.map((opt, i) => {
              const selected = answers[question.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                    selected
                      ? "border-alo-blue bg-alo-soft-blue"
                      : "border-slate-200 bg-white hover:border-alo-blue/40 hover:bg-slate-50"
                  )}
                >
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", selected ? "bg-alo-blue text-white" : "bg-slate-100 text-slate-500")}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-medium text-alo-navy">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              className="h-11 rounded-xl border-slate-300"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Answers autosaved
            </span>
            {current < total - 1 ? (
              <Button
                onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                className="h-11 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setSubmitted(true)}
                className="h-11 rounded-xl bg-alo-orange text-white hover:bg-[#d2460f]"
              >
                <Send className="mr-1 h-4 w-4" />
                Submit Test
              </Button>
            )}
          </div>
        </div>

        {/* Question palette */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-slate-50">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Question Palette</div>
          <div className="grid grid-cols-5 gap-2">
            {SAMPLE_QUESTIONS.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = flagged.has(i);
              const isCurrent = i === current;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "relative grid h-9 w-9 place-items-center rounded-lg text-xs font-bold border-2 transition-all",
                    isCurrent
                      ? "border-alo-blue ring-2 ring-alo-blue/20"
                      : "border-transparent",
                    isAnswered
                      ? "bg-alo-blue text-white"
                      : "bg-white text-slate-500 border-slate-200"
                  )}
                >
                  {i + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-alo-orange border border-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-alo-blue" /> Answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-slate-200 bg-white" /> Not answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-alo-orange" /> Flagged for review</div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progress</div>
            <div className="mt-1.5 text-2xl font-extrabold text-alo-navy">{answered}/{total}</div>
            <Progress value={progress} className="mt-2 h-1.5" />
          </div>

          <Button
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full h-11 rounded-xl bg-alo-orange text-white hover:bg-[#d2460f] font-semibold"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Test
          </Button>
          <button
            onClick={reset}
            className="mt-2 w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            Exit demo
          </button>
        </div>
      </div>
    </div>
  );
}

export function AloMockTestSection({ onStart }: { onStart: () => void }) {
  const features = [
    { icon: Clock, title: "Section & question timer", desc: "Sticky countdown with auto-submit" },
    { icon: ListChecks, title: "Question navigator", desc: "Palette with flag-for-review" },
    { icon: Check, title: "Autosave answers", desc: "Never lose progress on refresh" },
    { icon: Send, title: "Submit confirmation", desc: "Anti-refresh protection built in" },
  ];
  return (
    <section id="mock-tests" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
              ALO Test Engine
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
              A real mock test experience.
            </h2>
            <p className="mt-4 text-lg text-alo-muted leading-relaxed">
              Our exam engine replicates the real test interface — timer, question palette,
              flag-for-review, autosave, audio listening, writing editor with word count and
              speaking recorder. Try the live demo right now.
            </p>

            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-alo-navy">{f.title}</div>
                    <div className="text-xs text-slate-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Supported question types</div>
              <div className="flex flex-wrap gap-1.5">
                {["Multiple choice", "True/False/Not Given", "Matching headings", "Fill in the blanks", "Short answer", "Essay writing", "Audio listening", "Speaking recording", "Image prompt", "Ordering", "Repeat sentence", "Read aloud", "Describe image"].map((q) => (
                  <span key={q} className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600">
                    {q}
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={onStart} className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]">
              <Play className="mr-2 h-4 w-4" />
              Launch Mock Test Demo
            </Button>
          </div>

          <div className="lg:col-span-7">
            <AloMockTestDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
