"use client";

import { Sparkles, Play, ShieldCheck, Star, TrendingUp, Award, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRUST_STATS } from "@/lib/alo-data";

export function AloHero({
  onStart,
  onOpenAuth,
}: {
  onStart: () => void;
  onOpenAuth: (mode: "login" | "register") => void;
}) {
  return (
    <section id="top" className="relative overflow-hidden hero-gradient-blob">
      <div className="absolute inset-0 alphanumeric-grid opacity-40 pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3.5 py-1.5 text-xs font-semibold text-alo-blue">
              <Sparkles className="h-3.5 w-3.5" />
              ALO Smart Score Engine · 8 exam types
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-alo-navy">
              Master your{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-alo-blue">English exam</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9C40 3 160 3 198 9"
                    stroke="#E8501A"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              with premium practice.
            </h1>

            <p className="mt-6 max-w-2xl text-lg md:text-xl text-alo-muted leading-8">
              Full-length mock tests, realistic speaking interviews, and smart writing
              feedback for IELTS, PTE, TOEFL, Duolingo, OIETC and OET. ALO Education
              registered students get <span className="font-semibold text-alo-navy">3 free mock tests</span> —
              new visitors get <span className="font-semibold text-alo-navy">1 free</span>.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onStart}
                className="h-12 px-6 rounded-xl bg-alo-orange text-base font-semibold text-white shadow-sm hover:bg-[#d2460f] transition-colors"
              >
                <Play className="mr-2 h-5 w-5" />
                Take Free Mock Test
              </Button>
              <Button
                onClick={() => onOpenAuth("register")}
                variant="outline"
                className="h-12 px-6 rounded-xl border-alo-blue/30 bg-white text-base font-semibold text-alo-blue hover:bg-alo-soft-blue"
              >
                Create Free Account
              </Button>
            </div>

            {/* Trust stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-white/70 px-3 py-3">
                  <div className="text-xl font-extrabold text-alo-navy">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-alo-orange" />
                Trusted by 12,500+ students
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-alo-blue" />
                Practice-only · not official scores
              </span>
            </div>
          </div>

          {/* Right - image + floating cards */}
          <div className="relative">
            <div className="relative rounded-3xl border border-slate-200 bg-white p-2 shadow-xl">
              <img
                src="/images/hero-student.png"
                alt="Student preparing for English exam with laptop"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>

            {/* Floating score card */}
            <div className="absolute -left-4 sm:-left-8 top-10 animate-float-slow">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 shadow-xl w-44">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-orange">
                    <TrendingUp className="h-4 w-4 text-alo-orange" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Overall band</div>
                    <div className="text-lg font-extrabold text-alo-navy leading-none">7.5</div>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {[
                    { l: "Listening", v: 8, c: "bg-alo-blue" },
                    { l: "Reading", v: 7, c: "bg-alo-royal" },
                    { l: "Writing", v: 7, c: "bg-alo-orange" },
                    { l: "Speaking", v: 7.5, c: "bg-emerald-500" },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12">{s.l}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${s.c} rounded-full`} style={{ width: `${(s.v / 9) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-alo-navy w-6 text-right">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating speaking card */}
            <div className="absolute -right-2 sm:-right-6 bottom-8 animate-float-slower">
              <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3.5 shadow-xl w-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-blue">
                      <BarChart3 className="h-4 w-4 text-alo-blue" />
                    </div>
                    <div className="text-xs font-bold text-alo-navy">Speaking Eval</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    +1.2 band
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {[
                    { l: "Fluency", v: 92 },
                    { l: "Grammar", v: 88 },
                    { l: "Lexical", v: 85 },
                  ].map((m) => (
                    <div key={m.l} className="rounded-lg bg-slate-50 p-1.5 text-center">
                      <div className="text-sm font-extrabold text-alo-navy">{m.v}</div>
                      <div className="text-[9px] text-slate-500">{m.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  ALO Speaking Evaluator
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
