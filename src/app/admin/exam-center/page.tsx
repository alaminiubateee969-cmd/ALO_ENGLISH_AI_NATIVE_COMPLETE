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
  const { data: examTypes, loading: etLoading } = useApi<{ examTypes: Array<{ id: string; code: string; name: string; category: string; practiceSetCount: number }> }>("/api/exam-types");
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
        <DashboardCard title="Practice Sets" value={examTypes?.examTypes?.reduce((acc: number, et: any) => acc + et.practiceSetCount, 0) ?? 0} desc="Active" icon={FileText} />
        <DashboardCard title="Total Attempts" value={stats?.activity?.totalAttempts ?? 0} desc="All students" icon={Users} />
        <DashboardCard title="Completion Rate" value={`${stats?.activity?.completionRate ?? 0}%`} desc="Submitted" icon={TrendingUp} />
      </div>

      {/* Exam Types Table */}
      <h3 className="font-semibold mb-3">Available Exam Types</h3>
      {etLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading exam types...</div>
      ) : (
        <DashboardTable
          headers={["Code", "Name", "Category", "Practice Sets", "Action"]}
          rows={(examTypes?.examTypes || []).map((et) => [
            <span key={et.id} className="font-mono text-sm font-bold">{et.code}</span>,
            et.name,
            <span key={et.id + "c"} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{et.category}</span>,
            <strong key={et.id + "p"}>{et.practiceSetCount}</strong>,
            <a key={et.id + "a"} href={`/practice-test`} className="text-blue-600 hover:underline">View Tests →</a>,
          ])}
        />
      )}

      {/* Question Bank Info */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-2">Question Bank</h3>
        <p className="text-sm text-slate-500 mb-3">Questions are managed via the database and seeded through scripts. Currently 139 questions across 4 practice sets.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-3"><p className="text-xs text-slate-400">IELTS</p><p className="text-lg font-bold">93 questions</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-slate-400">TOEFL</p><p className="text-lg font-bold">22 questions</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-slate-400">PTE</p><p className="text-lg font-bold">12 questions</p></div>
          <div className="rounded-lg border p-3"><p className="text-xs text-slate-400">Duolingo</p><p className="text-lg font-bold">12 questions</p></div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-semibold mb-2">Exam API Endpoints</h3>
        <DashboardTable
          headers={["Endpoint", "Method", "Auth", "Purpose"]}
          rows={[
            ["/api/exam-types", "GET", "Public", "List exam types"],
            ["/api/practice-sets", "GET", "Public", "List practice sets"],
            ["/api/questions", "GET", "Public", "Fetch questions for a set"],
            ["/api/attempts/start", "POST", "STUDENT", "Start exam attempt"],
            ["/api/attempts/submit", "POST", "STUDENT", "Submit + AI evaluate"],
            ["/api/attempts", "GET", "STUDENT", "View attempt history"],
            ["/api/admin/stats", "GET", "ADMIN", "Platform statistics"],
            ["/api/agents/status", "GET", "Public", "AI agent status"],
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
