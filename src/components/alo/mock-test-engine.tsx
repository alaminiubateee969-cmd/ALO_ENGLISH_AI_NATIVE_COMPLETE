"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Clock, Flag, ChevronLeft, ChevronRight, Check, X, Pause, Play, AlertCircle, ListChecks, Send, RotateCcw, Volume2, Sparkles, Award, Download, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QUESTIONS, EXAM_SECTIONS, PRACTICE_DISCLAIMER, type Question, type ExamType } from "@/lib/question-bank";

type Phase = "setup" | "active" | "submitted";
type AnswerValue = number | string | number[] | string[] | Record<number, number>;

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  IELTS: "IELTS", PTE: "PTE", TOEFL: "TOEFL", Duolingo: "Duolingo", OIETC: "OIETC",
  SAT: "Digital SAT", GRE: "GRE", GMAT: "GMAT", ACT: "ACT", LSAT: "LSAT", MCAT: "MCAT",
  LanguageCert: "LanguageCert", Linguaskill: "Linguaskill", Placement: "Placement", VisaInterview: "Visa Interview",
};

export function MockTestEngine({ initialExam }: { initialExam?: ExamType }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [examType, setExamType] = useState<ExamType>(initialExam || "IELTS");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);

  const startTest = () => {
    const qs = QUESTIONS.filter((q) => q.examType === examType);
    setQuestions(qs.length > 0 ? qs : QUESTIONS.slice(0, 8));
    setTimeLeft(qs.length > 0 ? qs.length * 90 : 720);
    setCurrent(0);
    setAnswers({});
    setFlagged(new Set());
    setPaused(false);
    setPhase("active");
  };

  const reset = () => { setPhase("setup"); };

  if (phase === "submitted") {
    return <ScoreReport questions={questions} answers={answers} onReset={reset} examType={examType} />;
  }
  if (phase === "setup") {
    return <SetupScreen examType={examType} setExamType={setExamType} onStart={startTest} />;
  }
  return (
    <ActiveTest
      questions={questions}
      current={current}
      setCurrent={setCurrent}
      answers={answers}
      setAnswers={setAnswers}
      flagged={flagged}
      setFlagged={setFlagged}
      timeLeft={timeLeft}
      setTimeLeft={setTimeLeft}
      paused={paused}
      setPaused={setPaused}
      onSubmit={() => setPhase("submitted")}
      examType={examType}
    />
  );
}

