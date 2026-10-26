import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, GraduationCap, LibraryBig, SearchCheck, WalletCards } from "lucide-react";
import { ProcessFlow, TimelineRoadmap } from "@/components/diagrams";

export const metadata: Metadata = {
  title: "Study and Test Preparation Resources",
  description: "Browse ALO English practice, test-provider references, and study-abroad planning resources.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Study and Test Preparation Resources",
    description: "Browse ALO English practice, test-provider references, and study-abroad planning resources.",
    url: "/resources",
    type: "website",
  },
};

/**
 * Diagrams rendered on this page. Both are content, not decoration: the process
 * flow is what actually happens in a practice sitting, and the roadmap is the
 * sequence a student works through. Neither claims an official score or a
 * guaranteed outcome.
 */
const PRACTICE_SITTING_STEPS = [
  {
    label: "Choose a practice set",
    detail: "Only active sets are listed",
    code: "01",
  },
  {
    label: "Server freezes questions",
    detail: "Deadline set from server time",
    code: "02",
  },
  {
    label: "Answers autosave",
    detail: "Resume after a refresh or dropout",
    code: "03",
  },
  {
    label: "Submit for grading",
    detail: "Objective answers scored locally",
    code: "04",
  },
  {
    label: "Review the feedback",
    detail: "Practice estimate, never official",
    code: "05",
  },
] as const;

const STUDY_ROADMAP = [
  {
    label: "Phase 1",
    period: "Weeks 1–2",
    title: "Establish the baseline",
    description:
      "Take one short practice sitting per skill to see where you actually stand. A baseline is a starting measurement, not a prediction of your final result.",
    milestones: [
      "Complete one listening and one reading practice set",
      "Write one timed task and read the feedback",
      "Record the question types that cost you the most time",
    ],
  },
  {
    label: "Phase 2",
    period: "Weeks 3–6",
    title: "Work the weak task types",
    description:
      "Go after specific question types rather than whole papers. Shorter, focused sittings with a review between them move more than repeated full tests.",
    milestones: [
      "Two focused sittings per week on your weakest task types",
      "Keep a list of recurring mistakes, not just scores",
      "Re-check the official test format for your sitting date",
    ],
  },
  {
    label: "Phase 3",
    period: "Weeks 7–9",
    title: "Build exam conditions",
    description:
      "Sit full-length sessions under the real time limit with no interruptions, so pacing and fatigue become part of what you have practised.",
    milestones: [
      "One full timed sitting per week",
      "Practise the transition between sections without stopping",
      "Confirm the rules and identity requirements with the test provider",
    ],
  },
  {
    label: "Phase 4",
    period: "Week 10+",
    title: "Taper and confirm logistics",
    description:
      "Reduce volume, protect sleep, and settle the practical details. Test-day administration is the provider's responsibility, so verify it directly with them.",
    milestones: [
      "Light review only in the final days",
      "Confirm test centre, timing, and accepted ID documents",
      "Reconcile your plan with your application deadlines",
    ],
  },
] as const;

const RESOURCES = [
  {
    title: "Active exam catalog",
    description: "Check which local practice sets are active and review their listed counts before starting.",
    href: "/exam-prep",
    icon: BookOpenText,
    label: "Explore the catalog",
  },
  {
    title: "Language test overview",
    description: "Compare broad test types and follow links to current provider information.",
    href: "/language-prep",
    icon: LibraryBig,
    label: "Compare test options",
  },
  {
    title: "Public study handbook",
    description: "Ask study questions using the handbook experience; responses may be incomplete and are not official guidance.",
    href: "/ask-handbook",
    icon: SearchCheck,
    label: "Open the handbook",
  },
  {
    title: "Destination guidance",
    description: "Start with links to official government student-visa information and verify current requirements.",
    href: "/destinations",
    icon: Compass,
    label: "Review destinations",
  },
  {
    title: "Course planning",
    description: "Turn your subject, level, destination, and intake preferences into a consultation brief.",
    href: "/course-finder",
    icon: GraduationCap,
    label: "Plan a course search",
  },
  {
    title: "Scholarship checklist",
    description: "Review practical steps for verifying eligibility, coverage, deadlines, and application routes.",
    href: "/scholarships",
    icon: WalletCards,
    label: "Check scholarship details",
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="bg-[#0B1F3A] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">ALO English resource hub</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Useful next steps, in one place</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Browse current ALO practice and planning tools, then confirm exam, university, funding, and visa requirements with the responsible official source.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-label="Resource links">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map(({ title, description, href, icon: Icon, label }) => (
            <article key={href} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-[#EAF3FC] text-[#0057B8]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
              <Link href={href} className="mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]">
                {label} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Practice scores and generated handbook responses are learning aids only. ALO does not represent official exam providers, immigration authorities, universities, or scholarship-awarding organisations.
        </p>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-10 sm:px-6 sm:py-14" aria-label="How a practice sitting works">
        <div className="mx-auto max-w-6xl">
          <ProcessFlow
            id="practice-sitting"
            tone="blue"
            title="How one practice sitting works"
            description="Five steps, in order. The server owns question selection, the deadline, and grading — the browser never decides your score or how many questions you get."
            caption="If a sitting is interrupted, saved answers are restored and the original deadline is kept. A second attempt at the same set is a new sitting with its own selection."
            steps={PRACTICE_SITTING_STEPS.map((step) => ({ ...step }))}
            loopLabel="Review the feedback, then choose the next focused sitting"
          />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-14" aria-label="Study roadmap">
        <div className="mx-auto max-w-5xl">
          <TimelineRoadmap
            id="study-roadmap"
            tone="orange"
            title="A ten-week preparation roadmap"
            description="A workable preparation sequence for a language test. Adjust the periods to the time you actually have; the order matters more than the exact weeks."
            caption="Durations are a planning suggestion for self-study, not a recommendation from any test provider, and not a guarantee of a particular band or score."
            phases={STUDY_ROADMAP.map((phase) => ({ ...phase, milestones: [...phase.milestones] }))}
          />
        </div>
      </section>
    </div>
  );
}
