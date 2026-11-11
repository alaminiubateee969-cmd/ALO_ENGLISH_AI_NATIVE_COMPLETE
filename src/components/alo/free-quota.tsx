"use client";

import { Check, ShieldCheck, Users, Gift, KeyRound, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The platform's access policy section.
 *
 * Policy (2026-10-27): every exam, mock test and practice feature is free and
 * unlimited, 24/7, for everyone — there is no paid tier, no quota and no
 * expiry. This section explains that policy; it used to advertise the old
 * 3-free/1-free quota, which no longer exists.
 */
export function AloFreeQuota({ onVerify }: { onVerify: () => void }) {
  return (
    <section id="quota" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-blue/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue">
            <Gift className="h-3.5 w-3.5" />
            Free &amp; Unlimited — Always
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            Every exam. Every mock. Free for everyone, 24/7.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            All 32 exams, full-length mock tests, AI speaking practice, writing feedback and the
            complete study-material library — unlimited, with nothing to pay and no card required.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Every learner card */}
          <div className="relative rounded-3xl border-2 border-alo-orange/30 bg-white p-7 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-alo-orange/5 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-alo-orange text-white">
                <Users className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-alo-orange px-3 py-1 text-xs font-bold text-white">
                EVERY LEARNER
              </span>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <div className="text-6xl font-extrabold text-alo-navy leading-none">∞</div>
              <div className="mb-1">
                <div className="text-sm font-bold text-alo-navy">free mock tests</div>
                <div className="text-xs text-slate-500">unlimited, no expiry, 24/7</div>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[
                "All 32 computer-based exams",
                "Full-length mock experience with instant scoring",
                "AI speaking conversation practice",
                "Writing feedback & Smart Score reports",
                "Complete study-material library",
                "No credit card, no quota, ever",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-alo-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-orange" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={onVerify}
              variant="outline"
              className="mt-6 w-full h-12 rounded-xl border-alo-orange/40 text-alo-orange font-semibold hover:bg-alo-soft-orange"
            >
              Start Free Mock Test
            </Button>
          </div>

          {/* ALO student card */}
          <div className="relative rounded-3xl border-2 border-alo-blue/30 bg-white p-7 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-alo-blue/5 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-alo-blue text-white">
                <UserCheck className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-alo-blue px-3 py-1 text-xs font-bold text-white">
                ALO EDUCATION STUDENT
              </span>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <div className="text-6xl font-extrabold text-alo-navy leading-none">+</div>
              <div className="mb-1">
                <div className="text-sm font-bold text-alo-navy">guided support on top</div>
                <div className="text-xs text-slate-500">everything above, plus human guidance</div>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[
                "Valid ALO Student ID (e.g. AE-2026000001)",
                "Verified email or phone from CRM sync",
                "Results sync to ALO Web_CRM automatically",
                "Priority counselor follow-up",
                "Free consultation & application support",
                "Study-abroad guidance end to end",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-alo-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={onVerify}
              className="mt-6 w-full h-12 rounded-xl bg-alo-blue text-white font-semibold hover:bg-[#004a9e]"
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Verify ALO Student ID
            </Button>
          </div>
        </div>

        {/* Security strip */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: "Server-scored", desc: "Every attempt graded backend-side" },
              { icon: RefreshCw, title: "Progress saved", desc: "Autosave — resume after a refresh" },
              { icon: KeyRound, title: "Nothing to unlock", desc: "No paid tier, no vouchers needed" },
              { icon: UserCheck, title: "Counselor-visible", desc: "Results sync to the ALO CRM" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-alo-navy">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
