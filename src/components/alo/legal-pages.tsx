"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, FileText, Cookie, RefreshCw, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export type LegalPage = "privacy" | "terms" | "cookie" | "refund" | "exam-disclaimer";

const LEGAL_CONTENT: Record<LegalPage, { title: string; icon: any; content: { h: string; p: string[] }[] }> = {
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    content: [
      { h: "1. Information We Collect", p: ["We collect information you provide directly: name, email, phone number, target country, exam interest, and ALO Student ID if applicable.", "We automatically collect: IP address, device fingerprint, browser type, session data, and usage analytics (pages visited, time spent, clicks).", "For speaking practice, we collect audio recordings. For writing practice, we collect your written submissions."] },
      { h: "2. How We Use Your Information", p: ["To register you and manage your account.", "To record your practice-attempt usage (backend-enforced).", "To calculate estimated practice scores and generate Smart Score Reports.", "To sync your exam activity to ALO Education Web_CRM so your counselor can guide you.", "To send certificates via email.", "To improve our platform and question bank quality."] },
      { h: "3. Data Sharing", p: ["We share exam activity data (registration, attempts, scores, feedback, counseling bookings) with ALO Education Web_CRM.", "We do NOT share your data with third-party advertisers.", "We do NOT sell your data.", "Your private exam answers are never shown to other students.", "Counselors see your scores and progress — not your individual answers unless you permit."] },
      { h: "4. Data Security", p: ["All passwords are hashed using bcrypt (password_hash).", "All database queries use PDO prepared statements.", "CSRF protection on all forms.", "Private storage (audio recordings, writing submissions, reports) is auth-gated and blocked from public access.", "HTTPS is enforced on all pages.", "Rate limiting on login, registration, and attempt creation."] },
      { h: "5. Automated Digital Evaluation", p: ["Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools.", "This is a practice platform only, not an official exam result.", "The ALO Estimated Score Engine and Automated Practice Feedback use rule-based evaluation by default.", "External AI providers are optional and disabled by default."] },
      { h: "6. Your Rights", p: ["You can download your data from Settings.", "You can request deletion of your data by contacting support@aloeducation.com.", "You can opt out of CRM sync by contacting support.", "You can disable email/SMS/WhatsApp notifications in Settings."] },
      { h: "7. Data Retention", p: ["Account data: retained while your account is active.", "Exam recordings: retained for 90 days, then automatically deleted.", "Exam reports: retained for 1 year.", "Audit logs: retained for 2 years for security compliance.", "CRM sync logs: retained for 1 year."] },
      { h: "8. Cookies", p: ["We use essential cookies for session management and authentication.", "We use analytics cookies (if enabled) to understand usage patterns.", "You can manage cookies in your browser settings. See our Cookie Policy for details."] },
      { h: "9. Contact", p: ["For privacy questions: support@aloeducation.com", "ALO Education, Dhaka, Bangladesh"] },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    content: [
      { h: "1. Acceptance of Terms", p: ["By using the ALO English Test Platform (english.aloeducation.com), you agree to these Terms of Service.", "If you do not agree, please do not use the platform."] },
      { h: "2. Practice Platform Only", p: ["This is a practice platform. All tests, scores, feedback, and certificates are practice estimates only.", "Not official exam results. No guarantee that questions will appear in real exam.", "Official exam results are issued only by authorised test providers (IELTS, PTE, TOEFL, Duolingo, OIETC, OET, SAT, GRE, GMAT, LSAT, MCAT, ACT).", "We do not claim official partnership with any test provider unless supported by written authorization."] },
      { h: "3. Free & Unlimited Access", p: ["Every exam, mock test and practice feature is free and unlimited for every registered learner, 24/7.", "There is no paid tier, no quota and nothing to purchase.", "Usage is recorded on our backend for score history and analytics.", "Creating multiple accounts to mislead analytics is prohibited and may result in account suspension."] },
      { h: "4. Original Content", p: ["All questions, passages, audio scripts, and prompts are 100% original content.", "We do not use official exam questions, leaked questions, or copyrighted content.", "Users may not copy, redistribute, or republish platform content."] },
      { h: "5. User Conduct", p: ["You agree not to: cheat, share accounts, scrape content, attempt to access other users' data, or disrupt platform operations.", "Violations may result in account suspension without notice."] },
      { h: "6. Intellectual Property", p: ["All platform content, branding, logos, and software are property of ALO Education.", "The ALO Certify logo and ALO Labs AgentOS branding are proprietary marks."] },
      { h: "7. Limitation of Liability", p: ["The platform is provided 'as is' without warranties.", "ALO Education is not liable for any damages arising from use of the platform.", "Practice scores do not guarantee real exam performance."] },
      { h: "8. Changes to Terms", p: ["We may update these Terms at any time. Continued use after changes constitutes acceptance."] },
      { h: "9. Contact", p: ["For terms questions: support@aloeducation.com"] },
    ],
  },
  cookie: {
    title: "Cookie Policy",
    icon: Cookie,
    content: [
      { h: "1. What Are Cookies", p: ["Cookies are small text files stored on your device when you visit a website. They help with session management, authentication, and analytics."] },
      { h: "2. Essential Cookies", p: ["Session cookie (ALO_ENG_SID): Required for login and authentication. Deleted when you close your browser or after 120 minutes of inactivity.", "CSRF token cookie: Required for form security. Prevents cross-site request forgery."] },
      { h: "3. Analytics Cookies (Optional)", p: ["If enabled, we may use analytics cookies to understand usage patterns (pages visited, time spent, clicks).", "Analytics cookies are disabled by default and require your consent.", "We do not use advertising cookies."] },
      { h: "4. Managing Cookies", p: ["You can control cookies in your browser settings.", "Disabling essential cookies will prevent you from logging in and taking mock tests.", "Disabling analytics cookies will not affect platform functionality."] },
      { h: "5. Third-Party Cookies", p: ["We do not allow third-party advertising cookies.", "If we integrate payment gateways (bKash, Nagad, SSLCommerz, Stripe), they may set their own cookies during the payment process."] },
      { h: "6. Contact", p: ["For cookie questions: support@aloeducation.com"] },
    ],
  },
  refund: {
    title: "Refund Policy",
    icon: RefreshCw,
    content: [
      { h: "1. Free Mock Tests", p: ["All mock tests and practice features are provided free of charge, unlimited, 24/7.", "No payment is ever required, so no refund is applicable."] },
      { h: "2. Paid Mock Tests (Single)", p: ["If you purchased a single mock test and have NOT started the attempt, you may request a full refund within 7 days of purchase.", "Once an attempt is started, no refund is available.", "To request a refund: contact support@aloeducation.com with your transaction ID."] },
      { h: "3. Mock Test Bundles (5 Tests)", p: ["If you purchased a 5-test bundle and have NOT used any tests, you may request a full refund within 7 days.", "If you have used 1-2 tests, you may request a partial refund (proportional to unused tests).", "If you have used 3+ tests, no refund is available."] },
      { h: "4. Vouchers", p: ["Voucher purchases are non-refundable once the voucher code has been used.", "Unused vouchers may be refunded within 7 days of purchase.", "Expired vouchers are not refundable."] },
      { h: "5. English Prep Course", p: ["Prep course fees are refundable according to the course enrollment agreement.", "Contact your ALO Education counselor for course-specific refund terms."] },
      { h: "6. Refund Processing", p: ["Approved refunds are processed within 7-14 business days.", "Refunds are returned to the original payment method (bKash, Nagad, SSLCommerz, or Stripe).", "You will receive an email confirmation when your refund is processed."] },
      { h: "7. Non-Refundable Items", p: ["Exam recordings and reports generated from used attempts.", "Vouchers that have been used or expired.", "Services already rendered (counseling sessions, examiner reviews)."] },
      { h: "8. Contact", p: ["For refund requests: support@aloeducation.com", "Include your transaction ID and reason for refund."] },
    ],
  },
  "exam-disclaimer": {
    title: "Exam Disclaimer",
    icon: AlertTriangle,
    content: [
      { h: "Practice Only", p: ["ALO Education practice tests are preparation tools only. Scores are estimated and not official.", "Official exam results are issued only by authorised test providers (IELTS, PTE, TOEFL, Duolingo, OIETC, OET, SAT, GRE, GMAT, LSAT, MCAT, ACT, LanguageCert, Linguaskill).", "No guarantee that questions will appear in real exam."] },
      { h: "Original Content", p: ["All questions, passages, audio scripts, and prompts are 100% original content written for the ALO English Test Platform.", "We do NOT use official exam questions, leaked questions, or copyrighted content.", "We do NOT claim official partnership with any test provider unless supported by written authorization."] },
      { h: "Automated Digital Evaluation", p: ["Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools.", "The ALO Estimated Score Engine uses rule-based evaluation by default.", "External AI providers are optional and disabled by default.", "Writing and speaking evaluations are practice estimates — not official examiner scores."] },
      { h: "No Human Examiner Claim", p: ["The ALO Practice Examiner is a digital evaluation session — not a real human examiner.", "We do not claim that any automated evaluation is conducted by a real human.", "Optional ALO Academic Team Review is available on request but never required to view your report."] },
      { h: "Score Interpretation", p: ["Estimated scores are based on our Smart Score Engine and should be used as preparation guidance only.", "Your actual official exam score may differ.", "We recommend taking official practice tests from the test provider in addition to our platform."] },
      { h: "Recording Consent", p: ["By using speaking practice and interview simulations, you consent to audio recording for evaluation purposes.", "Recordings are stored securely in private storage and are only accessible to you.", "Recordings are automatically deleted after 90 days."] },
      { h: "No Visa/Admission Guarantee", p: ["Practice scores do not guarantee visa approval or university admission.", "Final university, visa, and official exam decisions are made only by official authorities.", "ALO Education is not responsible for decisions made by universities, embassies, or test providers."] },
    ],
  },
};

