import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    title: "Choose a test",
    description: "Start with the English test that matches your application requirements.",
  },
  {
    title: "Practise a section",
    description: "Work through practice materials currently available for the test you selected.",
  },
  {
    title: "Review feedback",
    description: "Use practice estimates and feedback as study guidance, not official results.",
  },
  {
    title: "Plan what is next",
    description: "Notice what to revisit, then choose a focused next practice session.",
  },
] as const;

/** Accessible, responsive SVG-backed process diagram (no external renderer). */
export function StudentJourneyDiagram() {
  return (
    <section aria-labelledby="practice-journey-title" className="border-y border-slate-200 bg-[#F5F8FC] py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">A clear route forward</p>
          <h2 id="practice-journey-title" className="mt-3 text-3xl font-bold tracking-tight text-[#0B1F3A] sm:text-4xl">
            Turn practice into a plan
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            A simple cycle for deciding what to work on next. Your result remains a practice estimate—not an official exam score.
          </p>
        </div>

        <div className="relative">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 1000 20"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 top-[30px] hidden h-5 w-full lg:block"
          >
            <line x1="125" y1="10" x2="875" y2="10" stroke="#BCD0E4" strokeWidth="2" strokeDasharray="7 7" />
          </svg>
          <ol aria-label="Four-step English practice journey" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative z-10 rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#0057B8] bg-white font-mono text-sm font-bold text-[#0057B8]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-slate-200 lg:hidden" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-[#0B1F3A]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/practice-test"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#CC3F10] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
          >
            Start a practice test <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/exam-prep"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#0B1F3A] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
          >
            Explore exam preparation
          </Link>
        </div>
      </div>
    </section>
  );
}
