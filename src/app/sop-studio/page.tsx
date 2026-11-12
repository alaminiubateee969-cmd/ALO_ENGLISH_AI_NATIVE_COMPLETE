"use client";

/**
 * src/app/sop-studio/page.tsx
 *
 * Guided Statement of Purpose / research-proposal writer. Each section has a
 * prompt, actionable tips, a target word count and a worked example. Drafts
 * auto-save to localStorage. Export options: copy to clipboard or download
 * as .txt. No backend writes for the MVP.
 *
 * Reference style: Purdue OWL SOP guidelines.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ClipboardCopy,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SOP_SECTIONS, buildSopDraftText, countWords, type SopSection } from "@/lib/study-tools/sop-templates";

const STORAGE_KEY = "alo:sop-draft";
const STORAGE_VERSION = "1";

type DraftMap = Record<string, string>;
type StoredDraft = {
  version: string;
  sections: DraftMap;
  updatedAt: string;
};

function loadDraft(): DraftMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed.version !== STORAGE_VERSION) return {};
    return parsed.sections ?? {};
  } catch {
    return {};
  }
}

function saveDraft(sections: DraftMap): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = {
      version: STORAGE_VERSION,
      sections,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable; ignore.
  }
}

function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function wordCountClass(count: number, range: { min: number; max: number }): string {
  if (count === 0) return "text-slate-400";
  if (count < range.min) return "text-amber-600";
  if (count > range.max) return "text-rose-600";
  return "text-emerald-600";
}

function wordCountLabel(count: number, range: { min: number; max: number }): string {
  if (count === 0) return "empty";
  if (count < range.min) return `${range.min - count} to go`;
  if (count > range.max) return `${count - range.max} over`;
  return "in range";
}

export default function SopStudioPage() {
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<DraftMap>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(SOP_SECTIONS[0]?.id ?? "intro");
  const debounceRef = useRef<number | null>(null);

  // Hydration + load persisted draft.
  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  // Debounced autosave whenever draft changes (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      saveDraft(draft);
      setSavedAt(new Date().toLocaleTimeString());
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [hydrated, draft]);

  const updateSection = useCallback((id: string, value: string) => {
    setDraft((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Clear the entire draft? This cannot be undone.",
    );
    if (!ok) return;
    clearDraft();
    setDraft({});
    setSavedAt(null);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = buildSopDraftText(draft);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard permission: select a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      } catch {
        // give up silently
      } finally {
        document.body.removeChild(ta);
      }
    }
  }, [draft]);

  const handleDownload = useCallback(() => {
    const text = buildSopDraftText(draft);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "statement-of-purpose.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [draft]);

  // Per-section word counts and overall progress.
  const sectionCounts = useMemo(
    () =>
      SOP_SECTIONS.map((s) => ({
        id: s.id,
        count: countWords(draft[s.id] ?? ""),
      })),
    [draft],
  );

  const totalWords = useMemo(
    () => sectionCounts.reduce((s, c) => s + c.count, 0),
    [sectionCounts],
  );

  const completedSections = useMemo(
    () =>
      SOP_SECTIONS.filter((s) => {
        const c = countWords(draft[s.id] ?? "");
        return c >= s.wordCount.min;
      }).length,
    [draft],
  );

  const overallProgress = Math.round((completedSections / SOP_SECTIONS.length) * 100);

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="sop-title"
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
              <FileText className="size-3.5 text-[#C2410C]" aria-hidden="true" />
              SOP &amp; research proposal studio
            </p>
            <h1
              id="sop-title"
              className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0B1F3A] sm:text-4xl lg:text-[2.75rem]"
            >
              Write a stronger Statement of Purpose, one section at a time
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              A guided SOP writer with six sections — introduction, academic background, research
              interests, why this university, career goals, conclusion. Each section has a prompt,
              actionable tips, a target word count, and a worked example. Your draft auto-saves to
              this browser. Export to clipboard or .txt when you are ready.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-3.5 text-[#0057B8]" aria-hidden="true" />
                {SOP_SECTIONS.length} sections
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#C2410C]" aria-hidden="true" />
                Purdue OWL reference style
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                Auto-saves locally — no account needed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky editor bar */}
      <section className="border-b border-slate-200 bg-white sticky top-16 z-30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total words
              </span>
              <span className="text-sm font-bold text-[#0B1F3A]">{totalWords}</span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Sections in range
              </span>
              <span className="text-sm font-bold text-[#0B1F3A]">
                {completedSections}/{SOP_SECTIONS.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Auto-save</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${savedAt ? "text-emerald-600" : "text-slate-400"}`}
              >
                <span
                  className={`size-1.5 rounded-full ${savedAt ? "bg-emerald-500" : "bg-slate-300"}`}
                  aria-hidden="true"
                />
                {savedAt ? `saved ${savedAt}` : "waiting"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <>
                  <ClipboardCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="size-3.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="size-3.5" aria-hidden="true" /> .txt
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>
        {/* Section navigation */}
        <nav
          aria-label="SOP sections"
          className="border-t border-slate-100 bg-[#F8FAFC]"
        >
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
            {SOP_SECTIONS.map((s) => {
              const c = sectionCounts.find((x) => x.id === s.id)?.count ?? 0;
              const done = c >= s.wordCount.min;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    document.getElementById(`section-${s.id}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-[#0057B8] text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{s.order}</span>
                  <span>{s.title}</span>
                  {done ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      </section>

      {/* Editor body */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Progress card */}
          <Card className="mb-6 border-slate-200">
            <CardContent className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Overall completion
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {completedSections} of {SOP_SECTIONS.length} sections within target word count.
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-[#0057B8]">{overallProgress}%</p>
              </div>
            </CardContent>
            <div className="h-1.5 w-full bg-slate-100">
              <div
                className="h-full bg-[#0057B8] transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </Card>

          <div className="space-y-6">
            {SOP_SECTIONS.map((section: SopSection) => {
              const text = draft[section.id] ?? "";
              const count = countWords(text);
              return (
                <Card
                  key={section.id}
                  id={`section-${section.id}`}
                  className="scroll-mt-40 border-slate-200"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-full bg-[#0B1F3A] text-xs font-bold text-white">
                            {section.order}
                          </span>
                          <CardTitle className="text-base font-bold text-[#0B1F3A]">
                            {section.title}
                          </CardTitle>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {section.prompt}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold ${wordCountClass(count, section.wordCount)}`}>
                          {count}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {wordCountLabel(count, section.wordCount)}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          target {section.wordCount.min}-{section.wordCount.max}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={text}
                      onChange={(e) => updateSection(section.id, e.target.value)}
                      placeholder={`Write your ${section.title.toLowerCase()} here…`}
                      className="min-h-32 leading-7"
                      aria-label={`${section.title} draft`}
                    />
                    <Accordion type="single" collapsible>
                      <AccordionItem value="tips" className="border-0">
                        <AccordionTrigger className="py-2 text-xs font-bold uppercase tracking-wide text-[#0057B8] hover:no-underline">
                          <span className="inline-flex items-center gap-1.5">
                            <Lightbulb className="size-3.5" aria-hidden="true" />
                            Tips for this section
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <ul className="space-y-1.5">
                            {section.tips.map((tip, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs leading-5 text-slate-700"
                              >
                                <span className="mt-1 size-1 shrink-0 rounded-full bg-[#0057B8]" aria-hidden="true" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="example" className="border-0">
                        <AccordionTrigger className="py-2 text-xs font-bold uppercase tracking-wide text-[#C2410C] hover:no-underline">
                          <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="size-3.5" aria-hidden="true" />
                            Worked example
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          <p className="rounded-lg bg-[#FFF7ED] p-3 text-xs leading-6 text-slate-700">
                            {section.example}
                          </p>
                          <p className="mt-2 text-[10px] text-slate-400">
                            Example is illustrative — adapt to your own experience, do not copy.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    {count > section.wordCount.max ? (
                      <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          This section is {count - section.wordCount.max} words over the target.
                          Admissions tutors notice length; consider trimming.
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Final export card */}
          <Card className="mt-8 border-[#D9E8FF] bg-[#F4F8FC]">
            <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#0B1F3A]">Ready to export?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Copy the full draft to your clipboard or download it as a plain-text file. Most
                  university application portals accept pasted text — always check each programme&apos;s
                  word limit before submitting.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={handleCopy} className="bg-[#CC3F10] hover:bg-[#A8320D]">
                  {copied ? (
                    <>
                      <ClipboardCheck className="size-4" aria-hidden="true" /> Copied
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="size-4" aria-hidden="true" /> Copy draft
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="size-4" aria-hidden="true" /> Download .txt
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cross-links */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link
              href="/shortcuts"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
            >
              <Lightbulb className="size-5 text-[#C2410C]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                Exam-prep shortcuts
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Techniques for IELTS, TOEFL, GRE, GMAT, SAT and more — searchable and filterable.
              </p>
            </Link>
            <Link
              href="/study-plan"
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
            >
              <ListChecks className="size-5 text-[#0057B8]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                Build a study plan
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Generate a day-by-day schedule by exam, target score and test date.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
