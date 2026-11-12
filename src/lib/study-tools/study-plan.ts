/**
 * src/lib/study-tools/study-plan.ts
 *
 * Personalised study-plan generator. Pure, isomorphic functions — runs in
 * the browser (client-side generation + localStorage) without any backend.
 *
 * Design intent: Khan-Academy-style daily plans broken down by skill area,
 * with recommended activities per day, milestone markers, and per-task
 * progress checkboxes. The skill allocation depends on the exam family
 * (IELTS uses 4 sub-skills; GRE/GMAT use Quant+Verbal+AW; SAT uses
 * Reading/Writing/Math).
 */

export type ExamFamily = "ENGLISH" | "GRAD" | "SAT_ACT";

export type StudyPlanInput = {
  exam: string; // e.g. "IELTS", "GRE"
  targetScore: string; // e.g. "7.5", "320", "1500"
  hoursPerDay: number; // 0.5 - 8
  testDate: string; // ISO date (yyyy-mm-dd)
  startDate?: string; // ISO date, defaults to today
  weakAreas?: string[]; // optional emphasis
};

export type SkillBlock = {
  skill: string;
  minutes: number;
  activity: string;
};

export type DayPlan = {
  date: string; // ISO yyyy-mm-dd
  dayIndex: number; // 1-based from start
  weekNumber: number; // 1-based
  weekday: string;
  label: string; // e.g. "Day 1 — Baseline assessment"
  totalMinutes: number;
  isLight: boolean; // review / rest day
  blocks: SkillBlock[];
};

export type Milestone = {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
};

export type StudyPlan = {
  exam: string;
  targetScore: string;
  hoursPerDay: number;
  startDate: string;
  testDate: string;
  totalDays: number;
  totalWeeks: number;
  totalStudyHours: number;
  skillWeights: Array<{ skill: string; weight: number }>;
  days: DayPlan[];
  milestones: Milestone[];
  createdAt: string;
};

const EXAM_FAMILY: Record<string, ExamFamily> = {
  IELTS: "ENGLISH",
  TOEFL: "ENGLISH",
  PTE: "ENGLISH",
  DET: "ENGLISH",
  OET: "ENGLISH",
  CAMBRIDGE: "ENGLISH",
  GRE: "GRAD",
  GMAT: "GRAD",
  SAT: "SAT_ACT",
  ACT: "SAT_ACT",
};

/** Skill catalog per exam family. Each skill has a base weight and a pool of
 * practice activities, one of which is sampled per day to avoid monotony. */
const SKILL_CATALOG: Record<
  ExamFamily,
  Array<{ skill: string; weight: number; activities: string[] }>
