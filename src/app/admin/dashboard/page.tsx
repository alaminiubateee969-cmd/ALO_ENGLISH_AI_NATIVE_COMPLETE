"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, GraduationCap, FileText, TrendingUp, BookOpen, Award } from "lucide-react";


const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/crm/users" },
  { label: "Teachers", href: "/admin/crm/teachers" },
  { label: "Universities", href: "/admin/crm/universities" },
  { label: "Courses", href: "/admin/crm/courses" },
  { label: "Scholarships", href: "/admin/crm/scholarships" },
  { label: "Countries", href: "/admin/crm/countries" },
  { label: "Branches", href: "/admin/crm/branches" },
  { label: "Departments", href: "/admin/crm/departments" },
  { label: "Partners", href: "/admin/crm/partners" },
  { label: "Commissions", href: "/admin/crm/commissions" },
  { label: "Audit Logs", href: "/admin/crm/audit-logs" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "SEO audit", href: "/admin/seo" },
  { label: "AI Agents", href: "/admin/agents" },
  { label: "Exam center", href: "/admin/exam-center" },
  { label: "Learning", href: "/admin/learning" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Settings", href: "/admin/settings" },
];

function AdminDashboardContent() {
  const { data: stats, loading } = useApi<{
    users: { total: number; students: number; examiners: number };
    content: { examTypes: number; practiceSets: number };
    activity: { totalAttempts: number; submittedAttempts: number; totalScores: number; completionRate: number };
  }>("/api/admin/stats");

  const { data: agents } = useApi<{
    stats: { total: number; ready: number; aiConfigured: boolean; aiProvider: string };
  }>("/api/agents/status");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-slate-600">Platform overview — real data from the database.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Loading platform statistics...
        </div>
      ) : (
        <>
          {/* Real Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <DashboardCard title="Total Users" value={stats?.users?.total ?? 0} desc="All registered users" icon={Users} />
            <DashboardCard title="Students" value={stats?.users?.students ?? 0} desc="Student role" icon={GraduationCap} />
            <DashboardCard title="Practice Tests" value={stats?.activity?.totalAttempts ?? 0} desc="Total attempts" icon={FileText} />
            <DashboardCard title="Completion Rate" value={`${stats?.activity?.completionRate ?? 0}%`} desc="Submitted vs total" icon={TrendingUp} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <DashboardCard title="Exam Types" value={stats?.content?.examTypes ?? 0} desc="Active exam types" icon={BookOpen} />
            <DashboardCard title="Practice Sets" value={stats?.content?.practiceSets ?? 0} desc="Available sets" icon={FileText} />
            <DashboardCard title="Practice score rows" value={stats?.activity?.totalScores ?? 0} desc="Stored; scoring is not validated" icon={Award} />
            <DashboardCard title="Agents marked ready" value={agents?.stats?.ready ?? 0} desc="Static registry; no runtime verification" icon={TrendingUp} />
          </div>

          {/* CRM Entity Links */}
          <DashboardTable
            headers={["Entity", "Action", "Open"]}
            rows={[
              ["Users", "Manage users", <a key="u" href="/admin/crm/users" className="font-semibold text-blue-600 hover:underline">Users manager</a>],
              ["Universities", "Manage universities", <a key="uni" href="/admin/crm/universities" className="font-semibold text-blue-600 hover:underline">Universities manager</a>],
              ["Courses", "Manage courses", <a key="c" href="/admin/crm/courses" className="font-semibold text-blue-600 hover:underline">Courses manager</a>],
              ["Scholarships", "Manage scholarships", <a key="sch" href="/admin/crm/scholarships" className="font-semibold text-blue-600 hover:underline">Scholarships manager</a>],
              ["Partners", "Manage partners", <a key="p" href="/admin/crm/partners" className="font-semibold text-blue-600 hover:underline">Partners manager</a>],
              ["Commissions", "Manage commissions", <a key="com" href="/admin/crm/commissions" className="font-semibold text-blue-600 hover:underline">Commissions manager</a>],
              ["AI Agents", "View agent workforce", <a key="ai" href="/admin/agents" className="font-semibold text-blue-600 hover:underline">Agents dashboard</a>],
              ["Settings", "Manage settings", <a key="set" href="/admin/settings" className="font-semibold text-blue-600 hover:underline">Settings editor</a>],
            ]}
          />
        </>
      )}
    </>
  );
}

export default function AdminDashboard() {
  return (
    <DashboardShell title="Admin Portal" nav={NAV} role="ADMIN">
      <AdminDashboardContent />
    </DashboardShell>
  );
}
