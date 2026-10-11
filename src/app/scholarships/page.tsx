import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, ClipboardCheck, Landmark } from "lucide-react";

export const metadata: Metadata = {
  title: "Scholarship Research",
  description: "A practical checklist for verifying international scholarships and funding opportunities.",
};

const CHECKS = [
  {
    title: "Check who awards it",
    description: "Start with the university, government, or named scholarship organisation—not an unverified repost.",
    icon: Landmark,
  },
  {
    title: "Read the eligibility rules",
    description: "Confirm eligible nationalities, academic level, subject, location, and any admission conditions from the award owner.",
    icon: BadgeCheck,
  },
  {
    title: "Confirm coverage and dates",
    description: "Check what costs are covered, whether the award is renewable, the application deadline, and the current intake.",
    icon: CalendarClock,
  },
  {
    title: "Use the official application route",
    description: "Submit only through the current application channel named by the awarding organisation and keep a copy of its terms.",
    icon: ClipboardCheck,
  },
];

export default function ScholarshipsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="bg-[#0B1F3A] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">Funding research</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Check every scholarship at its source</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Scholarship rules and deadlines vary. Use this checklist to verify an award directly with the university, government, or organisation that offers it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="scholarship-checklist-title">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#EAF3FC] text-[#0057B8]">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="scholarship-checklist-title" className="text-2xl font-bold">Before you apply</h2>
            <p className="mt-1 text-sm text-slate-600">Four checks to make with the official awarding source.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CHECKS.map(({ title, description, icon: Icon }, index) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-[#0057B8]">0{index + 1}</span>
                <Icon className="size-5 text-[#0057B8]" aria-hidden="true" />
              </div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          ALO does not currently provide a verified, searchable live scholarship database or guarantee eligibility or funding. Treat third-party lists as leads only; verify every detail on the current official award page.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-label="Scholarship planning links">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#EAF3FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold">Want help organising your questions?</h2>
            <p className="mt-1 text-sm text-slate-600">Send a funding-research request; confirm award terms with the awarding organisation.</p>
          </div>
          <Link href="/book-consultation?interest=funding" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004894] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
            Request planning follow-up <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Link href="/destinations" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]">
          Review official destination guidance <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
