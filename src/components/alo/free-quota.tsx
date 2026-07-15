"use client";

import { Check, ShieldCheck, Users, Gift, KeyRound, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AloFreeQuota({ onVerify }: { onVerify: () => void }) {
  return (
    <section id="quota" className="py-16 lg:py-24 bg-alo-soft-blue relative overflow-hidden">
      <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-alo-orange/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-alo-blue/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-white px-3 py-1 text-xs font-semibold text-alo-blue">
            <Gift className="h-3.5 w-3.5" />
            Free Mock Test Quota
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            ALO students get 3 free. Everyone gets 1.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            ALO Education registered students receive 3 free mock tests total. New visitors
            receive 1 free mock test. Quota is enforced securely on our backend — refreshing
            the browser will not reset it.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
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
              <div className="text-6xl font-extrabold text-alo-navy leading-none">3</div>
              <div className="mb-1">
                <div className="text-sm font-bold text-alo-navy">free mock tests</div>
                <div className="text-xs text-slate-500">total, no expiry during study</div>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[
                "Valid ALO Student ID (e.g. AE-2026000001)",
                "Verified email or phone from CRM sync",
                "Active application in ALO Web_CRM",
                "Admin manually marks as ALO student",
                "Includes speaking & writing feedback",
                "Priority counselor follow-up",
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

          {/* Public student card */}
          <div className="relative rounded-3xl border-2 border-alo-orange/30 bg-white p-7 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-alo-orange/5 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-alo-orange text-white">
                <Users className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-alo-orange px-3 py-1 text-xs font-bold text-white">
                NEW VISITOR
              </span>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <div className="text-6xl font-extrabold text-alo-navy leading-none">1</div>
              <div className="mb-1">
                <div className="text-sm font-bold text-alo-navy">free mock test</div>
                <div className="text-xs text-slate-500">try the full platform</div>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[
                "Any exam type of your choice",
                "Full-length mock experience",
                "Smart Score estimate report",
                "Basic writing feedback",
                "No credit card required",
                "Upgrade to bundle or prep course",
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
        </div>

        {/* Security strip */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: "Backend-enforced", desc: "Quota checked server-side, not frontend" },
              { icon: RefreshCw, title: "Refresh-proof", desc: "Tracked by email + phone + device + session" },
              { icon: KeyRound, title: "Admin override", desc: "Admins can add extra quota or reset" },
              { icon: UserCheck, title: "Counselor-visible", desc: "Quota & results sync to ALO CRM" },
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
