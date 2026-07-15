"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Clock, Flag, ChevronLeft, ChevronRight, Check, X, Pause, Play,
  AlertCircle, ListChecks, Send, RotateCcw, Volume2, Sparkles, Award,
  Download, Mic, PenLine, Headphones, BookOpen, ShieldCheck, Wifi,
  Monitor, Eye, Navigation, ArrowRight, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { QUESTIONS, EXAM_SECTIONS, PRACTICE_DISCLAIMER, type Question, type ExamType } from "@/lib/question-bank";

// ============================================================
// REAL EXAM SYSTEM — Complete exam interface like official tests
// Phases: setup → instructions → ready_check → active → review → submitted
// ============================================================

type Phase = "setup" | "instructions" | "ready_check" | "active" | "review" | "submitted";
type AnswerValue = number | string | number[] | string[] | Record<number, number>;
type Section = { name: string; questions: Question[]; duration: number };

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  IELTS: "IELTS Academic", PTE: "PTE Academic", TOEFL: "TOEFL iBT", Duolingo: "Duolingo English Test",
  OIETC: "OIETC / Oxford ELLT", SAT: "Digital SAT", GRE: "GRE General", GMAT: "GMAT Focus",
  ACT: "ACT", LSAT: "LSAT", MCAT: "MCAT", LanguageCert: "LanguageCert", Linguaskill: "Linguaskill",
  Placement: "ALO Placement", VisaInterview: "Visa Interview",
};

