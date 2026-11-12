"use client";

/**
 * src/app/study-plan/page.tsx
 *
 * Personalised Study Plan builder. The student selects target exam, target
 * score, daily study time, and test date; the client generates a day-by-day
 * schedule broken down by skill area with progress checkboxes and milestone
 * markers. Everything is persisted to localStorage — no backend writes for
 * the MVP.
 *
 * Reference style: Khan Academy SAT study plans.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import {
  generateStudyPlan,
  loadPlan,
  savePlan,
  clearPlan,
  loadProgress,
  saveProgress,
  todayISO,
  type StudyPlan,
  type DayPlan,
  type ProgressMap,
} from "@/lib/study-tools/study-plan";

type ExamOption = {
  code: string;
  label: string;
  skills: string[];
  scoreHint: string;
};

const EXAM_OPTIONS: ExamOption[] = [
  {
    code: "IELTS",
    label: "IELTS (Academic / General)",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "0-9 (e.g. 7.5)",
  },
  {
    code: "TOEFL",
    label: "TOEFL iBT",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "0-120 (e.g. 100)",
  },
  {
    code: "PTE",
    label: "PTE Academic",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "10-90 (e.g. 65)",
  },
  {
    code: "DET",
    label: "Duolingo English Test",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "10-160 (e.g. 120)",
  },
  {
    code: "OET",
    label: "OET (Occupational English Test)",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "A / B / C",
  },
  {
    code: "CAMBRIDGE",
    label: "Cambridge B2 First",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    scoreHint: "140-190 (e.g. 175)",
  },
  {
    code: "GRE",
    label: "GRE General",
    skills: ["Quant", "Verbal", "Analytical Writing"],
    scoreHint: "260-340 (e.g. 320)",
  },
  {
    code: "GMAT",
    label: "GMAT Focus",
    skills: ["Quant", "Verbal", "Analytical Writing"],
    scoreHint: "205-805 (e.g. 645)",
  },
  {
    code: "SAT",
    label: "SAT (Digital)",
    skills: ["Math", "Reading & Writing"],
    scoreHint: "400-1600 (e.g. 1400)",
  },
  {
    code: "ACT",
    label: "ACT",
    skills: ["Math", "Reading & Writing"],
    scoreHint: "1-36 (e.g. 30)",
  },
];

function skillsForExam(code: string): string[] {
  return EXAM_OPTIONS.find((e) => e.code === code)?.skills ?? [];
}

function scoreHintFor(code: string): string {
  return EXAM_OPTIONS.find((e) => e.code === code)?.scoreHint ?? "";
}

function labelFor(code: string): string {
  return EXAM_OPTIONS.find((e) => e.code === code)?.label ?? code;
}

const HOUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];

export default function StudyPlanPage() {
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [viewWeek, setViewWeek] = useState<string>("ALL");

  // Form state
  const [exam, setExam] = useState<string>("IELTS");
  const [targetScore, setTargetScore] = useState<string>("");
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [testDate, setTestDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(true);

  // Hydration + load persisted plan. Runs once after mount.
  // Reading localStorage during SSR is impossible and reading it in render
  // would cause a hydration mismatch, so this mount effect is the correct
  // place; the synchronous setState here is the documented exception to the
  // cascading-render rule (one-shot client-only initialisation).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const loaded = loadPlan();
    if (loaded) {
      setPlan(loaded);
      setProgress(loadProgress(loaded.createdAt));
      setShowForm(false);
    } else {
      // Default testDate = +30 days from today.
      const today = new Date();
      const t = new Date(today);
      t.setDate(today.getDate() + 30);
      setTestDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
      setStartDate(todayISO());
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Persist progress whenever it changes (only after hydration + when plan exists).
  useEffect(() => {
    if (!hydrated || !plan) return;
    saveProgress(plan.createdAt, progress);
  }, [hydrated, plan, progress]);

  const toggleWeakArea = useCallback((skill: string) => {
    setWeakAreas((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }, []);

  const handleGenerate = useCallback(() => {
    setFormError(null);
    if (!exam) {
      setFormError("Please choose a target exam.");
      return;
    }
    if (!targetScore.trim()) {
      setFormError("Please enter a target score.");
      return;
    }
    if (!testDate) {
      setFormError("Please choose a target test date.");
      return;
    }
    if (hoursPerDay < 0.5 || hoursPerDay > 8) {
      setFormError("Daily study time must be between 0.5 and 8 hours.");
      return;
    }
    try {
      const newPlan = generateStudyPlan({
        exam,
        targetScore: targetScore.trim(),
        hoursPerDay,
        testDate,
        startDate: startDate || todayISO(),
        weakAreas,
      });
      savePlan(newPlan);
      setPlan(newPlan);
      setProgress(loadProgress(newPlan.createdAt));
      setShowForm(false);
      setViewWeek("ALL");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to generate the plan.",
      );
    }
  }, [exam, targetScore, testDate, hoursPerDay, startDate, weakAreas]);

  const handleClear = useCallback(() => {
    clearPlan();
    setPlan(null);
    setProgress({});
    setShowForm(true);
  }, []);

  const toggleBlock = useCallback((date: string, blockIndex: number) => {
    setProgress((prev) => {
      const dayMap = { ...(prev[date] ?? {}) };
      dayMap[blockIndex] = !dayMap[blockIndex];
      return { ...prev, [date]: dayMap };
    });
  }, []);

  // Overall progress: completed blocks / total blocks.
  const overallProgress = useMemo(() => {
    if (!plan) return 0;
    let total = 0;
    let done = 0;
    for (const day of plan.days) {
      total += day.blocks.length;
      const dayMap = progress[day.date] ?? {};
      for (let i = 0; i < day.blocks.length; i++) {
        if (dayMap[i]) done += 1;
      }
    }
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  }, [plan, progress]);

  // Weekly grouping for display + week filter options.
  const weeklyDays = useMemo(() => {
    if (!plan) return [] as Array<{ week: number; days: DayPlan[] }>;
    const map = new Map<number, DayPlan[]>();
    for (const day of plan.days) {
      const arr = map.get(day.weekNumber) ?? [];
      arr.push(day);
      map.set(day.weekNumber, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, days]) => ({ week, days }));
  }, [plan]);

  const visibleWeeks = useMemo(() => {
    if (!plan) return [];
    if (viewWeek === "ALL") return weeklyDays;
    return weeklyDays.filter((w) => String(w.week) === viewWeek);
  }, [plan, viewWeek, weeklyDays]);

  const milestoneForWeek = useCallback(
    (weekNumber: number) =>
      plan?.milestones.find((m) => m.weekNumber === weekNumber) ?? null,
    [plan],
  );

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="study-plan-title"
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
              <ClipboardList className="size-3.5 text-[#C2410C]" aria-hidden="true" />
              Personalised study plan
            </p>
            <h1
              id="study-plan-title"
              className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0B1F3A] sm:text-4xl lg:text-[2.75rem]"
            >
              Build a daily study plan that fits your real schedule
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Pick your target exam, target score, daily study time and test date. The planner
              generates a day-by-day schedule broken down by skill area, with weekly milestone
              markers and progress checkboxes that save to this browser. No account needed.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Target className="size-3.5 text-[#0057B8]" aria-hidden="true" />
                10 supported exams
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#0057B8]" aria-hidden="true" />
                Per-day skill allocation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flag className="size-3.5 text-[#C2410C]" aria-hidden="true" />
                Milestones: baseline, mocks, taper
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Plan summary bar (when a plan exists and form is hidden) */}
          {plan && !showForm ? (
            <Card className="mb-6 border-[#D9E8FF] bg-[#F4F8FC]">
              <CardContent className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryStat
                    icon={<Target className="size-4 text-[#0057B8]" />}
                    label="Target"
                    value={`${labelFor(plan.exam)} — ${plan.targetScore}`}
                  />
                  <SummaryStat
                    icon={<Clock className="size-4 text-[#0057B8]" />}
                    label="Daily"
                    value={`${plan.hoursPerDay}h`}
                  />
                  <SummaryStat
                    icon={<CalendarDays className="size-4 text-[#0057B8]" />}
                    label="Window"
                    value={`${plan.startDate} → ${plan.testDate}`}
                  />
                  <SummaryStat
                    icon={<Trophy className="size-4 text-[#C2410C]" />}
                    label="Total study"
                    value={`${plan.totalStudyHours}h over ${plan.totalWeeks}w`}
                  />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" /> Clear plan
                  </Button>
                </div>
              </CardContent>
              <div className="border-t border-[#D9E8FF] px-5 py-3">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                  <span className="font-semibold text-[#0B1F3A]">Overall progress</span>
                  <span className="font-bold text-[#0057B8]">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="mt-2 h-2 bg-slate-200" />
              </div>
            </Card>
          ) : null}

          {/* Form */}
          {showForm ? (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#0B1F3A]">
                  {plan ? "Edit your plan inputs" : "Plan your study schedule"}
                </CardTitle>
                <p className="text-sm text-slate-600">
                  The plan is generated locally in your browser and saved to this device. Nothing
                  is sent to a server.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="exam">Target exam</Label>
                    <Select value={exam} onValueChange={(v) => { setExam(v); setWeakAreas([]); }}>
                      <SelectTrigger id="exam" className="w-full">
                        <SelectValue placeholder="Choose an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.code} value={opt.code}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetScore">Target score</Label>
                    <Input
                      id="targetScore"
                      value={targetScore}
                      onChange={(e) => setTargetScore(e.target.value)}
                      placeholder={scoreHintFor(exam)}
                    />
                    <p className="text-xs text-slate-500">
                      Use the format your test reports — e.g. 7.5 for IELTS, 320 for GRE, 1400 for SAT.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="hours">Study time per day</Label>
                    <Select
                      value={String(hoursPerDay)}
                      onValueChange={(v) => setHoursPerDay(Number(v))}
                    >
                      <SelectTrigger id="hours" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOUR_OPTIONS.map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {h} hour{h === 1 ? "" : "s"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Sundays are scheduled as a lighter 40% review day automatically.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="testDate">Target test date</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Earliest sensible window is ~2 weeks; we recommend 4-12 for most exams.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Weak areas to emphasise (optional)</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {skillsForExam(exam).map((skill) => (
                      <label
                        key={skill}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={weakAreas.includes(skill)}
                          onCheckedChange={() => toggleWeakArea(skill)}
                        />
                        <span>{skill}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Selected skills get ~40% more daily time. Choose the 1-2 sections where you
                    score lowest on practice.
                  </p>
                </div>

                {formError ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {formError}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleGenerate} className="bg-[#CC3F10] hover:bg-[#A8320D]">
                    <Plus className="size-4" aria-hidden="true" />
                    {plan ? "Regenerate plan" : "Generate study plan"}
                  </Button>
                  {plan ? (
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Plan body */}
          {plan && !showForm ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
              {/* Weekly schedule */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0B1F3A]">
                    Daily schedule
                  </h2>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="weekFilter" className="text-xs text-slate-500">
                      Week
                    </Label>
                    <Select value={viewWeek} onValueChange={setViewWeek}>
                      <SelectTrigger id="weekFilter" className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All weeks</SelectItem>
                        {weeklyDays.map((w) => (
                          <SelectItem key={w.week} value={String(w.week)}>
                            Week {w.week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-6">
                  {visibleWeeks.map(({ week, days }) => {
                    const ms = milestoneForWeek(week);
                    return (
                      <div key={week} className="rounded-2xl border border-slate-200 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                          <div>
                            <h3 className="text-sm font-bold text-[#0B1F3A]">
                              Week {week}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {days.length} day{days.length === 1 ? "" : "s"} ·{" "}
                              {days.reduce((s, d) => s + d.totalMinutes, 0)} min total
                            </p>
                          </div>
                          {ms ? (
                            <Badge className="bg-[#FFF7ED] text-[#C2410C] border border-orange-200 hover:bg-[#FFF7ED]">
                              <Flag className="size-3" aria-hidden="true" /> Milestone
                            </Badge>
                          ) : null}
                        </div>

                        {ms ? (
                          <div className="border-b border-orange-100 bg-[#FFF7ED] px-5 py-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#C2410C]">
                              Milestone · Week {ms.weekNumber}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#0B1F3A]">
                              {ms.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                              {ms.description}
                            </p>
                          </div>
                        ) : null}

                        <Accordion
                          type="multiple"
                          defaultValue={[days[0]?.date ?? ""]}
                          className="px-2"
                        >
                          {days.map((day) => {
                            const dayDone = day.blocks.filter(
                              (_, i) => progress[day.date]?.[i],
                            ).length;
                            const dayTotal = day.blocks.length;
                            const dayPct =
                              dayTotal === 0 ? 0 : Math.round((dayDone / dayTotal) * 100);
                            return (
                              <AccordionItem
                                key={day.date}
                                value={day.date}
                                className="border-b border-slate-100 last:border-b-0"
                              >
                                <AccordionTrigger className="px-3 py-3 text-left hover:no-underline">
                                  <div className="flex w-full items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                          {day.weekday} {day.date.slice(5)}
                                        </span>
                                        {day.isLight ? (
                                          <Badge
                                            variant="outline"
                                            className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                          >
                                            Light
                                          </Badge>
                                        ) : null}
                                      </div>
                                      <p className="mt-1 truncate text-sm font-semibold text-[#0B1F3A]">
                                        {day.label}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3 text-right">
                                      <span className="text-xs text-slate-500">
                                        {Math.round(day.totalMinutes / 60 * 10) / 10}h
                                      </span>
                                      <span
                                        className={`text-xs font-bold ${dayPct === 100 ? "text-emerald-600" : "text-[#0057B8]"}`}
                                      >
                                        {dayPct}%
                                      </span>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-4">
                                  <ul className="space-y-2">
                                    {day.blocks.map((block, i) => {
                                      const done = !!progress[day.date]?.[i];
                                      return (
                                        <li key={i}>
                                          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 hover:bg-slate-50">
                                            <Checkbox
                                              checked={done}
                                              onCheckedChange={() => toggleBlock(day.date, i)}
                                              className="mt-0.5"
                                            />
                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                  variant="outline"
                                                  className="border-[#D9E8FF] bg-[#EEF6FF] text-[#0057B8]"
                                                >
                                                  {block.skill}
                                                </Badge>
                                                <span className="text-xs text-slate-500">
                                                  {block.minutes} min
                                                </span>
                                              </div>
                                              <p
                                                className={`mt-1.5 text-sm leading-6 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}
                                              >
                                                {block.activity}
                                              </p>
                                            </div>
                                            {done ? (
                                              <CheckCircle2
                                                className="mt-0.5 size-4 shrink-0 text-emerald-500"
                                                aria-hidden="true"
                                              />
                                            ) : null}
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestones sidebar */}
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-[#0B1F3A]">
                      Milestones
                    </CardTitle>
                    <p className="text-xs text-slate-500">
                      Recommended checkpoints across your {plan.totalWeeks}-week plan.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {plan.milestones.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Plan too short for milestones — at least 2 weeks recommended.
                      </p>
                    ) : (
                      plan.milestones.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-xl border border-slate-200 bg-[#F4F8FC] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-[#C2410C]">
                              Week {m.weekNumber}
                            </span>
                            <Flag className="size-3.5 text-[#C2410C]" aria-hidden="true" />
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[#0B1F3A]">
                            {m.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {m.description}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="mt-4 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-[#0B1F3A]">
                      Skill allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {plan.skillWeights.map((w) => {
                      const max = Math.max(...plan.skillWeights.map((x) => x.weight));
                      const pct = Math.round((w.weight / max) * 100);
                      return (
                        <div key={w.skill}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{w.skill}</span>
                            <span className="text-slate-500">
                              {w.weight.toFixed(1)} weight
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0057B8]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit plan inputs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" /> Start over
                  </Button>
                </div>
              </aside>
            </div>
          ) : null}

          {/* Cross-links when no plan yet */}
          {plan ? null : (
            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              <Link
                href="/shortcuts"
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
              >
                <Target className="size-5 text-[#0057B8]" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                  Browse exam shortcuts
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Real techniques for IELTS, GRE, SAT and more — searchable and filterable.
                </p>
              </Link>
              <Link
                href="/sop-studio"
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
              >
                <ClipboardList className="size-5 text-[#C2410C]" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                  Write your SOP
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Guided statement-of-purpose writer with templates and word counts.
                </p>
              </Link>
              <Link
                href="/exam-prep"
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0057B8]/40"
              >
                <Trophy className="size-5 text-[#0057B8]" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-bold text-[#0B1F3A]">
                  Browse exam catalog
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  See which practice sets are currently active across exam types.
                </p>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-[#0B1F3A]">{value}</p>
      </div>
    </div>
  );
}
