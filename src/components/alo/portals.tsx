"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, Award, Gift, RefreshCw, BookOpen, Settings,
  ShieldCheck, TrendingUp, AlertCircle, Check, X, ChevronRight, Search, Download,
  Mic, PenLine, Sparkles, BarChart3, Bell, Briefcase, KeyRound, Star, Target, Send,
  Crown, Share2, Link2, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PortalLayout } from "./student-portal";
import { ADMIN_KPIS, ADMIN_STUDENTS, ADMIN_VOUCHERS, ADMIN_CRM_SYNC, ADMIN_AUDIT, ADMIN_PIPELINE, EXAMINER_QUEUE, EXAMINER_PERFORMANCE, AMBASSADOR_KPIS, AMBASSADOR_REFERRALS, AMBASSADOR_MARKETING_KIT, type Role } from "@/lib/platform-data";
import { AI_AGENTS, AGENT_STATS, AGENT_APPROVAL_QUEUE, AGENT_RECENT_LOGS, type AiAgent } from "@/lib/agent-data";

/* ============== ADMIN PORTAL ============== */
export function AdminPortal({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState("dashboard");
  const nav = [{ group: "Command", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "students", label: "Students", icon: Users }, { id: "questions", label: "Question Bank", icon: BookOpen }, { id: "agents", label: "AI Agent Employees", icon: Sparkles }, { id: "vouchers", label: "Vouchers", icon: Gift }, { id: "crm", label: "CRM Sync", icon: RefreshCw }, { id: "audit", label: "Audit Logs", icon: ShieldCheck }, { id: "reports", label: "Reports", icon: BarChart3 }, { id: "settings", label: "Settings", icon: Settings }] }];
  return (
    <PortalLayout role="ADMIN" userName="Super Admin" userMeta="Admin · SUPER_ADMIN" accent="bg-alo-navy" nav={nav} activePage={page} setPage={setPage} onExit={onExit}>
      {page === "dashboard" && <AdminDashboard />}
      {page === "students" && <AdminStudents />}
      {page === "questions" && <AdminQuestions />}
      {page === "agents" && <AdminAiAgents />}
      {page === "vouchers" && <AdminVouchers />}
      {page === "crm" && <AdminCrm />}
      {page === "audit" && <AdminAudit />}
      {page === "reports" && <AdminReports />}
      {page === "settings" && <AdminSettings />}
    </PortalLayout>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div><h1 className="text-2xl md:text-3xl font-extrabold text-alo-navy">{title}</h1>{subtitle && <p className="text-sm text-alo-muted mt-1">{subtitle}</p>}</div>
      {action}
    </div>
  );
}

