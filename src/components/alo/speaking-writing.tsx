"use client";

import { useState, useRef } from "react";
import {
  Mic,
  Play,
  Square,
  Pause,
  PenLine,
  Type,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Volume2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { INTERVIEW_MODES, AI_FEEDBACK_DIMENSIONS } from "@/lib/alo-data";

export function AloSpeakingPractice() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRec = () => {
    setRecording(true);
    setPaused(false);
    setHasRecording(true);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };
  const stopRec = () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const togglePause = () => {
    setPaused((p) => {
      if (!p) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      }
      return !p;
    });
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <section id="speaking" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-alo-blue/8 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - copy + modes */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue">
              <Mic className="h-3.5 w-3.5" />
              ALO Speaking Evaluator
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
              Practice speaking with a digital examiner.
            </h2>
            <p className="mt-4 text-lg text-alo-muted leading-relaxed">
              The ALO Speaking Evaluator and Digital Practice Examiner guide you through
              realistic interview simulations. Get scores for fluency, pronunciation, grammar,
              lexical resource, coherence and confidence — plus improvement tips.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              {INTERVIEW_MODES.map((mode) => (
                <div key={mode.name} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-bold text-alo-navy">{mode.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{mode.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">Honest practice, not deception.</span> Labelled
                "ALO Practice Examiner" and "Digital Evaluation Session". Simulated interview for
                practice only — never an official score or a real human claim.
              </p>
            </div>
          </div>

          {/* Right - recorder UI */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-alo-navy text-white">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-alo-navy">ALO Practice Examiner</div>
                  <div className="text-xs text-slate-500">IELTS Speaking · Part 2 Cue Card</div>
                </div>
              </div>
              <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", recording && !paused ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", recording && !paused ? "bg-red-500 animate-pulse" : "bg-slate-400")} />
                {recording ? (paused ? "Paused" : "Recording") : "Ready"}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cue card</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> 1 min prep · 2 min speak</span>
              </div>
              <p className="text-sm font-medium text-alo-navy leading-relaxed">
                Describe a time when you had to learn a new skill. You should say:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>what the skill was</li>
                <li>why you needed to learn it</li>
                <li>how you learned it</li>
                <li>and explain how you felt about the experience.</li>
              </ul>
            </div>

            {/* Recorder controls */}
            <div className="mt-5 flex flex-col items-center">
              <div className="font-mono text-3xl font-extrabold text-alo-navy">{mm}:{ss}</div>
              <div className="mt-3 flex items-center gap-2">
                {!recording ? (
                  <Button onClick={startRec} className="h-12 w-12 rounded-full bg-alo-orange p-0 text-white hover:bg-[#d2460f]">
                    <Mic className="h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button onClick={togglePause} variant="outline" className="h-10 w-10 rounded-full p-0 border-slate-300">
                      {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button onClick={stopRec} className="h-12 w-12 rounded-full bg-red-500 p-0 text-white hover:bg-red-600">
                      <Square className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <div className="ml-2 h-8 w-8 grid place-items-center rounded-full bg-slate-100">
                  <Volume2 className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                {recording ? "Tap stop when finished" : "Microphone test recommended before recording"}
              </p>
            </div>

            {hasRecording && !recording && (
              <div className="mt-4">
                <div className="flex items-center gap-2 rounded-lg bg-alo-soft-blue px-3 py-2">
                  <button className="grid h-7 w-7 place-items-center rounded-full bg-alo-blue text-white">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex-1 h-1.5 rounded-full bg-alo-blue/20 overflow-hidden">
                    <div className="h-full w-1/3 bg-alo-blue rounded-full" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{mm}:{ss}</span>
                </div>
                <Button
                  onClick={() => setShowFeedback(true)}
                  className="mt-3 w-full h-11 rounded-xl bg-alo-blue text-white font-semibold hover:bg-[#004a9e]"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Smart Score Feedback
                </Button>
              </div>
            )}

            {showFeedback && (
              <div className="mt-4 rounded-2xl border border-alo-blue/20 bg-alo-soft-blue/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin text-alo-blue" />
                  <span className="text-xs font-semibold text-alo-blue">Analyzing your response…</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {AI_FEEDBACK_DIMENSIONS.map((d, i) => {
                    const score = [88, 82, 79, 85, 84, 90][i];
                    return (
                      <div key={d.key} className="rounded-lg bg-white border border-slate-200 p-2.5 text-center">
                        <div className="text-lg font-extrabold text-alo-navy">{score}</div>
                        <div className="text-[10px] font-semibold text-alo-navy">{d.label}</div>
                        <div className="text-[9px] text-slate-400">{d.desc}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Improvement tip</div>
                  <p className="text-xs text-alo-navy leading-relaxed">
                    Strong fluency and confidence. Add more linking words (however, in addition) to
                    improve coherence, and try one or two higher-level vocabulary items for lexical resource.
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Practice estimate · not an official score
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloWritingEvaluation() {
  const [text, setText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const MIN_WORDS = 250;

  return (
    <section id="writing" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - editor */}
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 bg-slate-50">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-alo-orange" />
                  <span className="text-sm font-bold text-alo-navy">Writing Task 2 · Essay</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><Clock className="h-3.5 w-3.5" /> 40:00</span>
                  <span className={cn("font-bold", words >= MIN_WORDS ? "text-emerald-600" : "text-alo-orange")}>{words} words</span>
                </div>
              </div>

              <div className="p-4 border-b border-slate-100 bg-alo-soft-orange/40">
                <div className="text-[11px] font-bold uppercase tracking-wider text-alo-orange mb-1">Prompt</div>
                <p className="text-sm text-alo-navy">
                  Some people believe that university education should be free for everyone.
                  To what extent do you agree or disagree?
                </p>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your essay here… (minimum 250 words)"
                className="w-full min-h-[220px] resize-none p-4 text-sm text-alo-navy leading-relaxed focus:outline-none alo-scroll"
              />

              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Progress value={Math.min(100, (words / MIN_WORDS) * 100)} className="h-1.5 w-24" />
                  <span className="text-xs text-slate-500">{Math.min(100, Math.round((words / MIN_WORDS) * 100))}% of min</span>
                </div>
                <Button
                  onClick={() => setShowFeedback(true)}
                  disabled={words < 20}
                  className="h-9 rounded-lg bg-alo-orange text-white hover:bg-[#d2460f] disabled:opacity-40"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Get Feedback
                </Button>
              </div>
            </div>
            {words < 20 && (
              <p className="mt-2 text-xs text-slate-400">Write at least 20 words to enable feedback.</p>
            )}
          </div>

          {/* Right - copy + feedback */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
              <Type className="h-3.5 w-3.5" />
              Writing Evaluation
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
              Smart feedback on every essay.
            </h2>
            <p className="mt-4 text-lg text-alo-muted leading-relaxed">
              Get band estimates across task achievement, coherence, vocabulary and grammar —
              plus paragraph suggestions and an improvement plan. Supports IELTS Task 1 & 2,
              PTE essay, TOEFL integrated and Duolingo writing sample.
            </p>

            {!showFeedback ? (
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                {[
                  { label: "Task Achievement", desc: "Did you answer the question fully?" },
                  { label: "Coherence & Cohesion", desc: "Logical flow & linking" },
                  { label: "Lexical Resource", desc: "Vocabulary range & precision" },
                  { label: "Grammatical Range", desc: "Structure variety & accuracy" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <CheckCircle2 className="h-4 w-4 text-alo-blue" />
                    <div className="mt-1.5 text-sm font-bold text-alo-navy">{c.label}</div>
                    <div className="text-xs text-slate-500">{c.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-alo-orange/20 bg-alo-soft-orange/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-alo-navy">Estimated band</span>
                  <span className="text-3xl font-extrabold text-alo-orange">6.5</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { l: "Task Achievement", v: 6.5, pct: 72 },
                    { l: "Coherence", v: 7.0, pct: 78 },
                    { l: "Lexical Resource", v: 6.0, pct: 67 },
                    { l: "Grammar", v: 6.5, pct: 72 },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-alo-navy">{s.l}</span>
                        <span className="font-bold text-alo-orange">{s.v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white overflow-hidden">
                        <div className="h-full bg-alo-orange rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-white border border-slate-200 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Feedback</div>
                  <p className="text-xs text-alo-navy leading-relaxed">
                    Clear position taken. Improve paragraph structure with clearer topic sentences.
                    Add 2-3 higher-level vocabulary items and vary sentence types for a higher band.
                  </p>
                </div>
                <p className="mt-2 text-[10px] text-slate-500 text-center">Estimated practice score · not an official exam result</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