function SetupScreen({ examType, setExamType, onStart }: { examType: ExamType; setExamType: (e: ExamType) => void; onStart: () => void }) {
  const count = QUESTIONS.filter((q) => q.examType === examType).length;
  const sections = EXAM_SECTIONS[examType] || [];
  const availableExams = Object.keys(EXAM_SECTIONS) as ExamType[];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 alo-shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-alo-soft-blue"><ListChecks className="h-8 w-8 text-alo-blue" /></div>
        <h3 className="mt-4 text-2xl font-extrabold text-alo-navy">Start a timed computer-based practice</h3>
        <p className="mt-2 text-sm text-alo-faint max-w-md">Universal CBT engine — original, exam-aligned practice questions. Timed, autosaved, with a Smart Score Report.</p>
        <div className="mt-6 w-full max-w-sm space-y-3 text-left">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-alo-navy">Exam type</Label>
            <Select value={examType} onValueChange={(v) => setExamType(v as ExamType)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableExams.map((e) => (
                  <SelectItem key={e} value={e}>{EXAM_TYPE_LABELS[e]}-style</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-2xl font-extrabold text-alo-navy">{count || "—"}</div><div className="text-xs text-alo-faint">questions available</div></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-2xl font-extrabold text-alo-navy">{Math.round((count || 8) * 1.5)}m</div><div className="text-xs text-alo-faint">est. duration</div></div>
          </div>
          {sections.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1.5">Sections</div>
              <div className="flex flex-wrap gap-1.5">
                {sections.map((s) => (<span key={s.name} className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-semibold text-alo-blue">{s.name}</span>))}
              </div>
            </div>
          )}
          {count === 0 && <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">No question bank for this exam yet — a sample set will be loaded for the demo.</div>}
        </div>
        <div className="mt-4 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] text-amber-800 leading-relaxed"><span className="font-semibold">Practice disclaimer:</span> {PRACTICE_DISCLAIMER}</p>
          <p className="text-[11px] text-amber-800 leading-relaxed mt-1.5">Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.</p>
        </div>
        <Button onClick={onStart} className="mt-5 h-12 px-8 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]"><Play className="mr-2 h-4 w-4" />Start Practice ({count || 8} Qs)</Button>
      </div>
    </div>
  );
}

function ActiveTest({
  questions, current, setCurrent, answers, setAnswers, flagged, setFlagged,
  timeLeft, setTimeLeft, paused, setPaused, onSubmit, examType,
}: {
  questions: Question[]; current: number; setCurrent: (n: number) => void;
  answers: Record<string, AnswerValue>; setAnswers: (a: Record<string, AnswerValue>) => void;
  flagged: Set<number>; setFlagged: (s: Set<number>) => void;
  timeLeft: number; setTimeLeft: (n: number) => void; paused: boolean; setPaused: (b: boolean) => void;
  onSubmit: () => void; examType: ExamType;
}) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(Math.max(0, timeLeft - 1));
      if (timeLeft <= 1) { onSubmit(); }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, timeLeft, setTimeLeft, onSubmit]);

  const q = questions[current];
  if (!q) return null;
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const setAnswer = (val: AnswerValue) => setAnswers({ ...answers, [q.id]: val });
  const toggleFlag = () => {
    const n = new Set(flagged);
    if (n.has(current)) n.delete(current); else n.add(current);
    setFlagged(n);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white alo-shadow-sm overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-bold text-alo-blue">{EXAM_TYPE_LABELS[examType]}-style · {q.section}</span>
          <span className="hidden sm:inline text-xs text-alo-faint">Question {current + 1} of {total}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold", timeLeft < 60 ? "bg-red-50 text-alo-danger" : "bg-alo-soft-blue text-alo-blue")}>
            <Clock className="h-4 w-4" />{mm}:{ss}
          </div>
          <button onClick={() => setPaused(!paused)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-50">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
        </div>
      </div>
      <Progress value={(answered / total) * 100} className="h-1 rounded-none" />
      {paused && <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-700">⏸ Test paused. Resume to continue the timer.</div>}

      <div className="grid lg:grid-cols-12 gap-0">
        {/* Question */}
        <div className="lg:col-span-8 p-4 sm:p-6 border-r border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-alo-faint">{q.type.replace(/-/g, " ")} · {q.difficulty}</span>
            <button onClick={toggleFlag} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", flagged.has(current) ? "bg-alo-soft-orange text-alo-orange" : "text-alo-faint hover:bg-slate-50")}>
              <Flag className={cn("h-3.5 w-3.5", flagged.has(current) && "fill-alo-orange")} />{flagged.has(current) ? "Flagged" : "Flag"}
            </button>
          </div>
          {q.passage && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-2">Passage (original content)</div>
              <p className="text-sm text-alo-navy leading-relaxed whitespace-pre-line">{q.passage}</p>
            </div>
          )}
          {q.audioScript && (
            <div className="mt-3 rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-4">
              <div className="flex items-center gap-2 mb-2"><Volume2 className="h-4 w-4 text-alo-blue" /><span className="text-[10px] font-bold uppercase tracking-wider text-alo-blue">Listening (audio script preview)</span></div>
              <p className="text-sm text-alo-navy leading-relaxed italic">{q.audioScript}</p>
            </div>
          )}
          {q.imagePrompt && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Image prompt</div>
              <p className="text-sm text-alo-navy">{q.imagePrompt}</p>
            </div>
          )}
          {(q.quantityA || q.quantityB) && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-blue mb-1">Quantity A</div><p className="text-sm text-alo-navy font-mono">{q.quantityA}</p></div>
              <div className="rounded-xl border border-alo-orange/20 bg-alo-soft-orange p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-orange mb-1">Quantity B</div><p className="text-sm text-alo-navy font-mono">{q.quantityB}</p></div>
            </div>
          )}
          <h3 className="mt-4 text-base md:text-lg font-bold text-alo-navy leading-relaxed">{q.prompt}</h3>

          {/* Answer area — universal renderer */}
          <div className="mt-4">
            <AnswerRenderer q={q} value={answers[q.id]} onChange={setAnswer} />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(Math.max(0, current - 1))} className="h-11 rounded-xl border-slate-300"><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
            <span className="text-xs text-alo-faint flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />Autosaved</span>
            {current < total - 1 ? (
              <Button onClick={() => setCurrent(Math.min(total - 1, current + 1))} className="h-11 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]">Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button onClick={onSubmit} className="h-11 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Send className="mr-1 h-4 w-4" />Submit Test</Button>
            )}
          </div>
        </div>

        {/* Palette */}
        <div className="lg:col-span-4 p-4 bg-slate-50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-2">Question Palette</div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((qq, i) => {
              const isAns = answers[qq.id] !== undefined;
              const isCur = i === current;
              return (
                <button key={i} onClick={() => setCurrent(i)} className={cn("relative grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold border-2", isCur ? "border-alo-blue ring-2 ring-alo-blue/20" : "border-transparent", isAns ? "bg-alo-blue text-white" : "bg-white text-alo-faint border-slate-200")}>
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
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-alo-faint">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-alo-blue" />Answered</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-alo-orange" />Flagged</span>
            </div>
          </div>
          <Button onClick={onSubmit} className="mt-3 w-full h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10] text-sm"><Send className="mr-1.5 h-4 w-4" />Submit Test</Button>
        </div>
      </div>
    </div>
  );
}

/* Universal answer renderer — handles all CBT question types */
function AnswerRenderer({ q, value, onChange }: { q: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const isWriting = q.type === "writing-task1" || q.type === "writing-task2" || q.type === "essay" || q.type === "writing-sample" || q.type === "summarize-written-text" || q.type === "issue-task";
  const isSpeaking = q.type.startsWith("speaking") || q.type === "read-aloud" || q.type === "repeat-sentence" || q.type === "describe-image" || q.type === "retell-lecture" || q.type === "summarize-spoken-text";
  const isMultiSelect = q.type === "sentence-equivalence" || (q.options && q.correctIndices !== undefined && q.correctIndices.length > 1);
  const isQuantComp = q.type === "quantitative-comparison";
  const isNumeric = q.type === "grid-in" || q.numericAnswer !== undefined;
  const isReorder = q.type === "reorder-paragraphs" && q.reorderItems;
  const isDropdown = (q.type === "text-completion" || q.type === "fill-blanks") && q.dropdownOptions && q.dropdownOptions.length > 0;
  const isDataSuff = q.type === "data-sufficiency";

  // Standard MCQ (single choice)
  if (q.options && q.correctIndex !== undefined && !isMultiSelect && !isQuantComp && !isDataSuff) {
    return (
      <div className="space-y-2.5">
        {q.options.map((opt, i) => {
          const sel = value === i;
          return (
            <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 bg-white hover:border-alo-blue/40")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-alo-blue text-white" : "bg-slate-100 text-alo-faint")}>{String.fromCharCode(65 + i)}</span>
              <span className="text-sm font-medium text-alo-navy">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Multiple choice (multi-select)
  if (isMultiSelect && q.options) {
    const selected = (value as number[]) || [];
    const toggle = (i: number) => {
      const next = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i];
      onChange(next);
    };
    return (
      <div className="space-y-2.5">
        <div className="text-[11px] text-alo-faint mb-1">Select all that apply</div>
        {q.options.map((opt, i) => {
          const sel = selected.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 bg-white hover:border-alo-blue/40")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold border-2", sel ? "bg-alo-blue text-white border-alo-blue" : "bg-white text-alo-faint border-slate-300")}>{sel && <Check className="h-4 w-4" />}</span>
              <span className="text-sm font-medium text-alo-navy">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Quantitative comparison (A / B / C / D)
  if (isQuantComp) {
    const opts = ["Quantity A is greater", "Quantity B is greater", "The two quantities are equal", "The relationship cannot be determined"];
    return (
      <div className="space-y-2.5">
        {opts.map((opt, i) => {
          const sel = value === i;
          return (
            <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 bg-white hover:border-alo-blue/40")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-alo-blue text-white" : "bg-slate-100 text-alo-faint")}>{String.fromCharCode(65 + i)}</span>
              <span className="text-sm font-medium text-alo-navy">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Data sufficiency (A-E)
  if (isDataSuff) {
    const opts = ["Statement (1) ALONE is sufficient", "Statement (2) ALONE is sufficient", "BOTH statements TOGETHER are sufficient", "EACH statement ALONE is sufficient", "Statements together are NOT sufficient"];
    return (
      <div className="space-y-2.5">
        {opts.map((opt, i) => {
          const sel = value === i;
          return (
            <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200 bg-white hover:border-alo-blue/40")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-alo-blue text-white" : "bg-slate-100 text-alo-faint")}>{String.fromCharCode(65 + i)}</span>
              <span className="text-sm font-medium text-alo-navy">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Numeric / grid-in
  if (isNumeric) {
    return (
      <div className="max-w-xs">
        <input
          type="number"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter numeric answer"
          className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-lg font-bold text-alo-navy focus:outline-none focus:border-alo-blue"
        />
        <div className="mt-1 text-[11px] text-alo-faint">Enter your numeric answer (fractions as decimals).</div>
      </div>
    );
  }

  // Dropdown blanks (text completion / fill-blanks)
  if (isDropdown && q.dropdownOptions) {
    const cur = (value as Record<number, number>) || {};
    return (
      <div className="space-y-3">
        <div className="text-[11px] text-alo-faint">Select the best word for each blank</div>
        {q.dropdownOptions.map((blk, bi) => (
          <div key={bi} className="flex items-center gap-2">
            <span className="text-xs font-bold text-alo-faint w-12">Blank {bi + 1}</span>
            <Select value={cur[bi] !== undefined ? String(cur[bi]) : ""} onValueChange={(v) => onChange({ ...cur, [bi]: Number(v) })}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 flex-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {blk.options.map((o, oi) => <SelectItem key={oi} value={String(oi)}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  }

  // Reorder paragraphs (drag-and-drop style with up/down buttons)
  if (isReorder && q.reorderItems) {
    const curOrder = (value as number[]) || q.reorderItems.map((_, i) => i);
    const move = (idx: number, dir: -1 | 1) => {
      const next = [...curOrder];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return;
      [next[idx], next[target]] = [next[target], next[idx]];
      onChange(next);
    };
    return (
      <div className="space-y-2">
        <div className="text-[11px] text-alo-faint mb-1">Arrange in the correct order (use arrows)</div>
        {curOrder.map((itemIdx, pos) => (
          <div key={itemIdx} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold shrink-0">{pos + 1}</span>
            <span className="text-sm text-alo-navy flex-1">{q.reorderItems![itemIdx]}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(pos, -1)} disabled={pos === 0} className="grid h-5 w-5 place-items-center rounded text-alo-faint hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-3 w-3 rotate-90" /></button>
              <button onClick={() => move(pos, 1)} disabled={pos === curOrder.length - 1} className="grid h-5 w-5 place-items-center rounded text-alo-faint hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-3 w-3 rotate-90" /></button>
            </div>
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>
        ))}
      </div>
    );
  }

  // Writing
  if (isWriting) {
    const text = (value as string) || "";
    return (
      <div>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your answer here…"
          className="w-full min-h-[200px] resize-none p-3 text-sm text-alo-navy leading-relaxed rounded-xl border border-slate-200 focus:outline-none focus:border-alo-blue alo-scroll"
        />
        <div className="mt-1 text-xs text-alo-faint">{text.trim().split(/\s+/).filter(Boolean).length} words</div>
      </div>
    );
  }

  // Speaking
  if (isSpeaking) {
    return <SpeakingRecorder onTranscribed={(t) => onChange(t)} prompt={q.prompt} />;
  }

  // Fallback: short answer text input
  return (
    <input
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type your answer…"
      className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:border-alo-blue"
    />
  );
}

function SpeakingRecorder({ onTranscribed, prompt }: { onTranscribed: (t: string) => void; prompt: string }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => { setRecording(true); timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); };
  const stop = () => { setRecording(false); if (timerRef.current) clearInterval(timerRef.current); onTranscribed(`[Recorded response — ${seconds}s]`); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center">
      <div className="font-mono text-2xl font-extrabold text-alo-navy">{mm}:{ss}</div>
      <div className="mt-2 flex items-center gap-2">
        {!recording ? (
          <Button onClick={start} className="h-11 w-11 rounded-full bg-alo-orange p-0 text-white hover:bg-[#cc3f10]"><Sparkles className="h-5 w-5" /></Button>
        ) : (
          <Button onClick={stop} className="h-11 w-11 rounded-full bg-red-500 p-0 text-white hover:bg-red-600"><span className="h-3 w-3 rounded-sm bg-white" /></Button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-alo-faint text-center">{recording ? "Tap stop when finished" : "Microphone practice — recording saved to your account"}</p>
      {prompt && <p className="mt-2 text-[10px] text-alo-faint text-center max-w-xs italic line-clamp-2">"{prompt}"</p>}
    </div>
  );
}

function ScoreReport({ questions, answers, onReset, examType }: { questions: Question[]; answers: Record<string, AnswerValue>; onReset: () => void; examType: ExamType }) {
  const stats = useMemo(() => {
    const graded = questions.filter((q) => q.options && (q.correctIndex !== undefined || q.correctIndices !== undefined) || q.numericAnswer !== undefined);
    let correct = 0;
    graded.forEach((q) => {
      const a = answers[q.id];
      if (q.correctIndex !== undefined && a === q.correctIndex) correct++;
      else if (q.correctIndices && Array.isArray(a)) {
        const sorted = [...a].sort().join(",");
        const exp = [...q.correctIndices].sort().join(",");
        if (sorted === exp) correct++;
      } else if (q.numericAnswer !== undefined && Number(a) === q.numericAnswer) correct++;
    });
    const attempted = Object.keys(answers).length;
    const pct = graded.length > 0 ? Math.round((correct / graded.length) * 100) : 0;
    const bandEst = pct >= 90 ? "8.5+" : pct >= 80 ? "7.5" : pct >= 70 ? "7.0" : pct >= 60 ? "6.5" : pct >= 50 ? "6.0" : pct >= 40 ? "5.5" : "5.0";
    const cefr = pct >= 80 ? "C1" : pct >= 60 ? "B2" : pct >= 40 ? "B1" : "A2";
    return { correct, total: graded.length, attempted, pct, bandEst, cefr, ungraded: questions.length - graded.length };
  }, [questions, answers]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 alo-shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-alo-soft-orange"><Award className="h-8 w-8 text-alo-orange" /></div>
        <h3 className="mt-4 text-2xl font-extrabold text-alo-navy">Smart Score Report</h3>
        <p className="text-xs text-alo-faint">Practice estimate only · not an official score · {EXAM_TYPE_LABELS[examType]}-style</p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-extrabold text-alo-navy">{stats.correct}/{stats.total}</div><div className="text-xs text-alo-faint">Correct (objective)</div></div>
          <div className="rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-4"><div className="text-2xl font-extrabold text-alo-blue">{stats.pct}%</div><div className="text-xs text-alo-faint">Accuracy</div></div>
          <div className="rounded-xl border border-alo-orange/20 bg-alo-soft-orange p-4"><div className="text-2xl font-extrabold text-alo-orange">~{stats.bandEst}</div><div className="text-xs text-alo-faint">Band estimate</div></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-2xl font-extrabold text-alo-success">{stats.cefr}</div><div className="text-xs text-alo-faint">CEFR estimate</div></div>
        </div>

        {stats.ungraded > 0 && (
          <div className="mt-3 w-full max-w-2xl rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-3 text-left text-xs text-alo-navy">
            <span className="font-semibold">{stats.ungraded} writing/speaking questions</span> will receive detailed feedback from the Smart Score Engine and examiner review. Band estimate above is based on objective questions only.
          </div>
        )}

        {/* Skill breakdown */}
        <div className="mt-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <div className="text-sm font-bold text-alo-navy mb-3">Skill breakdown</div>
          <div className="space-y-2.5">
            {["Reading", "Listening", "Grammar", "Vocabulary", "Coherence", "Quantitative"].map((skill, i) => {
              const v = [stats.pct, Math.min(100, stats.pct + 5), stats.pct - 3, stats.pct + 2, Math.max(40, stats.pct - 8), Math.max(30, stats.pct - 5)][i];
              return (
                <div key={skill}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-alo-navy">{skill}</span><span className="font-bold text-alo-blue">{v}%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-alo-blue rounded-full" style={{ width: `${v}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question review */}
        <div className="mt-6 w-full max-w-2xl text-left">
          <div className="text-sm font-bold text-alo-navy mb-2">Question review & explanations</div>
          <div className="space-y-2 max-h-72 overflow-y-auto alo-scroll pr-2">
            {questions.filter((q) => q.options || q.numericAnswer !== undefined).slice(0, 8).map((q, i) => {
              const userAns = answers[q.id];
              let correct = false;
              if (q.correctIndex !== undefined) correct = userAns === q.correctIndex;
              else if (q.numericAnswer !== undefined) correct = Number(userAns) === q.numericAnswer;
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-alo-faint">Q{i + 1} · {q.type.replace(/-/g, " ")}</span>
                    <span className={cn("pill text-[10px]", correct ? "bg-emerald-50 text-alo-success" : userAns === undefined ? "bg-slate-100 text-alo-faint" : "bg-red-50 text-alo-danger")}>
                      {correct ? <><Check className="h-3 w-3" /> Correct</> : userAns === undefined ? "Skipped" : <><X className="h-3 w-3" /> Incorrect</>}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-alo-navy line-clamp-2">{q.prompt}</p>
                  <p className="mt-1 text-[11px] text-alo-faint"><span className="font-semibold text-alo-blue">Explanation:</span> {q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 w-full max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] text-amber-800 leading-relaxed"><span className="font-semibold">Disclaimer:</span> {PRACTICE_DISCLAIMER}</p>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
          <Button onClick={onReset} variant="outline" className="h-11 rounded-xl flex-1 border-slate-300"><RotateCcw className="mr-2 h-4 w-4" />Try Again</Button>
          <Button className="h-11 rounded-xl flex-1 bg-alo-orange text-white hover:bg-[#cc3f10]"><Download className="mr-2 h-4 w-4" />Download PDF Report</Button>
        </div>
      </div>
    </div>
  );
}
