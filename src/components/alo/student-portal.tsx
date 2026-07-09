"use client";

import { useState } from "react";
import {
  LayoutDashboard, GraduationCap, FileText, Award, Mic, PenLine, Gift, CalendarClock,
  MessageSquare, BookOpen, Download, ChevronRight, Sparkles, TrendingUp, ShieldCheck,
  Clock, Users, Star, KeyRound, Check, AlertCircle, Settings, CreditCard, Bell, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MockTestEngine } from "./mock-test-engine";
import { STUDENT_KPIS, STUDENT_RESULTS, STUDENT_VOUCHERS, STUDENT_FEEDBACK, STUDENT_APPOINTMENTS, PRACTICE_DISCLAIMER } from "@/lib/platform-data";
import { EXAM_MODULES, EXAM_CATEGORIES, type ExamCategory } from "@/lib/exam-catalog";
import { QUESTIONS, type ExamType } from "@/lib/question-bank";

type Page = "dashboard" | "tests" | "mock-test" | "results" | "vouchers" | "feedback" | "study-plan" | "messages" | "settings";

const NAV = [
  { group: "My Portal", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "tests", label: "Practice Tests", icon: BookOpen }, { id: "mock-test", label: "Take Mock Test", icon: FileText }, { id: "results", label: "My Results", icon: Award }, { id: "vouchers", label: "My Vouchers", icon: Gift }, { id: "feedback", label: "Practice Feedback", icon: Sparkles }, { id: "study-plan", label: "Study Plan", icon: TrendingUp }, { id: "messages", label: "Messages", icon: MessageSquare }, { id: "settings", label: "Settings", icon: Settings }] },
];

export function StudentPortal({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedExam, setSelectedExam] = useState<ExamType | undefined>(undefined);
  return (
    <PortalLayout role="STUDENT" userName="Tania Islam" userMeta="Student · AE-2026000042" accent="bg-alo-blue" nav={NAV} activePage={page} setPage={(p) => setPage(p as Page)} onExit={onExit}>
      {page === "dashboard" && <StudentDashboard onNavigate={(p) => setPage(p as Page)} />}
      {page === "tests" && <StudentTests onStart={() => { setSelectedExam(undefined); setPage("mock-test"); }} onSelectExam={(et) => { setSelectedExam(et); setPage("mock-test"); }} />}
      {page === "mock-test" && <div className="max-w-5xl mx-auto"><MockTestEngine initialExam={selectedExam} /></div>}
      {page === "results" && <StudentResults />}
      {page === "vouchers" && <StudentVouchers />}
      {page === "feedback" && <StudentFeedback />}
      {page === "study-plan" && <StudentStudyPlan />}
      {page === "messages" && <StudentMessages />}
      {page === "settings" && <StudentSettings />}
    </PortalLayout>
  );
}

