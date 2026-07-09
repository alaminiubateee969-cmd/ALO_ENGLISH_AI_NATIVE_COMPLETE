"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock, Flag, ChevronLeft, ChevronRight, Check, X, Pause, Play, AlertCircle, ListChecks, Send, RotateCcw,
  Mic, Type, Sparkles, CheckCircle2, Volume2, Loader2, PenLine, Headphones, BookOpen, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const EXAM_TABS = [
  { id: "ielts", name: "IELTS", desc: "Academic & UKVI", icon: BookOpen },
  { id: "pte", name: "PTE", desc: "Academic", icon: Headphones },
  { id: "toefl", name: "TOEFL", desc: "iBT", icon: PenLine },
  { id: "duolingo", name: "Duolingo", desc: "English Test", icon: Mic },
  { id: "oietc", name: "OIETC", desc: "Oxford ELLT", icon: BookOpen },
  { id: "oet", name: "OET", desc: "Healthcare", icon: CheckCircle2 },
];

const SAMPLE_QUESTIONS = [
  { id: 1, type: "Multiple Choice · Reading", passage: "The rise of remote work has fundamentally reshaped urban economies. With fewer employees commuting daily, city-centre retail has seen a marked decline, while suburban demand for co-working spaces has surged. Planners now face the challenge of rebalancing infrastructure investment.", prompt: "According to the passage, what is one consequence of the shift to remote work?", options: ["Increased revenue for city-centre retail businesses", "Higher demand for suburban co-working spaces", "A reduction in suburban infrastructure investment", "More daily commuting into city centres"], correct: 1, explanation: "The passage states that 'suburban demand for co-working spaces has surged', making option B correct." },
  { id: 2, type: "True / False / Not Given · Reading", passage: "Coral reefs support roughly 25% of all marine species despite covering less than 1% of the ocean floor. Rising sea temperatures have triggered repeated bleaching events, threatening this biodiversity.", prompt: "Statement: Coral reefs cover more than 1% of the ocean floor.", options: ["True", "False", "Not Given"], correct: 1, explanation: "The passage says reefs cover 'less than 1% of the ocean floor', so the statement is False." },
  { id: 3, type: "Fill in the Blanks · Listening", prompt: "Complete the sentence: The lecturer emphasised that sustainable development requires balancing economic growth with ______ protection.", options: ["environmental", "political", "commercial", "industrial"], correct: 0, explanation: "'Sustainable development' pairs with 'environmental protection' in academic listening contexts." },
  { id: 4, type: "Multiple Choice · Grammar", prompt: "Choose the grammatically correct sentence:", options: ["The data shows that the number of students are increasing.", "The data show that the number of students is increasing.", "The data shows that the number of students were increasing.", "The data show that the number of students are increasing."], correct: 1, explanation: "'Data' (plural) takes 'show'; 'the number of' takes a singular verb 'is increasing'." },
];

const AI_FEEDBACK_DIMENSIONS = [
  { key: "fluency", label: "Fluency" },
  { key: "pronunciation", label: "Pronunciation" },
  { key: "grammar", label: "Grammar" },
  { key: "lexical", label: "Lexical Resource" },
  { key: "coherence", label: "Coherence" },
  { key: "confidence", label: "Confidence" },
];

