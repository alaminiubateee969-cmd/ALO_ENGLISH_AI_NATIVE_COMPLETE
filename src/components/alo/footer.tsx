"use client";

import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Facebook, Instagram, Linkedin, Youtube, ChevronRight } from "lucide-react";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Destinations",
    links: [
      { label: "United Kingdom", href: "#destinations" },
      { label: "United States", href: "#destinations" },
      { label: "Australia", href: "#destinations" },
      { label: "Canada", href: "#destinations" },
      { label: "New Zealand", href: "#destinations" },
      { label: "Europe", href: "#destinations" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { label: "Course Finder", href: "#course-finder" },
      { label: "Services", href: "#services" },
      { label: "English Test Prep", href: "#language-prep" },
      { label: "Scholarships", href: "#scholarships" },
      { label: "Portals", href: "#portals" },
      { label: "Book Consultation", href: "#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#contact" },
      { label: "Team", href: "#contact" },
      { label: "Find Us", href: "#contact" },
      { label: "Contact Us", href: "#contact" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#privacy" },
    ],
  },
];

/* Animated graduation caps strip — 3 layers drifting left→right, different speeds/opacity/colors */
function GraduationCapsStrip() {
  const caps = (count: number, color: string, opacity: number, animClass: string, size: number) =>
    Array.from({ length: count }).map((_, i) => (
      <span
        key={`${animClass}-${i}`}
        className={`inline-block ${animClass}`}
        style={{
          color,
          opacity,
          animationDelay: `${(i * 1.7) % 12}s`,
          marginLeft: `${(i * 9 + 3) % 16}vw`,
          marginTop: `${(i % 3) * 6 - 6}px`,
        }}
      >
        <GraduationCap style={{ width: size, height: size }} />
      </span>
    ));

  return (
    <div
      className="relative w-full overflow-hidden border-y border-slate-200"
      style={{ background: "linear-gradient(90deg, #EEF6FF 0%, #FFFFFF 50%, #FFF7ED 100%)" }}
      aria-hidden="true"
    >
      <div className="relative h-20 flex items-center">
        {/* Layer 1 — slow, background, gray, 40% */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex items-center whitespace-nowrap">{caps(8, "#94A3B8", 0.4, "cap-drift-1", 28)}</div>
        </div>
        {/* Layer 2 — medium, blue, 70% */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex items-center whitespace-nowrap">{caps(6, "#0057B8", 0.7, "cap-drift-2", 24)}</div>
        </div>
        {/* Layer 3 — slightly faster, orange, 100% */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex items-center whitespace-nowrap">{caps(5, "#E8501A", 1, "cap-drift-3", 22)}</div>
        </div>
      </div>
    </div>
  );
}

export function AloFooter() {
  return (
    <footer id="privacy" className="mt-auto">
      {/* Section 1 — Main footer content */}
      <div className="bg-alo-navy text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-alo-blue text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-base font-extrabold text-white">
                    ALO <span className="text-alo-orange">Education</span>
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
                    Study Abroad · CRM
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm italic">
                &ldquo;From your ambition to admission, we&apos;re with you all the way.&rdquo;
              </p>
              <div className="mt-5 space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-alo-orange" />
                  <span>info@aloeducation.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-alo-orange" />
                  <span>+880 9613-ALO-EDU</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-alo-orange" />
                  <span>ALO Education, Dhaka, Bangladesh</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#contact"
                    aria-label="social link"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-alo-orange hover:text-white transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title}>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">{col.title}</h4>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="text-sm text-white/65 hover:text-alo-orange transition-colors inline-flex items-center gap-1 group"
                        >
                          <ChevronRight className="h-3 w-3 text-white/30 group-hover:text-alo-orange" />
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/80">
                <ShieldCheck className="h-4 w-4 text-alo-orange" />
                <span className="font-semibold">Backend-secured · Auth-gated · Audit-logged · CRM-connected</span>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <span>97% visa success</span>
                <span className="text-white/20">·</span>
                <span>12,500+ students</span>
                <span className="text-white/20">·</span>
                <span>4,000+ universities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Animated graduation caps strip */}
      <GraduationCapsStrip />

      {/* Section 3 — Bottom bar */}
      <div className="bg-[#f5f5f5] border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-muted">
            <p>© Copyright 2025 ALO Education. All Rights Reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#privacy" className="hover:text-alo-blue transition-colors">Privacy Policy</a>
              <a href="#privacy" className="hover:text-alo-blue transition-colors">Terms</a>
              <a href="#privacy" className="hover:text-alo-blue transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
