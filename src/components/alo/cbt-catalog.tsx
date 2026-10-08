"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, Clock, Award, BookOpen, Check, Filter, LayoutGrid, List, Sparkles, ArrowRight, Layers, ShieldCheck, Zap, FileText, BarChart3, Download, Pause, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXAM_MODULES, EXAM_CATEGORIES, CBT_ENGINE_FEATURES, CBT_QUESTION_TYPES, PRACTICE_DISCLAIMER, type ExamCategory, type ExamModule } from "@/lib/exam-catalog";
import type { ExamType } from "@/lib/question-bank";

const ACCENT_MAP = {
  blue: { bg: "bg-alo-blue", soft: "bg-alo-soft-blue", text: "text-alo-blue", border: "border-alo-blue/20" },
  orange: { bg: "bg-alo-orange", soft: "bg-alo-soft-orange", text: "text-alo-orange", border: "border-alo-orange/20" },
  royal: { bg: "bg-alo-royal", soft: "bg-blue-50", text: "text-alo-royal", border: "border-alo-royal/20" },
  green: { bg: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  purple: { bg: "bg-purple-500", soft: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
} as const;

const CATEGORY_ICONS: Record<string, any> = {
  language: BookOpen, plane: Sparkles, building: Layers, shield: ShieldCheck, graduation: Award,
};
const FEATURE_ICONS: Record<string, any> = {
  timer: Clock, palette: LayoutGrid, save: Check, submit: Send, pause: Pause, report: BarChart3, review: FileText, download: Download,
};

export function CbtExamCatalog({ onStartExam }: { onStartExam: (examType: ExamType | null, slug: string) => void }) {
  const [category, setCategory] = useState<ExamCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<ExamModule | null>(null);

  const filtered = useMemo(() => {
    return EXAM_MODULES.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.tagline.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, search]);

  if (selected) {
    return <ExamLanding exam={selected} onBack={() => setSelected(null)} onStart={() => onStartExam(selected.examTypeCode, selected.slug)} />;
  }

  return (
    <section id="computer-based-exams" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Universal Computer-Based Test Engine</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">All computer-based exams. One engine.</h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">From IELTS to MCAT — a flexible CBT engine that runs any exam type with timed sections, question palette, autosave, and a Smart Score Report. Original, exam-aligned practice only.</p>
        </div>

        {/* CBT engine features */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {CBT_ENGINE_FEATURES.map((f) => {
            const Icon = FEATURE_ICONS[f.icon] || Zap;
            return (
              <div key={f.title} className="rounded-2xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                <Icon className="h-4 w-4 text-alo-blue" />
                <div className="mt-1.5 text-sm font-bold text-alo-navy">{f.title}</div>
                <div className="text-[11px] text-alo-faint">{f.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Category filters + search */}
        <div className="mt-10 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory("all")} className={cn("rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all", category === "all" ? "border-transparent bg-alo-navy text-white" : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue")}>
              All ({EXAM_MODULES.length})
            </button>
            {EXAM_CATEGORIES.map((c) => {
              const count = EXAM_MODULES.filter((e) => e.category === c.id).length;
              return (
                <button key={c.id} onClick={() => setCategory(c.id)} className={cn("flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all", category === c.id ? "border-transparent bg-alo-blue text-white" : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue")}>
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-faint" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams…" className="h-10 rounded-xl border-slate-200 pl-9" />
            </div>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button onClick={() => setView("grid")} className={cn("grid h-10 w-10 place-items-center", view === "grid" ? "bg-alo-soft-blue text-alo-blue" : "text-alo-faint hover:bg-slate-50")}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView("list")} className={cn("grid h-10 w-10 place-items-center border-l border-slate-200", view === "list" ? "bg-alo-soft-blue text-alo-blue" : "text-alo-faint hover:bg-slate-50")}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Results */}
        {view === "grid" ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((exam) => {
              const a = ACCENT_MAP[exam.accent];
              return (
                <div key={exam.id} onClick={() => setSelected(exam)} className="group cursor-pointer rounded-2xl border border-alo-card bg-white p-5 transition-all duration-300 alo-shadow-sm hover:alo-shadow-xl hover:-translate-y-1 flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white", a.bg)}><BookOpen className="h-5 w-5" /></div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", a.soft, a.text)}>{exam.badge}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-alo-navy">{exam.name}</h3>
                  <p className="mt-1 text-sm text-alo-faint line-clamp-2 leading-relaxed flex-1">{exam.tagline}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-alo-faint">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration}</span>
                    <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{exam.scale}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn("text-[10px] font-semibold uppercase tracking-wider", a.text)}>{exam.styleLabel}</span>
                    <span className="text-[10px] text-alo-faint">{exam.sections.length} sections</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 space-y-2">
            {filtered.map((exam) => {
              const a = ACCENT_MAP[exam.accent];
              return (
                <div key={exam.id} onClick={() => setSelected(exam)} className="group cursor-pointer flex items-center gap-4 rounded-2xl border border-alo-card bg-white p-4 transition-all alo-shadow-sm hover:alo-shadow-lg">
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white", a.bg)}><BookOpen className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-alo-navy truncate">{exam.name}</h3>
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0", a.soft, a.text)}>{exam.badge}</span>
                    </div>
                    <p className="text-xs text-alo-faint line-clamp-1">{exam.tagline}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-xs text-alo-faint shrink-0">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{exam.duration}</span>
                    <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{exam.scale}</span>
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{exam.sections.length}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-alo-faint group-hover:text-alo-blue shrink-0" />
                </div>
              );
            })}
          </div>
        )}
        {filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Filter className="mx-auto h-8 w-8 text-alo-faint" />
            <p className="mt-2 text-sm text-alo-faint">No exams match your filters. Try a different category or search.</p>
          </div>
        )}

        {/* Question types supported */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-alo-soft-gray p-6 lg:p-8">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange mb-3">26+ Question types supported</div>
          <div className="flex flex-wrap gap-2">
            {CBT_QUESTION_TYPES.map((qt) => (
              <span key={qt} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-alo-navy">{qt}</span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-800 leading-relaxed"><span className="font-semibold">Practice disclaimer:</span> {PRACTICE_DISCLAIMER} ALO Education does not claim official partnership with IELTS, PTE, TOEFL, Duolingo, SAT, GRE, GMAT, LSAT, MCAT, ACT or any official exam provider unless supported by written authorization.</p>
        </div>
      </div>
    </section>
  );
}

function ExamLanding({ exam, onBack, onStart }: { exam: ExamModule; onBack: () => void; onStart: () => void }) {
  const a = ACCENT_MAP[exam.accent];
  const cat = EXAM_CATEGORIES.find((c) => c.id === exam.category);
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="text-sm font-semibold text-alo-blue hover:underline mb-6 inline-flex items-center gap-1">
          <ChevronRight className="h-4 w-4 rotate-180" />Back to all exams
        </button>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", a.soft, a.text)}>{cat?.name}</span>
              <span className="text-xs text-alo-faint">{exam.styleLabel}</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">{exam.name}</h1>
            <p className="mt-3 text-lg text-alo-muted leading-relaxed">{exam.description}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3"><Clock className="h-4 w-4 text-alo-blue" /><div className="mt-1 text-sm font-bold text-alo-navy">{exam.duration}</div><div className="text-[11px] text-alo-faint">Duration</div></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><Award className="h-4 w-4 text-alo-orange" /><div className="mt-1 text-sm font-bold text-alo-navy">{exam.scale}</div><div className="text-[11px] text-alo-faint">Score scale</div></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><Layers className="h-4 w-4 text-alo-royal" /><div className="mt-1 text-sm font-bold text-alo-navy">{exam.sections.length}</div><div className="text-[11px] text-alo-faint">Sections</div></div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button onClick={onStart} className="h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
                <Sparkles className="mr-2 h-4 w-4" />Start {exam.styleLabel.includes("Interview") ? "Practice" : "Mock Test"}
              </Button>
              <Button onClick={onBack} variant="outline" className="h-12 px-6 rounded-xl border-alo-blue/30 text-alo-blue hover:bg-alo-soft-blue">Browse other exams</Button>
            </div>

            {/* Sections */}
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-alo-faint mb-3">Modules & sections</h2>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {exam.sections.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white text-xs font-bold", a.bg)}>{i + 1}</span>
                    <div className="min-w-0"><div className="text-sm font-bold text-alo-navy">{s.name}</div><div className="text-[11px] text-alo-faint">{s.detail}</div></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-alo-faint mb-3">What you get</h2>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {exam.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-alo-navy"><Check className={cn("mt-0.5 h-4 w-4 shrink-0", a.text)} /><span>{h}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <div className={cn("rounded-2xl border-2 p-5", a.border, a.soft)}>
              <div className="flex items-center gap-2">
                <Sparkles className={cn("h-5 w-5", a.text)} />
                <span className="text-sm font-bold text-alo-navy">Free quota applies</span>
              </div>
              <p className="mt-2 text-xs text-alo-navy leading-relaxed">ALO Education students get <span className="font-bold">3 free</span> mock tests across ALL computer-based exams. New visitors get <span className="font-bold">1 free</span>. Quota is shared — using a free IELTS mock counts toward your total.</p>
              <Button onClick={onStart} className="mt-3 w-full h-11 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]">Start now</Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-bold text-alo-navy mb-2">CBT engine features</div>
              <ul className="space-y-2">
                {CBT_ENGINE_FEATURES.slice(0, 5).map((f) => {
                  const Icon = FEATURE_ICONS[f.icon] || Zap;
                  return <li key={f.title} className="flex items-start gap-2 text-xs text-alo-navy"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-alo-blue" /><span><span className="font-semibold">{f.title}</span> — {f.desc}</span></li>;
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-1.5"><ShieldCheck className="h-4 w-4 text-amber-600" /><span className="text-xs font-bold uppercase tracking-wider text-amber-600">Practice disclaimer</span></div>
              <p className="text-[11px] text-amber-800 leading-relaxed">{PRACTICE_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
