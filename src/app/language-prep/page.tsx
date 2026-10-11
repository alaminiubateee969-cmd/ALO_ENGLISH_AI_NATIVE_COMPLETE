import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Headphones, Mic, PenLine, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "English Test Preparation",
  description: "Explore IELTS, PTE, TOEFL iBT and Duolingo English Test preparation resources with clear limits on practice availability and scoring.",
};

const TESTS = [
  {
    name: "IELTS Academic & General Training",
    shortName: "IELTS",
    description: "Choose the version that matches your application requirement. Academic and General Training have different Reading and Writing tasks.",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    officialUrl: "https://ielts.org/take-a-test/test-types",
    officialLabel: "IELTS test types",
    icon: Headphones,
  },
  {
    name: "PTE Academic",
    shortName: "PTE",
    description: "Review the current test format and task types directly with Pearson before building a study plan.",
    skills: ["Speaking & Writing", "Reading", "Listening"],
    officialUrl: "https://www.pearsonpte.com/pte-academic/preparation/",
    officialLabel: "Pearson preparation guide",
    icon: PenLine,
  },
  {
    name: "TOEFL iBT",
    shortName: "TOEFL",
    description: "ETS updated TOEFL iBT in 2026. Confirm the test date, current tasks and score-reporting guidance for your sitting.",
    skills: ["Reading", "Listening", "Speaking", "Writing"],
    officialUrl: "https://www.ets.org/toefl/test-takers/ibt/about/content.html",
    officialLabel: "ETS test content",
    icon: BookOpen,
  },
  {
    name: "Duolingo English Test",
    shortName: "DET",
    description: "The test is adaptive and its guidance can change. Check the current official overview before choosing preparation materials.",
    skills: ["Literacy", "Comprehension", "Conversation", "Production"],
    officialUrl: "https://englishtest.duolingo.com/",
    officialLabel: "Official test overview",
    icon: Mic,
  },
] as const;

export default function LanguagePrepPage() {
  return (
    <div className="min-h-[60vh] bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C2410C]">Prepare with current information</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-5xl">English-test preparation, without the guesswork.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Use this overview to choose a direction, then confirm the latest test details with the official provider. The ALO exam catalog—not this page—shows which practice sets are currently active.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/exam-prep" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#CC3F10] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A8320D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8501A] focus-visible:ring-offset-2">
              Check active practice <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/practice-test" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0B1F3A] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2">
              Open practice tests
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="test-options-title" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-7 max-w-2xl">
          <h2 id="test-options-title" className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-3xl">Explore common test pathways</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Provider descriptions below identify broad skill areas; they do not certify that ALO practice content covers every task or matches an official test.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {TESTS.map((test) => {
            const Icon = test.icon;
            return (
            <article key={test.shortName} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0057B8]">{test.shortName}</p>
                  <h3 className="mt-1 text-xl font-bold text-[#0B1F3A]">{test.name}</h3>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF6FF] text-[#0057B8]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{test.description}</p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label={`${test.shortName} skill areas`}>
                {test.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{skill}</span>
                ))}
              </div>
              <a
                href={test.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg text-sm font-semibold text-[#0057B8] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0057B8] focus-visible:ring-offset-2"
              >
                {test.officialLabel} <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </article>
            );
          })}
        </div>

        <div className="mt-7 grid gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:grid-cols-[auto_1fr] sm:items-start sm:p-6">
          <ShieldCheck className="size-5 text-[#0057B8]" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-[#0B1F3A]">What ALO practice results mean</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Question counts and active-set status describe the local practice catalog only. They do not prove full test coverage, official content alignment, score equivalence or provider approval. Treat any result or automated feedback as a study aid, not an official score.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
