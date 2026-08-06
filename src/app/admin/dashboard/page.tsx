import type { Metadata } from "next";
import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, GraduationCap, FileText, TrendingUp, BookOpen, Award } from "lucide-react";

export const metadata: Metadata = { title: "Admin Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/api/crm/users" },
  { label: "Leads", href: "/api/crm/leads" },
  { label: "Students", href: "/api/crm/students" },
  { label: "Applications", href: "/api/crm/applications" },
  { label: "Universities", href: "/api/crm/universities" },
  { label: "Courses", href: "/api/crm/courses" },
  { label: "Scholarships", href: "/api/crm/scholarships" },
  { label: "Partners", href: "/api/crm/partners" },
  { label: "AI Agents", href: "/api/agents/status" },
  { label: "Audit Logs", href: "/api/crm/audit-logs" },
  { label: "Settings", href: "/api/admin/settings" },
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
            <DashboardCard title="Scores Generated" value={stats?.activity?.totalScores ?? 0} desc="AI-evaluated" icon={Award} />
            <DashboardCard title="AI Agents" value={agents?.stats?.ready ?? 0} desc={`Provider: ${agents?.stats?.aiProvider || "local"}`} icon={TrendingUp} />
          </div>

          {/* CRM Entity Links */}
          <DashboardTable
            headers={["Entity", "Action", "API Endpoint"]}
            rows={[
              ["Users", "Manage users", <a key="u" href="/api/crm/users" className="text-blue-600 hover:underline">GET /api/crm/users</a>],
              ["Leads", "Manage leads", <a key="l" href="/api/crm/leads" className="text-blue-600 hover:underline">GET /api/crm/leads</a>],
              ["Students", "Manage students", <a key="s" href="/api/crm/students" className="text-blue-600 hover:underline">GET /api/crm/students</a>],
              ["Applications", "Manage applications", <a key="a" href="/api/crm/applications" className="text-blue-600 hover:underline">GET /api/crm/applications</a>],
              ["Universities", "Manage universities", <a key="uni" href="/api/crm/universities" className="text-blue-600 hover:underline">GET /api/crm/universities</a>],
              ["Courses", "Manage courses", <a key="c" href="/api/crm/courses" className="text-blue-600 hover:underline">GET /api/crm/courses</a>],
              ["Scholarships", "Manage scholarships", <a key="sch" href="/api/crm/scholarships" className="text-blue-600 hover:underline">GET /api/crm/scholarships</a>],
              ["Partners", "Manage partners", <a key="p" href="/api/crm/partners" className="text-blue-600 hover:underline">GET /api/crm/partners</a>],
              ["AI Agents", "View agent status", <a key="ai" href="/api/agents/status" className="text-blue-600 hover:underline">GET /api/agents/status</a>],
              ["Settings", "Manage settings", <a key="set" href="/api/admin/settings" className="text-blue-600 hover:underline">GET /api/admin/settings</a>],
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
