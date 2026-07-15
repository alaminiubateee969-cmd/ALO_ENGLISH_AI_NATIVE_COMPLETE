"use client";

import {
  LayoutDashboard,
  Gift,
  Award,
  TrendingUp,
  Mic,
  PenLine,
  CalendarClock,
  MessageSquare,
  Download,
  FileText,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function AloDashboardPreview({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  return (
    <section id="dashboard" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-alo-orange/8 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Student Dashboard
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            Your entire prep journey in one place.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            Track free quota, scores, speaking & writing feedback, recommended next steps,
            counselor messages and downloadable reports — all in a premium dashboard.
          </p>
        </div>

        {/* Dashboard mock */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-alo-blue text-white text-xs font-bold">T</div>
              <div>
                <div className="text-sm font-bold text-alo-navy">Welcome back, Tasnia</div>
                <div className="text-[11px] text-slate-500">ALO Student · AE-2026000001</div>
              </div>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <ShieldCheck className="h-3 w-3" />
              ALO Education Student Benefits Active
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Gift, label: "Free mocks left", value: "2", sub: "of 3", color: "orange" },
                { icon: Award, label: "Best score", value: "7.5", sub: "IELTS band", color: "blue" },
                { icon: TrendingUp, label: "Average score", value: "7.0", sub: "+1.2 lift", color: "blue" },
                { icon: CalendarClock, label: "Next session", value: "Fri", sub: "4:00 PM", color: "orange" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${kpi.color === "orange" ? "bg-alo-soft-orange text-alo-orange" : "bg-alo-soft-blue text-alo-blue"}`}>
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <div className="mt-2.5 flex items-end gap-1.5">
                    <span className="text-2xl font-extrabold text-alo-navy">{kpi.value}</span>
                    <span className="text-[11px] text-slate-400 mb-1">{kpi.sub}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{kpi.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid lg:grid-cols-3 gap-4">
              {/* Score progression chart */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-bold text-alo-navy">Score progression</div>
                    <div className="text-[11px] text-slate-500">Last 5 mock tests</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">+1.2 band</span>
                </div>
                {/* Simple bar chart */}
                <div className="flex items-end justify-between gap-3 h-32">
                  {[
                    { m: "Mock 1", v: 6.0, h: 50 },
                    { m: "Mock 2", v: 6.5, h: 60 },
                    { m: "Mock 3", v: 7.0, h: 72 },
                    { m: "Mock 4", v: 7.0, h: 72 },
                    { m: "Mock 5", v: 7.5, h: 88 },
                  ].map((bar) => (
                    <div key={bar.m} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-alo-navy">{bar.v}</span>
                      <div className="w-full rounded-t-lg bg-gradient-to-t from-alo-blue to-alo-royal" style={{ height: `${bar.h}%` }} />
                      <span className="text-[10px] text-slate-400">{bar.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speaking & writing scores */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-bold text-alo-navy mb-3">Skill breakdown</div>
                <div className="space-y-3">
                  {[
                    { icon: BookOpen, l: "Listening", v: 8, c: "bg-alo-blue" },
                    { icon: BookOpen, l: "Reading", v: 7, c: "bg-alo-royal" },
                    { icon: PenLine, l: "Writing", v: 7, c: "bg-alo-orange" },
                    { icon: Mic, l: "Speaking", v: 7.5, c: "bg-emerald-500" },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 font-semibold text-alo-navy">
                          <s.icon className="h-3.5 w-3.5 text-slate-400" />
                          {s.l}
                        </span>
                        <span className="font-bold text-alo-navy">{s.v}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${s.c} rounded-full`} style={{ width: `${(s.v / 9) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid lg:grid-cols-3 gap-4">
              {/* Recommended next */}
              <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange/40 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-alo-orange" />
                  <span className="text-xs font-bold uppercase tracking-wider text-alo-orange">Recommended next</span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-alo-navy">IELTS Mock Test #6 — Reading focus</div>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Based on your last 2 attempts, your reading consistency can lift your overall band.
                </p>
                <Button className="mt-3 h-9 w-full rounded-lg bg-alo-orange text-white text-xs hover:bg-[#d2460f]">
                  Start recommended test
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Reports */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-alo-blue" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reports</span>
                </div>
                <div className="space-y-2">
                  {["Mock #5 · IELTS · Band 7.5", "Speaking eval · 88/100", "Writing feedback · Band 6.5"].map((r) => (
                    <div key={r} className="flex items-center justify-between rounded-lg border border-slate-200 px-2.5 py-1.5">
                      <span className="text-[11px] font-medium text-alo-navy truncate">{r}</span>
                      <Download className="h-3.5 w-3.5 text-alo-blue shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Counselor message */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-alo-blue" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Counselor</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-alo-blue text-white text-[10px] font-bold">RS</div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-alo-navy">Rumana Sultana</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Great progress! Your speaking is at 7.5. Let's book a 1:1 review Friday 4 PM.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Profile completion</span>
                    <span className="font-bold text-alo-navy">85%</span>
                  </div>
                  <Progress value={85} className="h-1.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => onOpenAuth("register")} className="h-12 px-8 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]">
            Create your free dashboard
          </Button>
          <p className="mt-2 text-xs text-slate-500">ALO students get 3 free mocks · public students get 1 free</p>
        </div>
      </div>
    </section>
  );
}
