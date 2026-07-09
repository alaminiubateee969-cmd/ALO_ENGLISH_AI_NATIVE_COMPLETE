"use client";

import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Facebook, Instagram, Linkedin, Youtube, ChevronRight } from "lucide-react";

const FOOTER_LINKS: { title: string; links: { label: string; action: string }[] }[] = [
  { title: "Exams", links: [{ label: "IELTS Academic", action: "exams" }, { label: "IELTS UKVI", action: "exams" }, { label: "PTE Academic", action: "exams" }, { label: "TOEFL iBT", action: "exams" }, { label: "Duolingo", action: "exams" }, { label: "OIETC / ELLT", action: "exams" }] },
  { title: "Platform", links: [{ label: "Mock Tests", action: "mock-tests" }, { label: "Pricing & Vouchers", action: "pricing" }, { label: "Ambassador Program", action: "ambassador" }, { label: "Student Portal", action: "portal:student" }, { label: "Admin Portal", action: "portal:admin" }, { label: "Examiner Portal", action: "portal:examiner" }] },
  { title: "Company", links: [{ label: "About ALO Education", action: "contact" }, { label: "Book Free Counseling", action: "contact" }, { label: "Contact Us", action: "contact" }, { label: "Verify ALO Student ID", action: "contact" }, { label: "Terms & Privacy", action: "privacy" }, { label: "Exam Disclaimer", action: "privacy" }] },
];

function GraduationCapsStrip() {
  const caps = (count: number, color: string, opacity: number, animClass: string, size: number) =>
    Array.from({ length: count }).map((_, i) => (
      <span key={`${animClass}-${i}`} className={`inline-block ${animClass}`} style={{ color, opacity, animationDelay: `${(i * 1.7) % 12}s`, marginLeft: `${(i * 9 + 3) % 16}vw`, marginTop: `${(i % 3) * 6 - 6}px` }}>
        <GraduationCap style={{ width: size, height: size }} />
      </span>
    ));
  return (
    <div className="relative w-full overflow-hidden border-y border-slate-200" style={{ background: "linear-gradient(90deg, #EEF6FF 0%, #FFFFFF 50%, #FFF7ED 100%)" }} aria-hidden="true">
      <div className="relative h-20 flex items-center">
        <div className="absolute inset-0 flex items-center"><div className="flex items-center whitespace-nowrap">{caps(8, "#94A3B8", 0.4, "cap-drift-1", 28)}</div></div>
        <div className="absolute inset-0 flex items-center"><div className="flex items-center whitespace-nowrap">{caps(6, "#0057B8", 0.7, "cap-drift-2", 24)}</div></div>
        <div className="absolute inset-0 flex items-center"><div className="flex items-center whitespace-nowrap">{caps(5, "#E8501A", 1, "cap-drift-3", 22)}</div></div>
      </div>
    </div>
  );
}

export function AloFooter({ onAction }: { onAction: (action: string) => void }) {
  return (
    <footer id="privacy" className="mt-auto">
      <div className="bg-alo-navy text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2.5">
                <img src="/images/alo-logo.webp" alt="ALO Education logo" className="h-10 w-10 rounded-lg bg-white/10 p-1 object-contain" />
                <div className="leading-tight">
                  <div className="text-base font-extrabold text-white">ALO <span className="text-alo-orange">English</span></div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">Test Platform</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm italic">"Your Dream — Our Commitment. Original exam-aligned practice for IELTS, PTE, TOEFL, Duolingo, OIETC & OET."</p>
              <div className="mt-5 space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-alo-orange" /><span>support@aloeducation.com</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-alo-orange" /><span>+880 9613-ALO-EDU</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-alo-orange" /><span>ALO Education, Dhaka, Bangladesh</span></div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                {[Facebook, Instagram, Linkedin, Youtube].map((Icon, i) => (
                  <button key={i} onClick={() => onAction("contact")} aria-label="social link" className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/70 hover:bg-alo-orange hover:text-white transition-colors"><Icon className="h-4 w-4" /></button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              {FOOTER_LINKS.map((col) => (
                <div key={col.title}>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-white">{col.title}</h4>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <button onClick={() => onAction(link.action)} className="text-sm text-white/65 hover:text-alo-orange transition-colors inline-flex items-center gap-1 group">
                          <ChevronRight className="h-3 w-3 text-white/30 group-hover:text-alo-orange" />{link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs leading-relaxed text-white/65">
              <span className="font-semibold text-white/85">Practice disclaimer:</span> ALO Education practice tests are preparation tools only. All questions are 100% original, exam-aligned content. Scores are estimates and not official. Official exam results are issued only by authorised test providers (IELTS, PTE, TOEFL, Duolingo, OIETC, OET). Some scoring and feedback may use automated digital tools. No guarantee of real-exam repetition. Users consent to recording for speaking practice.
            </p>
          </div>
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <p>© {new Date().getFullYear()} ALO Education. All rights reserved. Connected to ALO Web_CRM.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />CRM Sync: Connected</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />System Healthy</span>
            </div>
          </div>
        </div>
      </div>
      <GraduationCapsStrip />
      <div className="bg-[#f5f5f5] border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-muted">
            <p>© Copyright {new Date().getFullYear()} ALO Education. All Rights Reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => onAction("privacy")} className="hover:text-alo-blue transition-colors">Privacy Policy</button>
              <button onClick={() => onAction("privacy")} className="hover:text-alo-blue transition-colors">Terms</button>
              <button onClick={() => onAction("privacy")} className="hover:text-alo-blue transition-colors">Cookie Policy</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
