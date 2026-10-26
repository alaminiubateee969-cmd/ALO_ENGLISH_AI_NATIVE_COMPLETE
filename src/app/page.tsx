import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Globe,
  Headphones,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { StudentJourneyDiagram } from "@/components/site/student-journey-diagram";

export const metadata: Metadata = {
  // Rendered with the layout template as "… — ALO Education", which is 16
  // characters longer: see SITE_TITLE_SUFFIX and the SEO audit.
  title: "ALO English — Test Practice & Study Abroad",
  description:
    "Explore English-test practice, skill-focused preparation and study-abroad guidance from ALO Education. Check the active practice catalog.",
  keywords: ["English test practice", "IELTS preparation", "PTE practice", "TOEFL preparation", "study abroad", "ALO English"],
  openGraph: {
    title: "ALO English — Practice with purpose",
    description: "Explore English-test preparation and make a clear plan for your next step.",
    type: "website",
  },
};

const SKILLS = [
  {
    number: "01",
    title: "Listening",
    description: "Build focused listening habits and check the catalog for supported audio practice.",
    icon: Headphones,
  },
  {
    number: "02",
    title: "Reading",
    description: "Practise reading with purpose, then review the answers available in each active set.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Writing",
    description: "Work on a response and use available feedback as a study aid—not a certified score.",
    icon: PenLine,
  },
  {
    number: "04",
    title: "Speaking",
    description: "Explore speaking practice and review what is supported before starting a session.",
    icon: Mic,
  },
] as const;

const EXAM_PATHS = [
  { title: "IELTS", detail: "Academic and General Training" },
  { title: "PTE", detail: "Academic preparation" },
  { title: "TOEFL iBT", detail: "Current format information" },
  { title: "Duolingo English Test", detail: "Preparation resources" },
] as const;

