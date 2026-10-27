"use client";

import { UserPlus, FileText, Mic, BarChart3, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: UserPlus,
    title: "Register free",
    desc: "Create your account in 30 seconds. Every exam and mock is free and unlimited from the first login.",
    color: "bg-alo-blue",
  },
  {
    icon: FileText,
    title: "Pick an exam & mock test",
    desc: "Choose from IELTS, PTE, TOEFL, Duolingo, OIETC, OET or ALO Placement. Full-length or section practice.",
    color: "bg-alo-royal",
  },
  {
    icon: Mic,
    title: "Take the test",
    desc: "Real timer, question palette, autosave, listening audio, writing editor and speaking recorder.",
    color: "bg-alo-orange",
  },
  {
    icon: BarChart3,
    title: "Get smart feedback",
    desc: "Smart Score estimate, skill breakdown, writing & speaking feedback, downloadable PDF report.",
    color: "bg-emerald-500",
  },
];

const FEATURES = [
  { title: "Smart Score Engine", desc: "Band, CEFR & sub-skill estimates" },
  { title: "Speaking Evaluator", desc: "Fluency, pronunciation, grammar & more" },
  { title: "Writing Feedback", desc: "Task, coherence, lexical & grammar" },
  { title: "CRM Sync", desc: "Results pushed to ALO Web_CRM" },
  { title: "Downloadable Reports", desc: "PDF with strengths & plan" },
  { title: "Voucher System", desc: "Coupons, scholarships & bundles" },
  { title: "Ambassador Portal", desc: "Referrals, vouchers & commission" },
  { title: "Counselor Follow-up", desc: "Auto tasks after each attempt" },
];

export function AloHowItWorks({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">
            How It Works
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            From sign-up to score in 4 steps.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            A clean, guided journey — no clutter, no confusion. Just premium exam practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
              <div className="absolute -top-3 -right-3 grid h-8 w-8 place-items-center rounded-full bg-alo-navy text-white text-sm font-extrabold">
                {i + 1}
              </div>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${step.color} text-white`}>
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-alo-navy">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 h-5 w-5 text-slate-300" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button onClick={onStart} className="h-12 px-8 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]">
            Start Free Mock Test
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Feature marquee */}
      <div className="mt-16 border-y border-slate-200 bg-slate-50 py-6 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...FEATURES, ...FEATURES].map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 shrink-0">
              <ShieldCheck className="h-4 w-4 text-alo-blue" />
              <span className="text-sm font-bold text-alo-navy">{f.title}</span>
              <span className="text-xs text-slate-400">— {f.desc}</span>
              <span className="text-slate-300 ml-6">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
