import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, Compass, GraduationCap, LibraryBig, SearchCheck, WalletCards } from "lucide-react";

export const metadata: Metadata = {
  title: "Study and Test Preparation Resources",
  description: "Browse ALO English practice, test-provider references, and study-abroad planning resources.",
};

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
    </div>
  );
}