const QUESTIONS = [
  {
    question: "Are ALO practice scores official exam results?",
    answer: "No. Any score or automated feedback shown in ALO is for preparation only. It is not issued, endorsed or validated by an exam provider.",
  },
  {
    question: "Does every exam in the catalog have a full-length practice test?",
    answer: "Not necessarily. The catalog reports active database content; a question count alone does not establish a complete or current official-format test. Check the details shown for each active set before you begin.",
  },
  {
    question: "Where should I start?",
    answer: "Open the exam catalog, choose a test or practice set that is currently available, then use the practice-to-plan steps below to decide what to work on next.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <section aria-labelledby="home-title" className="relative isolate overflow-hidden bg-[#F4F8FC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(circle_at_15%_15%,rgba(0,87,184,0.12),transparent_32%),radial-gradient(circle_at_90%_75%,rgba(232,80,26,0.10),transparent_28%)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-[#0057B8]">
              <Sparkles className="size-3.5 text-[#C2410C]" aria-hidden="true" />
              English practice from ALO Education
            </p>
            <h1 id="home-title" className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1F3A] sm:text-5xl lg:text-[3.7rem]">
              Practise with purpose.
              <span className="mt-1 block text-[#0057B8]">Plan what comes next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Find available English-test practice, focus on a skill, and use your review to choose a next step. Study-abroad guidance is here when you need it, too.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/exam-prep"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#CC3F10] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2"
              >
                Browse active practice <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/language-prep"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0B1F3A] transition-colors hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
              >
                Explore test preparation <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 flex max-w-xl items-start gap-2.5 rounded-xl border border-blue-100 bg-white/75 px-3.5 py-3 text-xs leading-5 text-slate-600">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0057B8]" aria-hidden="true" />
              <p>Practice-set availability varies. Scores and automated feedback are study aids, not official exam results.</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-3 -rotate-2 rounded-[2rem] bg-gradient-to-br from-blue-200/70 via-white to-orange-100/80" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-2 shadow-[0_24px_60px_-32px_rgba(11,31,58,0.45)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-slate-200">
                <Image
                  src="/images/hero-student.png"
                  alt="Student preparing at a laptop in a bright study space"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/75 via-transparent to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/95 p-4 backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C2410C]">A simple study rhythm</p>
                      <p className="mt-1 text-lg font-extrabold text-[#0B1F3A]">Practice → review → plan</p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0057B8]">
                      <ArrowRight className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {SKILLS.map((skill) => (
                      <span key={skill.title} className="rounded-lg bg-slate-100 px-2 py-1.5 text-center text-[10px] font-semibold text-slate-600 sm:text-xs">
                        {skill.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">Use the live catalog to see which practice sets are available today.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="skills-title" className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Four skills, one practice plan</p>
              <h2 id="skills-title" className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">Start with the skill you want to work on</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Open the active exam catalog to review current practice sets and the details available for each one.</p>
            </div>
            <Link href="/exam-prep" className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-1 text-sm font-bold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2 sm:self-auto">
              View the exam catalog <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((skill) => (
              <Link
                key={skill.title}
                href="/exam-prep"
                className="group flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8] transition-colors group-hover:bg-[#0057B8] group-hover:text-white">
                    <skill.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-bold tracking-widest text-slate-400">{skill.number}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#0B1F3A]">{skill.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{skill.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0057B8]">
                  Check available practice <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="exam-paths-title" className="border-y border-slate-200 bg-[#F8FAFC] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Choose a preparation path</p>
            <h2 id="exam-paths-title" className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">Find the test that fits your goal</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">These are starting points, not a promise that a complete mock test is available. The active catalog shows current question counts and practice-set status.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXAM_PATHS.map((exam) => (
              <Link
                key={exam.title}
                href="/exam-prep"
                className="flex min-h-24 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
              >
                <span>
                  <span className="block text-sm font-bold text-[#0B1F3A]">{exam.title}</span>
                  <span className="mt-1 block text-xs text-slate-500">{exam.detail}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-[#0057B8]" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="mt-5 text-center">
            <Link href="/exam-prep" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0057B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2">
              Open active exam catalog <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <StudentJourneyDiagram />

      <section aria-labelledby="study-abroad-title" className="py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Beyond test preparation</p>
            <h2 id="study-abroad-title" className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">Planning to study abroad?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">ALO Education also helps students organise their study-abroad research. Requirements change, so confirm admissions, funding and visa details with the relevant official organisations.</p>
            <Link href="/book-consultation" className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#CC3F10] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2">
              Request a consultation <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: "Explore destinations", detail: "Compare the places listed by ALO Education.", href: "/destinations", icon: Globe },
              { title: "Research courses", detail: "Organise options around your interests.", href: "/course-finder", icon: Compass },
              { title: "Ask a question", detail: "Browse public study materials in the handbook.", href: "/ask-handbook", icon: BookOpen },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2">
                <span className="grid size-10 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8]"><item.icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-4 flex items-center gap-1.5 text-sm font-bold text-[#0B1F3A]">{item.title}<ArrowUpRight className="size-3.5 text-[#0057B8] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-slate-200 bg-[#F8FAFC] py-14 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Before you begin</p>
            <h2 id="faq-title" className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">A few useful details</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">We aim to be clear about what practice can—and cannot—tell you.</p>
          </div>
          <div className="space-y-3">
            {QUESTIONS.map((item) => (
              <details key={item.question} className="group rounded-xl border border-slate-200 bg-white p-4 open:border-blue-200 sm:p-5">
                <summary className="cursor-pointer list-none pr-6 text-sm font-bold text-[#0B1F3A] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] sm:text-base">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-lg font-normal text-[#0057B8] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0B1F3A] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Your next step starts here</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Choose a practice set and make a plan.</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100">The catalog is the source of truth for current set availability. Practice results are not official test scores.</p>
          </div>
          <Link href="/exam-prep" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B1F3A] transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1F3A]">
            Browse exam catalog <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