export function PortalLayout({ role, userName, userMeta, accent, nav, activePage, setPage, onExit, children }: {
  role: string; userName: string; userMeta: string; accent: string;
  nav: { group: string; items: { id: string; label: string; icon: any }[] }[];
  activePage: string; setPage: (p: string) => void; onExit: () => void; children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 alo-shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/images/alo-logo.webp" alt="ALO Education" className="h-8 w-8 rounded-lg object-contain" />
            <div className="hidden sm:block">
              <div className="text-sm font-extrabold text-alo-navy">ALO <span className="text-alo-orange">English</span></div>
              <div className="text-[9px] uppercase tracking-wider text-alo-faint">{role} PORTAL</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-alo-faint">
              <Search className="h-3.5 w-3.5" /><span>Search…</span>
            </div>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-50"><Bell className="h-4 w-4" /><span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-alo-orange" /></button>
            <button onClick={onExit} className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-alo-navy hover:bg-slate-50">Exit Portal</button>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 alo-shadow-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className={cn("grid h-9 w-9 place-items-center rounded-xl text-white text-xs font-bold", accent)}>{userName.charAt(0)}</div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-alo-navy truncate">{userName}</div>
                <div className="text-[11px] text-alo-faint truncate">{userMeta}</div>
              </div>
            </div>
            <nav className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto alo-scroll">
              {nav.map((g) => (
                <div key={g.group}>
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">{g.group}</div>
                  <div className="space-y-0.5">
                    {g.items.map((item) => (
                      <button key={item.id} onClick={() => setPage(item.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-left", activePage === item.id ? "bg-alo-soft-blue text-alo-blue" : "text-alo-navy hover:bg-slate-50")}>
                        <item.icon className="h-4 w-4" />{item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-alo-navy">{title}</h1>
        {subtitle && <p className="text-sm text-alo-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StudentDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      <PageHeader title="Welcome back, Tania 👋" subtitle="Your admission journey at a glance." action={<span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-alo-success"><ShieldCheck className="h-3 w-3" />ALO Student Benefits Active</span>} />
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {STUDENT_KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className={cn("grid h-9 w-9 place-items-center rounded-lg", k.color === "orange" ? "bg-alo-soft-orange text-alo-orange" : "bg-alo-soft-blue text-alo-blue")}>
              {k.icon === "vouchers" ? <Gift className="h-4 w-4" /> : k.icon === "tests" ? <FileText className="h-4 w-4" /> : k.icon === "award" ? <Award className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            </div>
            <div className="mt-2 flex items-end gap-1.5"><span className="text-2xl font-extrabold text-alo-navy">{k.value}</span><span className="text-[11px] text-alo-faint mb-1">{k.sub}</span></div>
            <div className="text-[11px] text-alo-faint">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Admission track */}
        <div className="lg:col-span-2 rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-alo-navy">Recent Results</div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("results")} className="text-alo-blue text-xs">View all<ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="space-y-2.5">
            {STUDENT_RESULTS.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-white text-xs font-bold", r.exam.includes("IELTS") ? "bg-alo-blue" : r.exam.includes("PTE") ? "bg-alo-orange" : "bg-alo-royal")}>{r.overall}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-alo-navy">{r.exam}</div>
                  <div className="text-[11px] text-alo-faint">{r.date} · {r.id} · CEFR {r.cefr}</div>
                </div>
                <Button variant="ghost" size="sm" className="text-alo-blue"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
        {/* AI next action */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className="text-sm font-bold text-alo-navy mb-1">Profile Strength</div>
            <div className="flex items-end gap-1"><span className="text-3xl font-extrabold text-alo-blue">85%</span><span className="text-[11px] text-alo-success mb-1">+5%</span></div>
            <Progress value={85} className="mt-2 h-1.5" />
            <p className="mt-2 text-[11px] text-alo-faint">Add 2 more documents to reach 95%.</p>
          </div>
          <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4">
            <div className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-alo-orange" /><span className="text-xs font-bold text-alo-orange">AI NEXT ACTION</span></div>
            <p className="mt-1.5 text-sm text-alo-navy leading-6">Your reading accuracy is at 70%. Take a focused IELTS Reading mock to lift your band.</p>
            <Button onClick={() => onNavigate("mock-test")} size="sm" className="mt-2 h-8 rounded-lg bg-alo-orange text-white text-xs hover:bg-[#cc3f10]">Start Reading Mock</Button>
          </div>
        </div>
      </div>

      {/* Appointments + Vouchers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-sm font-bold text-alo-navy mb-3">Upcoming Appointments</div>
          <div className="space-y-2">
            {STUDENT_APPOINTMENTS.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><CalendarClock className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy">{a.title}</div><div className="text-[11px] text-alo-faint">{a.counselor} · {a.date} {a.time} · {a.mode}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-alo-navy">Active Vouchers</div><Button variant="ghost" size="sm" onClick={() => onNavigate("vouchers")} className="text-alo-blue text-xs">View all</Button></div>
          <div className="space-y-2">
            {STUDENT_VOUCHERS.filter((v) => v.status === "available").slice(0, 3).map((v) => (
              <div key={v.code} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange"><Gift className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="text-xs font-mono font-bold text-alo-navy truncate">{v.code}</div><div className="text-[11px] text-alo-faint">{v.type.replace(/_/g, " ")} · expires {v.expires}</div></div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-alo-success">Available</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentTests({ onStart, onSelectExam }: { onStart: () => void; onSelectExam?: (examType: ExamType) => void }) {
  const [cat, setCat] = useState<ExamCategory | "all">("all");
  const filtered = EXAM_MODULES.filter((e) => cat === "all" || e.category === cat);
  const qCount = (et: ExamType | null) => et ? QUESTIONS.filter((q) => q.examType === et).length : 0;
  return (
    <div>
      <PageHeader title="Practice Tests" subtitle="Choose any computer-based exam to start a timed mock with original questions." action={<Button onClick={onStart} className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Sparkles className="mr-2 h-4 w-4" />Quick Start</Button>} />
      <div className="flex flex-wrap gap-2 mb-4">
        {([["all", `All (${EXAM_MODULES.length})`], ...EXAM_CATEGORIES.map((c) => [c.id, `${c.name} (${EXAM_MODULES.filter((e) => e.category === c.id).length})`] as const)] as const).map(([id, label]) => (
          <button key={id} onClick={() => setCat(id as ExamCategory | "all")} className={cn("rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all", cat === id ? "border-transparent bg-alo-navy text-white" : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue")}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => {
          const a = e.accent === "orange" ? "bg-alo-orange" : e.accent === "royal" ? "bg-alo-royal" : e.accent === "green" ? "bg-emerald-500" : e.accent === "purple" ? "bg-purple-500" : "bg-alo-blue";
          const qc = qCount(e.examType);
          return (
            <div key={e.id} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all flex flex-col">
              <div className="flex items-center justify-between">
                <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white", a)}><BookOpen className="h-5 w-5" /></div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-alo-soft-blue text-alo-blue">{e.badge}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-alo-navy">{e.name}</h3>
              <p className="text-xs text-alo-faint mt-1 flex-1 line-clamp-2">{e.tagline}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-alo-faint">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.duration}</span>
                <span className="flex items-center gap-1"><Award className="h-3 w-3" />{e.scale}</span>
                {qc > 0 && <span className="font-semibold text-alo-blue">{qc} Qs</span>}
              </div>
              <Button onClick={() => onSelectExam ? onSelectExam(e.examType || "IELTS") : onStart()} className="mt-3 w-full h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e] text-sm">Start Mock Test<ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-800 leading-relaxed"><span className="font-semibold">Practice disclaimer:</span> {PRACTICE_DISCLAIMER}</p></div>
    </div>
  );
}

function StudentResults() {
  return (
    <div>
      <PageHeader title="My Results" subtitle="All your mock test attempts and downloadable reports." />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wide text-alo-faint">
                <th className="px-4 py-3 font-semibold">Attempt</th>
                <th className="px-4 py-3 font-semibold">Exam</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Overall</th>
                <th className="px-4 py-3 font-semibold">L / R / W / S</th>
                <th className="px-4 py-3 font-semibold">CEFR</th>
                <th className="px-4 py-3 font-semibold">Report</th>
              </tr>
            </thead>
            <tbody>
              {STUDENT_RESULTS.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-alo-navy">{r.exam}</td>
                  <td className="px-4 py-3 text-alo-muted">{r.date}</td>
                  <td className="px-4 py-3"><span className="text-base font-extrabold text-alo-orange">{r.overall}</span></td>
                  <td className="px-4 py-3 text-alo-muted text-xs">{r.listening} / {r.reading} / {r.writing} / {r.speaking}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-alo-soft-blue px-2 py-0.5 text-[11px] font-bold text-alo-blue">{r.cefr}</span></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-alo-blue"><Download className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StudentVouchers() {
  return (
    <div>
      <PageHeader title="My Vouchers" subtitle="Use vouchers to unlock mock tests, speaking practice and writing evaluation." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STUDENT_VOUCHERS.map((v) => (
          <div key={v.code} className={cn("rounded-2xl border-2 p-5", v.status === "available" ? "border-alo-card bg-white" : "border-slate-200 bg-slate-50 opacity-70")}>
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-alo-soft-orange text-alo-orange"><Gift className="h-5 w-5" /></div>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase", v.status === "available" ? "bg-emerald-50 text-alo-success" : "bg-slate-200 text-alo-faint")}>{v.status}</span>
            </div>
            <div className="mt-3 text-sm font-mono font-bold text-alo-navy">{v.code}</div>
            <div className="text-xs text-alo-faint mt-1">{v.type.replace(/_/g, " ")} · {v.source}</div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-alo-faint">Expires: {v.expires}</span>
              {v.used ? <span className="text-alo-faint">Used: {v.used}</span> : <Button size="sm" className="h-8 rounded-lg bg-alo-orange text-white text-xs hover:bg-[#cc3f10]">Use Voucher</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentFeedback() {
  return (
    <div>
      <PageHeader title="Practice Feedback" subtitle="Smart Score Engine + examiner feedback on your writing & speaking." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange"><PenLine className="h-4 w-4" /></div><div className="mt-2 text-2xl font-extrabold text-alo-navy">1</div><div className="text-xs text-alo-faint">Writing feedback pending</div></div>
        <div className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><Mic className="h-4 w-4" /></div><div className="mt-2 text-2xl font-extrabold text-alo-navy">0</div><div className="text-xs text-alo-faint">Speaking feedback pending</div></div>
        <div className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-alo-success"><Check className="h-4 w-4" /></div><div className="mt-2 text-2xl font-extrabold text-alo-navy">3</div><div className="text-xs text-alo-faint">Feedback ready</div></div>
      </div>
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-alo-navy">Feedback History</div>
        <div className="divide-y divide-slate-100">
          {STUDENT_FEEDBACK.map((f) => (
            <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
              <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-white", f.type === "Writing" ? "bg-alo-orange" : "bg-alo-blue")}>{f.type === "Writing" ? <PenLine className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</div>
              <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy">{f.exam}</div><div className="text-[11px] text-alo-faint">{f.date} · {f.id} · {f.reviewer}</div></div>
              <div className="text-right"><div className="text-base font-extrabold text-alo-orange">{f.score}</div><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", f.status.includes("Ready") ? "bg-emerald-50 text-alo-success" : "bg-alo-soft-blue text-alo-blue")}>{f.status}</span></div>
              <Button variant="ghost" size="sm" className="text-alo-blue"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentStudyPlan() {
  const plan = [
    { day: "Mon", focus: "Reading — matching headings", duration: "45 min", done: true },
    { day: "Tue", focus: "Listening — section 3 practice", duration: "30 min", done: true },
    { day: "Wed", focus: "Writing — Task 1 report", duration: "40 min", done: true },
    { day: "Thu", focus: "Speaking — Part 2 cue cards", duration: "30 min", done: false },
    { day: "Fri", focus: "Full mock test (timed)", duration: "2h 44m", done: false },
    { day: "Sat", focus: "Review weak areas + vocabulary", duration: "60 min", done: false },
    { day: "Sun", focus: "Rest or light practice", duration: "—", done: false },
  ];
  return (
    <div>
      <PageHeader title="Study Plan" subtitle="AI-generated 7-day plan based on your latest performance." action={<Button className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Sparkles className="mr-2 h-4 w-4" />Regenerate Plan</Button>} />
      <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-alo-navy">This Week</div><span className="rounded-full bg-alo-soft-blue px-2.5 py-1 text-[11px] font-bold text-alo-blue">3/7 completed</span></div>
        <div className="space-y-2">
          {plan.map((p) => (
            <div key={p.day} className={cn("flex items-center gap-3 rounded-xl border p-3", p.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200")}>
              <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-xs font-bold", p.done ? "bg-alo-success text-white" : "bg-slate-100 text-alo-faint")}>{p.day}</div>
              <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-alo-navy">{p.focus}</div><div className="text-[11px] text-alo-faint">{p.duration}</div></div>
              {p.done ? <Check className="h-4 w-4 text-alo-success" /> : <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs">Start</Button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentMessages() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with your counselor and support team." />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-3 min-h-[400px]">
          <div className="border-r border-slate-200 lg:col-span-1">
            <div className="p-3 text-xs font-bold uppercase tracking-wider text-alo-faint border-b border-slate-200">Conversations</div>
            {[{ n: "Rumana Sultana", r: "Senior Counselor", t: "Great progress! Your speaking is at 7.5…", time: "2h", unread: true }, { n: "ALO Support", r: "Helpdesk", t: "Your voucher has been activated.", time: "1d", unread: false }].map((c, i) => (
              <div key={c.n} className={cn("flex items-center gap-2.5 p-3 border-b border-slate-100 cursor-pointer", i === 0 ? "bg-alo-soft-blue" : "hover:bg-slate-50")}>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold">{c.n.charAt(0)}</div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy truncate">{c.n}</div><div className="text-[11px] text-alo-faint truncate">{c.t}</div></div>
                <div className="text-right"><div className="text-[10px] text-alo-faint">{c.time}</div>{c.unread && <span className="inline-block h-2 w-2 rounded-full bg-alo-orange mt-1" />}</div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2 flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-alo-blue text-white text-xs font-bold">R</div>
              <div><div className="text-sm font-bold text-alo-navy">Rumana Sultana</div><div className="text-[11px] text-alo-success flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-alo-success" />Online</div></div>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto alo-scroll bg-slate-50/50">
              <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3.5 py-2 text-sm text-alo-navy">Hi Tania! Your last mock was great — band 7.5. Let's focus on reading matching headings next.</div></div>
              <div className="flex justify-end"><div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-alo-blue px-3.5 py-2 text-sm text-white">Thank you! I struggled with matching headings. Any tips?</div></div>
              <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-3.5 py-2 text-sm text-alo-navy">Yes! Read the headings first, then scan for synonyms. I've added 3 practice sets to your study plan. 📚</div></div>
            </div>
            <div className="p-3 border-t border-slate-200 flex items-center gap-2">
              <input placeholder="Type a message…" className="flex-1 h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:border-alo-blue" />
              <Button className="h-10 rounded-lg bg-alo-blue text-white hover:bg-[#004a9e] px-4">Send</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentSettings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, notifications and security." />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-sm font-bold text-alo-navy mb-3">Profile</div>
          <div className="space-y-3">
            <div><label className="text-xs font-semibold text-alo-navy">Full name</label><input defaultValue="Tania Islam" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
            <div><label className="text-xs font-semibold text-alo-navy">Email</label><input defaultValue="tania.i@example.com" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
            <div><label className="text-xs font-semibold text-alo-navy">Phone</label><input defaultValue="+8801712***456" className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm" /></div>
            <div><label className="text-xs font-semibold text-alo-navy">ALO Student ID</label><input defaultValue="AE-2026000042" disabled className="mt-1 w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50 text-alo-faint" /></div>
            <Button className="h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]">Save Changes</Button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
            <div className="text-sm font-bold text-alo-navy mb-3">Notifications</div>
            {[{ l: "Email — results & feedback", on: true }, { l: "SMS — appointment reminders", on: true }, { l: "WhatsApp — voucher updates", on: false }].map((n) => (
              <div key={n.l} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-alo-navy">{n.l}</span>
                <div className={cn("h-5 w-9 rounded-full p-0.5 transition-colors", n.on ? "bg-alo-blue" : "bg-slate-300")}><div className={cn("h-4 w-4 rounded-full bg-white transition-transform", n.on && "translate-x-4")} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
            <div className="text-sm font-bold text-alo-navy mb-3">Security</div>
            <Button variant="outline" className="w-full h-10 rounded-xl border-slate-300 text-alo-blue mb-2">Change Password</Button>
            <Button variant="outline" className="w-full h-10 rounded-xl border-slate-300 text-alo-navy">Download My Data</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
