"use client";

import { Check, ArrowRight, Sparkles, ShieldCheck, Users, Award, Clock, Heart, Star, Zap, Quote, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SERVICES, SCHOLARSHIPS, UNIVERSITIES, JOURNEY_STEPS } from "@/lib/alo-data";

export function AloServices({ onCta }: { onCta: () => void }) {
  return (
    <section id="services" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Our Services</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            End-to-end study abroad support.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            From your first counseling session to landing at your destination, our certified team
            and AI tools handle every step of your journey.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.id}
              className="group rounded-2xl border border-alo-card bg-white p-6 h-full flex flex-col alo-shadow-sm hover:alo-shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={cn("grid h-12 w-12 place-items-center rounded-xl text-white", s.accent === "orange" ? "bg-alo-orange" : "bg-alo-blue")}>
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg md:text-xl font-bold text-alo-navy">{s.title}</h3>
              <p className="mt-2 text-sm md:text-base leading-7 text-alo-muted">{s.description}</p>
              <ul className="mt-4 space-y-2 flex-1">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-alo-navy">
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", s.accent === "orange" ? "text-alo-orange" : "text-alo-blue")} />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={onCta} className={cn("mt-4 text-sm font-semibold inline-flex items-center gap-1", s.accent === "orange" ? "text-alo-orange" : "text-alo-blue")}>
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AloWhyAlo() {
  const reasons = [
    { icon: Users, title: "Certified counselors", desc: "10+ years average experience guiding Bangladeshi students abroad.", color: "bg-alo-blue" },
    { icon: ShieldCheck, title: "97% visa success", desc: "Document-perfect applications and interview readiness.", color: "bg-alo-success" },
    { icon: Zap, title: "AI Copilot Live", desc: "AI SOP Writer, CV Auditor and Study Matchmaker accelerate your prep.", color: "bg-alo-orange" },
    { icon: Award, title: "Scholarship focus", desc: "We've helped students secure over ৳12 Cr in scholarships.", color: "bg-alo-royal" },
    { icon: Clock, title: "Always-on support", desc: "WhatsApp, chat and helpdesk from application to arrival.", color: "bg-alo-warning" },
    { icon: Heart, title: "Student-first", desc: "No hidden fees. Transparent, ethical, student-friendly guidance.", color: "bg-alo-danger" },
  ];
  return (
    <section className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-alo-orange/8 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Why ALO Education</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            The trusted choice of 12,500+ students.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            We combine certified human counselors with AI tools to deliver a premium,
            transparent and results-driven study abroad experience.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl border border-alo-card bg-white p-6 alo-shadow-sm hover:alo-shadow-lg transition-all">
              <div className={cn("grid h-12 w-12 place-items-center rounded-xl text-white", r.color)}>
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-alo-navy">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-alo-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AloScholarships({ onCta }: { onCta: () => void }) {
  return (
    <section id="scholarships" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Scholarships</div>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
              Reduce your tuition with scholarships.
            </h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
              We match you to merit, need-based and country-specific scholarships — and help you
              craft winning essays. Our students have secured over ৳12 crore in scholarships.
            </p>
            <div className="mt-6 rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-5">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-alo-orange" />
                <span className="text-sm font-bold text-alo-navy">Scholarship highlights</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-alo-navy">
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-alo-orange" /> Chevening, Commonwealth, Fulbright</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-alo-orange" /> University merit awards up to 50%</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-alo-orange" /> Country-specific government grants</li>
                <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-alo-orange" /> Essay & interview support included</li>
              </ul>
              <Button onClick={onCta} className="mt-4 w-full h-11 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]">
                Check Eligibility
              </Button>
            </div>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-4">
            {SCHOLARSHIPS.map((s) => (
              <div key={s.id} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-alo-soft-blue px-2 py-0.5 text-[11px] font-bold text-alo-blue">{s.country}</span>
                  <span className="text-[11px] font-semibold text-alo-faint">{s.level}</span>
                </div>
                <h3 className="mt-2 text-base font-bold text-alo-navy">{s.name}</h3>
                <div className="mt-2 text-lg font-extrabold text-alo-orange">{s.amount}</div>
                <p className="mt-2 text-xs text-alo-muted leading-6">{s.eligibility}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloUniversityCarousel() {
  return (
    <section className="py-12 lg:py-16 bg-alo-soft-gray border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">University Partners</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-alo-navy">4,000+ universities across 7 destinations</h2>
        </div>
        <div className="relative overflow-hidden">
          <div className="flex gap-3 animate-marquee">
            {[...UNIVERSITIES, ...UNIVERSITIES].map((u, i) => (
              <div key={i} className="shrink-0 w-60 rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-alo-soft-blue text-xl">{u.flag}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-alo-navy truncate">{u.name}</div>
                    <div className="text-xs text-alo-faint">{u.country}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="rounded-md bg-alo-soft-orange px-2 py-0.5 font-semibold text-alo-orange">{u.ranking}</span>
                  <span className="text-alo-faint truncate ml-2">{u.popularFor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloJourney() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Student Journey</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            Your roadmap from ambition to admission.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Six clear steps with our team and AI Copilot guiding you at every stage.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {JOURNEY_STEPS.map((step) => (
            <div key={step.step} className="relative rounded-2xl border border-alo-card bg-white p-6 alo-shadow-sm hover:alo-shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-alo-navy text-white">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-extrabold text-slate-100">{step.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-alo-navy">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-alo-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AloAiCounselor({ onCta }: { onCta: () => void }) {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-alo-soft-blue via-white to-alo-soft-orange relative overflow-hidden">
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-alo-blue/8 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue">
              <Sparkles className="h-3.5 w-3.5" />
              ALO AI Copilot
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
              Your AI admissions assistant, always on.
            </h2>
            <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
              The ALO AI Admissions Assistant helps you search courses, draft your SOP, audit your
              CV, practice interviews and plan your career path — 24/7, in Bangla and English.
              Always supervised by certified human counselors.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                { icon: GraduationCap, t: "AI Study Matchmaker", d: "Best-fit courses for your profile" },
                { icon: Star, t: "AI SOP Writer", d: "Drafts tailored to each university" },
                { icon: ShieldCheck, t: "AI CV Auditor", d: "ATS-friendly resume optimization" },
                { icon: Users, t: "AI Credibility Practice", d: "Mock visa & CAS interviews" },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                  <f.icon className="h-4 w-4 text-alo-orange" />
                  <div className="mt-1.5 text-sm font-bold text-alo-navy">{f.t}</div>
                  <div className="text-xs text-alo-faint">{f.d}</div>
                </div>
              ))}
            </div>
            <Button onClick={onCta} className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
              <Sparkles className="mr-2 h-4 w-4" />
              Try AI Copilot Free
            </Button>
          </div>

          {/* AI chat mock */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 alo-shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-orange text-white"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-bold text-alo-navy">ALO AI Admissions Assistant</div>
                  <div className="text-[11px] text-alo-success flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-alo-success" /> Online now</div>
                </div>
              </div>
              <span className="rounded-full bg-alo-soft-blue px-2.5 py-1 text-[10px] font-bold text-alo-blue">AI COPILOT LIVE</span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto alo-scroll">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-alo-blue px-3.5 py-2 text-sm text-white">
                  I want to study MSc Data Science in the UK. My IELTS is 6.5 and budget is £25k/yr.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-sm text-alo-navy">
                  Great profile! Based on your IELTS 6.5 and £25k budget, I found 8 matching UK courses. Top picks: <span className="font-semibold text-alo-blue">University of Edinburgh MSc Data Science</span> (£28,200, scholarship up to 30%) and <span className="font-semibold text-alo-blue">University of Leeds</span> (£27,500, merit 25%).
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-sm text-alo-navy">
                  Shall I draft your SOP for Edinburgh and book a free counseling session?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-alo-blue px-3.5 py-2 text-sm text-white">
                  Yes, draft SOP and book counseling 🎓
                </div>
              </div>
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-alo-soft-orange px-3.5 py-2 text-sm text-alo-navy border border-alo-orange/20">
                  <Quote className="inline h-3.5 w-3.5 text-alo-orange mr-1" />
                  SOP draft saved to your Documents Hub. Counseling booked for Fri 4:00 PM with Rumana Sultana. ✅
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <input placeholder="Ask anything about studying abroad…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-alo-faint" />
              <Button size="sm" className="h-8 rounded-lg bg-alo-orange px-3 text-white hover:bg-[#cc3f10]">Send</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
