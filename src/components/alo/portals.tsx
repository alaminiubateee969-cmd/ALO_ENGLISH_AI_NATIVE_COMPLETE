"use client";

import { useState } from "react";
import {
  GraduationCap,
  Users,
  Briefcase,
  LayoutDashboard,
  Bell,
  Search,
  ChevronRight,
  FileText,
  Award,
  ShieldCheck,
  MessageSquare,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  Settings,
  Download,
  Send,
  Star,
  Target,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CRM_KPIS, CRM_PIPELINE, STUDENT_PORTAL_NAV } from "@/lib/alo-data";

type PortalId = "student" | "partner" | "employee" | "crm";

const PORTALS: { id: PortalId; name: string; icon: any; tagline: string; accent: string }[] = [
  { id: "student", name: "Student Portal", icon: GraduationCap, tagline: "Your personal admission command center", accent: "bg-alo-blue" },
  { id: "partner", name: "Partner Portal", icon: Briefcase, tagline: "Manage referrals, students and applications", accent: "bg-alo-orange" },
  { id: "employee", name: "Employee Login", icon: Users, tagline: "Secure staff workspace for counselors", accent: "bg-alo-navy" },
  { id: "crm", name: "CRM Dashboard", icon: LayoutDashboard, tagline: "Revenue & student operations cockpit", accent: "bg-alo-royal" },
];