export function LegalModal({ page, onClose }: { page: LegalPage | null; onClose: () => void }) {
  useEffect(() => {
    if (page) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [page]);

  if (!page) return null;
  const data = LEGAL_CONTENT[page];
  const Icon = data.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-alo-navy/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-[88vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-alo-navy">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white"><Icon className="h-5 w-5" /></div>
            <div>
              <div className="text-base font-extrabold text-white">{data.title}</div>
              <div className="text-[10px] text-white/60">ALO English Test Platform · Last updated: January 2026</div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto alo-scroll p-6 space-y-5">
          {data.content.map((sec, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-alo-navy mb-1.5">{sec.h}</h3>
              {sec.p.map((para, j) => (
                <p key={j} className="text-sm text-alo-muted leading-relaxed mb-1.5">{para}</p>
              ))}
            </div>
          ))}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-800 leading-relaxed"><span className="font-semibold">Disclosure:</span> Some practice tests, scoring, feedback, and interview simulations may be supported by automated digital evaluation tools. This is a practice platform only, not an official exam result.</p>
          </div>
          <div className="text-center text-xs text-alo-faint pt-2">© {new Date().getFullYear()} ALO Education. All rights reserved. Connected to ALO Web_CRM.</div>
        </div>
      </div>
    </div>
  );
}