function AdminDashboard() {
  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Revenue & student operations cockpit." action={<Button className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Sparkles className="mr-2 h-4 w-4" />+ New Lead</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {ADMIN_KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className="flex items-center justify-between">
              <div className={cn("grid h-9 w-9 place-items-center rounded-lg", k.color === "orange" ? "bg-alo-soft-orange text-alo-orange" : "bg-alo-soft-blue text-alo-blue")}>
                {k.icon === "students" ? <Users className="h-4 w-4" /> : k.icon === "tests" ? <FileText className="h-4 w-4" /> : k.icon === "writing" ? <PenLine className="h-4 w-4" /> : k.icon === "speaking" ? <Mic className="h-4 w-4" /> : k.icon === "review" ? <AlertCircle className="h-4 w-4" /> : k.icon === "vouchers" ? <Gift className="h-4 w-4" /> : k.icon === "used" ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              </div>
              <span className={cn("text-[10px] font-bold", k.delta.startsWith("+") ? "text-alo-success" : "text-alo-danger")}>{k.delta}</span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-alo-navy">{k.value}</div>
            <div className="text-xs text-alo-faint">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="lg:col-span-2 rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-4"><div className="text-sm font-bold text-alo-navy">Student Pipeline</div><div className="flex gap-1">{["Board", "Chart"].map((v, i) => <span key={v} className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold", i === 0 ? "bg-alo-soft-blue text-alo-blue" : "text-alo-faint")}>{v}</span>)}</div></div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ADMIN_PIPELINE.map((col) => (
              <div key={col.stage} className="min-w-[100px]">
                <div className="flex items-center justify-between mb-1.5"><span className="text-[11px] font-bold text-alo-navy">{col.stage}</span><span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: col.color }}>{col.count}</span></div>
                <div className="h-20 rounded-lg border border-slate-200 bg-slate-50 p-1.5 flex items-end"><div className="w-full rounded-md" style={{ backgroundColor: col.color, height: `${(col.count / 412) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        {/* AI recommendations */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-alo-orange/20 bg-alo-soft-orange p-4">
            <div className="flex items-center gap-1.5 mb-2"><Sparkles className="h-4 w-4 text-alo-orange" /><span className="text-xs font-bold text-alo-orange">AI RECOMMENDATIONS</span></div>
            <ul className="space-y-2 text-xs text-alo-navy">
              <li className="flex items-start gap-1.5"><TrendingUp className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" />14 leads need follow-up today</li>
              <li className="flex items-start gap-1.5"><AlertCircle className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" />3 visa files approaching deadline</li>
              <li className="flex items-start gap-1.5"><Target className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" />UK intake closing in 18 days</li>
              <li className="flex items-start gap-1.5"><BarChart3 className="mt-0.5 h-3.5 w-3.5 text-alo-orange shrink-0" />Speaking submissions up 15%</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className="text-sm font-bold text-alo-navy mb-2">Top Weakness</div>
            <div className="text-2xl font-extrabold text-alo-orange">Reading — Matching</div>
            <p className="text-[11px] text-alo-faint mt-1">32% of students struggle with matching headings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStudents() {
  return (
    <div>
      <PageHeader title="Students" subtitle="Manage all English platform students." action={<Button className="h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]"><Download className="mr-2 h-4 w-4" />Export CSV</Button>} />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-alo-faint flex-1 max-w-xs"><Search className="h-3.5 w-3.5" /><input placeholder="Search students…" className="flex-1 bg-transparent outline-none" /></div>
          <select className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option>All exams</option><option>IELTS</option><option>PTE</option><option>TOEFL</option></select>
          <select className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option>All CRM status</option><option>Synced</option><option>Pending</option><option>Failed</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wide text-alo-faint">
                <th className="px-4 py-3 font-semibold">Student ID</th><th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Exam</th><th className="px-4 py-3 font-semibold">Mocks</th><th className="px-4 py-3 font-semibold">Best</th><th className="px-4 py-3 font-semibold">Country</th><th className="px-4 py-3 font-semibold">CRM</th><th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_STUDENTS.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{s.id}</td>
                  <td className="px-4 py-3"><div className="font-semibold text-alo-navy">{s.name}</div><div className="text-[11px] text-alo-faint">{s.email}</div></td>
                  <td className="px-4 py-3 text-alo-muted">{s.exam}</td>
                  <td className="px-4 py-3 text-alo-muted">{s.mocks}</td>
                  <td className="px-4 py-3 font-bold text-alo-orange">{s.bestScore}</td>
                  <td className="px-4 py-3 text-alo-muted">{s.country}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", s.crm === "synced" ? "bg-emerald-50 text-alo-success" : s.crm === "pending" ? "bg-amber-50 text-alo-warning" : "bg-red-50 text-alo-danger")}>{s.crm}</span></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", s.status === "active" ? "bg-emerald-50 text-alo-success" : "bg-slate-200 text-alo-faint")}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminQuestions() {
  return (
    <div>
      <PageHeader title="Question Bank" subtitle="Original, exam-aligned practice questions. 70 questions across 5 exam types." action={<Button className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><FileText className="mr-2 h-4 w-4" />+ Add Question</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[{ e: "IELTS", c: 41, color: "blue" }, { e: "PTE", c: 10, color: "orange" }, { e: "TOEFL", c: 8, color: "blue" }, { e: "Duolingo", c: 6, color: "orange" }, { e: "OIETC", c: 5, color: "blue" }].map((s) => (
          <div key={s.e} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className={cn("grid h-9 w-9 place-items-center rounded-lg", s.color === "orange" ? "bg-alo-soft-orange text-alo-orange" : "bg-alo-soft-blue text-alo-blue")}><BookOpen className="h-4 w-4" /></div>
            <div className="mt-2 text-2xl font-extrabold text-alo-navy">{s.c}</div>
            <div className="text-xs text-alo-faint">{s.e}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-bold text-alo-navy">Recent Questions</div>
          <div className="flex gap-2"><select className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option>All types</option><option>Multiple choice</option><option>Writing</option></select><select className="h-9 rounded-lg border border-slate-200 px-2 text-xs"><option>All difficulty</option><option>Easy</option><option>Medium</option></select></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { id: "Q-IELTS-R-018", exam: "IELTS", section: "Reading", type: "multiple-choice", diff: "medium", tags: ["inference", "academic-reading"] },
            { id: "Q-IELTS-L-008", exam: "IELTS", section: "Listening", type: "fill-blanks", diff: "easy", tags: ["listening-detail"] },
            { id: "Q-PTE-S-005", exam: "PTE", section: "Speaking", type: "read-aloud", diff: "easy", tags: ["pronunciation", "fluency"] },
            { id: "Q-TOEFL-R-004", exam: "TOEFL", section: "Reading", type: "reading-mcq", diff: "hard", tags: ["vocabulary", "inference"] },
            { id: "Q-DUO-W-002", exam: "Duolingo", section: "Writing", type: "writing-sample", diff: "medium", tags: ["task-response", "coherence"] },
          ].map((q) => (
            <div key={q.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50">
              <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-white text-[10px] font-bold", q.exam === "IELTS" ? "bg-alo-blue" : q.exam === "PTE" ? "bg-alo-orange" : q.exam === "TOEFL" ? "bg-alo-royal" : "bg-purple-500")}>{q.exam.slice(0, 3)}</div>
              <div className="min-w-0 flex-1"><div className="text-sm font-mono font-bold text-alo-navy">{q.id}</div><div className="text-[11px] text-alo-faint">{q.section} · {q.type.replace(/-/g, " ")} · {q.diff}</div></div>
              <div className="hidden md:flex gap-1">{q.tags.map((t) => <span key={t} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-alo-faint">{t}</span>)}</div>
              <Button variant="ghost" size="sm" className="text-alo-blue"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[11px] text-amber-800"><span className="font-semibold">Compliance:</span> All questions are 100% original, exam-aligned content. No official exam questions reproduced. No guarantee of real-exam repetition.</p></div>
    </div>
  );
}

function AdminVouchers() {
  return (
    <div>
      <PageHeader title="Vouchers" subtitle="Manage mock test vouchers, scholarships and partner access." action={<Button className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Gift className="mr-2 h-4 w-4" />+ Generate Voucher</Button>} />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-alo-faint"><th className="px-4 py-3 font-semibold">Code</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Owner</th><th className="px-4 py-3 font-semibold">Uses</th><th className="px-4 py-3 font-semibold">Expires</th><th className="px-4 py-3 font-semibold">Source</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
            <tbody>
              {ADMIN_VOUCHERS.map((v) => (
                <tr key={v.code} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{v.code}</td>
                  <td className="px-4 py-3 text-alo-muted">{v.type.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-alo-navy">{v.owner}</td>
                  <td className="px-4 py-3 text-alo-muted">{v.uses}</td>
                  <td className="px-4 py-3 text-alo-muted">{v.expires}</td>
                  <td className="px-4 py-3 text-alo-muted">{v.source}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", v.status === "available" ? "bg-emerald-50 text-alo-success" : v.status === "reserved" ? "bg-amber-50 text-alo-warning" : "bg-slate-200 text-alo-faint")}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCrm() {
  return (
    <div>
      <PageHeader title="CRM Sync" subtitle="ALO Web_CRM integration logs and queue." action={<div className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-alo-success"><span className="h-1.5 w-1.5 rounded-full bg-alo-success" />Connected</span><Button className="h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]"><RefreshCw className="mr-2 h-4 w-4" />Sync Now</Button></div>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[{ l: "Synced today", v: "284", c: "emerald" }, { l: "Pending", v: "12", c: "amber" }, { l: "Failed", v: "3", c: "red" }, { l: "Success rate", v: "97.2%", c: "blue" }].map((s) => (
          <div key={s.l} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className={cn("text-2xl font-extrabold", s.c === "emerald" ? "text-alo-success" : s.c === "amber" ? "text-alo-warning" : s.c === "red" ? "text-alo-danger" : "text-alo-blue")}>{s.v}</div><div className="text-xs text-alo-faint">{s.l}</div></div>
        ))}
      </div>
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-alo-navy">Sync Logs</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-alo-faint"><th className="px-4 py-3 font-semibold">Sync ID</th><th className="px-4 py-3 font-semibold">Entity</th><th className="px-4 py-3 font-semibold">Ref</th><th className="px-4 py-3 font-semibold">Endpoint</th><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
            <tbody>
              {ADMIN_CRM_SYNC.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{s.id}</td>
                  <td className="px-4 py-3 text-alo-muted">{s.entity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{s.ref}</td>
                  <td className="px-4 py-3 text-alo-muted text-xs">{s.endpoint}</td>
                  <td className="px-4 py-3 text-alo-faint text-xs">{s.time}</td>
                  <td className="px-4 py-3">{s.status === "success" ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-alo-success">success</span> : <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-alo-danger">failed</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminAudit() {
  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every admin action, result view, voucher use and CRM sync is logged." action={<Button className="h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]"><Download className="mr-2 h-4 w-4" />Export Logs</Button>} />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {ADMIN_AUDIT.map((a) => (
            <div key={a.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><ShieldCheck className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-alo-navy"><span className="font-mono text-alo-blue">{a.action}</span> · {a.entity}</div>
                <div className="text-[11px] text-alo-faint">by {a.actor} · {a.ip} · {a.time}</div>
              </div>
              <span className="font-mono text-[10px] text-alo-faint">{a.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminReports() {
  const reports = [
    { name: "Student Growth", desc: "Monthly registration & activation trend", icon: TrendingUp },
    { name: "Mock Test Usage", desc: "Tests taken by exam type & difficulty", icon: FileText },
    { name: "Voucher Usage", desc: "Generated vs used vs expired", icon: Gift },
    { name: "Skill Weakness", desc: "Top weak skills across all students", icon: Target },
    { name: "CRM Sync Report", desc: "Success/failure rate by entity", icon: RefreshCw },
    { name: "Security Audit", desc: "Failed logins, locked accounts, RBAC", icon: ShieldCheck },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle="Admin analytics and operational reports." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.name} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-alo-soft-blue text-alo-blue"><r.icon className="h-5 w-5" /></div>
            <h3 className="mt-3 text-lg font-bold text-alo-navy">{r.name}</h3>
            <p className="text-xs text-alo-faint mt-1">{r.desc}</p>
            <Button variant="ghost" className="mt-3 text-alo-blue text-sm p-0 h-auto">Generate report<ChevronRight className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSettings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration, integrations and security." />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-sm font-bold text-alo-navy mb-3">Integrations</div>
          {[{ n: "ALO Web_CRM", k: "ALO_CRM_API_KEY", status: "configured" }, { n: "SMTP Email", k: "SMTP_PASSWORD", status: "configured" }, { n: "WhatsApp", k: "WHATSAPP_ACCESS_TOKEN", status: "missing" }, { n: "AI Providers", k: "OPENROUTER_API_KEY", status: "disabled" }].map((i) => (
            <div key={i.n} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <div><div className="text-sm font-semibold text-alo-navy">{i.n}</div><div className="text-[11px] text-alo-faint font-mono">{i.k} = ••••••••••••</div></div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", i.status === "configured" ? "bg-emerald-50 text-alo-success" : i.status === "missing" ? "bg-amber-50 text-alo-warning" : "bg-slate-200 text-alo-faint")}>{i.status}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-sm font-bold text-alo-navy mb-3">Security</div>
          {[{ l: "CSRF protection", on: true }, { l: "Rate limiting (login)", on: true }, { l: "Account lockout (5 attempts)", on: true }, { l: "Audit logging", on: true }, { l: "HTTPS forced", on: true }].map((s) => (
            <div key={s.l} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
              <span className="text-sm text-alo-navy">{s.l}</span>
              <div className={cn("h-5 w-9 rounded-full p-0.5", s.on ? "bg-alo-success" : "bg-slate-300")}><div className={cn("h-4 w-4 rounded-full bg-white", s.on && "translate-x-4")} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== ADMIN AI AGENT EMPLOYEES ============== */
function AdminAiAgents() {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const agent = AI_AGENTS.find((a) => a.id === selectedAgent);
  if (agent) return <AgentDetail agent={agent} onBack={() => setSelectedAgent(null)} />;
  return (
    <div>
      <PageHeader title="AI Agent Employees" subtitle="Internal operations layer — 20 automated agents operate all 32 exam types. NOT visible to students." action={<span className="rounded-full bg-alo-soft-blue px-2.5 py-1 text-[11px] font-bold text-alo-blue">20 Active Agents</span>} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { l: "Active Agents", v: AGENT_STATS.activeAgents, c: "blue" },
          { l: "Tasks Today", v: AGENT_STATS.tasksToday.toLocaleString(), c: "orange" },
          { l: "Failed Tasks", v: AGENT_STATS.failedTasks, c: "warning" },
          { l: "Pending Approvals", v: AGENT_STATS.pendingApprovals, c: "orange" },
          { l: "Avg Success Rate", v: `${AGENT_STATS.avgSuccessRate}%`, c: "blue" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className={cn("text-2xl font-extrabold", k.c === "orange" ? "text-alo-orange" : k.c === "warning" ? "text-alo-warning" : "text-alo-blue")}>{k.v}</div>
            <div className="text-xs text-alo-faint">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Task breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
        {[
          { l: "Scoring", v: AGENT_STATS.scoringTasks }, { l: "Speaking", v: AGENT_STATS.speakingTasks },
          { l: "Writing", v: AGENT_STATS.writingTasks }, { l: "Reports", v: AGENT_STATS.reportTasks },
          { l: "Weekly Update", v: AGENT_STATS.weeklyUpdateTasks }, { l: "Compliance Warnings", v: AGENT_STATS.complianceWarnings },
        ].map((t) => (
          <div key={t.l} className="rounded-xl border border-alo-card bg-white p-3 alo-shadow-sm text-center">
            <div className="text-xl font-extrabold text-alo-navy">{t.v}</div>
            <div className="text-[10px] text-alo-faint">{t.l}</div>
          </div>
        ))}
      </div>

      {/* Approval queue */}
      <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-alo-navy">Approval Queue</div>
          <span className="rounded-full bg-alo-soft-orange px-2.5 py-1 text-[11px] font-bold text-alo-orange">{AGENT_APPROVAL_QUEUE.length} pending</span>
        </div>
        <div className="space-y-2">
          {AGENT_APPROVAL_QUEUE.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><Sparkles className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-alo-navy">{a.agent}</div>
                <div className="text-[11px] text-alo-faint">{a.type} · {a.detail}</div>
              </div>
              <span className="hidden sm:inline text-[10px] text-alo-faint">{a.requestedAt}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", a.priority === "high" ? "bg-red-50 text-alo-danger" : "bg-slate-100 text-alo-faint")}>{a.priority}</span>
              <div className="flex gap-1">
                <button className="grid h-7 w-7 place-items-center rounded-lg bg-alo-success text-white"><Check className="h-3.5 w-3.5" /></button>
                <button className="grid h-7 w-7 place-items-center rounded-lg bg-alo-danger text-white"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm mb-5">
        <div className="text-sm font-bold text-alo-navy mb-3">All 20 Agent Employees</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AI_AGENTS.map((a) => (
            <button key={a.id} onClick={() => setSelectedAgent(a.id)} className="text-left rounded-xl border border-slate-200 p-3.5 hover:alo-shadow-lg hover:border-alo-blue/40 transition-all">
              <div className="flex items-start justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-navy text-white"><Sparkles className="h-4 w-4" /></div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", a.isActive ? "bg-emerald-50 text-alo-success" : "bg-slate-200 text-alo-faint")}>{a.isActive ? "active" : "inactive"}</span>
              </div>
              <div className="mt-2 text-sm font-bold text-alo-navy">{a.internalLabel}</div>
              <div className="text-[10px] font-mono text-alo-faint">{a.agentCode}</div>
              <div className="text-[11px] text-alo-faint mt-1 line-clamp-2">{a.responsibility}</div>
              <div className="mt-2 flex items-center gap-2 text-[10px]">
                <span className="rounded bg-alo-soft-blue px-1.5 py-0.5 font-semibold text-alo-blue">{a.department}</span>
                <span className="text-alo-faint">{a.tasksToday} tasks today</span>
                <span className={cn("font-bold", a.successRate >= 95 ? "text-alo-success" : "text-alo-warning")}>{a.successRate}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[9px]">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-alo-faint">Public: {a.publicLabel}</span>
                {a.requiresAdminApproval && <span className="rounded bg-alo-soft-orange px-1.5 py-0.5 text-alo-orange">Approval req.</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent logs */}
      <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
        <div className="text-sm font-bold text-alo-navy mb-3">Recent Agent Activity</div>
        <div className="space-y-1.5">
          {AGENT_RECENT_LOGS.map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-1.5 border-b border-slate-100 last:border-0">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><Sparkles className="h-3.5 w-3.5" /></div>
              <div className="min-w-0 flex-1"><span className="text-xs font-semibold text-alo-navy">{l.agent}</span> <span className="text-[11px] text-alo-faint">{l.action}</span></div>
              <span className="font-mono text-[10px] text-alo-faint">{l.entity}</span>
              <span className="text-[10px] text-alo-faint shrink-0">{l.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-3 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-alo-blue mt-0.5 shrink-0" />
        <p className="text-[11px] text-alo-navy"><span className="font-semibold">Compliance:</span> Students never see "AI Agent", "bot", or "robot" wording. Public-facing labels use approved terms only (ALO Practice Examiner, Digital Practice Session, Smart Score Report, etc.). Weekly Update Agent never auto-publishes — admin approval required.</p>
      </div>
    </div>
  );
}

function AgentDetail({ agent, onBack }: { agent: AiAgent; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm font-semibold text-alo-blue hover:underline mb-4 inline-flex items-center gap-1"><ChevronRight className="h-4 w-4 rotate-180" />Back to all agents</button>
      <div className="rounded-2xl border border-alo-card bg-white p-6 alo-shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-alo-navy text-white"><Sparkles className="h-7 w-7" /></div>
            <div>
              <h2 className="text-2xl font-extrabold text-alo-navy">{agent.internalLabel}</h2>
              <div className="text-xs font-mono text-alo-faint">{agent.agentCode} · {agent.department}</div>
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", agent.isActive ? "bg-emerald-50 text-alo-success" : "bg-slate-200 text-alo-faint")}>{agent.isActive ? "Active" : "Inactive"}</span>
        </div>
        <p className="mt-4 text-sm text-alo-muted leading-relaxed">{agent.responsibility}</p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: "Tasks Today", v: agent.tasksToday }, { l: "Completed", v: agent.tasksCompleted },
            { l: "Failed", v: agent.tasksFailed }, { l: "Success Rate", v: `${agent.successRate}%` },
          ].map((k) => (
            <div key={k.l} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-xl font-extrabold text-alo-navy">{k.v}</div><div className="text-[11px] text-alo-faint">{k.l}</div></div>
          ))}
        </div>
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Public Label (student-visible)</div><div className="text-sm font-bold text-alo-blue">{agent.publicLabel}</div></div>
          <div className="rounded-xl border border-slate-200 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Internal Label (admin-only)</div><div className="text-sm font-bold text-alo-navy">{agent.internalLabel}</div></div>
          <div className="rounded-xl border border-slate-200 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Can Auto-Execute</div><div className={cn("text-sm font-bold", agent.canAutoExecute ? "text-alo-success" : "text-alo-warning")}>{agent.canAutoExecute ? "Yes" : "No"}</div></div>
          <div className="rounded-xl border border-slate-200 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-alo-faint mb-1">Requires Admin Approval</div><div className={cn("text-sm font-bold", agent.requiresAdminApproval ? "text-alo-orange" : "text-alo-success")}>{agent.requiresAdminApproval ? "Yes" : "No"}</div></div>
        </div>
      </div>
    </div>
  );
}

/* ============== EXAMINER PORTAL ============== */
export function ExaminerPortal({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState("dashboard");
  const nav = [{ group: "Review", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "writing", label: "Writing Queue", icon: PenLine }, { id: "speaking", label: "Speaking Queue", icon: Mic }, { id: "results", label: "My Reviews", icon: Award }, { id: "settings", label: "Settings", icon: Settings }] }];
  return (
    <PortalLayout role="EXAMINER" userName="Rumana Sultana" userMeta="Senior Examiner · UK Desk" accent="bg-alo-royal" nav={nav} activePage={page} setPage={setPage} onExit={onExit}>
      {page === "dashboard" && <ExaminerDashboard onNavigate={setPage} />}
      {page === "writing" && <ExaminerQueue type="writing" />}
      {page === "speaking" && <ExaminerQueue type="speaking" />}
      {page === "results" && <ExaminerResults />}
      {page === "settings" && <div><PageHeader title="Settings" subtitle="Examiner profile and review preferences." /><div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm text-sm text-alo-muted">Settings panel — exam types, SLA preferences, notification preferences.</div></div>}
    </PortalLayout>
  );
}

function ExaminerDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      <PageHeader title="Examiner Dashboard" subtitle="Your review queue and performance." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {EXAMINER_PERFORMANCE.map((k) => (
          <div key={k.label} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className="text-2xl font-extrabold text-alo-navy">{k.value}</div><div className="text-xs text-alo-faint">{k.label}</div><div className="text-[11px] text-alo-success mt-1">{k.sub}</div></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-alo-navy">Writing Queue</div><Button variant="ghost" size="sm" onClick={() => onNavigate("writing")} className="text-alo-blue text-xs">Open<ChevronRight className="h-3.5 w-3.5" /></Button></div>
          <div className="space-y-2">
            {EXAMINER_QUEUE.writing.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-orange text-alo-orange"><PenLine className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy truncate">{w.student} · {w.exam}</div><div className="text-[11px] text-alo-faint">{w.words} words · {w.submitted}</div></div>
                {w.priority === "high" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-alo-danger">high</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-alo-navy">Speaking Queue</div><Button variant="ghost" size="sm" onClick={() => onNavigate("speaking")} className="text-alo-blue text-xs">Open<ChevronRight className="h-3.5 w-3.5" /></Button></div>
          <div className="space-y-2">
            {EXAMINER_QUEUE.speaking.slice(0, 3).map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-alo-soft-blue text-alo-blue"><Mic className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy truncate">{w.student} · {w.exam}</div><div className="text-[11px] text-alo-faint">{w.duration} · {w.submitted}</div></div>
                {w.priority === "high" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-alo-danger">high</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExaminerQueue({ type }: { type: "writing" | "speaking" }) {
  const items = type === "writing" ? EXAMINER_QUEUE.writing : EXAMINER_QUEUE.speaking;
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <ExaminerReview type={type} onBack={() => setSelected(null)} />;
  return (
    <div>
      <PageHeader title={type === "writing" ? "Writing Review Queue" : "Speaking Review Queue"} subtitle="Review submissions and give practice feedback." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((w) => (
          <div key={w.id} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white", type === "writing" ? "bg-alo-orange" : "bg-alo-blue")}>{type === "writing" ? <PenLine className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</div>
              {w.priority === "high" && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-alo-danger">high priority</span>}
            </div>
            <h3 className="mt-3 text-sm font-bold text-alo-navy">{w.student}</h3>
            <div className="text-[11px] text-alo-faint">{w.exam} · {w.id}</div>
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-alo-muted line-clamp-2">{w.prompt}</div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-alo-faint">
              <span>{type === "writing" ? `${w.words} words` : w.duration}</span><span>{w.submitted}</span>
            </div>
            <Button onClick={() => setSelected(w.id)} className="mt-3 w-full h-10 rounded-xl bg-alo-blue text-white hover:bg-[#004a9e]">Open Review<ChevronRight className="ml-1 h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExaminerReview({ type, onBack }: { type: "writing" | "speaking"; onBack: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>({ "Task Response": 7, Coherence: 7, "Lexical Resource": 6, Grammar: 7 });
  const dims = type === "writing" ? ["Task Response", "Coherence", "Lexical Resource", "Grammar"] : ["Fluency", "Pronunciation", "Grammar", "Lexical Resource", "Coherence"];
  return (
    <div>
      <PageHeader title="Review Submission" subtitle="Give practice score and feedback. Practice estimate only — not official." action={<Button variant="outline" onClick={onBack} className="h-10 rounded-xl border-slate-300">← Back to queue</Button>} />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-alo-faint mb-2">Student submission</div>
          {type === "writing" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-alo-navy leading-relaxed">
              <p>In recent years, the debate over whether university education should be free has intensified. While some argue that tuition fees create barriers, others contend that free education would place unsustainable burdens on public finances…</p>
              <p className="mt-2">In my opinion, a balanced approach is necessary. Governments should subsidize education for those who cannot afford it while maintaining reasonable fees for those who can…</p>
              <div className="mt-3 text-[11px] text-alo-faint">287 words · submitted 12 min ago</div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-alo-blue text-white"><Mic className="h-8 w-8" /></div>
              <div className="mt-3 font-mono text-sm font-bold text-alo-navy">01:58</div>
              <Button className="mt-2 h-9 rounded-lg bg-alo-blue text-white hover:bg-[#004a9e]">▶ Play Recording</Button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-alo-faint mb-3">Score & Feedback</div>
          <div className="space-y-3">
            {dims.map((d) => (
              <div key={d}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold text-alo-navy">{d}</span><span className="font-bold text-alo-orange">{scores[d] || 7}</span></div>
                <input type="range" min="0" max="9" step="0.5" defaultValue="7" onChange={(e) => setScores({ ...scores, [d]: Number(e.target.value) })} className="w-full accent-alo-orange" />
              </div>
            ))}
          </div>
          <div className="mt-3"><label className="text-xs font-semibold text-alo-navy">Feedback comments</label><textarea defaultValue="Clear position taken. Improve paragraph structure with clearer topic sentences. Add 2-3 higher-level vocabulary items." className="mt-1 w-full min-h-[100px] rounded-xl border border-slate-200 p-3 text-sm" /></div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl border-amber-300 text-alo-warning">Request Resubmission</Button>
            <Button className="flex-1 h-10 rounded-xl bg-alo-success text-white hover:bg-[#138a3d]"><Check className="mr-1.5 h-4 w-4" />Submit Review</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExaminerResults() {
  return (
    <div>
      <PageHeader title="My Reviews" subtitle="Submissions you have reviewed." />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-alo-faint"><th className="px-4 py-3 font-semibold">ID</th><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Type</th><th className="px-4 py-3 font-semibold">Score</th><th className="px-4 py-3 font-semibold">Date</th></tr></thead>
            <tbody>
              {[{ id: "FB-2026-010", s: "Rakib Hasan", t: "Writing", sc: "7.0", d: "Jan 8" }, { id: "FB-2026-009", s: "Nadia Khan", t: "Speaking", sc: "7.5", d: "Jan 7" }, { id: "FB-2026-008", s: "Arif Rahman", t: "Writing", sc: "6.5", d: "Jan 6" }].map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{r.id}</td><td className="px-4 py-3 font-semibold text-alo-navy">{r.s}</td><td className="px-4 py-3 text-alo-muted">{r.t}</td><td className="px-4 py-3 font-bold text-alo-orange">{r.sc}</td><td className="px-4 py-3 text-alo-muted">{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============== AMBASSADOR PORTAL ============== */
export function AmbassadorPortal({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState("dashboard");
  const nav = [{ group: "Ambassador", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "referrals", label: "Referrals", icon: Share2 }, { id: "vouchers", label: "My Vouchers", icon: Gift }, { id: "commission", label: "Commission", icon: Briefcase }, { id: "marketing", label: "Marketing Kit", icon: Download }, { id: "settings", label: "Settings", icon: Settings }] }];
  return (
    <PortalLayout role="AMBASSADOR" userName="Arif Rahman" userMeta="Ambassador · AMB-2026-0042" accent="bg-alo-orange" nav={nav} activePage={page} setPage={setPage} onExit={onExit}>
      {page === "dashboard" && <AmbassadorDashboard onNavigate={setPage} />}
      {page === "referrals" && <AmbassadorReferrals />}
      {page === "vouchers" && <AmbassadorVouchers />}
      {page === "commission" && <AmbassadorCommission />}
      {page === "marketing" && <AmbassadorMarketing />}
      {page === "settings" && <div><PageHeader title="Settings" subtitle="Ambassador profile and preferences." /><div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm text-sm text-alo-muted">Profile, payout preferences, notification settings.</div></div>}
    </PortalLayout>
  );
}

function AmbassadorDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div>
      <PageHeader title="Ambassador Dashboard" subtitle="Track referrals, vouchers and commission (safe status only)." action={<span className="rounded-full bg-alo-orange/20 px-2.5 py-1 text-[11px] font-bold text-alo-orange">Active Ambassador</span>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {AMBASSADOR_KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm">
            <div className={cn("grid h-9 w-9 place-items-center rounded-lg", k.color === "orange" ? "bg-alo-soft-orange text-alo-orange" : "bg-alo-soft-blue text-alo-blue")}>
              {k.icon === "users" ? <Users className="h-4 w-4" /> : k.icon === "check" ? <Check className="h-4 w-4" /> : k.icon === "voucher" ? <Gift className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
            </div>
            <div className="mt-2 text-2xl font-extrabold text-alo-navy">{k.value}</div>
            <div className="text-xs text-alo-faint">{k.label}</div>
            <div className="text-[11px] text-alo-faint mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="flex items-center justify-between mb-3"><div className="text-sm font-bold text-alo-navy">Your Referral Link</div><Button size="sm" className="h-8 rounded-lg bg-alo-orange text-white hover:bg-[#cc3f10]">Copy</Button></div>
          <div className="flex items-center gap-2 rounded-lg bg-alo-navy/5 border border-slate-200 px-3 py-2.5">
            <Link2 className="h-4 w-4 text-alo-orange shrink-0" />
            <span className="text-sm text-alo-navy truncate font-mono">english.aloeducation.com/r/AMB-0042</span>
          </div>
          <Button onClick={() => onNavigate("referrals")} variant="ghost" className="mt-3 text-alo-blue text-sm p-0 h-auto">View all referrals<ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm">
          <div className="text-sm font-bold text-alo-navy mb-3">Recent Referrals</div>
          <div className="space-y-2">
            {AMBASSADOR_REFERRALS.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-alo-orange text-white text-xs font-bold">{r.name.charAt(0)}</div>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-alo-navy">{r.name}</div><div className="text-[11px] text-alo-faint">{r.exam} · {r.stage}</div></div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", r.status === "converted" ? "bg-emerald-50 text-alo-success" : "bg-amber-50 text-alo-warning")}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-alo-blue/20 bg-alo-soft-blue p-3"><p className="text-[11px] text-alo-navy"><span className="font-semibold">Privacy:</span> Ambassadors see safe status only — no private student applications, documents, visa notes or CRM internal notes.</p></div>
    </div>
  );
}

function AmbassadorReferrals() {
  return (
    <div>
      <PageHeader title="Referrals" subtitle="All students you have referred (safe status only)." action={<Button className="h-10 rounded-xl bg-alo-orange text-white hover:bg-[#cc3f10]"><Share2 className="mr-2 h-4 w-4" />+ New Referral</Button>} />
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-left text-xs uppercase tracking-wide text-alo-faint"><th className="px-4 py-3 font-semibold">Ref ID</th><th className="px-4 py-3 font-semibold">Student</th><th className="px-4 py-3 font-semibold">Exam</th><th className="px-4 py-3 font-semibold">Stage</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Status</th></tr></thead>
            <tbody>
              {AMBASSADOR_REFERRALS.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-alo-navy">{r.id}</td><td className="px-4 py-3 font-semibold text-alo-navy">{r.name}</td><td className="px-4 py-3 text-alo-muted">{r.exam}</td><td className="px-4 py-3 text-alo-muted">{r.stage}</td><td className="px-4 py-3 text-alo-faint">{r.date}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", r.status === "converted" ? "bg-emerald-50 text-alo-success" : "bg-amber-50 text-alo-warning")}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AmbassadorVouchers() {
  return (
    <div>
      <PageHeader title="My Vouchers" subtitle="Vouchers earned through referrals." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[{ code: "ALO-AMB-042-V01", t: "IELTS_MOCK", st: "available" }, { code: "ALO-AMB-042-V02", t: "PTE_MOCK", st: "available" }, { code: "ALO-AMB-042-V03", t: "SPEAKING_PRACTICE", st: "used" }].map((v) => (
          <div key={v.code} className={cn("rounded-2xl border-2 p-5", v.st === "available" ? "border-alo-card bg-white" : "border-slate-200 bg-slate-50 opacity-70")}>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-alo-soft-orange text-alo-orange"><Gift className="h-5 w-5" /></div>
            <div className="mt-3 text-sm font-mono font-bold text-alo-navy">{v.code}</div>
            <div className="text-xs text-alo-faint">{v.t.replace(/_/g, " ")}</div>
            <span className={cn("mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold", v.st === "available" ? "bg-emerald-50 text-alo-success" : "bg-slate-200 text-alo-faint")}>{v.st}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AmbassadorCommission() {
  return (
    <div>
      <PageHeader title="Commission" subtitle="Your earnings (safe status — partner commission not visible)." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[{ l: "Total earned", v: "৳48,500" }, { l: "Pending", v: "৳12,000" }, { l: "Paid out", v: "৳36,500" }, { l: "This month", v: "৳8,500" }].map((s) => (
          <div key={s.l} className="rounded-2xl border border-alo-card bg-white p-4 alo-shadow-sm"><div className="text-2xl font-extrabold text-alo-orange">{s.v}</div><div className="text-xs text-alo-faint">{s.l}</div></div>
        ))}
      </div>
      <div className="rounded-2xl border border-alo-card bg-white alo-shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-alo-navy">Payout History</div>
        <div className="divide-y divide-slate-100">
          {[{ d: "Jan 5, 2026", a: "৳12,500", s: "paid" }, { d: "Dec 5, 2025", a: "৳10,000", s: "paid" }, { d: "Nov 5, 2025", a: "৳14,000", s: "paid" }].map((p, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between"><div className="text-sm text-alo-navy">{p.d}</div><div className="text-sm font-bold text-alo-orange">{p.a}</div><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-alo-success">{p.s}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AmbassadorMarketing() {
  return (
    <div>
      <PageHeader title="Marketing Kit" subtitle="Download branded materials to share your referral." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AMBASSADOR_MARKETING_KIT.map((m) => (
          <div key={m.name} className="rounded-2xl border border-alo-card bg-white p-5 alo-shadow-sm hover:alo-shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-alo-soft-blue text-alo-blue"><Download className="h-5 w-5" /></div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-alo-faint">{m.type}</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-alo-navy">{m.name}</h3>
            <p className="text-xs text-alo-faint mt-1">{m.desc}</p>
            <div className="mt-2 text-[11px] text-alo-faint">{m.size}</div>
            <Button variant="outline" className="mt-3 w-full h-10 rounded-xl border-alo-blue/30 text-alo-blue hover:bg-alo-soft-blue"><Download className="mr-2 h-4 w-4" />Download</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
