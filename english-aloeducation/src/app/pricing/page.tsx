import Link from "next/link";

import { formatCurrency } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Starter",
    tagline: "Try the platform free, forever.",
    price: 0,
    currency: "BDT",
    period: "forever",
    features: [
      "1 complimentary mock test",
      "Limited question bank access",
      "Basic AI tutor (5 queries/day)",
      "Community support",
    ],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro Learner",
    tagline: "For serious test-takers.",
    price: 2999,
    currency: "BDT",
    period: "month",
    features: [
      "Unlimited mock tests",
      "Full question bank (10,000+)",
      "Unlimited AI tutor & writing evaluator",
      "AI Speaking Coach (30 min/day)",
      "Verifiable digital certificates",
      "Email & WhatsApp support",
    ],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    id: "alo",
    name: "ALO Student",
    tagline: "Exclusive for ALO Education enrollees.",
    price: 0,
    currency: "BDT",
    period: "with enrollment",
    features: [
      "3 free mock tests per exam type",
      "Priority access to live classes",
      "Dedicated study plan & mentor",
      "All AI features included",
      "Free certificate on completion",
    ],
    cta: "Talk to us",
  },
];

export default function PricingPage() {
  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Simple, transparent pricing</h1>
          <p className="mt-3 max-w-2xl mx-auto text-blue-100">
            Whether you&apos;re studying solo or enrolled with ALO Education,
            there&apos;s a plan for you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-alo ${
                p.highlight ? "border-alo-orange ring-2 ring-alo-orange" : "border-alo-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-alo-orange px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-alo-navy">{p.name}</h3>
              <p className="mt-1 text-sm text-alo-muted">{p.tagline}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-alo-navy">
                  {p.price === 0 ? "Free" : formatCurrency(p.price, p.currency)}
                </span>
                <span className="ml-2 text-sm text-alo-faint">/ {p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-alo-muted">
                    <span className="mt-0.5 text-alo-orange">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                <Link
                  href={p.id === "alo" ? "/contact" : "/register"}
                  className={`block w-full rounded-lg px-4 py-2.5 text-center font-semibold transition ${
                    p.highlight
                      ? "bg-alo-orange text-white hover:bg-orange-600"
                      : "bg-alo-soft-blue text-alo-blue hover:bg-blue-100"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-alo-card bg-white p-8 text-center">
          <h3 className="text-lg font-semibold text-alo-navy">Need a custom plan for your institution?</h3>
          <p className="mt-2 text-sm text-alo-muted">
            We offer bulk licensing, white-label portals, and dedicated
            examiners for universities and consultancies.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-lg bg-alo-navy px-6 py-2.5 font-semibold text-white transition hover:bg-navy-900"
          >
            Contact sales
          </Link>
        </div>
      </section>
    </main>
  );
}
