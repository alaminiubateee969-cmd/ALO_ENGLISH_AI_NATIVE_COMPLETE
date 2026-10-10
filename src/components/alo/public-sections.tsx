"use client";

import { useState } from "react";
import { Sparkles, Play, ShieldCheck, Star, TrendingUp, BarChart3, Award, Check, ChevronRight, Clock, Users, Gift, KeyRound, RefreshCw, UserCheck, Mic, PenLine, Headphones, BookOpen, GraduationCap, Send, CalendarClock, MapPin, Banknote, Zap, Heart, Quote, ArrowRight, Briefcase, Plane, FileText, Target, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "./app-shell";
import { PRICING_PLANS, FAQS, TESTIMONIALS, TRUST_STATS, JOURNEY_STEPS, FREE_QUOTA_RULES, CRM_SYNC_FIELDS, PRACTICE_DISCLAIMER, type Role } from "@/lib/platform-data";

/* ============== HERO ============== */
export function PublicHero() {
  const { openAuth } = useApp();
  return (
    <section id="top" className="relative overflow-hidden bg-white alo-gradient-hero">
      <div className="absolute inset-0 alphanumeric-grid opacity-30 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3.5 py-1.5 text-xs font-semibold text-alo-blue">
              <Sparkles className="h-3.5 w-3.5" />ORIGINAL EXAM-ALIGNED PRACTICE · 8 EXAM TYPES
            </div>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-alo-navy">
              Premium English exam practice,{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-alo-blue">10x better</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none"><path d="M2 9C40 3 160 3 198 9" stroke="#E8501A" strokeWidth="4" strokeLinecap="round" /></svg>
              </span>{" "}
              built for serious students.
            </h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-alo-muted">
              Original IELTS, PTE, TOEFL, Duolingo, OIETC & OET practice. Timed mock tests, speaking
              evaluator, writing feedback and Smart Score reports. ALO Education students get 3 free mocks.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={() => openAuth("register")} className="h-12 px-6 rounded-xl bg-alo-orange text-base font-semibold text-white alo-shadow-orange hover:bg-[#cc3f10]">
                <Play className="mr-2 h-5 w-5" />Start Free Practice
              </Button>
              <Button onClick={() => document.getElementById("exams")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="h-12 px-6 rounded-xl border-alo-blue/30 bg-white text-base font-semibold text-alo-blue hover:bg-alo-soft-blue">
                Explore Exams <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-alo-card bg-white/80 px-3 py-3 alo-shadow-sm">
                  <div className="text-xl md:text-2xl font-extrabold text-alo-navy">{stat.value}</div>
                  <div className="text-xs text-alo-faint">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-alo-faint">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-alo-success" />No credit card required</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-alo-orange" />Trusted by 12,500+ students</span>
              <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-alo-blue" />Practice-only · not official scores</span>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-3xl border border-slate-200 bg-white p-2 alo-shadow-xl overflow-hidden">
              <img src="/images/hero-student.png" alt="Student preparing for English exam with ALO English platform" className="w-full h-[300px] sm:h-[380px] lg:h-[440px] object-cover rounded-2xl" />
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 alo-shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-alo-orange" /><span className="text-sm font-bold text-alo-navy">Smart Score Engine</span>
              </div>
            </div>
            <div className="absolute -left-4 sm:-left-8 top-10 animate-float-slow hidden sm:block">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 alo-shadow-lg w-44">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-orange"><TrendingUp className="h-4 w-4 text-alo-orange" /></div>
                  <div><div className="text-[10px] uppercase tracking-wide text-alo-faint">Overall band</div><div className="text-lg font-extrabold text-alo-navy leading-none">7.5</div></div>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {[{ l: "Listening", v: 8, c: "bg-alo-blue" }, { l: "Reading", v: 7, c: "bg-alo-royal" }, { l: "Writing", v: 7, c: "bg-alo-orange" }, { l: "Speaking", v: 7.5, c: "bg-emerald-500" }].map((s) => (
                    <div key={s.l} className="flex items-center gap-2">
                      <span className="text-[10px] text-alo-faint w-12">{s.l}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${s.c} rounded-full`} style={{ width: `${(s.v / 9) * 100}%` }} /></div>
                      <span className="text-[10px] font-bold text-alo-navy w-6 text-right">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-2 sm:-right-6 bottom-8 animate-float-slower hidden sm:block">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 alo-shadow-lg w-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-blue"><BarChart3 className="h-4 w-4 text-alo-blue" /></div>
                    <div className="text-xs font-bold text-alo-navy">Speaking Eval</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-alo-success">+1.2 band</span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {[{ l: "Fluency", v: 92 }, { l: "Grammar", v: 88 }, { l: "Lexical", v: 85 }].map((m) => (
                    <div key={m.l} className="rounded-lg bg-slate-50 p-1.5 text-center"><div className="text-sm font-extrabold text-alo-navy">{m.v}</div><div className="text-[9px] text-alo-faint">{m.l}</div></div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-alo-faint"><Clock className="h-3 w-3" />ALO Speaking Evaluator</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== FREE QUOTA ============== */
export function PublicFreeQuota({ onVerify }: { onVerify: () => void }) {
  return (
    <section id="quota" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue"><Gift className="h-3.5 w-3.5" />Free Mock Test Quota</div>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">ALO students get 3 free. Everyone gets 1.</h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">Quota is enforced securely on our backend — refreshing the browser will not reset it.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="relative rounded-3xl border-2 border-alo-blue/30 bg-white p-7 alo-shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-alo-blue/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-alo-blue text-white"><UserCheck className="h-6 w-6" /></div>
              <span className="rounded-full bg-alo-blue px-3 py-1 text-xs font-bold text-white">ALO STUDENT</span>
            </div>
            <div className="mt-5 flex items-end gap-3"><div className="text-6xl font-extrabold text-alo-navy leading-none">3</div><div className="mb-1"><div className="text-sm font-bold text-alo-navy">free mock tests</div><div className="text-xs text-alo-faint">total, no expiry during study</div></div></div>
            <ul className="mt-5 space-y-2.5">
              {["Valid ALO Student ID (e.g. AE-2026000001)", "Verified email/phone from CRM sync", "Active application in ALO Web_CRM", "Admin can manually mark as ALO student", "Includes speaking & writing feedback", "Priority counselor follow-up"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-alo-navy"><Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" /><span>{item}</span></li>
              ))}
            </ul>
            <Button onClick={onVerify} className="mt-6 w-full h-12 rounded-xl bg-alo-blue text-white font-semibold hover:bg-[#004a9e]"><KeyRound className="mr-2 h-4 w-4" />Verify ALO Student ID</Button>
          </div>
          <div className="relative rounded-3xl border-2 border-alo-orange/30 bg-white p-7 alo-shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-alo-orange/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-alo-orange text-white"><Users className="h-6 w-6" /></div>
              <span className="rounded-full bg-alo-orange px-3 py-1 text-xs font-bold text-white">NEW VISITOR</span>
            </div>
            <div className="mt-5 flex items-end gap-3"><div className="text-6xl font-extrabold text-alo-navy leading-none">1</div><div className="mb-1"><div className="text-sm font-bold text-alo-navy">free mock test</div><div className="text-xs text-alo-faint">try the full platform</div></div></div>
            <ul className="mt-5 space-y-2.5">
              {["Any exam type of your choice", "Full-length mock experience", "Smart Score estimate report", "Basic writing feedback", "No credit card required", "Upgrade to bundle or prep course"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-alo-navy"><Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-orange" /><span>{item}</span></li>
              ))}
            </ul>
            <Button onClick={onVerify} variant="outline" className="mt-6 w-full h-12 rounded-xl border-alo-orange/40 text-alo-orange font-semibold hover:bg-alo-soft-orange">Start Free Mock Test</Button>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_QUOTA_RULES.map((r) => (
              <div key={r.rule} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><ShieldCheck className="h-4 w-4" /></div>
                <div><div className="text-sm font-bold text-alo-navy">{r.rule}</div><div className="text-xs text-alo-faint">{r.desc}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== MOCK TESTS EXPLAINER ============== */
export function PublicMockTests({ onStart }: { onStart: () => void }) {
  const features = [
    { icon: Clock, title: "Section & question timer", desc: "Sticky countdown with auto-submit" },
    { icon: BookOpen, title: "Question navigator", desc: "Palette with flag-for-review" },
    { icon: Check, title: "Autosave answers", desc: "Never lose progress on refresh" },
    { icon: Send, title: "Submit confirmation", desc: "Anti-refresh protection built in" },
    { icon: BarChart3, title: "Smart Score report", desc: "Band, CEFR & skill breakdown" },
    { icon: FileText, title: "Downloadable PDF", desc: "Strengths, weaknesses & plan" },
  ];
  return (
    <section id="mock-tests" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">ALO Test Engine</div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">A real mock test experience.</h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">Our exam engine replicates the real test interface — timer, question palette, flag-for-review, autosave, audio listening, writing editor and speaking recorder. Original, exam-aligned questions only.</p>
            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3 rounded-xl border border-alo-card bg-white p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><f.icon className="h-4 w-4" /></div>
                  <div><div className="text-sm font-bold text-alo-navy">{f.title}</div><div className="text-xs text-alo-faint">{f.desc}</div></div>
                </div>
              ))}
            </div>
            <Button onClick={onStart} className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]"><Play className="mr-2 h-4 w-4" />Launch Mock Test Engine</Button>
          </div>
          <div>
            <MockTestPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockTestPreview() {
  const [started, setStarted] = useState(false);
  if (!started) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 alo-shadow-sm">
        <div className="flex flex-col items-center text-center py-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-alo-soft-blue"><Clock className="h-8 w-8 text-alo-blue" /></div>
          <h3 className="mt-4 text-xl font-extrabold text-alo-navy">Try the mock test engine</h3>
          <p className="mt-2 text-sm text-alo-faint max-w-md">Login to the student portal to take a full timed mock test with 70+ original questions, score report and feedback.</p>
          <Button onClick={() => setStarted(true)} className="mt-5 h-12 px-6 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Play className="mr-2 h-4 w-4" />Preview interface</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white alo-shadow-sm overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-bold text-alo-blue">IELTS-style · Reading</span>
        <div className="flex items-center gap-1.5 rounded-lg bg-alo-soft-blue px-2.5 py-1.5 font-mono text-sm font-bold text-alo-blue"><Clock className="h-4 w-4" />54:32</div>
      </div>
      <div className="p-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Passage (original)</div>
          <p className="text-xs text-alo-navy leading-relaxed">The rise of remote work has reshaped urban economies. City-centre retail has declined while suburban co-working spaces have surged…</p>
        </div>
        <h3 className="text-sm font-bold text-alo-navy">According to the passage, what is one consequence of remote work?</h3>
        <div className="mt-3 space-y-2">
          {["Increased city-centre retail revenue", "Higher demand for suburban co-working", "Reduced suburban investment", "More daily commuting"].map((opt, i) => (
            <div key={opt} className={cn("flex items-center gap-2.5 rounded-lg border-2 p-2.5", i === 1 ? "border-alo-blue bg-alo-soft-blue" : "border-slate-200")}>
              <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold", i === 1 ? "bg-alo-blue text-white" : "bg-slate-100 text-alo-faint")}>{String.fromCharCode(65 + i)}</span>
              <span className="text-xs font-medium text-alo-navy">{opt}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((n, i) => (
            <span key={n} className={cn("grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold border-2", i === 0 ? "border-alo-blue bg-alo-blue text-white" : i < 1 ? "bg-alo-blue text-white border-transparent" : "bg-white text-alo-faint border-slate-200")}>{n}</span>
          ))}
        </div>
        <span className="text-[10px] text-alo-faint">Autosaved · 1/4 answered</span>
      </div>
    </div>
  );
}

/* ============== PRICING ============== */
export function PublicPricing({ onStart }: { onStart: () => void }) {
  return (
    <section id="pricing" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange"><Gift className="h-3.5 w-3.5" />Pricing & Vouchers</div>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">Start free. Upgrade when you're ready.</h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">Admins can also create free coupons, discounts and scholarships. Partner students with active ALO applications get benefits automatically.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className={cn("relative rounded-2xl border-2 p-6 flex flex-col", plan.highlighted ? "border-alo-orange bg-white shadow-xl lg:scale-[1.03]" : "border-slate-200 bg-white")}>
              {plan.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-alo-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{plan.badge}</span>}
              <h3 className="text-lg font-bold text-alo-navy">{plan.name}</h3>
              <p className="mt-1 text-xs text-alo-faint">{plan.description}</p>
              <div className="mt-4 flex items-end gap-1"><span className="text-4xl font-extrabold text-alo-navy">{plan.price}</span><span className="text-xs text-alo-faint mb-1.5">/ {plan.period}</span></div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-alo-navy"><Check className={cn("mt-0.5 h-4 w-4 shrink-0", plan.highlighted ? "text-alo-orange" : "text-alo-blue")} /><span className="leading-relaxed">{f}</span></li>
                ))}
              </ul>
              <Button onClick={onStart} className={cn("mt-6 h-12 rounded-xl font-semibold", plan.highlighted ? "bg-alo-orange text-white hover:bg-[#cc3f10]" : "border border-alo-blue/30 bg-white text-alo-blue hover:bg-alo-soft-blue")} variant={plan.highlighted ? "default" : "outline"}>{plan.cta}</Button>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div><div className="text-sm font-bold text-alo-navy">Supported payment gateways</div><div className="text-xs text-alo-faint">SSLCommerz · bKash · Nagad · Stripe — integration ready</div></div>
          <div className="flex flex-wrap items-center gap-2">
            {["SSLCommerz", "bKash", "Nagad", "Stripe"].map((p) => (<span key={p} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-alo-navy">{p}</span>))}
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-alo-success">Coupon ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== AMBASSADOR ============== */
export function PublicAmbassador({ onEnter }: { onEnter: () => void }) {
  const perks = [
    { icon: KeyRound, title: "Unique referral link", desc: "Share your personalised code" },
    { icon: Users, title: "Track referrals", desc: "Safe status of every referred student" },
    { icon: Gift, title: "Voucher rewards", desc: "Earn mock test vouchers per conversion" },
    { icon: TrendingUp, title: "Commission safe view", desc: "Transparent earnings dashboard" },
    { icon: FileText, title: "Marketing kit", desc: "Ready-made posters, captions and images" },
    { icon: Briefcase, title: "Ambassador portal", desc: "Dedicated dashboard with reports" },
  ];
  return (
    <section id="ambassador" className="py-16 lg:py-24 bg-alo-navy relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-alo-blue/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-alo-orange/20 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/30 bg-alo-orange/10 px-3 py-1 text-xs font-semibold text-alo-orange"><Users className="h-3.5 w-3.5" />Ambassador Program</div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Refer students. Earn rewards.</h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-slate-300">Become an ALO English Ambassador. Share your referral link, track referred students (safe status only), earn vouchers and commission.</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {perks.map((perk) => (
                <div key={perk.title} className="rounded-xl border border-white/10 bg-white/5 p-3.5"><perk.icon className="h-4 w-4 text-alo-orange" /><div className="mt-1.5 text-sm font-bold text-white">{perk.title}</div><div className="text-xs text-slate-400">{perk.desc}</div></div>
              ))}
            </div>
            <Button onClick={onEnter} className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]"><Users className="mr-2 h-4 w-4" />Open Ambassador Portal</Button>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-orange text-white text-xs font-bold">AR</div>
                <div><div className="text-sm font-bold text-white">Arif Rahman</div><div className="text-[11px] text-slate-400">Ambassador · AMB-2026-0042</div></div>
              </div>
              <span className="rounded-full bg-alo-orange/20 px-2.5 py-1 text-[10px] font-bold text-alo-orange">Active</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[{ l: "Referrals", v: "28" }, { l: "Converted", v: "12" }, { l: "Vouchers", v: "8" }].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><div className="text-2xl font-extrabold text-white">{s.v}</div><div className="text-[10px] text-slate-400">{s.l}</div></div>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Your referral link</div>
              <div className="flex items-center gap-2 rounded-lg bg-alo-navy/60 border border-white/10 px-3 py-2">
                <KeyRound className="h-4 w-4 text-alo-orange shrink-0" />
                <span className="text-xs text-slate-200 truncate font-mono">english.aloeducation.com/r/AMB-0042</span>
                <Button className="ml-auto h-7 rounded-md bg-alo-orange px-2 text-[10px] text-white hover:bg-[#cc3f10]">Copy</Button>
              </div>
            </div>
            <p className="mt-3 text-[10px] text-slate-500 text-center">Ambassadors see safe status only · no private student data</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== CRM INTEGRATION ============== */
export function PublicCrmIntegration() {
  return (
    <section id="crm" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue"><RefreshCw className="h-3.5 w-3.5" />ALO Web_CRM Integration</div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">Connected to ALO Education CRM.</h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">Every registration creates a CRM lead. Mock attempts, scores, feedback, voucher usage and counseling bookings sync automatically. If CRM is down, data saves locally and retries via cron.</p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                { t: "Auto lead creation", d: "source = english.aloeducation.com" },
                { t: "Score sync", d: "Latest mock to CRM timeline" },
                { t: "Counselor tasks", d: "Auto follow-up after each attempt" },
                { t: "Quota visibility", d: "Counselors see free quota & results" },
                { t: "Safe status only", d: "Students never see CRM private notes" },
                { t: "Offline-first", d: "Saves locally & retries if CRM down" },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" /><div><div className="text-sm font-bold text-alo-navy">{f.t}</div><div className="text-xs text-alo-faint">{f.d}</div></div></div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-alo-soft-blue to-white p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-blue text-white text-xs font-bold">EN</div>
                <div><div className="text-sm font-bold text-alo-navy">English Platform</div><div className="text-[11px] text-alo-faint">english.aloeducation.com</div></div>
              </div>
              <RefreshCw className="h-4 w-4 text-alo-blue" />
              <div className="flex items-center gap-2">
                <div><div className="text-sm font-bold text-alo-navy text-right">ALO Web_CRM</div><div className="text-[11px] text-alo-faint text-right">crm.aloeducation.com</div></div>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-orange text-white text-xs font-bold">CRM</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { l: "Student registers", t: "→ Lead created in CRM", c: "bg-alo-blue" },
                { l: "Mock attempt completed", t: "→ Score pushed to timeline", c: "bg-alo-royal" },
                { l: "Speaking eval done", t: "→ Feedback summary synced", c: "bg-alo-orange" },
                { l: "Voucher used", t: "→ Usage logged in CRM", c: "bg-emerald-500" },
                { l: "Counseling booked", t: "→ Follow-up task assigned", c: "bg-purple-500" },
                { l: "Payment completed", t: "→ Payment status updated", c: "bg-alo-navy" },
              ].map((row) => (
                <div key={row.l} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${row.c} text-white`}><RefreshCw className="h-3 w-3" /></span>
                  <div className="min-w-0 flex-1"><div className="text-xs font-bold text-alo-navy">{row.l}</div><div className="text-[10px] text-alo-faint">{row.t}</div></div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-alo-success">SYNCED</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {CRM_SYNC_FIELDS.map((f) => (<span key={f} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[9px] font-mono text-alo-faint">{f}</span>))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== TESTIMONIALS ============== */
export function PublicTestimonials() {
  return (
    <section className="py-16 lg:py-24 bg-alo-soft-blue">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange"><Star className="h-3.5 w-3.5 fill-alo-orange" />Student Results</div>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">Real students. Real score lifts.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-alo-card bg-white p-5 flex flex-col alo-shadow-sm hover:alo-shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <Quote className="h-7 w-7 text-alo-orange/30" />
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className="h-3.5 w-3.5 fill-alo-orange text-alo-orange" />))}</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-alo-muted flex-1">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold">{t.initials}</div>
                <div className="min-w-0"><div className="text-sm font-bold text-alo-navy truncate">{t.name}</div><div className="text-xs text-alo-faint truncate">{t.role}</div></div>
                <span className="ml-auto rounded-full bg-alo-soft-orange px-2 py-0.5 text-[10px] font-bold text-alo-orange shrink-0">{t.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============== FAQ ============== */
export function PublicFaq() {
  return (
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">FAQ</div>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">Questions, answered.</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-alo-card bg-white px-5 alo-shadow-sm">
              <AccordionTrigger className="text-left text-base font-bold text-alo-navy hover:no-underline py-5">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm md:text-base leading-7 text-alo-muted pb-5">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ============== LEAD CAPTURE ============== */
export function PublicLeadCapture() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", exam: "", country: "", message: "" });
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { toast({ title: "Please fill in your name, email and phone.", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const referralCode = new URLSearchParams(window.location.search).get("ref") || undefined;
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, source: "english.aloeducation.com", referralCode }) });
      const data = await res.json();
      if (res.ok && data.success) { toast({ title: "Counseling request received!", description: "An ALO Education advisor will contact you." }); setForm({ name: "", email: "", phone: "", exam: "", country: "", message: "" }); }
      else toast({ title: "Request could not be sent", description: data.message || "Please check your details and try again.", variant: "destructive" });
    } catch { toast({ title: "Network error", description: "Your request was not submitted. Please try again.", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };
  return (
    <section id="contact" className="py-16 lg:py-24 bg-gradient-to-br from-alo-soft-blue via-white to-alo-soft-orange relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-blue/10 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-white px-3 py-1 text-xs font-semibold text-alo-orange"><CalendarClock className="h-3.5 w-3.5" />Book Free Counseling</div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">Talk to an ALO Education advisor — free.</h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">Not sure which exam? Book a free 1:1 session. Our certified counselors will build your personalized prep plan.</p>
            <div className="mt-6 space-y-3">
              {[{ icon: ShieldCheck, t: "100% free first session", d: "No obligation, no hidden fees" }, { icon: Users, t: "Certified counselors", d: "10+ years average experience" }, { icon: CalendarClock, t: "Flexible scheduling", d: "Online or in-person at ALO offices" }, { icon: GraduationCap, t: "12,500+ students guided", d: "97% visa success rate" }].map((b) => (
                <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange"><b.icon className="h-4 w-4" /></div>
                  <div><div className="text-sm font-bold text-alo-navy">{b.t}</div><div className="text-xs text-alo-faint">{b.d}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 alo-shadow-xl">
            <h3 className="text-xl font-extrabold text-alo-navy">Request your free session</h3>
            <p className="text-sm text-alo-faint mt-1">We'll create a CRM lead and an advisor will reach out.</p>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="name" className="text-xs font-semibold text-alo-navy">Full name *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="h-11 rounded-xl border-slate-200" /></div>
                <div className="space-y-1.5"><Label htmlFor="phone" className="text-xs font-semibold text-alo-navy">Phone *</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1XXX-XXXXXX" className="h-11 rounded-xl border-slate-200" /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="email" className="text-xs font-semibold text-alo-navy">Email *</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="h-11 rounded-xl border-slate-200" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs font-semibold text-alo-navy">Exam interest</Label><Select value={form.exam} onValueChange={(v) => setForm({ ...form, exam: v })}><SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select exam" /></SelectTrigger><SelectContent>{["IELTS Academic", "IELTS UKVI", "PTE Academic", "TOEFL iBT", "Duolingo", "OIETC / ELLT", "OET", "Not sure yet"].map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold text-alo-navy">Target country</Label><Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}><SelectTrigger className="h-11 rounded-xl border-slate-200"><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{["UK", "USA", "Canada", "Australia", "Ireland", "New Zealand", "Dubai", "Other"].map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="message" className="text-xs font-semibold text-alo-navy">Message (optional)</Label><Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your goals, current score, target intake…" className="rounded-xl border-slate-200 min-h-[80px]" /></div>
              <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10] disabled:opacity-50">{submitting ? "Sending…" : (<><Send className="mr-2 h-4 w-4" />Book Free Counseling</>)}</Button>
              <p className="text-[11px] text-alo-faint text-center">By submitting you agree to our Terms & Privacy Policy. Data syncs to ALO Web_CRM.</p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============== FINAL CTA ============== */
export function PublicFinalCta({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl alo-gradient-navy p-8 lg:p-14">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">Ready to ace your English exam?</h2>
              <p className="mt-4 text-base md:text-lg leading-8 text-slate-200">Start your free mock test now. ALO Education students get 3 free — new visitors get 1 free. No card required.</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button onClick={onStart} className="h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">Take Free Mock Test</Button>
                <a href="#contact"><Button variant="outline" className="h-12 px-6 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20">Book Free Counseling</Button></a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[{ v: "48,200+", l: "Mock tests delivered" }, { v: "12,500+", l: "Students prepared" }, { v: "+1.2", l: "Average band lift" }, { v: "8", l: "Exam types covered" }].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5"><div className="text-3xl font-extrabold text-white">{s.v}</div><div className="text-xs text-slate-300 mt-1">{s.l}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
