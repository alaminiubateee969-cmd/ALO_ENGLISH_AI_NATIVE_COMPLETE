"use client";

/**
 * src/app/shortcuts/page.tsx
 *
 * Shortcut Hub — searchable, filterable library of exam-prep tips and
 * techniques. Reads from GET /api/shortcuts. No backend writes; this is
 * a free reference tool.
 *
 * Reference style: IELTS Liz, IELTS Simon, GregMat, College Board SAT guidance.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Lightbulb,
  Loader2,
  Search,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Shortcut = {
  id: string;
  title: string;
  exam: string;
  skill: string;
  description: string;
  example: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  tags: string[];
};

type Facet = { code: string; label: string; count: number };

type ApiResponse = {
  total: number;
  filters: { exam: string; skill: string; difficulty: string; query: string | null };
  facets: { exams: Facet[]; skills: Facet[]; difficulties: Facet[] };
  shortcuts: Shortcut[];
};

const DIFFICULTY_STYLE: Record<Shortcut["difficulty"], string> = {
  BEGINNER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INTERMEDIATE: "bg-amber-50 text-amber-700 border-amber-200",
  ADVANCED: "bg-rose-50 text-rose-700 border-rose-200",
};

const EXAM_STYLE: Record<string, string> = {
  IELTS: "bg-[#EEF6FF] text-[#0057B8] border-[#D9E8FF]",
  TOEFL: "bg-[#EEF6FF] text-[#0057B8] border-[#D9E8FF]",
  PTE: "bg-[#EEF6FF] text-[#0057B8] border-[#D9E8FF]",
  GRE: "bg-violet-50 text-violet-700 border-violet-200",
  GMAT: "bg-violet-50 text-violet-700 border-violet-200",
  SAT: "bg-orange-50 text-orange-700 border-orange-200",
  ACT: "bg-orange-50 text-orange-700 border-orange-200",
  DET: "bg-teal-50 text-teal-700 border-teal-200",
  OET: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CAMBRIDGE: "bg-slate-100 text-slate-700 border-slate-200",
};

const SKILL_STYLE: Record<string, string> = {
  READING: "bg-slate-100 text-slate-700 border-slate-200",
  WRITING: "bg-slate-100 text-slate-700 border-slate-200",
  SPEAKING: "bg-slate-100 text-slate-700 border-slate-200",
  LISTENING: "bg-slate-100 text-slate-700 border-slate-200",
  QUANT: "bg-violet-50 text-violet-700 border-violet-200",
  VERBAL: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function ShortcutsPage() {
  const [exam, setExam] = useState<string>("ALL");
  const [skill, setSkill] = useState<string>("ALL");
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce the free-text query so we don't fire a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  // Re-fetch whenever any filter changes. Dependencies are explicit.
  // setState only fires inside async callbacks (not synchronously in the
  // effect body) so the cascading-render lint rule is satisfied; the
  // initial `loading: true` covers first paint.
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (exam !== "ALL") params.set("exam", exam);
    if (skill !== "ALL") params.set("skill", skill);
    if (difficulty !== "ALL") params.set("difficulty", difficulty);
    if (debouncedQuery) params.set("q", debouncedQuery);
    const qs = params.toString();
    const url = `/api/shortcuts${qs ? `?${qs}` : ""}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((json: ApiResponse) => {
        setData(json);
        setLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Failed to load shortcuts. Please try again.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [exam, skill, difficulty, debouncedQuery]);

  const clearAll = useCallback(() => {
    setExam("ALL");
    setSkill("ALL");
    setDifficulty("ALL");
    setQuery("");
  }, []);

  const hasActiveFilter =
    exam !== "ALL" || skill !== "ALL" || difficulty !== "ALL" || debouncedQuery !== "";

  const exams = useMemo(() => data?.facets.exams ?? [], [data]);
  const skills = useMemo(() => data?.facets.skills ?? [], [data]);
  const difficulties = useMemo(() => data?.facets.difficulties ?? [], [data]);

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="shortcuts-title"
        className="relative isolate overflow-hidden bg-[#F4F8FC]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(circle_at_15%_15%,rgba(0,87,184,0.12),transparent_32%),radial-gradient(circle_at_90%_75%,rgba(232,80,26,0.10),transparent_28%)]"
        />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0057B8]"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to home
          </Link>
          <div className="mt-4 max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-[#0057B8]">
              <Lightbulb className="size-3.5 text-[#C2410C]" aria-hidden="true" />
              Free preparation shortcuts
            </p>
            <h1
              id="shortcuts-title"
              className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0B1F3A] sm:text-4xl lg:text-[2.75rem]"
            >
              Exam-prep shortcuts that actually move your score
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              A working library of techniques for IELTS, TOEFL, PTE, GRE, GMAT, SAT and more —
              organised by skill area, with concrete examples you can apply today. Every shortcut
              was written by hand, not generated as filler.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Target className="size-3.5 text-[#0057B8]" aria-hidden="true" />
                {data?.total ?? 0} shortcuts shown
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-[#0057B8]" aria-hidden="true" />
                Filter by exam, skill, difficulty or keyword
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#C2410C]" aria-hidden="true" />
                Preparation guidance only — not official exam content
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section
        aria-labelledby="filters-title"
        className="border-b border-slate-200 bg-white sticky top-16 z-30"
      >
        <h2 id="filters-title" className="sr-only">
          Filter shortcuts
        </h2>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search techniques, e.g. 'skimming', 'T/F/NG', 'backsolve'…"
                className="pl-9"
                aria-label="Search shortcuts"
              />
            </div>
            <Select value={exam} onValueChange={setExam}>
              <SelectTrigger className="w-full md:w-[160px]" aria-label="Filter by exam">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All exams</SelectItem>
                {exams.map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.label} ({f.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger className="w-full md:w-[160px]" aria-label="Filter by skill">
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All skills</SelectItem>
                {skills.map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.label} ({f.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full md:w-[170px]" aria-label="Filter by difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All levels</SelectItem>
                {difficulties.map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.label} ({f.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="w-full md:w-auto"
              >
                <X className="size-3.5" aria-hidden="true" /> Clear
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {/* Results */}
      <section aria-labelledby="results-title" className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between">
            <h2 id="results-title" className="text-lg font-bold text-[#0B1F3A]">
              {loading ? "Loading…" : `${data?.total ?? 0} shortcut${(data?.total ?? 0) === 1 ? "" : "s"}`}
            </h2>
            <p className="text-xs text-slate-500">
              Click a card to read the worked example.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              {error}
            </div>
          ) : loading && !data ? (
            <div className="mt-8 flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="ml-2 text-sm">Loading shortcuts…</span>
            </div>
          ) : data && data.shortcuts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-[#0B1F3A]">No shortcuts matched.</p>
              <p className="mt-2 text-sm text-slate-600">
                Try clearing one of the filters or using a broader search term.
              </p>
              <Button onClick={clearAll} variant="outline" size="sm" className="mt-4">
                <X className="size-3.5" aria-hidden="true" /> Clear all filters
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.shortcuts.map((s) => (
                <Card
                  key={s.id}
                  className="group flex flex-col gap-3 border-slate-200 p-5 transition-colors hover:border-[#0057B8]/40 hover:shadow-md"
                >
                  <CardHeader className="px-0 pt-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`border ${EXAM_STYLE[s.exam] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
                      >
                        {s.exam}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border ${SKILL_STYLE[s.skill] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
                      >
                        {s.skill.charAt(0) + s.skill.slice(1).toLowerCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`border ${DIFFICULTY_STYLE[s.difficulty]}`}
                      >
                        {s.difficulty.charAt(0) + s.difficulty.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-base font-bold leading-snug text-[#0B1F3A]">
                      {s.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-sm leading-6 text-slate-600">{s.description}</p>
                    <Accordion type="single" collapsible className="mt-3">
                      <AccordionItem value="example" className="border-0">
                        <AccordionTrigger className="py-2 text-xs font-bold uppercase tracking-wide text-[#0057B8] hover:no-underline">
                          <span className="inline-flex items-center gap-1.5">
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                            Worked example
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <p className="rounded-lg bg-[#F4F8FC] p-3 text-xs leading-6 text-slate-700">
                            {s.example}
                          </p>
                          {s.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {s.tags.map((t) => (
                                <span
                                  key={t}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Cross-links */}
          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            <Link
              href="/study-plan"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
            >
              <Target className="size-5 text-[#0057B8]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                Build a study plan
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Generate a day-by-day schedule by exam, target score and test date.
              </p>
            </Link>
            <Link
              href="/sop-studio"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
            >
              <Sparkles className="size-5 text-[#C2410C]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                Write your Statement of Purpose
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Guided SOP writer with templates, tips and word counts for each section.
              </p>
            </Link>
            <Link
              href="/exam-prep"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
            >
              <BookOpen className="size-5 text-[#0057B8]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                Browse the exam catalog
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                See which practice sets are currently active across exam types.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
