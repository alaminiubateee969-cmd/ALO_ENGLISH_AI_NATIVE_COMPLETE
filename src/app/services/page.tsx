import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Compass, GraduationCap, ShieldCheck, WalletCards } from "lucide-react";

export const metadata: Metadata = {
  title: "Study Planning Services",
  description: "Explore study-abroad planning topics and English-test practice available from ALO Education.",
};

const SERVICE_AREAS = [
  {
    title: "Course and institution research",
    description: "Organise your subject, study level, destination, and intake preferences. The course planner does not query a verified live university database.",
    icon: Compass,
    href: "/course-finder",
    linkLabel: "Open course planner",
  },
  {
    title: "Application planning",
    description: "Prepare questions about entry criteria, document requirements, and deadlines. Confirm current requirements with the institution you choose.",
    icon: GraduationCap,
    href: "/book-consultation",
    linkLabel: "Ask about planning support",
  },
  {
    title: "Scholarship research",
    description: "Use a verification checklist to review eligibility, award coverage, closing dates, and the official application route.",
    icon: WalletCards,
    href: "/scholarships",
    linkLabel: "Scholarship checklist",
  },
  {
    title: "Visa information planning",
    description: "Start with government guidance and confirm rules for your own circumstances. ALO does not decide or guarantee visa outcomes.",
    icon: ShieldCheck,
    href: "/destinations",
    linkLabel: "Official destination sources",
  },
  {
    title: "English-test preparation",
    description: "Explore the active local exam catalog. Practice availability varies, and ALO indicators are not official or provider-certified scores.",
    icon: BookOpenCheck,
    href: "/exam-prep",
    linkLabel: "View exam catalog",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F3A]">
      <section className="bg-[#0B1F3A] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#72B7FF]">ALO Education</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Study planning, with clear next steps</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore the topics ALO can help you organise. Specific support, availability, scope, and any fees should be confirmed directly before you engage a service.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="service-areas-title">
        <h2 id="service-areas-title" className="mb-6 text-2xl font-bold">Ways to move your research forward</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {SERVICE_AREAS.map(({ title, description, icon: Icon, href, linkLabel }) => (
            <article key={title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-[#EAF3FC] text-[#0057B8]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
              <Link href={href} className="mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-lg text-sm font-semibold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8]">
                {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          ALO English practice is independent preparation. It is not an official test provider, immigration authority, university, or scholarship-awarding body. Always confirm admissions, funding, visa, and test requirements with the responsible organisation.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-label="Contact ALO Education">
        <div className="flex flex-col gap-4 rounded-2xl bg-[#EAF3FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-bold">Have a specific question?</h2>
            <p className="mt-1 text-sm text-slate-600">Send a request and include the destination or exam you are researching.</p>
          </div>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004894] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
            Contact ALO <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
