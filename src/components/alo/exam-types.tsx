"use client";

import { useState } from "react";
import { Check, ChevronRight, Clock, TrendingUp, Users, Headphones, BookOpen, PenTool, Mic, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXAM_TYPES, type ExamType } from "@/lib/alo-data";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Headphones, BookOpen, PenTool, Mic, Calculator,
};

const ACCENT_MAP = {
  blue: {
    bg: "bg-alo-blue",
    soft: "bg-alo-soft-blue",
    text: "text-alo-blue",
    border: "border-alo-blue/20",
    ring: "ring-alo-blue/20",
  },
  orange: {
    bg: "bg-alo-orange",
    soft: "bg-alo-soft-orange",
    text: "text-alo-orange",
    border: "border-alo-orange/20",
    ring: "ring-alo-orange/20",
  },
  royal: {
    bg: "bg-alo-royal",
    soft: "bg-blue-50",
    text: "text-alo-royal",
    border: "border-alo-royal/20",
    ring: "ring-alo-royal/20",
  },
} as const;

export function AloExamTypes({ onStart }: { onStart: (examId?: string) => void }) {
  const [active, setActive] = useState<ExamType>(EXAM_TYPES[0]);

  return (
    <section id="exams" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
            8 Exam Types
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            One platform. Every major English exam.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            From IELTS to OET — practice authentic, exam-style questions with the ALO
            Smart Score Engine. Pick an exam to see modules, question types and timing.
          </p>
        </div>

        {/* Exam cards grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {EXAM_TYPES.map((exam) => {
            const a = ACCENT_MAP[exam.accent];
            const isActive = active.id === exam.id;
            return (
              <div
                key={exam.id}
                id={`exam-${exam.id}`}
                onClick={() => setActive(exam)}
                className={cn(
                  "group relative cursor-pointer rounded-2xl border bg-white p-5 transition-all duration-300 alo-card-shadow hover:alo-card-shadow-hover",
                  isActive ? `${a.border} ring-2 ${a.ring}` : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white", a.bg)}>
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", a.soft, a.text)}>
                    {exam.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-alo-navy">{exam.name}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>

                <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {exam.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {exam.scale}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(exam);
                      onStart(exam.id);
                    }}
                    className={cn("text-sm font-semibold inline-flex items-center gap-1", a.text)}
                  >
                    Practice now
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <span className="text-[10px] text-slate-400">{exam.sections.length} modules</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active exam detail panel */}
        <ActiveExamPanel exam={active} onStart={() => onStart(active.id)} />
      </div>
    </section>
  );
}

function ActiveExamPanel({ exam, onStart }: { exam: ExamType; onStart: () => void }) {
  const a = ACCENT_MAP[exam.accent];
  return (
    <div className="mt-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 lg:p-8">
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3">
            <div className={cn("grid h-12 w-12 place-items-center rounded-xl text-white", a.bg)}>
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-alo-navy">{exam.name}</h3>
              <p className="text-sm text-slate-500">{exam.tagline}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-alo-muted leading-relaxed">{exam.longDescription}</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Duration</div>
              <div className="text-sm font-bold text-alo-navy mt-0.5">{exam.duration}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Score scale</div>
              <div className="text-sm font-bold text-alo-navy mt-0.5">{exam.scale}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Popularity</div>
              <div className="text-sm font-bold text-alo-navy mt-0.5">{exam.popularity}</div>
            </div>
          </div>

          <Button
            onClick={onStart}
            className={cn("mt-6 h-12 px-6 rounded-xl text-white font-semibold", a.bg, "hover:opacity-90")}
          >
            Start {exam.name} Practice
          </Button>
        </div>

        <div className="lg:col-span-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Modules</h4>
          <div className="space-y-2.5">
            {exam.sections.map((section) => (
              <div key={section.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg", a.soft, a.text)}>
                  {(() => { const Icon = ICON_MAP[section.icon] ?? BookOpen; return <Icon className="h-4 w-4" />; })()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-alo-navy">{section.name}</div>
                  <div className="text-xs text-slate-500">{section.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Highlights</h4>
          <ul className="space-y-2">
            {exam.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-sm text-alo-navy">
                <Check className={cn("mt-0.5 h-4 w-4 shrink-0", a.text)} />
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ul>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2">Question types</h4>
          <div className="flex flex-wrap gap-1.5">
            {exam.questionTypes.slice(0, 6).map((q) => (
              <span key={q} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                {q}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