> = {
  ENGLISH: [
    {
      skill: "Listening",
      weight: 1,
      activities: [
        "One full IELTS Listening section (40 questions); review every wrong answer's transcript line.",
        "BBC 6 Minute English episode — note 8 new collocations and use 3 in a sentence.",
        "TED Talk (15 min) — practise note-taking while listening, then write a 60-word summary.",
        "Section 4 only — academic lecture practice; pre-read questions, predict answer types.",
        "Active listening: shadow-read the audio transcript aloud for 5 minutes to internalise rhythm.",
      ],
    },
    {
      skill: "Reading",
      weight: 1.1,
      activities: [
        "One full Reading passage (13-14 questions) under 20 minutes; full error review afterwards.",
        "Skim-and-scan drill: time yourself finding 10 keywords across 3 passages (target: under 5 minutes).",
        "T/F/NG set (10 questions) — for each answer write the sentence from the passage that justifies it.",
        "Vocabulary harvest: extract 15 unfamiliar words from a passage, write each in a sentence.",
        "Long-form read: one Economist or Guardian article; summarise in 100 words in your own language.",
      ],
    },
    {
      skill: "Writing",
      weight: 1.2,
      activities: [
        "Timed Task 2 essay (40 min) — use the 4-paragraph template; review against the band descriptors.",
        "Task 1 Academic — describe one chart in 20 minutes; include overview sentence.",
        "Cohesion drill: rewrite yesterday's essay using referencing ('this', 'these') instead of linkers.",
        "Collocation harvest: learn 8 collocations for one IELTS topic; use 4 in a fresh paragraph.",
        "Self-review pass: take a recent essay and mark every passive construction; convert half to active.",
      ],
    },
    {
      skill: "Speaking",
      weight: 1,
      activities: [
        "Part 2 cue-card practice (2-min talk) — record yourself, transcribe, count fillers.",
        "Part 3 abstract question set (5 questions) — apply A-R-E-C structure to each.",
        "Discourse-marker drill: rehearse 8 openers until they come out without thinking.",
        "Shadow-practice: listen to a 2-minute BBC segment, repeat each sentence immediately afterwards.",
        "Mock speaking session with a partner or recorder — 11-14 minutes, three full parts.",
      ],
    },
  ],
  GRAD: [
    {
      skill: "Quant",
      weight: 1.3,
      activities: [
        "20-question mixed quant set under 35 minutes; full error log afterwards.",
        "Number-properties drill: 10 QC questions, test 0/1/-1/fraction on each.",
        "Estimation practice: 15 questions, force yourself to round before calculating.",
        "Topic focus (algebra/geometry/word problems) — 12 questions, time-boxed at 90s each.",
        "Backsolve drill: 8 multiple-choice questions; solve by plugging choices only.",
      ],
    },
    {
      skill: "Verbal",
      weight: 1,
      activities: [
        "Text Completion set (10 questions) — predict before looking at choices; review clues.",
        "Sentence Equivalence set (8 questions) — find the synonym pair before committing.",
        "Reading Comprehension — 2 passages with 6 questions; underline each question's keyword.",
        "Vocabulary sprint: 25 new high-frequency GRE words, 5 uses in sentences.",
        "Critical Reasoning (GMAT) — 6 questions, identify conclusion before reading the question.",
      ],
    },
    {
      skill: "Analytical Writing",
      weight: 0.6,
      activities: [
        "Timed Argument essay (30 min) — identify 3 flaws; structure intro, 3 body, conclusion.",
        "Timed Issue essay (30 min) — pick a side, 2 reasons with examples.",
        "Read one official prompt and outline only (5 min) — do not write the essay.",
        "Self-review: take yesterday's essay and mark every vague claim; rewrite with specifics.",
        "Vocabulary pass: replace 5 generic words ('good', 'important') with precise alternatives.",
      ],
    },
  ],
  SAT_ACT: [
    {
      skill: "Math",
      weight: 1.4,
      activities: [
        "20-question Math module under 35 minutes; full error review.",
        "Calculator strategy drill: 10 questions, decide calc vs head-only before solving.",
        "Elimination practice: 8 multiple-choice, eliminate 2 choices before solving.",
        "Topic focus (algebra/problem-solving/advanced math) — 12 questions time-boxed.",
        "Grid-in practice: 8 student-produced-response questions; double-check rounding.",
      ],
    },
    {
      skill: "Reading & Writing",
      weight: 1,
      activities: [
        "Reading module (1 passage, 11 questions) under 13 minutes; review line references.",
        "Writing & Language module (11 questions) under 9 minutes; flag every concision choice.",
        "Vocabulary-in-context set (10 questions) — predict before looking at choices.",
        "Grammar drill: 12 questions on subject-verb agreement, pronouns, transitions.",
        "Rhetoric drill: 8 'which choice best accomplishes' questions — identify the goal first.",
      ],
    },
  ],
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Parse a yyyy-mm-dd string into a Date at local midnight. */
function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date back to yyyy-mm-dd. */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today as yyyy-mm-dd in local time. */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Pseudo-deterministic pick from an array, based on dayIndex. Stable per day. */
function pick<T>(arr: T[], dayIndex: number): T {
  return arr[(dayIndex - 1) % arr.length];
}

/** Determine skill allocation. Weak areas get +0.4 weight boost. */
function resolveSkillWeights(
  exam: string,
  weakAreas: string[] = [],
): Array<{ skill: string; weight: number }> {
  const family = EXAM_FAMILY[exam.toUpperCase()] ?? "ENGLISH";
  const catalog = SKILL_CATALOG[family];
  return catalog.map((c) => {
    const boost = weakAreas
      .map((w) => w.toLowerCase().trim())
      .includes(c.skill.toLowerCase())
      ? 0.4
      : 0;
    return { skill: c.skill, weight: c.weight + boost };
  });
}

/** Build the milestone list. Weeks are 1-indexed. */
function buildMilestones(totalWeeks: number, exam: string): Milestone[] {
  const ms: Milestone[] = [
    {
      id: "ms-baseline",
      weekNumber: 1,
      title: "Baseline assessment",
      description: `Sit a half-length ${exam} diagnostic under timed conditions. Record your starting scores by section so progress is measurable.`,
    },
    {
      id: "ms-first-mock",
      weekNumber: Math.max(2, Math.min(3, Math.ceil(totalWeeks * 0.25))),
      title: "First full mock test",
      description: `Complete one full ${exam} mock under exam conditions (no breaks beyond the official schedule). Score it and update your weak-area list.`,
    },
    {
      id: "ms-review-week",
      weekNumber: Math.max(4, Math.min(totalWeeks - 1, Math.ceil(totalWeeks * 0.6))),
      title: "Targeted review week",
      description:
        "Re-do every wrong answer from the last two mocks. Identify the 3 question types with the highest error rate and dedicate this week to them.",
    },
    {
      id: "ms-final-mock",
      weekNumber: Math.max(2, totalWeeks - 1),
      title: "Final full mock",
      description: `Sit a final full ${exam} mock under timed conditions. Confirm your target score is within reach; if not, adjust your test date or strategy now.`,
    },
    {
      id: "ms-taper",
      weekNumber: totalWeeks,
      title: "Taper week",
      description:
        "Reduce volume by 50%. Light review of error log only. Sleep on schedule that matches test-day timing. No new material.",
    },
  ];
  // Filter milestones whose weekNumber is within range, dedupe by week, sort.
  const seen = new Set<number>();
  return ms
    .filter((m) => m.weekNumber >= 1 && m.weekNumber <= totalWeeks)
    .filter((m) => {
      if (seen.has(m.weekNumber)) return false;
      seen.add(m.weekNumber);
      return true;
    })
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

/** Day-level label depending on day-of-week and week phase. */
function dayLabel(dayIndex: number, weekday: string, isLight: boolean): string {
  if (isLight) return `Day ${dayIndex} — Light review (${weekday})`;
  return `Day ${dayIndex} — Focused practice (${weekday})`;
}

/**
 * Generate a personalised study plan.
 *
 * @throws Error if testDate is not after startDate, or hoursPerDay is out of range.
 */
export function generateStudyPlan(input: StudyPlanInput): StudyPlan {
  const startDateISO = input.startDate ?? todayISO();
  if (!input.testDate || !startDateISO) {
    throw new Error("Start date and test date are required.");
  }
  if (input.hoursPerDay < 0.5 || input.hoursPerDay > 8) {
    throw new Error("Hours per day must be between 0.5 and 8.");
  }
  const start = parseISODate(startDateISO);
  const test = parseISODate(input.testDate);
  if (test.getTime() <= start.getTime()) {
    throw new Error("Test date must be after the start date.");
  }

  const totalMs = test.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / (24 * 60 * 60 * 1000)) + 1; // inclusive
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  const weights = resolveSkillWeights(input.exam, input.weakAreas);
  const family = EXAM_FAMILY[input.exam.toUpperCase()] ?? "ENGLISH";
  const catalog = SKILL_CATALOG[family];
  const weightSum = weights.reduce((s, w) => s + w.weight, 0);

  const dailyMinutesTotal = Math.round(input.hoursPerDay * 60);
  const days: DayPlan[] = [];
  let totalStudyMinutes = 0;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = toISODate(date);
    const weekday = WEEKDAYS[date.getDay()];
    const dayIndex = i + 1;
    const weekNumber = Math.floor(i / 7) + 1;

    // Sunday is a light day (review / rest) — 40% volume, single skill.
    const isLight = weekday === "Sun";

    const blocks: SkillBlock[] = [];
    if (isLight) {
      // One skill only — rotate.
      const skillIdx = (weekNumber - 1) % catalog.length;
      const cat = catalog[skillIdx];
      const minutes = Math.round(dailyMinutesTotal * 0.4);
      blocks.push({
        skill: cat.skill,
        minutes,
        activity:
          `Light review (${minutes} min): re-read the week's error log; redo 5 of the hardest missed questions; no new material.`,
      });
      totalStudyMinutes += minutes;
    } else {
      // Allocate minutes across all skills by weight.
      let allocated = 0;
      weights.forEach((w, idx) => {
        const share = w.weight / weightSum;
        // Round to nearest 5 minutes; minimum 10 minutes per block.
        const minutes = Math.max(10, Math.round((dailyMinutesTotal * share) / 5) * 5);
        const cat = catalog[idx];
        blocks.push({
          skill: cat.skill,
          minutes,
          activity: pick(cat.activities, dayIndex),
        });
        allocated += minutes;
      });
      // If rounding overran, trim the largest block; if underrun, pad the largest.
      if (allocated !== dailyMinutesTotal) {
        const diff = dailyMinutesTotal - allocated;
        let maxIdx = 0;
        for (let b = 1; b < blocks.length; b++) {
          if (blocks[b].minutes > blocks[maxIdx].minutes) maxIdx = b;
        }
        blocks[maxIdx].minutes = Math.max(10, blocks[maxIdx].minutes + diff);
        allocated = blocks.reduce((s, b) => s + b.minutes, 0);
      }
      totalStudyMinutes += allocated;
    }

    days.push({
      date: iso,
      dayIndex,
      weekNumber,
      weekday,
      label: dayLabel(dayIndex, weekday, isLight),
      totalMinutes: blocks.reduce((s, b) => s + b.minutes, 0),
      isLight,
      blocks,
    });
  }

  const milestones = buildMilestones(totalWeeks, input.exam);

  return {
    exam: input.exam,
    targetScore: input.targetScore,
    hoursPerDay: input.hoursPerDay,
    startDate: startDateISO,
    testDate: input.testDate,
    totalDays,
    totalWeeks,
    totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
    skillWeights: weights,
    days,
    milestones,
    createdAt: new Date().toISOString(),
  };
}

// ---------------- localStorage persistence (client only) ----------------

const PLAN_STORAGE_KEY = "alo:study-plan";
const PROGRESS_STORAGE_KEY = "alo:study-plan-progress";

export function loadPlan(): StudyPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudyPlan;
  } catch {
    return null;
  }
}

export function savePlan(plan: StudyPlan): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    // Reset progress whenever a new plan is saved.
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: plan.createdAt, completed: {} }),
    );
  } catch {
    // localStorage may be unavailable (private mode); silently ignore.
  }
}

export function clearPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PLAN_STORAGE_KEY);
  window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
}

/** Per-day task-completion map: { [date]: { [blockIndex]: boolean } } */
export type ProgressMap = Record<string, Record<number, boolean>>;

export function loadProgress(planCreatedAt: string): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { version: string; completed: ProgressMap };
    if (parsed.version !== planCreatedAt) return {};
    return parsed.completed ?? {};
  } catch {
    return {};
  }
}

export function saveProgress(planCreatedAt: string, progress: ProgressMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: planCreatedAt, completed: progress }),
    );
  } catch {
    // ignore
  }
}