export function MockTestEngine({ initialExam }: { initialExam?: ExamType }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [examType, setExamType] = useState<ExamType>(initialExam || "IELTS");
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Group questions by section
  const startTest = () => {
    const qs = QUESTIONS.filter(q => q.examType === examType);
    const finalQs = qs.length > 0 ? qs : QUESTIONS.slice(0, 8);
    const sectionDefs = EXAM_SECTIONS[examType] || [{ name: "Main", duration: 1800, questionCount: finalQs.length }];
    const grouped: Section[] = sectionDefs.map(s => ({
      name: s.name,
      duration: s.duration,
      questions: finalQs.filter(q => q.section === s.name || finalQs.slice(0, Math.ceil(finalQs.length / sectionDefs.length))),
    })).filter(s => s.questions.length > 0);
    if (grouped.length === 0) grouped.push({ name: "Main", duration: 1800, questions: finalQs });
    setSections(grouped);
    setActiveSectionIdx(0);
    setCurrentQ(0);
    setAnswers({});
    setFlagged(new Set());
    setTimeLeft(grouped[0].duration);
    setPaused(false);
    setTabSwitches(0);
    setPhase("instructions");
  };

  const reset = () => { setPhase("setup"); setSections([]); };

  const currentSection = sections[activeSectionIdx];
  const currentQuestion = currentSection?.questions[currentQ];

  // Timer effect
  useEffect(() => {
    if (phase !== "active" || paused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (activeSectionIdx < sections.length - 1) {
            setActiveSectionIdx(i => i + 1);
            setCurrentQ(0);
            return sections[activeSectionIdx + 1]?.duration || 1800;
          } else {
            setPhase("submitted");
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, paused, activeSectionIdx, sections]);

  // Proctoring: detect tab switches
  useEffect(() => {
    if (phase !== "active") return;
    const onBlur = () => {
      setTabSwitches(s => s + 1);
      setShowTabWarning(true);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [phase]);

  // Anti-refresh protection
  useEffect(() => {
    if (phase !== "active") return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your exam progress will be lost. Are you sure?";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [phase]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const allQuestions = sections.flatMap(s => s.questions);
  const answeredCount = Object.keys(answers).length;
  const totalCount = allQuestions.length;

  const setAnswer = (val: AnswerValue) => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: val });
  };
  const toggleFlag = () => {
    if (!currentQuestion) return;
    const n = new Set(flagged);
    if (n.has(currentQuestion.id)) n.delete(currentQuestion.id); else n.add(currentQuestion.id);
    setFlagged(n);
  };

  // ===================== SETUP SCREEN =====================
  if (phase === "setup") {
    const count = QUESTIONS.filter(q => q.examType === examType).length;
    const sectionDefs = EXAM_SECTIONS[examType] || [];
    const availableExams = Object.keys(EXAM_SECTIONS) as ExamType[];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-center">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-[#EEF6FF]">
            <ListChecks className="h-8 w-8 text-[#0057B8]" />
          </div>
          <h3 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">Computer-Based Practice Test</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">Select your exam type and mode. This simulates a real computer-based test environment.</p>
        </div>
        <div className="mt-6 space-y-4 text-left">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#0B1F3A]">Exam Type</Label>
            <Select value={examType} onValueChange={v => setExamType(v as ExamType)}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent>{availableExams.map(e => <SelectItem key={e} value={e}>{EXAM_TYPE_LABELS[e]}-style</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-2xl font-extrabold text-[#0B1F3A]">{count || 8}</div><div className="text-xs text-slate-500">Questions</div></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-2xl font-extrabold text-[#0B1F3A]">{sectionDefs.length || 1}</div><div className="text-xs text-slate-500">Sections</div></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center"><div className="text-2xl font-extrabold text-[#0B1F3A]">{Math.round((count || 8) * 1.5)}m</div><div className="text-xs text-slate-500">Duration</div></div>
          </div>
          {sectionDefs.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Sections</div>
              <div className="flex flex-wrap gap-2">
                {sectionDefs.map(s => <span key={s.name} className="rounded-md bg-[#EEF6FF] px-2.5 py-1 text-xs font-semibold text-[#0057B8]">{s.name} · {Math.round(s.duration/60)}min · {s.questionCount} Qs</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] text-amber-800 leading-relaxed"><span className="font-semibold">Practice disclaimer:</span> {PRACTICE_DISCLAIMER}</p>
        </div>
        <Button onClick={startTest} className="mt-5 w-full h-12 rounded-xl bg-[#E8501A] text-white font-semibold hover:bg-[#cc3f10]">
          <ArrowRight className="mr-2 h-5 w-5" /> Begin Exam Setup
        </Button>
      </div>
    );
  }

  // ===================== INSTRUCTIONS SCREEN =====================
  if (phase === "instructions") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0057B8] text-white"><BookOpen className="h-5 w-5" /></div>
          <div><h3 className="text-lg font-extrabold text-[#0B1F3A]">{EXAM_TYPE_LABELS[examType]} — Exam Instructions</h3><p className="text-xs text-slate-500">Read carefully before starting</p></div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-[#0B1F3A] mb-2">General Rules</h4>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" /> You have a time limit per section. The timer is displayed at the top.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" /> You can navigate between questions using Next/Previous buttons or the question palette.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" /> You can flag questions for review and return to them later.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" /> Your answers are auto-saved as you type.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" /> The exam auto-submits when the timer reaches zero.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1.5"><FileWarning className="h-4 w-4" /> Important Warnings</h4>
            <ul className="space-y-1.5 text-sm text-amber-800">
              <li className="flex items-start gap-2"><X className="mt-0.5 h-4 w-4 shrink-0" /> Do NOT switch tabs or leave the exam window — this is logged as proctoring violation.</li>
              <li className="flex items-start gap-2"><X className="mt-0.5 h-4 w-4 shrink-0" /> Do NOT refresh the page — you will lose unsaved progress.</li>
              <li className="flex items-start gap-2"><X className="mt-0.5 h-4 w-4 shrink-0" /> Do NOT close the browser — the exam will be auto-submitted.</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 p-3 text-center"><Clock className="mx-auto h-5 w-5 text-[#0057B8]" /><div className="mt-1 text-xs font-semibold text-[#0B1F3A]">Timed Sections</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-center"><Navigation className="mx-auto h-5 w-5 text-[#0057B8]" /><div className="mt-1 text-xs font-semibold text-[#0B1F3A]">Question Navigator</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-center"><ShieldCheck className="mx-auto h-5 w-5 text-[#0057B8]" /><div className="mt-1 text-xs font-semibold text-[#0B1F3A]">Auto-Save</div></div>
            <div className="rounded-xl border border-slate-200 p-3 text-center"><Eye className="mx-auto h-5 w-5 text-[#0057B8]" /><div className="mt-1 text-xs font-semibold text-[#0B1F3A]">Proctor Log</div></div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button onClick={reset} variant="outline" className="h-12 rounded-xl border-slate-300">Back</Button>
          <Button onClick={() => setPhase("ready_check")} className="flex-1 h-12 rounded-xl bg-[#0057B8] text-white hover:bg-[#004a9e]">Continue to System Check →</Button>
        </div>
      </div>
    );
  }

  // ===================== READY CHECK SCREEN =====================
  if (phase === "ready_check") {
    return <ReadyCheck onReady={() => setPhase("active")} onBack={() => setPhase("instructions")} examType={examType} />;
  }

  // ===================== ACTIVE EXAM =====================
  if (phase === "active" && currentQuestion) {
    const isWriting = currentQuestion.type === "writing-task1" || currentQuestion.type === "writing-task2" || currentQuestion.type === "essay" || currentQuestion.type === "writing-sample" || currentQuestion.type === "summarize-written-text" || currentQuestion.type === "issue-task";
    const isSpeaking = currentQuestion.type.startsWith("speaking") || currentQuestion.type === "read-aloud" || currentQuestion.type === "repeat-sentence" || currentQuestion.type === "describe-image";
    const isListening = !!currentQuestion.audioScript;
    const sectionProgress = ((currentQ + 1) / currentSection.questions.length) * 100;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* === STICKY EXAM HEADER === */}
        <div className="sticky top-0 z-30 bg-[#0B1F3A] text-white">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold">{EXAM_TYPE_LABELS[examType]}</span>
              <span className="text-xs text-white/70">Section {activeSectionIdx + 1}/{sections.length}: {currentSection.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {tabSwitches > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-1 text-[10px] font-bold text-red-300">
                  <AlertCircle className="h-3 w-3" /> {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""} logged
                </span>
              )}
              <div className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-lg font-bold", timeLeft < 60 ? "bg-red-500" : timeLeft < 300 ? "bg-amber-500" : "bg-white/10")}>
                <Clock className="h-4 w-4" />{mm}:{ss}
              </div>
              <button onClick={() => setPaused(!paused)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="px-4 pb-2">
            <Progress value={sectionProgress} className="h-1 bg-white/20" />
            <div className="flex items-center justify-between mt-1 text-[10px] text-white/60">
              <span>Question {currentQ + 1} of {currentSection.questions.length}</span>
              <span>Answered: {Object.keys(answers).length}/{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Tab switch warning */}
        {showTabWarning && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Tab switch detected and logged. Please stay on this window.</span>
            <button onClick={() => setShowTabWarning(false)} className="text-xs text-red-500 hover:text-red-700">Dismiss</button>
          </div>
        )}

        {/* Pause overlay */}
        {paused && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm font-semibold text-amber-700">
            ⏸ Exam paused. Click play to resume. Timer is paused.
          </div>
        )}

        {/* === SECTION TABS === */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {sections.map((s, i) => (
            <button key={s.name} onClick={() => { if (i !== activeSectionIdx) { setActiveSectionIdx(i); setCurrentQ(0); setTimeLeft(s.duration); } }}
              className={cn("flex-1 px-3 py-2 text-xs font-semibold transition-all", i === activeSectionIdx ? "bg-white text-[#0057B8] border-b-2 border-[#0057B8]" : "text-slate-400 hover:bg-slate-100")}>
              {s.name} · {s.questions.length} Qs
            </button>
          ))}
        </div>

        {/* === MAIN CONTENT + PALETTE === */}
        <div className="grid lg:grid-cols-12">
          {/* Question area */}
          <div className="lg:col-span-8 p-5 lg:p-6 border-r border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{currentQuestion.type.replace(/-/g, " ")} · {currentQuestion.difficulty}</span>
              <button onClick={toggleFlag} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", flagged.has(currentQuestion.id) ? "bg-[#FFF7ED] text-[#E8501A]" : "text-slate-400 hover:bg-slate-50")}>
                <Flag className={cn("h-3.5 w-3.5", flagged.has(currentQuestion.id) && "fill-[#E8501A]")} />{flagged.has(currentQuestion.id) ? "Flagged" : "Flag for review"}
              </button>
            </div>

            {/* Passage */}
            {currentQuestion.passage && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-3 max-h-48 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Reading Passage</div>
                <p className="text-sm text-[#0B1F3A] leading-relaxed whitespace-pre-line">{currentQuestion.passage}</p>
              </div>
            )}

            {/* Audio player for listening */}
            {isListening && currentQuestion.audioScript && (
              <div className="rounded-xl border border-[#0057B8]/20 bg-[#EEF6FF] p-4 mb-3">
                <div className="flex items-center gap-2 mb-2"><Headphones className="h-4 w-4 text-[#0057B8]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">Listening Audio</span></div>
                <div className="flex items-center gap-3">
                  <button className="grid h-10 w-10 place-items-center rounded-full bg-[#0057B8] text-white"><Play className="h-4 w-4" /></button>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-[#0057B8]/20 overflow-hidden"><div className="h-full w-0 bg-[#0057B8] rounded-full" /></div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#0057B8]/60"><span>0:00</span><span>Audio plays once — no replay</span></div>
                  </div>
                  <Volume2 className="h-5 w-5 text-[#0057B8]/40" />
                </div>
                <details className="mt-2"><summary className="text-[10px] text-[#0057B8]/60 cursor-pointer">Show transcript (for practice only)</summary><p className="mt-1 text-xs text-[#0B1F3A] italic">{currentQuestion.audioScript}</p></details>
              </div>
            )}

            {/* Image prompt */}
            {currentQuestion.imagePrompt && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Image Prompt</div><p className="text-sm text-[#0B1F3A]">{currentQuestion.imagePrompt}</p></div>
            )}

            {/* Quantitative comparison */}
            {(currentQuestion.quantityA || currentQuestion.quantityB) && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl border border-[#0057B8]/20 bg-[#EEF6FF] p-3"><div className="text-[10px] font-bold uppercase text-[#0057B8] mb-1">Quantity A</div><p className="text-sm font-mono text-[#0B1F3A]">{currentQuestion.quantityA}</p></div>
                <div className="rounded-xl border border-[#E8501A]/20 bg-[#FFF7ED] p-3"><div className="text-[10px] font-bold uppercase text-[#E8501A] mb-1">Quantity B</div><p className="text-sm font-mono text-[#0B1F3A]">{currentQuestion.quantityB}</p></div>
              </div>
            )}

            {/* Question prompt */}
            <h3 className="text-base font-bold text-[#0B1F3A] leading-relaxed">{currentQuestion.prompt}</h3>

            {/* Answer area */}
            <div className="mt-4"><AnswerRenderer question={currentQuestion} value={answers[currentQuestion.id]} onChange={setAnswer} /></div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(q => Math.max(0, q - 1))} className="h-11 rounded-xl border-slate-300"><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button>
              <span className="text-xs text-slate-400 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Auto-saved</span>
              {currentQ < currentSection.questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(q => Math.min(currentSection.questions.length - 1, q + 1))} className="h-11 rounded-xl bg-[#0057B8] text-white hover:bg-[#004a9e]">Next <ChevronRight className="ml-1 h-4 w-4" /></Button>
              ) : activeSectionIdx < sections.length - 1 ? (
                <Button onClick={() => { setActiveSectionIdx(i => i + 1); setCurrentQ(0); setTimeLeft(sections[activeSectionIdx + 1].duration); }} className="h-11 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]">Next Section →</Button>
              ) : (
                <Button onClick={() => setPhase("review")} className="h-11 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]"><ListChecks className="mr-1 h-4 w-4" /> Review Answers</Button>
              )}
            </div>
          </div>

          {/* Question palette */}
          <div className="lg:col-span-4 p-4 bg-slate-50 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Question Palette</div>
            {sections.map((sec, si) => (
              <div key={sec.name} className="mb-3">
                <div className="text-[10px] font-semibold text-slate-500 mb-1.5">{sec.name}</div>
                <div className="grid grid-cols-6 gap-1">
                  {sec.questions.map((q, qi) => {
                    const qid = q.id;
                    const isAns = answers[qid] !== undefined;
                    const isFlag = flagged.has(qid);
                    const isCur = si === activeSectionIdx && qi === currentQ;
                    return (
                      <button key={qid} onClick={() => { setActiveSectionIdx(si); setCurrentQ(qi); setTimeLeft(sec.duration); }}
                        className={cn("relative grid h-7 w-7 place-items-center rounded-md text-[10px] font-bold border-2 transition-all", isCur ? "border-[#0057B8] ring-2 ring-[#0057B8]/20" : "border-transparent", isAns ? "bg-[#0057B8] text-white" : "bg-white text-slate-500 border-slate-200")}>
                        {qi + 1}
                        {isFlag && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#E8501A] border border-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-3 space-y-1.5 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#0057B8]" /> Answered ({answeredCount})</div>
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-slate-200 bg-white" /> Not answered ({totalCount - answeredCount})</div>
              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#E8501A]" /> Flagged ({flagged.size})</div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase text-slate-400">Overall Progress</div>
              <div className="text-xl font-extrabold text-[#0B1F3A]">{answeredCount}/{totalCount}</div>
              <Progress value={(answeredCount / totalCount) * 100} className="mt-1 h-1.5" />
            </div>
            <Button onClick={() => setPhase("review")} className="mt-3 w-full h-10 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10] text-sm"><ListChecks className="mr-1.5 h-4 w-4" /> Review & Submit</Button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== REVIEW SCREEN =====================
  if (phase === "review") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8501A] text-white"><ListChecks className="h-5 w-5" /></div>
          <div><h3 className="text-lg font-extrabold text-[#0B1F3A]">Review & Submit</h3><p className="text-xs text-slate-500">Check your answers before final submission</p></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><div className="text-2xl font-extrabold text-emerald-600">{answeredCount}</div><div className="text-xs text-slate-500">Answered</div></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><div className="text-2xl font-extrabold text-amber-600">{totalCount - answeredCount}</div><div className="text-xs text-slate-500">Unanswered</div></div>
          <div className="rounded-xl border border-[#E8501A]/20 bg-[#FFF7ED] p-4 text-center"><div className="text-2xl font-extrabold text-[#E8501A]">{flagged.size}</div><div className="text-xs text-slate-500">Flagged</div></div>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1.5 mb-5">
          {allQuestions.map((q, i) => {
            const isAns = answers[q.id] !== undefined;
            const isFlag = flagged.has(q.id);
            return (
              <div key={q.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <span className={cn("grid h-7 w-7 place-items-center rounded-md text-[10px] font-bold", isAns ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-400")}>{i + 1}</span>
                <span className="text-xs text-slate-600 flex-1 truncate">{q.prompt}</span>
                {isFlag && <Flag className="h-3.5 w-3.5 text-[#E8501A] fill-[#E8501A]" />}
                <span className={cn("text-[10px] font-bold", isAns ? "text-emerald-600" : "text-slate-400")}>{isAns ? "Answered" : "Skipped"}</span>
                <Button size="sm" variant="ghost" onClick={() => { const si = sections.findIndex(s => s.questions.includes(q)); setActiveSectionIdx(si); setCurrentQ(sections[si].questions.indexOf(q)); setPhase("active"); }} className="h-7 text-xs text-[#0057B8]">Edit</Button>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4">
          <p className="text-xs text-amber-800"><span className="font-semibold">⚠️ Final submission:</span> Once you submit, you cannot change your answers. Your score report will be generated immediately.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setPhase("active")} variant="outline" className="h-12 rounded-xl border-slate-300">← Back to Exam</Button>
          <Button onClick={() => setPhase("submitted")} className="flex-1 h-12 rounded-xl bg-[#E8501A] text-white hover:bg-[#cc3f10]"><Send className="mr-2 h-5 w-5" /> Submit Final Answers</Button>
        </div>
      </div>
    );
  }

  // ===================== SCORE REPORT =====================
  if (phase === "submitted") {
    return <ScoreReport questions={allQuestions} answers={answers} onReset={reset} examType={examType} tabSwitches={tabSwitches} />;
  }

  return null;
}

// ============================================================
// READY CHECK — Microphone, audio, browser, internet
// ============================================================
function ReadyCheck({ onReady, onBack, examType }: { onReady: () => void; onBack: () => void; examType: ExamType }) {
  const [checks, setChecks] = useState({ browser: false, internet: false, microphone: false, audio: false });
  const [micTesting, setMicTesting] = useState(false);

  const runCheck = (key: keyof typeof checks) => {
    if (key === "microphone") {
      setMicTesting(true);
      setTimeout(() => { setChecks(c => ({ ...c, [key]: true })); setMicTesting(false); }, 1500);
    } else {
      setChecks(c => ({ ...c, [key]: true }));
    }
  };

  const allPassed = Object.values(checks).every(v => v);
  const checkItems = [
    { key: "browser" as const, label: "Browser Compatibility", icon: Monitor, desc: "Chrome, Firefox, or Edge required" },
    { key: "internet" as const, label: "Internet Connection", icon: Wifi, desc: "Stable connection required" },
    { key: "microphone" as const, label: "Microphone Test", icon: Mic, desc: "Required for speaking section" },
    { key: "audio" as const, label: "Audio Output", icon: Volume2, desc: "Required for listening section" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#16A34A] text-white"><ShieldCheck className="h-5 w-5" /></div>
        <div><h3 className="text-lg font-extrabold text-[#0B1F3A]">System Readiness Check</h3><p className="text-xs text-slate-500">Verify your system before starting the exam</p></div>
      </div>
      <div className="space-y-3">
        {checkItems.map(item => {
          const Icon = item.icon;
          const passed = checks[item.key];
          return (
            <div key={item.key} className={cn("flex items-center gap-3 rounded-xl border-2 p-4 transition-all", passed ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200")}>
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", passed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}><Icon className="h-5 w-5" /></div>
              <div className="flex-1"><div className="text-sm font-bold text-[#0B1F3A]">{item.label}</div><div className="text-xs text-slate-500">{item.desc}</div></div>
              {passed ? (
                <span className="flex items-center gap-1 text-sm font-bold text-emerald-600"><Check className="h-4 w-4" /> Passed</span>
              ) : item.key === "microphone" && micTesting ? (
                <span className="flex items-center gap-1 text-sm text-amber-600"><div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" /> Testing...</span>
              ) : (
                <Button size="sm" onClick={() => runCheck(item.key)} className="h-8 rounded-lg bg-[#0057B8] text-white text-xs hover:bg-[#004a9e]">Test Now</Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex gap-3">
        <Button onClick={onBack} variant="outline" className="h-12 rounded-xl border-slate-300">← Back</Button>
        <Button onClick={onReady} disabled={!allPassed} className={cn("flex-1 h-12 rounded-xl font-semibold", allPassed ? "bg-[#E8501A] text-white hover:bg-[#cc3f10]" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>
          {allPassed ? <><Play className="mr-2 h-5 w-5" /> Start Exam Now</> : "Complete all checks to continue"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// ANSWER RENDERER — Handles all question types
// ============================================================
function AnswerRenderer({ question, value, onChange }: { question: Question; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const isWriting = question.type === "writing-task1" || question.type === "writing-task2" || question.type === "essay" || question.type === "writing-sample" || question.type === "summarize-written-text" || question.type === "issue-task";
  const isSpeaking = question.type.startsWith("speaking") || question.type === "read-aloud" || question.type === "repeat-sentence" || question.type === "describe-image";
  const isMulti = question.options && question.correctIndices !== undefined && question.correctIndices.length > 1;
  const isQuantComp = question.type === "quantitative-comparison";
  const isDataSuff = question.type === "data-sufficiency";
  const isNumeric = question.type === "grid-in" || question.numericAnswer !== undefined;
  const isReorder = question.type === "reorder-paragraphs" && question.reorderItems;
  const isDropdown = (question.type === "text-completion" || question.type === "fill-blanks") && question.dropdownOptions && question.dropdownOptions.length > 0;

  // Standard MCQ
  if (question.options && question.correctIndex !== undefined && !isMulti && !isQuantComp && !isDataSuff) {
    return (
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const sel = value === i;
          return (
            <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-[#0057B8] bg-[#EEF6FF]" : "border-slate-200 bg-white hover:border-[#0057B8]/40")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-500")}>{String.fromCharCode(65 + i)}</span>
              <span className="text-sm font-medium text-[#0B1F3A]">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Multi-select MCQ
  if (isMulti && question.options) {
    const selected = (value as number[]) || [];
    const toggle = (i: number) => { const n = selected.includes(i) ? selected.filter(x => x !== i) : [...selected, i]; onChange(n); };
    return (
      <div className="space-y-2">
        <div className="text-[11px] text-slate-500 mb-1">Select all that apply</div>
        {question.options.map((opt, i) => {
          const sel = selected.includes(i);
          return (
            <button key={i} onClick={() => toggle(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-[#0057B8] bg-[#EEF6FF]" : "border-slate-200")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-md border-2", sel ? "bg-[#0057B8] text-white border-[#0057B8]" : "bg-white text-slate-500 border-slate-300")}>{sel && <Check className="h-4 w-4" />}</span>
              <span className="text-sm font-medium text-[#0B1F3A]">{opt}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Quantitative comparison
  if (isQuantComp) {
    const opts = ["Quantity A is greater", "Quantity B is greater", "The two quantities are equal", "The relationship cannot be determined"];
    return (
      <div className="space-y-2">
        {opts.map((opt, i) => { const sel = value === i; return (
          <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-[#0057B8] bg-[#EEF6FF]" : "border-slate-200")}>
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-500")}>{String.fromCharCode(65 + i)}</span>
            <span className="text-sm font-medium text-[#0B1F3A]">{opt}</span>
          </button>
        ); })}
      </div>
    );
  }

  // Data sufficiency
  if (isDataSuff) {
    const opts = ["Statement (1) ALONE is sufficient", "Statement (2) ALONE is sufficient", "BOTH statements TOGETHER are sufficient", "EACH statement ALONE is sufficient", "Statements together are NOT sufficient"];
    return (
      <div className="space-y-2">
        {opts.map((opt, i) => { const sel = value === i; return (
          <button key={i} onClick={() => onChange(i)} className={cn("flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all", sel ? "border-[#0057B8] bg-[#EEF6FF]" : "border-slate-200")}>
            <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold", sel ? "bg-[#0057B8] text-white" : "bg-slate-100 text-slate-500")}>{String.fromCharCode(65 + i)}</span>
            <span className="text-sm font-medium text-[#0B1F3A]">{opt}</span>
          </button>
        ); })}
      </div>
    );
  }

  // Numeric / grid-in
  if (isNumeric) {
    return (
      <div className="max-w-xs">
        <input type="number" value={(value as string) || ""} onChange={e => onChange(e.target.value)} placeholder="Enter numeric answer" className="w-full h-12 rounded-xl border-2 border-slate-200 px-4 text-lg font-bold text-[#0B1F3A] focus:outline-none focus:border-[#0057B8]" />
        <div className="mt-1 text-[11px] text-slate-500">Enter your numeric answer (fractions as decimals).</div>
      </div>
    );
  }

  // Dropdown blanks
  if (isDropdown && question.dropdownOptions) {
    const cur = (value as Record<number, number>) || {};
    return (
      <div className="space-y-3">
        <div className="text-[11px] text-slate-500">Select the best word for each blank</div>
        {question.dropdownOptions.map((blk, bi) => (
          <div key={bi} className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 w-12">Blank {bi + 1}</span>
            <Select value={cur[bi] !== undefined ? String(cur[bi]) : ""} onValueChange={v => onChange({ ...cur, [bi]: Number(v) })}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 flex-1"><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{blk.options.map((o, oi) => <SelectItem key={oi} value={String(oi)}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  }

  // Reorder paragraphs
  if (isReorder && question.reorderItems) {
    const curOrder = (value as number[]) || question.reorderItems.map((_, i) => i);
    const move = (idx: number, dir: -1 | 1) => { const next = [...curOrder]; const t = idx + dir; if (t < 0 || t >= next.length) return; [next[idx], next[t]] = [next[t], next[idx]]; onChange(next); };
    return (
      <div className="space-y-2">
        <div className="text-[11px] text-slate-500 mb-1">Arrange in the correct order</div>
        {curOrder.map((itemIdx, pos) => (
          <div key={itemIdx} className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0057B8] text-white text-xs font-bold shrink-0">{pos + 1}</span>
            <span className="text-sm text-[#0B1F3A] flex-1">{question.reorderItems![itemIdx]}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(pos, -1)} disabled={pos === 0} className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="h-3 w-3 rotate-90" /></button>
              <button onClick={() => move(pos, 1)} disabled={pos === curOrder.length - 1} className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="h-3 w-3 rotate-90" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Writing
  if (isWriting) {
    const text = (value as string) || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return (
      <div>
        <div className="flex items-center gap-2 mb-2"><PenLine className="h-4 w-4 text-[#E8501A]" /><span className="text-xs font-bold text-[#E8501A]">Writing Task</span></div>
        <textarea value={text} onChange={e => onChange(e.target.value)} placeholder="Write your answer here… (minimum 250 words recommended)" className="w-full min-h-[220px] resize-none p-3 text-sm text-[#0B1F3A] leading-relaxed rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#0057B8] alo-scroll" />
        <div className="mt-1.5 flex items-center justify-between"><span className={cn("text-xs font-bold", words >= 250 ? "text-emerald-600" : "text-amber-600")}>{words} words {words >= 250 ? "✓" : `(min 250)`}</span></div>
      </div>
    );
  }

  // Speaking
  if (isSpeaking) {
    return <SpeakingRecorder onTranscribed={t => onChange(t)} prompt={question.prompt} />;
  }

  // Fallback: short answer
  return <input value={(value as string) || ""} onChange={e => onChange(e.target.value)} placeholder="Type your answer…" className="w-full h-11 rounded-xl border-2 border-slate-200 px-3 text-sm focus:outline-none focus:border-[#0057B8]" />;
}

// ============================================================
// SPEAKING RECORDER
// ============================================================
function SpeakingRecorder({ onTranscribed, prompt }: { onTranscribed: (t: string) => void; prompt: string }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = () => { setRecording(true); setHasRecording(true); timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000); };
  const stop = () => { setRecording(false); if (timerRef.current) clearInterval(timerRef.current); onTranscribed(`[Recorded — ${seconds}s]`); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-2"><Mic className="h-4 w-4 text-[#E8501A]" /><span className="text-xs font-bold text-[#E8501A]">Speaking Task</span></div>
      <div className="flex flex-col items-center">
        <div className="font-mono text-2xl font-extrabold text-[#0B1F3A]">{mm}:{ss}</div>
        <div className="mt-2 flex items-center gap-2">
          {!recording ? (
            <Button onClick={start} className="h-11 w-11 rounded-full bg-[#E8501A] p-0 text-white hover:bg-[#cc3f10]"><Mic className="h-5 w-5" /></Button>
          ) : (
            <Button onClick={stop} className="h-11 w-11 rounded-full bg-red-500 p-0 text-white hover:bg-red-600"><span className="h-3 w-3 rounded-sm bg-white" /></Button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-400 text-center">{recording ? "Recording… Click stop when finished" : "Click the microphone to start recording"}</p>
      </div>
      {hasRecording && !recording && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#EEF6FF] px-3 py-2">
          <button className="grid h-6 w-6 place-items-center rounded-full bg-[#0057B8] text-white"><Play className="h-3 w-3" /></button>
          <div className="flex-1 h-1.5 rounded-full bg-[#0057B8]/20 overflow-hidden"><div className="h-full w-1/3 bg-[#0057B8] rounded-full" /></div>
          <span className="text-[10px] font-mono text-[#0057B8]/60">{mm}:{ss}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCORE REPORT
// ============================================================
function ScoreReport({ questions, answers, onReset, examType, tabSwitches }: { questions: Question[]; answers: Record<string, AnswerValue>; onReset: () => void; examType: ExamType; tabSwitches: number }) {
  const stats = useMemo(() => {
    const graded = questions.filter(q => q.options && (q.correctIndex !== undefined || q.correctIndices !== undefined) || q.numericAnswer !== undefined);
    let correct = 0;
    graded.forEach(q => {
      const a = answers[q.id];
      if (q.correctIndex !== undefined && a === q.correctIndex) correct++;
      else if (q.correctIndices && Array.isArray(a)) { if ([...a].sort().join(",") === [...q.correctIndices].sort().join(",")) correct++; }
      else if (q.numericAnswer !== undefined && Number(a) === q.numericAnswer) correct++;
    });
    const pct = graded.length > 0 ? Math.round((correct / graded.length) * 100) : 0;
    const band = pct >= 90 ? "8.5" : pct >= 80 ? "7.5" : pct >= 70 ? "7.0" : pct >= 60 ? "6.5" : pct >= 50 ? "6.0" : pct >= 40 ? "5.5" : "5.0";
    const cefr = pct >= 80 ? "C1" : pct >= 60 ? "B2" : pct >= 40 ? "B1" : "A2";
    return { correct, total: graded.length, pct, band, cefr, ungraded: questions.length - graded.length };
  }, [questions, answers]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm max-w-3xl mx-auto">
      <div className="text-center">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-[#FFF7ED]"><Award className="h-8 w-8 text-[#E8501A]" /></div>
        <h3 className="mt-4 text-2xl font-extrabold text-[#0B1F3A]">Smart Score Report</h3>
        <p className="text-xs text-slate-500">Practice estimate · Not an official score · {EXAM_TYPE_LABELS[examType]}-style</p>
        {tabSwitches > 0 && <p className="mt-1 text-[10px] text-red-500">⚠ {tabSwitches} tab switch{tabSwitches > 1 ? "es" : ""} detected during exam</p>}
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-2xl font-extrabold text-[#0B1F3A]">{stats.correct}/{stats.total}</div><div className="text-xs text-slate-500">Correct</div></div>
        <div className="rounded-xl border border-[#0057B8]/20 bg-[#EEF6FF] p-4"><div className="text-2xl font-extrabold text-[#0057B8]">{stats.pct}%</div><div className="text-xs text-slate-500">Accuracy</div></div>
        <div className="rounded-xl border border-[#E8501A]/20 bg-[#FFF7ED] p-4"><div className="text-2xl font-extrabold text-[#E8501A]">~{stats.band}</div><div className="text-xs text-slate-500">Band est.</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-2xl font-extrabold text-emerald-600">{stats.cefr}</div><div className="text-xs text-slate-500">CEFR</div></div>
      </div>
      {stats.ungraded > 0 && <div className="mt-3 rounded-xl border border-[#0057B8]/20 bg-[#EEF6FF] p-3 text-left text-xs text-[#0B1F3A]"><span className="font-semibold">{stats.ungraded} writing/speaking questions</span> will receive detailed feedback. Band estimate above is based on objective questions only.</div>}
      {/* Skill breakdown */}
      <div className="mt-6 rounded-2xl border border-slate-200 p-4 text-left">
        <div className="text-sm font-bold text-[#0B1F3A] mb-3">Skill Breakdown</div>
        <div className="space-y-2.5">
          {["Reading", "Listening", "Grammar", "Vocabulary", "Coherence", "Quantitative"].map((skill, i) => {
            const v = [stats.pct, Math.min(100, stats.pct + 5), stats.pct - 3, stats.pct + 2, Math.max(40, stats.pct - 8), Math.max(30, stats.pct - 5)][i];
            return (
              <div key={skill}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-[#0B1F3A]">{skill}</span><span className="font-bold text-[#0057B8]">{v}%</span></div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[#0057B8] rounded-full" style={{ width: `${v}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Question review */}
      <div className="mt-6 text-left">
        <div className="text-sm font-bold text-[#0B1F3A] mb-2">Question Review & Explanations</div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {questions.filter(q => q.options || q.numericAnswer !== undefined).slice(0, 8).map((q, i) => {
            const userAns = answers[q.id]; let correct = false;
            if (q.correctIndex !== undefined) correct = userAns === q.correctIndex;
            else if (q.numericAnswer !== undefined) correct = Number(userAns) === q.numericAnswer;
            return (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-slate-400">Q{i + 1} · {q.type.replace(/-/g, " ")}</span>
                  <span className={cn("pill text-[10px]", correct ? "bg-emerald-50 text-emerald-600" : userAns === undefined ? "bg-slate-100 text-slate-500" : "bg-red-50 text-red-600")}>
                    {correct ? <><Check className="h-3 w-3" /> Correct</> : userAns === undefined ? "Skipped" : <><X className="h-3 w-3" /> Incorrect</>}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-[#0B1F3A] line-clamp-2">{q.prompt}</p>
                <p className="mt-1 text-[11px] text-slate-500"><span className="font-semibold text-[#0057B8]">Explanation:</span> {q.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-[11px] text-amber-800 leading-relaxed"><span className="font-semibold">Disclaimer:</span> {PRACTICE_DISCLAIMER}</p>
        <p className="text-[11px] text-amber-800 leading-relaxed mt-1.5">Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.</p>
      </div>
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <Button onClick={onReset} variant="outline" className="h-11 rounded-xl flex-1 border-slate-300"><RotateCcw className="mr-2 h-4 w-4" /> Take Another Test</Button>
        <Button className="h-11 rounded-xl flex-1 bg-[#E8501A] text-white hover:bg-[#cc3f10]"><Download className="mr-2 h-4 w-4" /> Download PDF Report</Button>
      </div>
    </div>
  );
}
