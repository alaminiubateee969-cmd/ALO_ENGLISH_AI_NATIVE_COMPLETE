import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, CircleDollarSign, FileSearch, Globe2 } from "lucide-react";

export const metadata: Metadata = {
  title: "University Research",
  description: "A checklist for comparing institutions and verifying course information with official sources.",
};

const SHORTLIST_CHECKS = [
  {
    title: "Confirm the institution and course",
    description: "Use the institution's own site and the destination's official recognition or provider register where applicable.",
    icon: BadgeCheck,
  },
  {
    title: "Review entry requirements",
    description: "Check prerequisites, English-language requirements, accepted documents, and any course-specific conditions.",
    icon: FileSearch,
  },
  {
    title: "Compare the full cost",
    description: "Look beyond tuition: confirm fees, deposits, living-cost estimates, insurance, and refund terms from current official pages.",
    icon: CircleDollarSign,
  },
  {
    title: "Check dates and location",
    description: "Verify campus, teaching format, intake availability, application deadlines, and attendance requirements for your selected course.",
    icon: CalendarDays,
  },
];

export default function UniversitiesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="bg-[#0B1F3A] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">Institution research</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Build a shortlist you can verify</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            ALO does not currently publish a verified, searchable university and course directory in this deployment. Use each institution’s current official information to check details before applying.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="university-checklist-title">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#EAF3FC] text-[#0057B8]">
            <Globe2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="university-checklist-title" className="text-2xl font-bold">Shortlist verification checklist</h2>
            <p className="mt-1 text-sm text-slate-600">Compare like with like, and date-stamp the source you checked.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {SHORTLIST_CHECKS.map(({ title, description, icon: Icon }, index) => (
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
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          ALO’s course planner collects your preferences for a consultation request; it does not rank institutions, check vacancies, or predict admission. Confirm recognition and current course availability directly with the institution and relevant official authority.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-label="University research actions">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#EAF3FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold">Organise your course preferences</h2>
            <p className="mt-1 text-sm text-slate-600">Create a planning brief, then add questions for your consultation.</p>
          </div>
          <Link href="/course-finder" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004894] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
            Open course planner <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
