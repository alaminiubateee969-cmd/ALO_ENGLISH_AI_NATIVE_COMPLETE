"use client";

import { useEffect, useState } from "react";
import { Sparkles, Play, ShieldCheck, Star, ChevronRight, MapPin, TrendingUp, BarChart3, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DESTINATIONS, TRUST_STATS } from "@/lib/alo-data";

export function AloHero({
  onStart,
  onOpenAuth,
}: {
  onStart: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % DESTINATIONS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const active = DESTINATIONS[activeIdx];

  return (
    <section id="top" className="relative overflow-hidden bg-white alo-gradient-hero">
      <div className="absolute inset-0 alphanumeric-grid opacity-30 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3.5 py-1.5 text-xs font-semibold text-alo-blue">
              <Sparkles className="h-3.5 w-3.5" />
              BANGLADESH&apos;S PREMIUM STUDY-ABROAD &amp; CRM PLATFORM
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-alo-navy">
              From your ambition to{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-alo-blue">admission</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 9C40 3 160 3 198 9" stroke="#E8501A" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              , we&apos;re with you all the way.
            </h1>

            <p className="mt-6 max-w-2xl text-lg md:text-xl leading-8 text-alo-muted">
              Expert counseling for UK, Canada, Australia, USA, Ireland, New Zealand &amp; Dubai.
              Find the right course, ace your English test, secure scholarships and your visa —
              all in one premium platform powered by ALO AI Copilot.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onStart}
                className="h-12 px-6 rounded-xl bg-alo-orange text-base font-semibold text-white alo-shadow-orange hover:bg-[#cc3f10] transition-colors"
              >
                <Play className="mr-2 h-5 w-5" />
                Book Free Consultation
              </Button>
              <Button
                onClick={() => document.getElementById("course-finder")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                className="h-12 px-6 rounded-xl border-alo-blue/30 bg-white text-base font-semibold text-alo-blue hover:bg-alo-soft-blue"
              >
                Find Courses
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>

            {/* Trust stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-alo-card bg-white/80 px-3 py-3 alo-shadow-sm">
                  <stat.icon className="h-4 w-4 text-alo-orange mb-1" />
                  <div className="text-xl md:text-2xl font-extrabold text-alo-navy">{stat.value}</div>
                  <div className="text-xs text-alo-faint">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-alo-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-alo-success" />
                97% visa success rate
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-alo-orange" />
                Trusted by 12,500+ students
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-alo-blue" />
                Certified education counselors
              </span>
            </div>
          </div>

          {/* Right - rotating destination image */}
          <div className="relative">
            <div className="relative rounded-3xl border border-slate-200 bg-white p-2 alo-shadow-xl overflow-hidden">
              <div className="relative overflow-hidden rounded-2xl">
                {DESTINATIONS.map((d, i) => (
                  <img
                    key={d.id}
                    src={d.image}
                    alt={`${d.name} university campus — ALO Education study abroad`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className={`w-full h-[300px] sm:h-[380px] lg:h-[440px] object-cover transition-opacity duration-700 ${
                      i === activeIdx ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                  />
                ))}
                {/* Country badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 alo-shadow-sm">
                  <span className="text-lg">{active.flag}</span>
                  <span className="text-sm font-bold text-alo-navy">{active.name}</span>
                </div>
                {/* Accent dot */}
                <div
                  className="absolute top-4 right-4 h-3 w-3 rounded-full ring-4 ring-white"
                  style={{ backgroundColor: active.accent }}
                />
              </div>
            </div>

            {/* Floating score card */}
            <div className="absolute -left-4 sm:-left-8 top-10 animate-float-slow hidden sm:block">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 alo-shadow-lg w-44">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-orange">
                    <TrendingUp className="h-4 w-4 text-alo-orange" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-alo-faint">Visa success</div>
                    <div className="text-lg font-extrabold text-alo-navy leading-none">97%</div>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-alo-orange rounded-full" style={{ width: "97%" }} />
                </div>
              </div>
            </div>

            {/* Floating applications card */}
            <div className="absolute -right-2 sm:-right-6 bottom-8 animate-float-slower hidden sm:block">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 alo-shadow-lg w-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-blue">
                      <BarChart3 className="h-4 w-4 text-alo-blue" />
                    </div>
                    <div className="text-xs font-bold text-alo-navy">Applications</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-alo-success">+12%</span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {[
                    { l: "UK", v: 412 },
                    { l: "CAN", v: 318 },
                    { l: "AUS", v: 264 },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg bg-slate-50 p-1.5 text-center">
                      <div className="text-sm font-extrabold text-alo-navy">{m.v}</div>
                      <div className="text-[9px] text-alo-faint">{m.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-alo-faint">
                  <MapPin className="h-3 w-3" />
                  Live CRM dashboard
                </div>
              </div>
            </div>

            {/* Destination dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {DESTINATIONS.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Show ${d.name}`}
                  className={`h-1.5 rounded-full transition-all ${i === activeIdx ? "w-8 bg-alo-orange" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
