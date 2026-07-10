// ALO English Test Platform — Portal & platform data (original, demo-safe)
// All names, IDs, scores below are illustrative demo data for the platform UI.
// No real student data is exposed.

export type Role = "student" | "admin" | "examiner" | "ambassador";

export const ROLES: { id: Role; name: string; description: string; redirect: string; accent: string }[] = [
  { id: "student", name: "Student Portal", description: "Take mock tests, view results, use vouchers, get practice feedback", redirect: "/student/dashboard", accent: "#0057B8" },
  { id: "admin", name: "Admin Portal", description: "Manage students, questions, vouchers, CRM sync & audit logs", redirect: "/admin/dashboard", accent: "#0B1F3A" },
  { id: "examiner", name: "Examiner Portal", description: "Review writing & speaking submissions, give practice feedback", redirect: "/examiner/dashboard", accent: "#0B63CE" },
  { id: "ambassador", name: "Ambassador Portal", description: "Track referrals, vouchers & commission (safe status only)", redirect: "/ambassador/dashboard", accent: "#E8501A" },
];

export const EXAM_MODULES = [
  { id: "ielts-academic", name: "IELTS Academic", slug: "ielts", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 44m", scale: "Band 0–9", badge: "Most Popular", accent: "blue", tagline: "Academic reading, Task 1 report & Task 2 essay" },
  { id: "ielts-ukvi", name: "IELTS UKVI", slug: "ielts-ukvi", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 44m", scale: "Band 0–9", badge: "UK Visa", accent: "royal", tagline: "UKVI secure test guidance + practice disclaimer" },
  { id: "pte", name: "PTE Academic", slug: "pte", sections: ["Speaking & Writing", "Reading", "Listening"], duration: "2h 00m", scale: "10–90", badge: "Fast Results", accent: "orange", tagline: "20 integrated question types, Smart Score Engine" },
  { id: "toefl", name: "TOEFL iBT", slug: "toefl", sections: ["Reading", "Listening", "Speaking", "Writing"], duration: "2h 00m", scale: "0–120", badge: "USA Focused", accent: "blue", tagline: "Integrated tasks & academic discussion" },
  { id: "duolingo", name: "Duolingo English Test", slug: "duolingo", sections: ["Literacy", "Comprehension", "Conversation", "Production"], duration: "1h 00m", scale: "10–160", badge: "Adaptive", accent: "orange", tagline: "Adaptive practice, 4 subscores" },
  { id: "oietc", name: "OIETC / Oxford ELLT", slug: "oietc", sections: ["Reading", "Listening", "Writing", "Speaking"], duration: "1h 30m", scale: "CEFR A2–C1", badge: "University Entry", accent: "royal", tagline: "Interview simulation + CEFR estimate" },
  { id: "oet", name: "OET (Healthcare)", slug: "oet", sections: ["Listening", "Reading", "Writing", "Speaking"], duration: "2h 50m", scale: "A–E grades", badge: "Healthcare", accent: "blue", tagline: "Healthcare scenarios & clinical role-play" },
  { id: "alo-placement", name: "ALO Placement Test", slug: "alo-placement", sections: ["Grammar", "Vocabulary", "Reading", "Writing", "Speaking"], duration: "1h 15m", scale: "Readiness 0–100", badge: "Internal", accent: "orange", tagline: "Study readiness score + counselor report" },
];

export const PRICING_PLANS = [
  { id: "free", name: "Free Trial", price: "৳0", period: "one-time", description: "Start free — no card required.", features: ["1 free mock (public students)", "3 free mocks for ALO students", "Smart Score estimate", "Basic writing feedback", "Result report download"], cta: "Start Free Practice", highlighted: false },
  { id: "single", name: "Single Mock Test", price: "৳499", period: "per test", description: "Buy one full mock test on demand.", features: ["1 full-length mock test", "Any exam type", "Full Smart Score report", "Writing + speaking feedback", "Downloadable PDF report", "Email report delivery"], cta: "Buy Single Mock", highlighted: false },
  { id: "bundle", name: "5 Mock Test Bundle", price: "৳1,999", period: "5 tests", description: "Best value for serious preparation.", features: ["5 full-length mock tests", "Mix any exam types", "Full Smart Score each", "Priority feedback", "Personalised study plan", "CRM counselor sync", "1:1 review session"], cta: "Buy Bundle & Save 20%", highlighted: true, badge: "Best Value" },
  { id: "prep", name: "English Prep Course", price: "Custom", period: "cohort", description: "Full guided preparation with teachers.", features: ["Unlimited mocks during course", "Live classes with teachers", "1:1 speaking practice", "Writing correction by examiners", "Personal counselor + plan", "Visa & admission guidance"], cta: "Talk to ALO Advisor", highlighted: false },
];

export const FAQS = [
  { q: "Are these official exam questions?", a: "No. All questions are 100% original, exam-aligned practice written by ALO Education. They mimic official-style structure, skill coverage and difficulty but are not official exam content. No guarantee of real-exam repetition. Scores are practice estimates only." },
  { q: "How many free mock tests can I take?", a: "ALO Education registered students receive 3 free mock tests total. New visitors receive 1 free mock test. Quota is enforced securely on our backend using verified email, phone, device and session — refreshing the browser will not reset it." },
  { q: "Are the scores official?", a: "No. ALO Education practice tests are preparation tools only. Scores are estimates produced by our Smart Score Engine and examiner review. Official exam results are issued only by authorised test providers (IELTS, PTE, TOEFL, Duolingo, OIETC, OET)." },
  { q: "How does partner-student benefit work?", a: "A partner student gets English test benefits only if they have an active ALO application (statuses: Application Draft through Visa File Created). Default benefits: 3 mock test vouchers, 1 speaking practice, 1 writing evaluation, 1 study plan, 1 document checklist. No active application = no free voucher." },
  { q: "Can I download my results and recordings?", a: "Yes. Every completed mock produces a downloadable PDF report. Speaking recordings and writing submissions are auth-gated — only you can download your own files. Admins and examiners access only what RBAC permits, fully audit-logged." },
  { q: "Is my data synced to ALO CRM?", a: "Yes. When you register, a lead is created in ALO Web_CRM. Mock attempts, scores, feedback, voucher usage and counseling bookings sync to your CRM timeline so your counselor can guide you. If CRM is unavailable, data saves locally and retries via cron. You see safe CRM status only." },
];

export const TESTIMONIALS = [
  { name: "Tania Islam", role: "IELTS Academic · Dhaka", score: "Band 7.5", quote: "The mock tests felt exactly like the real exam. The Smart Score report pinpointed my weak areas in reading, and my band jumped from 6.0 to 7.5 in six weeks.", initials: "TI" },
  { name: "Mahin Chowdhury", role: "PTE Academic · Chittagong", score: "Score 79", quote: "Speaking practice with the ALO Speaking Evaluator was a game changer. I improved my fluency and the repeat-sentence drills were spot on.", initials: "MC" },
  { name: "Nusrat Jahan", role: "Duolingo · Sylhet", score: "Score 135", quote: "Being an ALO student I got 3 free mocks. The adaptive practice and writing feedback were exactly what I needed.", initials: "NJ" },
  { name: "Rakib Hasan", role: "TOEFL iBT · Rajshahi", score: "Score 104", quote: "The integrated writing and speaking tasks were realistic. The downloadable report helped my counselor build a perfect study plan.", initials: "RH" },
];

/* ===== Student Portal data ===== */
export const STUDENT_KPIS = [
  { label: "Mock tests available", value: "2", sub: "of 3 free", icon: "vouchers", color: "orange" },
  { label: "Tests attempted", value: "5", sub: "this quarter", icon: "tests", color: "blue" },
  { label: "Best score", value: "7.5", sub: "IELTS band", icon: "award", color: "blue" },
  { label: "Avg practice score", value: "7.0", sub: "+1.2 lift", icon: "trend", color: "orange" },
];

export const STUDENT_RESULTS = [
  { id: "ATT-2026-005", exam: "IELTS Academic", date: "Jan 8, 2026", overall: "7.5", listening: 8, reading: 7, writing: 7, speaking: 7.5, status: "completed", cefr: "C1" },
  { id: "ATT-2026-004", exam: "IELTS Academic", date: "Dec 22, 2025", overall: "7.0", listening: 7.5, reading: 7, writing: 6.5, speaking: 7, status: "completed", cefr: "C1" },
  { id: "ATT-2026-003", exam: "PTE Academic", date: "Dec 5, 2025", overall: "72", listening: 75, reading: 70, writing: 68, speaking: 74, status: "completed", cefr: "C1" },
  { id: "ATT-2026-002", exam: "IELTS Academic", date: "Nov 18, 2025", overall: "6.5", listening: 7, reading: 6.5, writing: 6, speaking: 6.5, status: "completed", cefr: "B2" },
  { id: "ATT-2026-001", exam: "Duolingo", date: "Nov 2, 2025", overall: "120", listening: 125, reading: 118, writing: 115, speaking: 122, status: "completed", cefr: "B2" },
];

export const STUDENT_VOUCHERS = [
  { code: "ALO-IELTS-2026-AE42", type: "IELTS_MOCK", status: "available", expires: "Mar 31, 2026", source: "ALO Student Benefit", used: "2026-01-08" },
  { code: "ALO-IELTS-2026-AE43", type: "IELTS_MOCK", status: "available", expires: "Mar 31, 2026", source: "ALO Student Benefit", used: null },
  { code: "ALO-IELTS-2026-AE44", type: "IELTS_MOCK", status: "available", expires: "Mar 31, 2026", source: "ALO Student Benefit", used: null },
  { code: "ALO-SPEAK-2026-AM18", type: "SPEAKING_PRACTICE", status: "available", expires: "Apr 15, 2026", source: "Bundle Bonus", used: null },
  { code: "ALO-WRIT-2026-WL07", type: "WRITING_EVALUATION", status: "available", expires: "Apr 15, 2026", source: "Bundle Bonus", used: null },
];

export const STUDENT_FEEDBACK = [
  { id: "FB-2026-012", type: "Writing", exam: "IELTS Task 2", date: "Jan 8, 2026", score: "7.0", status: "AI Feedback Ready", reviewer: "Smart Score Engine" },
  { id: "FB-2026-011", type: "Speaking", exam: "IELTS Part 2", date: "Jan 7, 2026", score: "7.5", status: "AI Feedback Ready", reviewer: "Smart Score Engine" },
  { id: "FB-2026-010", type: "Writing", exam: "PTE Essay", date: "Dec 5, 2025", score: "68", status: "Examiner Reviewed", reviewer: "Rumana Sultana" },
];

export const STUDENT_APPOINTMENTS = [
  { id: "APT-001", title: "1:1 Speaking Review", counselor: "Rumana Sultana", date: "Fri, Jan 16", time: "4:00 PM", mode: "Online" },
  { id: "APT-002", title: "Study Plan Session", counselor: "Arif Mahmud", date: "Mon, Jan 20", time: "11:00 AM", mode: "Office" },
];

/* ===== Admin Portal data ===== */
export const ADMIN_KPIS = [
  { label: "Total Students", value: "1,924", delta: "+7%", icon: "students", color: "blue" },
  { label: "Mock Tests Taken", value: "8,412", delta: "+12%", icon: "tests", color: "orange" },
  { label: "Writing Submissions", value: "3,206", delta: "+9%", icon: "writing", color: "blue" },
  { label: "Speaking Submissions", value: "2,847", delta: "+15%", icon: "speaking", color: "orange" },
  { label: "Pending Reviews", value: "48", delta: "-3%", icon: "review", color: "warning" },
  { label: "Vouchers Available", value: "1,142", delta: "+4%", icon: "vouchers", color: "blue" },
  { label: "Vouchers Used", value: "2,318", delta: "+18%", icon: "used", color: "orange" },
  { label: "CRM Synced", value: "1,807", delta: "+6%", icon: "crm", color: "blue" },
];

export const ADMIN_STUDENTS = [
  { id: "AE-2026000042", name: "Tania Islam", email: "tania.i@example.com", phone: "+8801712***456", exam: "IELTS", mocks: 5, bestScore: "7.5", crm: "synced", status: "active", country: "UK" },
  { id: "AE-2026000043", name: "Arif Rahman", email: "arif.r@example.com", phone: "+8801812***789", exam: "PTE", mocks: 3, bestScore: "79", crm: "synced", status: "active", country: "Canada" },
  { id: "AE-2026000044", name: "Nadia Khan", email: "nadia.k@example.com", phone: "+8801912***123", exam: "Duolingo", mocks: 2, bestScore: "135", crm: "pending", status: "active", country: "Australia" },
  { id: "AE-2026000045", name: "Rakib Hasan", email: "rakib.h@example.com", phone: "+8801612***654", exam: "TOEFL", mocks: 4, bestScore: "104", crm: "synced", status: "active", country: "USA" },
  { id: "AE-2026000046", name: "Sadia Karim", email: "sadia.k@example.com", phone: "+8801512***987", exam: "IELTS UKVI", mocks: 1, bestScore: "6.5", crm: "failed", status: "active", country: "UK" },
  { id: "AE-2026000047", name: "Mitu Rahman", email: "mitu.r@example.com", phone: "+8801712***321", exam: "OIETC", mocks: 2, bestScore: "C1", crm: "synced", status: "inactive", country: "Ireland" },
  { id: "AE-2026000048", name: "Hasan Ali", email: "hasan.a@example.com", phone: "+8801812***852", exam: "OET", mocks: 3, bestScore: "B", crm: "synced", status: "active", country: "UK" },
  { id: "AE-2026000049", name: "Jerin Akter", email: "jerin.a@example.com", phone: "+8801912***741", exam: "IELTS", mocks: 6, bestScore: "8.0", crm: "synced", status: "active", country: "Canada" },
];

export const ADMIN_VOUCHERS = [
  { code: "ALO-IELTS-2026-BND01", type: "IELTS_MOCK", owner: "Bundle (5 tests)", status: "available", uses: "0/5", expires: "Dec 31, 2026", source: "Admin" },
  { code: "ALO-SCHOL-2026-MERIT", type: "PRACTICE_FEEDBACK", owner: "Scholarship Program", status: "available", uses: "2/10", expires: "Jun 30, 2026", source: "Scholarship" },
  { code: "ALO-AMB-2026-042", type: "AMBASSADOR_PROMO", owner: "AMB-2026-0042", status: "available", uses: "8/20", expires: "Mar 31, 2026", source: "Ambassador" },
  { code: "ALO-PTE-2026-PART07", type: "PTE_MOCK", owner: "Partner PRT-018", status: "reserved", uses: "3/3", expires: "Apr 15, 2026", source: "Partner" },
  { code: "ALO-WRIT-2026-COUN03", type: "WRITING_EVALUATION", owner: "Counselor Approved", status: "available", uses: "0/1", expires: "May 1, 2026", source: "Counselor" },
];

export const ADMIN_CRM_SYNC = [
  { id: "SYNC-2026-1284", entity: "Student", ref: "AE-2026000042", direction: "push", endpoint: "sync-student", status: "success", time: "2 min ago" },
  { id: "SYNC-2026-1283", entity: "Result", ref: "ATT-2026-005", direction: "push", endpoint: "push-result", status: "success", time: "5 min ago" },
  { id: "SYNC-2026-1282", entity: "Voucher", ref: "ALO-IELTS-2026-AE42", direction: "push", endpoint: "push-voucher-usage", status: "success", time: "8 min ago" },
  { id: "SYNC-2026-1281", entity: "Feedback", ref: "FB-2026-012", direction: "push", endpoint: "push-feedback", status: "success", time: "12 min ago" },
  { id: "SYNC-2026-1280", entity: "Student", ref: "AE-2026000046", direction: "push", endpoint: "sync-student", status: "failed", time: "18 min ago", error: "CRM timeout — queued for retry" },
  { id: "SYNC-2026-1279", entity: "Eligibility", ref: "AE-2026000044", direction: "pull", endpoint: "check-eligibility", status: "success", time: "25 min ago" },
];

export const ADMIN_AUDIT = [
  { id: "AUD-9842", actor: "Super Admin", action: "voucher.generate", entity: "ALO-IELTS-2026-BND01", ip: "203.188.x.x", time: "2 min ago" },
  { id: "AUD-9841", actor: "Rumana Sultana", action: "examiner.review_submit", entity: "FB-2026-010", ip: "203.188.x.x", time: "14 min ago" },
  { id: "AUD-9840", actor: "Super Admin", action: "result.view", entity: "ATT-2026-005", ip: "203.188.x.x", time: "22 min ago" },
  { id: "AUD-9839", actor: "CRM Sync Service", action: "crm.sync", entity: "AE-2026000042", ip: "127.0.0.1", time: "25 min ago" },
  { id: "AUD-9838", actor: "Super Admin", action: "question.create", entity: "Q-IELTS-R-019", ip: "203.188.x.x", time: "1 hr ago" },
  { id: "AUD-9837", actor: "Ambassador AMB-0042", action: "referral.create", entity: "REF-2026-018", ip: "103.84.x.x", time: "1 hr ago" },
  { id: "AUD-9836", actor: "Super Admin", action: "settings.update", entity: "smtp_host", ip: "203.188.x.x", time: "2 hr ago" },
  { id: "AUD-9835", actor: "System", action: "cron.voucher-expiry", entity: "12 vouchers", ip: "127.0.0.1", time: "3 hr ago" },
];

export const ADMIN_PIPELINE = [
  { stage: "Registered", count: 412, color: "#0057B8" },
  { stage: "Free Mock Done", count: 318, color: "#0B63CE" },
  { stage: "Paid Mock", count: 184, color: "#F59E0B" },
  { stage: "Voucher Used", count: 162, color: "#E8501A" },
  { stage: "CRM Lead", count: 147, color: "#8B5CF6" },
  { stage: "Counseled", count: 98, color: "#16A34A" },
];

/* ===== Examiner Portal data ===== */
export const EXAMINER_QUEUE = {
  writing: [
    { id: "WS-2026-045", student: "Tania Islam", exam: "IELTS Task 2", prompt: "Some people believe university education should be free…", words: 287, submitted: "12 min ago", priority: "normal", status: "pending" },
    { id: "WS-2026-044", student: "Arif Rahman", exam: "PTE Essay", prompt: "Discuss the impact of remote work on urban economies…", words: 312, submitted: "38 min ago", priority: "high", status: "pending" },
    { id: "WS-2026-043", student: "Nadia Khan", exam: "Duolingo Writing", prompt: "Describe a person who has influenced you…", words: 198, submitted: "1 hr ago", priority: "normal", status: "pending" },
    { id: "WS-2026-042", student: "Rakib Hasan", exam: "TOEFL Integrated", prompt: "Summarize the points made in the lecture…", words: 245, submitted: "2 hr ago", priority: "normal", status: "in-review" },
  ],
  speaking: [
    { id: "SS-2026-052", student: "Tania Islam", exam: "IELTS Part 2", prompt: "Describe a time you learned a new skill…", duration: "1:58", submitted: "15 min ago", priority: "normal", status: "pending" },
    { id: "SS-2026-051", student: "Mitu Rahman", exam: "OIETC Interview", prompt: "Why do you want to study in Ireland?…", duration: "2:14", submitted: "40 min ago", priority: "high", status: "pending" },
    { id: "SS-2026-050", student: "Hasan Ali", exam: "OET Role-play", prompt: "Clinical scenario: explaining medication…", duration: "3:02", submitted: "1 hr ago", priority: "normal", status: "in-review" },
  ],
};

export const EXAMINER_PERFORMANCE = [
  { label: "Reviews this week", value: "32", sub: "+8 vs last week" },
  { label: "Avg review time", value: "11 min", sub: "SLA: < 20 min" },
  { label: "CSAT rating", value: "4.9", sub: "from 28 students" },
  { label: "Queue remaining", value: "7", sub: "2 high priority" },
];

/* ===== Ambassador Portal data ===== */
export const AMBASSADOR_KPIS = [
  { label: "Total Referrals", value: "28", sub: "all time", icon: "users", color: "blue" },
  { label: "Converted", value: "12", sub: "43% rate", icon: "check", color: "orange" },
  { label: "Vouchers Earned", value: "8", sub: "3 unused", icon: "voucher", color: "blue" },
  { label: "Commission (safe)", value: "৳48,500", sub: "pending ৳12k", icon: "money", color: "orange" },
];

export const AMBASSADOR_REFERRALS = [
  { id: "REF-2026-028", name: "Sadia K.", exam: "IELTS", stage: "Offer", status: "converted", date: "Jan 10, 2026", commission: "৳2,500" },
  { id: "REF-2026-027", name: "Rakib H.", exam: "PTE", stage: "Mock started", status: "active", date: "Jan 8, 2026", commission: "—" },
  { id: "REF-2026-026", name: "Mitu R.", exam: "Duolingo", stage: "Registered", status: "active", date: "Jan 6, 2026", commission: "—" },
  { id: "REF-2026-025", name: "Hasan A.", exam: "IELTS UKVI", stage: "Counseled", status: "converted", date: "Jan 4, 2026", commission: "৳2,500" },
  { id: "REF-2026-024", name: "Nadia K.", exam: "TOEFL", stage: "Paid mock", status: "converted", date: "Jan 2, 2026", commission: "৳3,000" },
  { id: "REF-2026-023", name: "Tania I.", exam: "IELTS", stage: "Enrolled", status: "converted", date: "Dec 28, 2025", commission: "৳3,500" },
];

export const AMBASSADOR_MARKETING_KIT = [
  { name: "ALO English — A4 Poster", type: "PNG", size: "2.4 MB", desc: "Print-ready poster for coaching centers" },
  { name: "Facebook Ad Creative Pack", type: "ZIP", size: "8.1 MB", desc: "5 ad variations + captions (Bangla & English)" },
  { name: "Instagram Story Templates", type: "PNG", size: "3.2 MB", desc: "6 story templates with referral CTA" },
  { name: "WhatsApp Forward Pack", type: "ZIP", size: "1.8 MB", desc: "Short text + image for WhatsApp sharing" },
  { name: "Referral Link Card", type: "PNG", size: "0.6 MB", desc: "Personalized card with your code" },
  { name: "Brand Guidelines", type: "PDF", size: "1.2 MB", desc: "Logo, colors, tone of voice" },
];

/* ===== Public portal landing data ===== */
export const TRUST_STATS = [
  { label: "Students Guided", value: "12,500+" },
  { label: "Original Questions", value: "70+" },
  { label: "Exam Types", value: "8" },
  { label: "Practice Mocks", value: "48,200+" },
];

export const JOURNEY_STEPS = [
  { step: "01", title: "Register free", desc: "Create your account in 30 seconds. Verify ALO Student ID to unlock 3 free mocks." },
  { step: "02", title: "Pick an exam", desc: "IELTS, PTE, TOEFL, Duolingo, OIETC, OET or ALO Placement — full-length or section practice." },
  { step: "03", title: "Take the mock", desc: "Real timer, question palette, autosave, listening audio, writing editor, speaking recorder." },
  { step: "04", title: "Get feedback", desc: "Smart Score estimate, skill breakdown, writing & speaking feedback, downloadable PDF report." },
];

export const CRM_SYNC_FIELDS = [
  "alo_student_id", "email & phone", "country_interest", "exam_type",
  "mock_attempts", "latest_score", "speaking_report", "writing_report",
  "payment_status", "voucher_usage", "counselor_followup", "marketing_source",
];

export const FREE_QUOTA_RULES = [
  { rule: "ALO student = 3 free mocks", desc: "Verified via ALO Student ID, CRM sync, or admin mark" },
  { rule: "Public student = 1 free mock", desc: "Tracked by email + phone + device + session" },
  { rule: "Backend-enforced", desc: "Cannot be bypassed by refreshing browser" },
  { rule: "Admin can override", desc: "Add extra quota, scholarships, counselor-approved access" },
  { rule: "Audit-logged", desc: "Every free quota usage logged with IP & user agent" },
  { rule: "CRM-visible", desc: "Counselors see quota & results in CRM timeline" },
];

export const PRACTICE_DISCLAIMER = "This is original exam-aligned practice for preparation only. Scores are practice estimates. Not official exam content. No guarantee of real-exam repetition.";
