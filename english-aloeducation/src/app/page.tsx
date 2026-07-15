import Link from "next/link";

import { formatDate } from "@/lib/utils";

const EXAM_TYPES = [
  { name: "IELTS Academic", desc: "Band 1–9 · 4 sections · 2h 45m", icon: "🎓" },
  { name: "IELTS UKVI", desc: "UK visa & immigration approved", icon: "🇬🇧" },
  { name: "PTE Academic", desc: "Computer-based · 10–90 score", icon: "💻" },
  { name: "TOEFL iBT", desc: "120-point · 4 skills", icon: "📚" },
  { name: "Duolingo English Test", desc: "Adaptive · 10–160 score", icon: "🦉" },
  { name: "OIETC", desc: "Online English test · B1–C1", icon: "🌐" },
  { name: "Oxford ELLT", desc: "Language Level Test · 6 levels", icon: "📖" },
  { name: "Spoken English", desc: "Fluency & pronunciation focus", icon: "🗣️" },
  { name: "Academic English", desc: "EAP · university readiness", icon: "🎓" },
  { name: "Business English", desc: "BEC-style professional fluency", icon: "💼" },
  { name: "Grammar", desc: "Foundational & advanced drills", icon: "✏️" },
  { name: "Vocabulary", desc: "Academic word lists · AWL", icon: "🔤" },
];

const FEATURES = [
  { title: "Mock Tests", desc: "Full-length timed practice tests that mirror the real exam.", icon: "📝" },
  { title: "Question Bank", desc: "10,000+ curated questions across every section & difficulty.", icon: "🗂️" },
  { title: "AI Tutor", desc: "Personalised 24/7 explanations across Reading, Listening & Grammar.", icon: "🤖" },
  { title: "AI Speaking Coach", desc: "Real-time pronunciation & fluency feedback on recorded speech.", icon: "🎤" },
  { title: "AI Writing Evaluator", desc: "Instant band estimate with grammar, lexical & coherence scoring.", icon: "✍️" },
  { title: "Certificates", desc: "Verifiable digital certificates with public lookup URL.", icon: "🏆" },
];

const STATS = [
  { label: "Students Enrolled", value: "12,000+" },
  { label: "Active Courses", value: "48" },
  { label: "Mock Tests Taken", value: "240,000+" },
  { label: "Success Rate", value: "94%" },
];

export default function HomePage() {
  return (
    <main>
      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden bg-alo-navy text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #0057B8 0, transparent 40%), radial-gradient(circle at 80% 70%, #E8501A 0, transparent 35%)" }} />
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 ring-1 ring-white/20">
            <span className="h-2 w-2 rounded-full bg-alo-orange" />
            Trusted by 12,000+ learners across Bangladesh
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            Learn English. Ace Your Exam.{" "}
            <span className="bg-gradient-to-r from-alo-orange to-amber-400 bg-clip-text text-transparent">
              Achieve Your Dream.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-blue-100">
            ALO English Education brings together AI-powered mock tests,
            certified examiners, and a complete CRM — for IELTS, PTE, TOEFL,
            Duolingo, OIETC and Oxford ELLT preparation.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white shadow-alo-lg transition hover:bg-orange-600"
            >
              Start Free Mock Test
            </Link>
            <Link
              href="/courses"
              className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ============= STATS ============= */}
      <section className="border-b border-alo-soft-blue bg-alo-soft-gray">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-alo-navy md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-alo-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============= EXAM TYPES ============= */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-alo-navy md:text-4xl">
            Exam preparation for every goal
          </h2>
          <p className="mt-3 text-alo-muted">
            Choose the exam you&apos;re targeting — we&apos;ve got mock tests,
            question banks, and AI feedback tailored to each one.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {EXAM_TYPES.map((exam) => (
            <Link
              key={exam.name}
              href="/exams"
              className="group rounded-xl border border-alo-card bg-white p-5 shadow-alo transition hover:-translate-y-0.5 hover:border-alo-blue hover:shadow-alo-lg"
            >
              <div className="text-3xl">{exam.icon}</div>
              <h3 className="mt-3 font-semibold text-alo-navy group-hover:text-alo-blue">
                {exam.name}
              </h3>
              <p className="mt-1 text-sm text-alo-muted">{exam.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ============= FEATURES ============= */}
      <section className="bg-alo-soft-blue">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-alo-navy md:text-4xl">
              Everything you need to score higher
            </h2>
            <p className="mt-3 text-alo-muted">
              A unified platform that blends AI, certified examiners, and a
              comprehensive CRM.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-alo-card bg-white p-6 shadow-alo"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-alo-soft-blue text-2xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-alo-navy">{f.title}</h3>
                <p className="mt-2 text-sm text-alo-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section className="bg-alo-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to begin your English journey?
          </h2>
          <p className="mt-4 max-w-2xl text-blue-100">
            Create your free account today and take your first mock test on us.
            ALO students receive 3 free attempts per exam type.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white shadow-alo-lg transition hover:bg-orange-600"
            >
              Sign up free
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-6 text-xs text-blue-200">
            Last updated {formatDate(new Date())} · ALO English Education
          </p>
        </div>
      </section>
    </main>
  );
}