export function AloLanguagePrep({ onCta }: { onCta: () => void }) {
  const [activeExam, setActiveExam] = useState("ielts");
  return (
    <section id="language-prep" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">English Test Prep</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            Ace your English test with premium practice.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Full mock tests, speaking practice and writing feedback for IELTS, PTE, TOEFL, Duolingo,
            OIETC and OET. ALO Education students get 3 free mock tests.
          </p>
        </div>

        {/* Exam tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {EXAM_TABS.map((e) => (
            <button
              key={e.id}
              onClick={() => setActiveExam(e.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all",
                activeExam === e.id ? "border-transparent bg-alo-blue text-white alo-shadow-sm" : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue"
              )}
            >
              <e.icon className="h-4 w-4" />
              {e.name}
              <span className={cn("text-[10px] hidden sm:inline", activeExam === e.id ? "text-white/70" : "text-alo-faint")}>{e.desc}</span>
            </button>
          ))}
        </div>

        {/* Free quota banner */}
        <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-alo-orange text-white"><GraduationCap className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold text-alo-navy">Free mock test quota</div>
              <div className="text-xs text-alo-muted">ALO Education students get <span className="font-bold text-alo-orange">3 free</span> · new visitors get <span className="font-bold text-alo-orange">1 free</span></div>
            </div>
          </div>
          <Button onClick={onCta} className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]">Verify ALO Student ID</Button>
        </div>

        {/* Mock test + speaking/writing grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <MockTestDemo />
          <SpeakingDemo />
        </div>
        <div className="mt-6">
          <WritingDemo />
        </div>
      </div>
    </section>
  );
}

function MockTestDemo() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(600);
  const [paused, setPaused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || submitted || paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { setSubmitted(true); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, paused, submitted]);

  const question = SAMPLE_QUESTIONS[current];
  const total = SAMPLE_QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const score = submitted ? SAMPLE_QUESTIONS.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0) : 0;

  const reset = () => { setStarted(false); setSubmitted(false); setCurrent(0); setAnswers({}); setFlagged(new Set()); setTimeLeft(600); setPaused(false); };

  if (submitted) {
    const pct = Math.round((score / total) * 100);
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 alo-shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-alo-soft-orange"><ListChecks className="h-7 w-7 text-alo-orange" /></div>
          <h3 className="mt-3 text-xl font-extrabold text-alo-navy">Smart Score Report</h3>
          <p className="text-xs text-alo-faint">practice estimate · not an official score</p>
          <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-2xl font-extrabold text-alo-navy">{score}/{total}</div><div className="text-[10px] text-alo-faint">Correct</div></div>
            <div className="rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-3"><div className="text-2xl font-extrabold text-alo-blue">{pct}%</div><div className="text-[10px] text-alo-faint">Accuracy</div></div>
            <div className="rounded-xl border border-alo-orange/20 bg-alo-soft-orange p-3"><div className="text-2xl font-extrabold text-alo-orange">~7.0</div><div className="text-[10px] text-alo-faint">Band est.</div></div>
          </div>
          <div className="mt-4 w-full text-left space-y-2 max-h-48 overflow-y-auto alo-scroll pr-2">
            {SAMPLE_QUESTIONS.map((q, i) => {
              const userAns = answers[q.id]; const correct = userAns === q.correct;
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-alo-faint">Q{i + 1} · {q.type}</span>
                    <span className={cn("pill text-[10px]", correct ? "bg-emerald-50 text-alo-success" : userAns === undefined ? "bg-slate-100 text-alo-faint" : "bg-red-50 text-alo-danger")}>
                      {correct ? <><Check className="h-3 w-3" /> Correct</> : userAns === undefined ? "Skipped" : <><X className="h-3 w-3" /> Incorrect</>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-alo-navy">{q.prompt}</p>
                  <p className="mt-1 text-[11px] text-alo-faint"><span className="font-semibold text-alo-blue">Explanation:</span> {q.explanation}</p>
                </div>
              );
            })}
          </div>
          <Button onClick={reset} variant="outline" className="mt-4 h-10 rounded-xl border-slate-300"><RotateCcw className="mr-2 h-4 w-4" />Try Again</Button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 alo-shadow-sm h-full flex flex-col items-center justify-center text-center py-10">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-alo-soft-blue"><Clock className="h-7 w-7 text-alo-blue" /></div>
        <h3 className="mt-3 text-xl font-extrabold text-alo-navy">Try the mock test engine</h3>
        <p className="mt-2 text-sm text-alo-faint max-w-xs">Interactive 4-question demo with timer, palette, flag-for-review and instant Smart Score.</p>
        <Button onClick={() => setStarted(true)} className="mt-5 h-12 px-6 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Play className="mr-2 h-4 w-4" />Start Demo</Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white alo-shadow-sm overflow-hidden">
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <span className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-bold text-alo-blue">IELTS-style · Reading</span>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold", timeLeft < 60 ? "bg-red-50 text-alo-danger" : "bg-alo-soft-blue text-alo-blue")}><Clock className="h-4 w-4" />{mm}:{ss}</div>
          <button onClick={() => setPaused((p) => !p)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-50">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
        </div>
      </div>
      <Progress value={(answered / total) * 100} className="h-1 rounded-none" />
      <div className="grid lg:grid-cols-12 gap-0">
        <div className="lg:col-span-8 p-4 sm:p-5 border-r border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-alo-faint">{question.type}</span>
            <button onClick={() => setFlagged((p) => { const n = new Set(p); if (n.has(current)) n.delete(current); else n.add(current); return n; })} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold", flagged.has(current) ? "bg-alo-soft-orange text-alo-orange" : "text-alo-faint hover:bg-slate-50")}>
              <Flag className={cn("h-3.5 w-3.5", flagged.has(current) && "fill-alo-orange")} />{flagged.has(current) ? "Flagged" : "Flag"}
            </button>
          </div>
          {question.passage && (<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Passage</div><p className="text-xs text-alo-navy leading-relaxed">{question.passage}</p></div>)}
          <h3 className="mt-4 text-base font-bold text-alo-navy leading-relaxed">{question.prompt}</h3>
          <div className="mt-4 space-y-2">
            {question.options.map((opt, i) => {
              const sel = answers[question.id] === i;
              return (
                <button key={i} onClick={() => setAnswers((p) => ({ ...p, [question.id]: i }))} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all", sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 bg-white hover:border-alo-blue/40")}>
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", sel ? "bg-alo-blue text-white" : "bg-slate-100 text-alo-faint")}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-sm font-medium text-alo-navy">{opt}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))} className="h-10 rounded-xl border-slate-300"><ChevronLeft className="mr-1 h-4 w-4" />Prev</Button>
            <span className="text-[10px] text-alo-faint flex items-center gap-1"><AlertCircle className="h-3 w-3" />Autosaved</span>
            {current < total - 1 ? (
              <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))} className="h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]">Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={() => setSubmitted(true)} className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Send className="mr-1 h-4 w-4" />Submit</Button>
            )}
          </div>
        </div>
        <div className="lg:col-span-4 p-4 bg-slate-50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-2">Question Palette</div>
          <div className="grid grid-cols-5 gap-1.5">
            {SAMPLE_QUESTIONS.map((q, i) => {
              const isAns = answers[q.id] !== undefined; const isCur = i === current;
              return (
                <button key={q.id} onClick={() => setCurrent(i)} className={cn("relative grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold border-2", isCur ? "border-alo-blue ring-2 ring-alo-blue/20" : "border-transparent", isAns ? "bg-alo-blue text-white" : "bg-white text-alo-faint border-slate-200")}>
                  {i + 1}
                  {flagged.has(i) && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-alo-orange border border-white" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint">Progress</div>
            <div className="text-xl font-extrabold text-alo-navy">{answered}/{total}</div>
            <Progress value={(answered / total) * 100} className="mt-1.5 h-1.5" />
          </div>
          <Button onClick={() => setSubmitted(true)} className="mt-3 w-full h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10] text-sm"><Send className="mr-1.5 h-4 w-4" />Submit Test</Button>
          <button onClick={reset} className="mt-2 w-full text-center text-[11px] text-alo-faint hover:text-alo-muted">Exit demo</button>
        </div>
      </div>
    </div>
  );
}

function SpeakingDemo() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRec = () => { setRecording(true); setPaused(false); setHasRecording(true); timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); };
  const stopRec = () => { setRecording(false); if (timerRef.current) clearInterval(timerRef.current); };
  const togglePause = () => { setPaused((p) => { if (!p) { if (timerRef.current) clearInterval(timerRef.current); } else { timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); } return !p; }); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 alo-shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-navy text-white"><Mic className="h-5 w-5" /></div>
          <div>
            <div className="text-sm font-bold text-alo-navy">ALO Speaking Evaluator</div>
            <div className="text-[11px] text-alo-faint">IELTS Speaking · Part 2 Cue Card</div>
          </div>
        </div>
        <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold", recording && !paused ? "bg-red-50 text-alo-danger" : "bg-slate-100 text-alo-faint")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", recording && !paused ? "bg-alo-danger animate-pulse" : "bg-slate-400")} />
          {recording ? (paused ? "Paused" : "Recording") : "Ready"}
        </span>
      </div>
      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Cue card</div>
        <p className="text-xs font-medium text-alo-navy">Describe a time you learned a new skill. Say what it was, why you needed it, how you learned it, and how you felt.</p>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <div className="font-mono text-2xl font-extrabold text-alo-navy">{mm}:{ss}</div>
        <div className="mt-2 flex items-center gap-2">
          {!recording ? (
            <Button onClick={startRec} className="h-11 w-11 rounded-full bg-alo-orange p-0 text-white hover:bg-[#cc3f10]"><Mic className="h-5 w-5" /></Button>
          ) : (
            <>
              <Button onClick={togglePause} variant="outline" className="h-9 w-9 rounded-full p-0 border-slate-300">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</Button>
              <Button onClick={stopRec} className="h-11 w-11 rounded-full bg-red-500 p-0 text-white hover:bg-red-600"><span className="h-3 w-3 rounded-sm bg-white" /></Button>
            </>
          )}
          <div className="ml-1 h-7 w-7 grid place-items-center rounded-full bg-slate-100"><Volume2 className="h-4 w-4 text-alo-faint" /></div>
        </div>
      </div>
      {hasRecording && !recording && (
        <div className="mt-3">
          <div className="flex items-center gap-2 rounded-lg bg-alo-soft-blue px-3 py-2">
            <button className="grid h-6 w-6 place-items-center rounded-full bg-alo-blue text-white"><Play className="h-3 w-3" /></button>
            <div className="flex-1 h-1.5 rounded-full bg-alo-blue/20 overflow-hidden"><div className="h-full w-1/3 bg-alo-blue rounded-full" /></div>
            <span className="text-[10px] font-mono text-alo-faint">{mm}:{ss}</span>
          </div>
          <Button onClick={() => setShowFeedback(true)} className="mt-2 w-full h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e] text-sm"><Sparkles className="mr-2 h-4 w-4" />Get Smart Score Feedback</Button>
        </div>
      )}
      {showFeedback && (
        <div className="mt-3 rounded-2xl border border-alo-blue/20 bg-alo-soft-blue/50 p-3">
          <div className="flex items-center gap-2 mb-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-alo-blue" /><span className="text-[11px] font-semibold text-alo-blue">Analyzing your response…</span></div>
          <div className="grid grid-cols-3 gap-1.5">
            {AI_FEEDBACK_DIMENSIONS.map((d, i) => {
              const sc = [88, 82, 79, 85, 84, 90][i];
              return (<div key={d.key} className="rounded-lg bg-white border border-slate-200 p-2 text-center"><div className="text-base font-extrabold text-alo-navy">{sc}</div><div className="text-[9px] font-semibold text-alo-navy">{d.label}</div></div>);
            })}
          </div>
          <p className="mt-2 text-[10px] text-alo-faint text-center">Practice estimate · not an official score</p>
        </div>
      )}
    </div>
  );
}

function WritingDemo() {
  const [text, setText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const MIN = 250;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white alo-shadow-sm overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="p-5 border-r border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-orange text-white"><PenLine className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold text-alo-navy">Writing Evaluation</div>
              <div className="text-[11px] text-alo-faint">AI Writing Evaluator · band estimate</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-alo-soft-orange/40 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-alo-orange mb-1">Prompt</div>
            <p className="text-xs text-alo-navy">Some people believe university education should be free for everyone. To what extent do you agree or disagree?</p>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your essay here… (min 250 words)" className="mt-3 w-full min-h-[180px] resize-none p-3 text-sm text-alo-navy leading-relaxed focus:outline-none alo-scroll rounded-xl border border-slate-200" />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Progress value={Math.min(100, (words / MIN) * 100)} className="h-1.5 w-20" />
              <span className="text-[11px] text-alo-faint">{words}/{MIN} words</span>
            </div>
            <Button onClick={() => setShowFeedback(true)} disabled={words < 20} className="h-9 rounded-lg bg-alo-orange text-white hover:bg-[#cc3f10] disabled:opacity-40 text-xs"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Get Feedback</Button>
          </div>
        </div>
        <div className="p-5 bg-slate-50/50">
          {!showFeedback ? (
            <div className="h-full flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider text-alo-faint mb-3">Feedback dimensions</div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {[
                  { l: "Task Achievement", d: "Did you answer fully?" },
                  { l: "Coherence", d: "Logical flow & linking" },
                  { l: "Lexical Resource", d: "Vocabulary range" },
                  { l: "Grammar", d: "Range & accuracy" },
                ].map((c) => (
                  <div key={c.l} className="rounded-xl border border-alo-card bg-white p-3"><CheckCircle2 className="h-4 w-4 text-alo-blue" /><div className="mt-1.5 text-sm font-bold text-alo-navy">{c.l}</div><div className="text-[11px] text-alo-faint">{c.d}</div></div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-alo-faint">Write 20+ words and click Get Feedback.</p>
            </div>
          ) : (
            <div>
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
                    <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-alo-navy">{s.l}</span><span className="font-bold text-alo-orange">{s.v}</span></div>
                    <div className="h-1.5 rounded-full bg-white overflow-hidden"><div className="h-full bg-alo-orange rounded-full" style={{ width: `${s.pct}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-white border border-slate-200 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Feedback</div><p className="text-xs text-alo-navy leading-relaxed">Clear position. Improve paragraph structure with clearer topic sentences. Add 2-3 higher-level vocabulary items and vary sentence types for a higher band.</p></div>
              <p className="mt-2 text-[10px] text-alo-faint text-center">Estimated practice score · not an official exam result</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
