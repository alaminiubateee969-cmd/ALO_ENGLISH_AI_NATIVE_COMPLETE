"use client";

import { useState } from "react";
import { Check, ChevronRight, Building2, Banknote, Clock, ShieldCheck, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DESTINATIONS } from "@/lib/alo-data";

export function AloDestinations({ onCta }: { onCta: () => void }) {
  const [activeId, setActiveId] = useState(DESTINATIONS[0].id);
  const active = DESTINATIONS.find((d) => d.id === activeId)!;

  return (
    <section id="destinations" className="py-16 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Top Study Destinations</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            Choose your study abroad destination.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Explore university options, tuition, scholarships, post-study work visas and lifestyle
            across 7 top destinations. Tap a country to see quick facts and details.
          </p>
        </div>

        {/* Destination tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all",
                d.id === activeId
                  ? "border-transparent text-white alo-shadow-sm"
                  : "border-slate-200 bg-white text-alo-navy hover:border-alo-blue/40 hover:bg-alo-soft-blue"
              )}
              style={d.id === activeId ? { backgroundColor: d.accent } : undefined}
            >
              <span className="text-base">{d.flag}</span>
              {d.name}
            </button>
          ))}
        </div>

        {/* Active destination detail */}
        <div className="mt-8 grid lg:grid-cols-12 gap-8">
          {/* Image */}
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white alo-shadow-sm">
              <img
                src={active.image}
                alt={`${active.name} university campus — ALO Education study abroad`}
                className="w-full h-64 md:h-72 object-cover"
              />
              <div className="p-5" style={{ backgroundColor: active.accentSoft }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{active.flag}</span>
                  <h3 className="text-xl font-bold text-alo-navy">{active.name}</h3>
                </div>
                <p className="mt-1 text-sm text-alo-muted">{active.tagline}</p>
                <p className="mt-2 text-sm text-alo-muted leading-7">{active.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {active.highlights.map((h) => (
                    <span key={h} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-alo-navy">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick facts */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-alo-faint mb-3">Quick facts</h4>
            <div className="grid grid-cols-2 gap-3">
              {active.quickFacts.map((f) => (
                <div key={f.label} className="rounded-2xl border border-alo-card bg-white p-3.5 alo-shadow-sm">
                  <f.icon className="h-4 w-4 text-alo-blue" />
                  <div className="mt-1.5 text-sm font-bold text-alo-navy">{f.value}</div>
                  <div className="text-xs text-alo-faint">{f.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-alo-faint mb-1.5">Top universities</div>
              <div className="flex flex-wrap gap-1.5">
                {active.topUniversities.map((u) => (
                  <span key={u} className="rounded-md bg-alo-soft-blue px-2 py-1 text-[11px] font-semibold text-alo-blue">{u}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Popular courses + CTA */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-alo-faint mb-3">Popular courses</h4>
            <ul className="space-y-2">
              {active.popularCourses.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-alo-navy">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-alo-orange" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-alo-orange">Tuition range</div>
              <div className="text-sm font-bold text-alo-navy mt-0.5">{active.tuitionRange}</div>
            </div>
            <Button onClick={onCta} className="mt-4 w-full h-12 rounded-xl bg-alo-orange text-white font-semibold hover:bg-[#cc3f10]">
              Book Free Consultation
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
