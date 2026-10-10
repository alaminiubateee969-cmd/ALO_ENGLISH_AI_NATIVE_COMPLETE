"use client";

import { useState, useEffect } from "react";
import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { BookOpen, FileText, Users, TrendingUp } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Exam Center", href: "/admin/exam-center" },
  { label: "AI Agents", href: "/api/agents/status" },
  { label: "Audit Logs", href: "/api/crm/audit-logs" },
  { label: "Settings", href: "/api/admin/settings" },
];

function ExamCenterContent() {
  const { data: examTypes, loading: etLoading } = useApi<{ examTypes: Array<{ id: string; code: string; name: string; category: string; practiceSetCount: number; questionCount: number; available: boolean }> }>("/api/exam-types");
  const { data: stats, loading: statsLoading } = useApi<{ users: { total: number }; activity: { totalAttempts: number; totalScores: number; completionRate: number } }>("/api/admin/stats");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Exam Center</h2>
        <p className="text-slate-600">Manage exam types, practice sets, and questions</p>
      </div>

      {/* Exam Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="Exam Types" value={examTypes?.examTypes?.length ?? 0} desc="Available" icon={BookOpen} />
        <DashboardCard title="Active Questions" value={examTypes?.examTypes?.reduce((acc, et) => acc + et.questionCount, 0) ?? 0} desc="In active practice sets" icon={FileText} />
        <DashboardCard title="Total Attempts" value={stats?.activity?.totalAttempts ?? 0} desc="All students" icon={Users} />
        <DashboardCard title="Completion Rate" value={`${stats?.activity?.completionRate ?? 0}%`} desc="Submitted" icon={TrendingUp} />
      </div>

      {/* Exam Types Table */}
      <h3 className="font-semibold mb-3">Available Exam Types</h3>
      {etLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading exam types...</div>
      ) : (
        <DashboardTable
          headers={["Code", "Name", "Category", "Active Sets", "Active Questions", "Content State"]}
          rows={(examTypes?.examTypes || []).map((et) => [
            <span key={et.id} className="font-mono text-sm font-bold">{et.code}</span>,
            et.name,
            <span key={et.id + "c"} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{et.category}</span>,
            <strong key={et.id + "p"}>{et.practiceSetCount}</strong>,
            <strong key={et.id + "q"}>{et.questionCount}</strong>,
            <span key={et.id + "a"} className={`rounded-full px-2 py-0.5 text-xs ${et.available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
              {et.available ? "Questions exist; depth/quality not verified" : "No active questions"}
            </span>,
          ])}
        />
      )}

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Counts above are live database counts for active practice sets only. A non-zero count does not establish a full-length bank, current specification alignment, audio playback, or scoring validity.
      </div>

      {/* API Endpoints */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-2">Exam API Endpoints</h3>
        <DashboardTable
          headers={["Endpoint", "Method", "Auth", "Purpose"]}
          rows={[
            ["/api/exam-types", "GET", "Public", "List exam types"],
            ["/api/practice-sets", "GET", "Public", "List practice sets"],
            ["/api/questions", "GET", "Authenticated", "Fetch redacted questions for an owned, quota-gated attempt"],
            ["/api/attempts/start", "POST", "STUDENT", "Start exam attempt"],
            ["/api/attempts/submit", "POST", "STUDENT", "Submit; objective indicators + non-scored writing suggestions"],
            ["/api/attempts", "GET", "STUDENT", "View attempt history"],
            ["/api/admin/stats", "GET", "ADMIN", "Platform statistics"],
            ["/api/agents/status", "GET", "ADMIN/SUPER_ADMIN", "Static agent registration inventory; readiness is not verified"],
          ]}
        />
      </div>
    </>
  );
}

export default function ExamCenterPage() {
  return (
    <DashboardShell title="Admin Exam Center" nav={NAV} role="ADMIN">
      <ExamCenterContent />
    </DashboardShell>
  );
}
