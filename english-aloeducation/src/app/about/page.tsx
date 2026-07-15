import Link from "next/link";

export const metadata = {
  title: "About ALO English Education",
};

const VALUES = [
  {
    title: "Excellence",
    desc: "We hold every learner to international standards — and help them exceed them.",
    icon: "🎯",
  },
  {
    title: "Accessibility",
    desc: "World-class English preparation, affordable to every student in Bangladesh.",
    icon: "🌍",
  },
  {
    title: "Innovation",
    desc: "AI tutors, automated writing evaluation, and real-time speaking feedback.",
    icon: "💡",
  },
  {
    title: "Integrity",
    desc: "Verifiable certificates. Transparent scoring. Honest feedback.",
    icon: "🛡️",
  },
];

const MILESTONES = [
  { year: "2018", text: "ALO Education founded in Dhaka as an overseas-study consultancy." },
  { year: "2020", text: "Launched in-person IELTS preparation with 200+ students." },
  { year: "2022", text: "Introduced AI-powered mock tests and writing evaluation." },
  { year: "2024", text: "Expanded to PTE, TOEFL, Duolingo, OIETC and Oxford ELLT preparation." },
  { year: "2025", text: "Launched the unified English.ALOEducation.com Web CRM platform." },
];

export default function AboutPage() {
  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">About ALO English Education</h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            ALO Education has been helping Bangladeshi students achieve their
            dreams of studying abroad since 2018. Our English learning
            platform combines certified examiners, AI tutors, and a complete
            CRM to deliver measurable outcomes — every time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-alo-card bg-white p-6 shadow-alo">
              <div className="text-3xl">{v.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-alo-navy">{v.title}</h3>
              <p className="mt-2 text-sm text-alo-muted">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold text-alo-navy">Our journey</h2>
          <ol className="mt-8 space-y-6 border-l-2 border-alo-soft-blue pl-6">
            {MILESTONES.map((m) => (
              <li key={m.year} className="relative">
                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-alo-orange text-xs font-bold text-white">
                  •
                </span>
                <p className="font-semibold text-alo-navy">{m.year}</p>
                <p className="mt-1 text-sm text-alo-muted">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-alo-navy">Want to learn more?</h2>
        <p className="mt-2 text-alo-muted">
          Reach out — we&apos;d love to hear from you.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-lg bg-alo-orange px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
        >
          Get in touch
        </Link>
      </section>
    </main>
  );
}
