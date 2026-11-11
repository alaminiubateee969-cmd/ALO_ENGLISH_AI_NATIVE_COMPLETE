import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardList, GraduationCap } from "lucide-react";
import { CourseFinderForm } from "@/components/site/course-finder-form";

export const metadata: Metadata = {
  title: "Course Finder",
  description: "Explore course-planning options and prepare a study-abroad consultation request.",
};

const STEPS = [
  {
    number: "01",
    title: "Share your preferences",
    description: "Choose a subject, study level, destination, and intake window—or leave anything undecided.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Review your planning brief",
    description: "Your selections are carried into a consultation form so you can add contact details and context.",
    icon: BookOpenCheck,
  },
  {
    number: "03",
    title: "Discuss next steps",
    description: "ALO Education can follow up about your request. University availability and eligibility must be confirmed with official sources.",
    icon: GraduationCap,
  },
];

export default function CourseFinderPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="relative overflow-hidden bg-[#0B1F3A] px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-[#0057B8]/30 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">Study planning</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Start with the course that fits your goals</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Tell us what you are considering. We will turn your preferences into a clear consultation request—without pretending to search an unverified course database.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="course-finder-title">
        <h2 id="course-finder-title" className="mb-5 text-xl font-bold">Build your course-planning brief</h2>
        <CourseFinderForm />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6" aria-labelledby="course-finder-steps-title">
        <h2 id="course-finder-steps-title" className="mb-6 text-2xl font-bold">What happens next?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ number, title, description, icon: Icon }) => (
            <article key={number} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-bold text-[#0057B8]">{number}</span>
                <Icon className="size-5 text-[#0057B8]" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-label="Related study planning links">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#EAF3FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold">Still exploring destinations?</h2>
            <p className="mt-1 text-sm text-slate-600">Review the overview, then confirm current rules with each country’s official sources.</p>
          </div>
          <Link href="/destinations" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#0057B8] px-4 py-2 text-sm font-semibold text-[#0057B8] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
            Explore destinations <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