export function AloPortals({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  const [active, setActive] = useState<PortalId>("student");

  return (
    <section id="portals" className="py-16 lg:py-24 bg-alo-soft-gray">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-sm font-bold uppercase tracking-wide text-alo-orange">Portals</div>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-alo-navy">
            One platform. Four secure workspaces.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-8 text-alo-muted">
            Students, partners, employees and CRM users each get a role-based portal — secure,
            audit-logged and tailored to their needs.
          </p>
        </div>

        {/* Portal tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                active === p.id
                  ? "border-transparent bg-alo-navy text-white alo-shadow-sm"
                  : "border-slate-200 bg-white text-alo-navy hover:bg-alo-soft-blue"
              )}
            >
              <p.icon className="h-4 w-4" />
              {p.name}
            </button>
          ))}
        </div>

        {/* Active portal preview */}
        <div className="rounded-3xl border border-slate-200 bg-white alo-shadow-lg overflow-hidden">
          {active === "student" && <StudentPortalPreview onOpenAuth={onOpenAuth} />}
          {active === "partner" && <PartnerPortalPreview onOpenAuth={onOpenAuth} />}
          {active === "employee" && <EmployeePortalPreview onOpenAuth={onOpenAuth} />}
          {active === "crm" && <CrmPortalPreview />}
        </div>

        <p className="mt-4 text-center text-xs text-alo-faint">
          Role-based access · CSRF protected · audit-logged · private data never exposed across roles
        </p>
      </div>
    </section>
  );
}

/* ---------- Shared portal shell ---------- */
function PortalShell({
  sidebarNav,
  role,
  userName,
  userMeta,
  children,
  accent,
  onOpenAuth,
}: {
  sidebarNav: { group: string; items: string[] }[];
  role: string;
  userName: string;
  userMeta: string;
  accent: string;
  children: React.ReactNode;
  onOpenAuth: (mode: "login" | "register") => void;
}) {
  return (
    <div className="grid lg:grid-cols-12 min-h-[560px]">
      {/* Sidebar */}
      <aside className="lg:col-span-3 border-r border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl text-white text-xs font-bold", accent)}>
            {userName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-alo-navy truncate">{userName}</div>
            <div className="text-[11px] text-alo-faint truncate">{userMeta}</div>
          </div>
        </div>
        <nav className="mt-3 space-y-3 max-h-[460px] overflow-y-auto alo-scroll">
          {sidebarNav.map((g) => (
            <div key={g.group}>
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">{g.group}</div>
              <div className="space-y-0.5">
                {g.items.map((item, i) => (
                  <button
                    key={item}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-alo-navy hover:bg-alo-soft-blue text-left",
                      g.group === "AI Tools" && "text-alo-orange"
                    )}
                  >
                    {g.group === "AI Tools" ? <Sparkles className="h-3.5 w-3.5" /> : i === 0 ? <LayoutDashboard className="h-3.5 w-3.5 text-alo-blue" /> : <ChevronRight className="h-3 w-3 text-alo-faint" />}
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:col-span-9 flex flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-alo-soft-blue px-2 py-0.5 text-[11px] font-bold text-alo-blue">{role}</span>
            <span className="text-sm font-bold text-alo-navy hidden sm:inline">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-alo-faint">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search…</span>
            </div>
            <button className="relative grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-50">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-alo-orange" />
            </button>
            <Button onClick={() => onOpenAuth("login")} size="sm" className="h-8 rounded-lg bg-alo-blue text-white text-xs hover:bg-[#004a9e]">
              Open Portal
            </Button>
          </div>
        </div>
        <div className="flex-1 p-5 overflow-y-auto alo-scroll">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Student Portal ---------- */
function StudentPortalPreview({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  return (
    <PortalShell
      sidebarNav={STUDENT_PORTAL_NAV}
      role="STUDENT"
      userName="Tania Islam"
      userMeta="Student · AE-2026000042"
      accent="bg-alo-blue"
      onOpenAuth={onOpenAuth}
    >
      <div className="mb-4">
        <h3 className="text-2xl md:text-3xl font-extrabold text-alo-navy">Welcome back, Tania 👋</h3>
        <p className="text-sm text-alo-muted">Your admission journey at a glance.</p>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { icon: FileText, l: "Applications", v: "3", c: "blue" },
          { icon: Award, l: "Offers", v: "2", c: "orange" },
          { icon: ShieldCheck, l: "Visa stage", v: "Docs", c: "blue" },
          { icon: Sparkles, l: "AI actions", v: "5", c: "orange" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-alo-card bg-white p-4">
            <k.icon className={cn("h-4 w-4", k.c === "orange" ? "text-alo-orange" : "text-alo-blue")} />
            <div className="mt-1.5 text-2xl font-extrabold text-alo-navy">{k.v}</div>
            <div className="text-xs text-alo-faint">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Global admission track */}
        <div className="lg:col-span-2 rounded-2xl border border-alo-card bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-alo-navy">Global Admission Track</div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-alo-success">On track</span>
          </div>
          <div className="space-y-3">
            {[
              { l: "University of Edinburgh — MSc Data Science", s: "Offer received", c: "bg-alo-success", pct: 80 },
              { l: "University of Leeds — MSc Data Science", s: "Offer received", c: "bg-alo-success", pct: 80 },
              { l: "University of Manchester — MSc CS", s: "Under review", c: "bg-alo-warning", pct: 55 },
            ].map((a) => (
              <div key={a.l}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-alo-navy truncate">{a.l}</span>
                  <span className="text-alo-faint shrink-0 ml-2">{a.s}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", a.c)} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Profile strength + AI next action */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-alo-card bg-white p-4">
            <div className="text-sm font-bold text-alo-navy mb-1">Profile Strength</div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-alo-blue">85%</span>
              <span className="text-[11px] text-alo-success mb-1">+5%</span>
            </div>
            <Progress value={85} className="mt-2 h-1.5" />
            <p className="mt-2 text-[11px] text-alo-faint">Add 2 more documents to reach 95%.</p>
          </div>
          <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-alo-orange" />
              <span className="text-xs font-bold text-alo-orange">AI NEXT ACTION</span>
            </div>
            <p className="mt-1.5 text-sm text-alo-navy leading-6">Upload your bank statement to start your UK visa file.</p>
            <Button size="sm" className="mt-2 h-8 rounded-lg bg-alo-orange text-white text-xs hover:bg-[#cc3f10]">Upload now</Button>
          </div>
        </div>
      </div>
      {/* AI Copilot chat strip */}
      <div className="mt-4 rounded-2xl border border-alo-card bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-alo-orange text-white"><Sparkles className="h-4 w-4" /></div>
          <span className="text-sm font-bold text-alo-navy">ALO AI Admissions Assistant</span>
          <span className="rounded-full bg-alo-soft-blue px-2 py-0.5 text-[10px] font-bold text-alo-blue">COPILOT LIVE</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <input placeholder="Ask about courses, documents, deadlines…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-alo-faint" />
          <Button size="sm" className="h-8 rounded-lg bg-alo-orange text-white text-xs hover:bg-[#cc3f10]"><Send className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </PortalShell>
  );
}

/* ---------- Partner Portal ---------- */
function PartnerPortalPreview({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  const nav = [
    { group: "Partner", items: ["Dashboard", "Leads", "Students", "Applications", "Reports", "Course Finder"] },
  ];
  return (
    <PortalShell
      sidebarNav={nav}
      role="PARTNER"
      userName="Dhaka Ed Consult"
      userMeta="Partner · PRT-2026-018"
      accent="bg-alo-orange"
      onOpenAuth={onOpenAuth}
    >
      <div className="mb-4">
        <h3 className="text-2xl md:text-3xl font-extrabold text-alo-navy">Partner Dashboard</h3>
        <p className="text-sm text-alo-muted">Track referrals, students and application progress.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { icon: Users, l: "Referred students", v: "42" },
          { icon: FileText, l: "Active applications", v: "18" },
          { icon: Award, l: "Offers", v: "11" },
          { icon: Plane, l: "Enrolled", v: "7" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-alo-card bg-white p-4">
            <k.icon className="h-4 w-4 text-alo-orange" />
            <div className="mt-1.5 text-2xl font-extrabold text-alo-navy">{k.v}</div>
            <div className="text-xs text-alo-faint">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-alo-card bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-alo-navy">Recent referrals</div>
          <span className="text-xs text-alo-faint">Safe status only · no private data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-alo-faint border-b border-slate-200">
                <th className="py-2 font-semibold">Student</th>
                <th className="py-2 font-semibold">Country</th>
                <th className="py-2 font-semibold">Stage</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { n: "Sadia K.", c: "🇬🇧 UK", s: "Offer", st: "approved" },
                { n: "Rakib H.", c: "🇨🇦 Canada", s: "Application", st: "pending" },
                { n: "Mitu R.", c: "🇦🇺 Australia", s: "Counseling", st: "pending" },
                { n: "Hasan A.", c: "🇮🇪 Ireland", s: "Enrolled", st: "approved" },
              ].map((r) => (
                <tr key={r.n} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 font-semibold text-alo-navy">{r.n}</td>
                  <td className="py-2.5 text-alo-muted">{r.c}</td>
                  <td className="py-2.5 text-alo-muted">{r.s}</td>
                  <td className="py-2.5">
                    <span className={cn("pill", r.st === "approved" ? "bg-emerald-50 text-alo-success" : "bg-amber-50 text-alo-warning")}>
                      {r.st}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}

/* ---------- Employee Portal ---------- */
function EmployeePortalPreview({ onOpenAuth }: { onOpenAuth: (mode: "login" | "register") => void }) {
  const nav = [
    { group: "Workspace", items: ["Dashboard", "My Students", "My Tasks", "Appointments", "Messages", "Reports"] },
    { group: "Tools", items: ["Course Finder", "Document Review", "Visa Desk", "Marketing Studio"] },
  ];
  return (
    <PortalShell
      sidebarNav={nav}
      role="COUNSELOR"
      userName="Rumana Sultana"
      userMeta="Senior Counselor · UK Desk"
      accent="bg-alo-navy"
      onOpenAuth={onOpenAuth}
    >
      <div className="mb-4">
        <h3 className="text-2xl md:text-3xl font-extrabold text-alo-navy">Counselor Workspace</h3>
        <p className="text-sm text-alo-muted">Your students, tasks and follow-ups for today.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { icon: Users, l: "My students", v: "38" },
          { icon: Clock, l: "Tasks today", v: "12" },
          { icon: Target, l: "Offers this month", v: "9" },
          { icon: Star, l: "CSAT rating", v: "4.9" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-alo-card bg-white p-4">
            <k.icon className="h-4 w-4 text-alo-blue" />
            <div className="mt-1.5 text-2xl font-extrabold text-alo-navy">{k.v}</div>
            <div className="text-xs text-alo-faint">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-4">
          <div className="text-sm font-bold text-alo-navy mb-3">Today&apos;s tasks</div>
          <div className="space-y-2">
            {[
              { t: "Review Tania I. SOP — Edinburgh", s: "urgent" },
              { t: "Call Rakib H. re: visa documents", s: "today" },
              { t: "Submit Mitu R. application — Leeds", s: "today" },
              { t: "Follow up with Hasan A. — offer", s: "done" },
            ].map((task) => (
              <div key={task.t} className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2">
                {task.s === "done" ? <CheckCircle2 className="h-4 w-4 text-alo-success" /> : task.s === "urgent" ? <AlertCircle className="h-4 w-4 text-alo-danger" /> : <Clock className="h-4 w-4 text-alo-warning" />}
                <span className={cn("text-sm flex-1", task.s === "done" ? "text-alo-faint line-through" : "text-alo-navy")}>{task.t}</span>
                <span className={cn("pill text-[10px]", task.s === "done" ? "bg-emerald-50 text-alo-success" : task.s === "urgent" ? "bg-red-50 text-alo-danger" : "bg-amber-50 text-alo-warning")}>{task.s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-4">
          <div className="text-sm font-bold text-alo-navy mb-3">Upcoming appointments</div>
          <div className="space-y-2">
            {[
              { n: "Tania Islam", t: "Fri 4:00 PM", p: "SOP review + Edinburgh offer", flag: "🇬🇧" },
              { n: "Arif Rahman", t: "Sat 11:00 AM", p: "Canada visa docs", flag: "🇨🇦" },
              { n: "Nadia Khan", t: "Mon 2:30 PM", p: "Course shortlisting", flag: "🇦🇺" },
            ].map((a) => (
              <div key={a.n} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-blue text-lg">{a.flag}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-alo-navy">{a.n}</div>
                  <div className="text-xs text-alo-faint truncate">{a.p}</div>
                </div>
                <div className="text-xs font-semibold text-alo-blue shrink-0">{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalShell>
  );
}

/* ---------- CRM Portal ---------- */
function CrmPortalPreview() {
  return (
    <div className="grid lg:grid-cols-12 min-h-[560px]">
      {/* CRM Sidebar */}
      <aside className="lg:col-span-2 border-r border-slate-200 bg-alo-navy p-3 text-white">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-orange text-white text-xs font-bold">SA</div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">Super Admin</div>
            <div className="text-[10px] text-white/60">ALO Web_CRM</div>
          </div>
        </div>
        <nav className="mt-3 space-y-3 max-h-[460px] overflow-y-auto alo-scroll">
          {[
            { g: "Command", items: ["Dashboard", "Leads", "Students", "Applications", "Pipeline"] },
            { g: "Operations", items: ["Universities", "Course Finder", "Tasks", "Reports"] },
            { g: "Intelligence", items: ["AI Command Center", "Marketing", "Visa", "Settings"] },
          ].map((grp) => (
            <div key={grp.g}>
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">{grp.g}</div>
              <div className="space-y-0.5">
                {grp.items.map((it, i) => (
                  <button key={it} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-left", grp.g === "Command" && i === 0 ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5")}>
                    {i === 0 && grp.g === "Command" ? <LayoutDashboard className="h-3.5 w-3.5" /> : <ChevronRight className="h-3 w-3 text-white/30" />}
                    <span className="truncate">{it}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* CRM Main */}
      <div className="lg:col-span-10 flex flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-alo-navy px-2 py-0.5 text-[11px] font-bold text-white">CRM</span>
            <span className="text-sm font-bold text-alo-navy hidden sm:inline">Revenue &amp; Student Operations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-alo-faint">
              <Search className="h-3.5 w-3.5" /><span className="hidden md:inline">Search students, leads…</span>
            </div>
            <button className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-alo-faint hover:bg-slate-50"><Bell className="h-4 w-4" /></button>
            <Button size="sm" className="h-8 rounded-lg bg-alo-orange text-white text-xs hover:bg-[#cc3f10]">+ New Lead</Button>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto alo-scroll bg-slate-50/50">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {CRM_KPIS.map((k) => (
              <div key={k.label} className="rounded-2xl border border-alo-card bg-white p-4">
                <div className="flex items-center justify-between">
                  <k.icon className={cn("h-4 w-4", k.color === "orange" ? "text-alo-orange" : "text-alo-blue")} />
                  <span className="text-[10px] font-bold text-alo-success">{k.delta}</span>
                </div>
                <div className="mt-1.5 text-3xl md:text-4xl font-extrabold text-alo-navy">{k.value}</div>
                <div className="text-xs text-alo-faint">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Pipeline board */}
            <div className="lg:col-span-2 rounded-2xl border border-alo-card bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-bold text-alo-navy">Admissions Pipeline</div>
                <div className="flex gap-1">
                  {["Board", "List", "Chart"].map((v, i) => (
                    <span key={v} className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", i === 0 ? "bg-alo-soft-blue text-alo-blue" : "text-alo-faint")}>{v}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 overflow-x-auto">
                {CRM_PIPELINE.map((col) => (
                  <div key={col.stage} className="min-w-[120px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-alo-navy">{col.stage}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: col.color }}>{col.count}</span>
                    </div>
                    <div className="space-y-1.5">
                      {col.items.map((it) => (
                        <div key={it} className="rounded-lg border border-slate-200 bg-white p-2 text-[10px] text-alo-navy leading-tight">
                          {it}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI recommendations + activity */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-alo-orange" />
                  <span className="text-xs font-bold text-alo-orange">AI RECOMMENDATIONS</span>
                </div>
                <ul className="space-y-2 text-xs text-alo-navy">
                  <li className="flex items-start gap-1.5"><TrendingUp className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" /> 14 leads need follow-up today</li>
                  <li className="flex items-start gap-1.5"><AlertCircle className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" /> 3 visa files approaching deadline</li>
                  <li className="flex items-start gap-1.5"><Target className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" /> UK intake closing in 18 days</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-alo-card bg-white p-4">
                <div className="text-sm font-bold text-alo-navy mb-2">Activity timeline</div>
                <div className="space-y-2.5">
                  {[
                    { i: Award, c: "text-alo-success", t: "Offer accepted — Tania I. → Edinburgh" },
                    { i: FileText, c: "text-alo-blue", t: "New application — Rakib H. → Toronto" },
                    { i: Users, c: "text-alo-orange", t: "New lead from Course Finder — Nadia K." },
                    { i: ShieldCheck, c: "text-alo-success", t: "Visa approved — Sabbir A. → UK" },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <a.i className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", a.c)} />
                      <span className="text-alo-navy leading-5">{a.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
