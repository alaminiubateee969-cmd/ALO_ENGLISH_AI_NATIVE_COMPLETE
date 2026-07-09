"use client";

import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

const FOOTER_LINKS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Exam Practice",
    links: [
      { label: "IELTS Academic", href: "#exams" },
      { label: "IELTS UKVI", href: "#exams" },
      { label: "PTE Academic", href: "#exams" },
      { label: "TOEFL iBT", href: "#exams" },
      { label: "Duolingo English Test", href: "#exams" },
      { label: "OIETC / Oxford ELLT", href: "#exams" },
      { label: "OET for Healthcare", href: "#exams" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Mock Tests", href: "#mock-tests" },
      { label: "Speaking Practice", href: "#speaking" },
      { label: "Writing Evaluation", href: "#writing" },
      { label: "Student Dashboard", href: "#dashboard" },
      { label: "Pricing & Vouchers", href: "#pricing" },
      { label: "Ambassador Program", href: "#ambassador" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About ALO Education", href: "#contact" },
      { label: "Book Free Counseling", href: "#contact" },
      { label: "Talk to an Advisor", href: "#contact" },
      { label: "Verify ALO Student ID", href: "#contact" },
      { label: "Partner with Us", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#terms" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Refund Policy", href: "#terms" },
      { label: "Exam Disclaimer", href: "#terms" },
      { label: "Data Usage Policy", href: "#privacy" },
      { label: "Cookie Policy", href: "#privacy" },
    ],
  },
];

export function AloFooter() {
  return (
    <footer id="terms" className="mt-auto bg-alo-navy text-slate-300">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-white/90">
              <ShieldCheck className="h-5 w-5 text-alo-orange" />
              <span className="font-semibold">Backend-secured free quota · Auth-gated downloads · Audit-logged every action</span>
            </div>
            <div className="flex items-center gap-4 text-white/70">
              <span>SSLCommerz</span>
              <span className="text-white/20">·</span>
              <span>bKash</span>
              <span className="text-white/20">·</span>
              <span>Nagad</span>
              <span className="text-white/20">·</span>
              <span>Stripe</span>
            </div>
          </div>
        </div>
      </div>

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
                  ALO <span className="text-alo-orange">English</span>
                </div>
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
                  Test Platform
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm">
              Premium English language testing and preparation by ALO Education.
              Practice mock tests, speaking interviews and writing evaluation for
              IELTS, PTE, TOEFL, Duolingo, OIETC and OET.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-alo-orange" />
                <span>support@aloeducation.com</span>
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
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
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
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/65 hover:text-alo-orange transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs leading-relaxed text-white/65">
            <span className="font-semibold text-white/85">Practice disclaimer:</span>{" "}
            ALO Education practice tests are preparation tools only. Scores are estimated and not official.
            Official exam results are issued only by authorised test providers (IELTS, PTE, TOEFL, Duolingo, OIETC, OET).
            Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital
            evaluation tools. Final university, visa, and official exam decisions are made only by official authorities.
            Users consent to recording for speaking and interview practice. We do not claim official partnership with
            any test provider unless supported by written authorisation.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} ALO Education. All rights reserved. Connected to ALO Web_CRM.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CRM Sync: Connected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              System Healthy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
