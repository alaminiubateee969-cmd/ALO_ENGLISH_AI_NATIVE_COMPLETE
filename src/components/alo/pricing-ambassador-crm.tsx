"use client";

import { Check, Crown, Users, RefreshCw, Share2, TrendingUp, Gift, Link2, Download, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/alo-data";

export function AloPricing({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  return (
    <section id="pricing" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/20 bg-alo-soft-orange px-3 py-1 text-xs font-semibold text-alo-orange">
            <Gift className="h-3.5 w-3.5" />
            Pricing & Vouchers
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
            Start free. Upgrade when you're ready.
          </h2>
          <p className="mt-4 text-lg text-alo-muted leading-relaxed">
            After your free quota, pick a single test, a bundle, or a full prep course.
            Admins can also create free coupons, discounts and scholarships.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border-2 p-6 flex flex-col",
                plan.highlighted
                  ? "border-alo-orange bg-white shadow-xl lg:scale-[1.03]"
                  : "border-slate-200 bg-white"
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-alo-orange px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center gap-2">
                {plan.id === "prep" && <Crown className="h-4 w-4 text-alo-orange" />}
                {plan.id === "bundle" && <Zap className="h-4 w-4 text-alo-orange" />}
                {plan.id === "single" && <RefreshCw className="h-4 w-4 text-alo-blue" />}
                {plan.id === "free" && <Gift className="h-4 w-4 text-emerald-500" />}
                <h3 className="text-lg font-bold text-alo-navy">{plan.name}</h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-alo-navy">{plan.price}</span>
                <span className="text-xs text-slate-400 mb-1.5">/ {plan.period}</span>
              </div>

              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-alo-navy">
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", plan.highlighted ? "text-alo-orange" : "text-alo-blue")} />
                    <span className="leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => onOpenAuth("register")}
                className={cn(
                  "mt-6 h-11 rounded-xl font-semibold",
                  plan.highlighted
                    ? "bg-alo-orange text-white hover:bg-[#d2460f]"
                    : "border border-alo-blue/30 bg-white text-alo-blue hover:bg-alo-soft-blue"
                )}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Payment gateways */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-alo-navy">Supported payment gateways</div>
              <div className="text-xs text-slate-500">SSLCommerz · bKash · Nagad · Stripe — integration ready</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["SSLCommerz", "bKash", "Nagad", "Stripe"].map((p) => (
                <span key={p} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-alo-navy">
                  {p}
                </span>
              ))}
              <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">Coupon ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloAmbassador() {
  const perks = [
    { icon: Link2, title: "Unique referral link", desc: "Share your personalised referral code" },
    { icon: Users, title: "Track referrals", desc: "See safe status of every referred student" },
    { icon: Gift, title: "Voucher rewards", desc: "Earn mock test vouchers per conversion" },
    { icon: TrendingUp, title: "Commission safe view", desc: "Transparent earnings dashboard" },
    { icon: Download, title: "Marketing kit", desc: "Ready-made posters, captions and images" },
    { icon: Crown, title: "Ambassador portal", desc: "Dedicated dashboard with reports" },
  ];
  return (
    <section id="ambassador" className="py-16 lg:py-24 bg-alo-navy relative overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-alo-blue/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-alo-orange/20 blur-3xl pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-orange/30 bg-alo-orange/10 px-3 py-1 text-xs font-semibold text-alo-orange">
              <Share2 className="h-3.5 w-3.5" />
              Ambassador Program
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Refer students. Earn rewards.
            </h2>
            <p className="mt-4 text-lg text-slate-300 leading-relaxed">
              Become an ALO English Ambassador. Share your referral link, track your referred
              students (safe status only), earn vouchers and commission — all from a dedicated
              ambassador portal.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {perks.map((perk) => (
                <div key={perk.title} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <perk.icon className="h-4 w-4 text-alo-orange" />
                  <div className="mt-1.5 text-sm font-bold text-white">{perk.title}</div>
                  <div className="text-xs text-slate-400">{perk.desc}</div>
                </div>
              ))}
            </div>
            <Button className="mt-6 h-12 px-6 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#d2460f]">
              <Share2 className="mr-2 h-4 w-4" />
              Become an Ambassador
            </Button>
          </div>

          {/* Ambassador portal mock */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-orange text-white text-xs font-bold">AR</div>
                <div>
                  <div className="text-sm font-bold text-white">Arif Rahman</div>
                  <div className="text-[11px] text-slate-400">Ambassador · AMB-2026-0042</div>
                </div>
              </div>
              <span className="rounded-full bg-alo-orange/20 px-2.5 py-1 text-[10px] font-bold text-alo-orange">Active</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { l: "Referrals", v: "28" },
                { l: "Converted", v: "12" },
                { l: "Vouchers", v: "8" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <div className="text-2xl font-extrabold text-white">{s.v}</div>
                  <div className="text-[10px] text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Your referral link</div>
              <div className="flex items-center gap-2 rounded-lg bg-alo-navy/60 border border-white/10 px-3 py-2">
                <Link2 className="h-4 w-4 text-alo-orange shrink-0" />
                <span className="text-xs text-slate-200 truncate font-mono">english.aloeducation.com/r/AMB-0042</span>
                <Button className="ml-auto h-7 rounded-md bg-alo-orange px-2 text-[10px] text-white hover:bg-[#d2460f]">Copy</Button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent referrals</div>
              <div className="space-y-2">
                {[
                  { n: "Sadia K.", s: "Converted", c: "text-emerald-400" },
                  { n: "Rakib H.", s: "Mock started", c: "text-alo-orange" },
                  { n: "Mitu R.", s: "Registered", c: "text-slate-300" },
                ].map((r) => (
                  <div key={r.n} className="flex items-center justify-between text-xs">
                    <span className="text-slate-200">{r.n}</span>
                    <span className={`font-semibold ${r.c}`}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-3 text-[10px] text-slate-500 text-center">
              Ambassadors see safe status only · no private student data
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AloCrmIntegration() {
  const syncFields = [
    "alo_student_id", "email & phone", "country_interest", "exam_type",
    "mock_attempts", "latest_score", "speaking_report", "writing_report",
    "payment_status", "voucher_usage", "counselor_followup", "marketing_source",
  ];
  return (
    <section id="crm" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-alo-blue/20 bg-alo-soft-blue px-3 py-1 text-xs font-semibold text-alo-blue">
              <RefreshCw className="h-3.5 w-3.5" />
              ALO Web_CRM Integration
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-alo-navy">
              Connected to ALO Education CRM.
            </h2>
            <p className="mt-4 text-lg text-alo-muted leading-relaxed">
              Every registration creates a lead in the ALO Web_CRM. Mock attempts, scores,
              speaking & writing feedback, counseling bookings and payments sync automatically —
              so your counselor can guide you without you repeating yourself.
            </p>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                { t: "Auto lead creation", d: "source = english.aloeducation.com" },
                { t: "Score sync", d: "Latest mock to CRM timeline" },
                { t: "Counselor tasks", d: "Auto follow-up after each attempt" },
                { t: "Quota visibility", d: "Counselors see free quota & results" },
                { t: "Safe status only", d: "Students never see CRM private notes" },
                { t: "Offline-first", d: "Saves locally & retries if CRM down" },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" />
                  <div>
                    <div className="text-sm font-bold text-alo-navy">{f.t}</div>
                    <div className="text-xs text-slate-500">{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRM sync flow diagram */}
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-alo-soft-blue to-white p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-alo-blue text-white text-xs font-bold">EN</div>
                <div>
                  <div className="text-sm font-bold text-alo-navy">English Platform</div>
                  <div className="text-[11px] text-slate-500">english.aloeducation.com</div>
                </div>
              </div>
              <RefreshCw className="h-4 w-4 text-alo-blue animate-spin-slow" />
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-sm font-bold text-alo-navy text-right">ALO Web_CRM</div>
                  <div className="text-[11px] text-slate-500 text-right">crm.aloeducation.com</div>
                </div>
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
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${row.c} text-white`}>
                    <RefreshCw className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-alo-navy">{row.l}</div>
                    <div className="text-[10px] text-slate-500">{row.t}</div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">SYNCED</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {syncFields.map((f) => (
                <span key={f} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[9px] font-mono text-slate-500">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
