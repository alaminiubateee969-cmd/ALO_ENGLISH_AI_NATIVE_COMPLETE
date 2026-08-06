import type { Metadata } from "next";
import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, GraduationCap, FileText, TrendingUp, BookOpen, Award, Bot, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Super Admin Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/super-admin/dashboard" },
  { label: "Admin Panel", href: "/admin/dashboard" },
  { label: "AI Agents", href: "/api/agents/status" },
  { label: "Health Check", href: "/api/health" },
  { label: "Audit Logs", href: "/api/crm/audit-logs" },
  { label: "Settings", href: "/api/admin/settings" },
];

function SuperAdminDashboardContent() {
  const { data: stats, loading } = useApi<{
    users: { total: number; students: number; examiners: number };
    content: { examTypes: number; practiceSets: number };
    activity: { totalAttempts: number; submittedAttempts: number; totalScores: number; completionRate: number };
  }>("/api/admin/stats");

  const { data: agents } = useApi<{
    stats: { total: number; ready: number; aiConfigured: boolean; aiProvider: string; byDept: Record<string, number> };
  }>("/api/agents/status");

  const { data: health } = useApi<{
    status: string; version: string; checks: { database: string; examTypes: number };
  }>("/api/health");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
        <p className="text-slate-600">Full platform control — real-time data.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Loading platform data...
        </div>
      ) : (
        <>
          {/* Platform Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <DashboardCard title="Total Users" value={stats?.users?.total ?? 0} desc="All users" icon={Users} />
            <DashboardCard title="Students" value={stats?.users?.students ?? 0} desc="Student role" icon={GraduationCap} />
            <DashboardCard title="Exam Attempts" value={stats?.activity?.totalAttempts ?? 0} desc="Total" icon={FileText} />
            <DashboardCard title="Completion" value={`${stats?.activity?.completionRate ?? 0}%`} desc="Rate" icon={TrendingUp} />
          </div>

          {/* AI Agents */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <DashboardCard title="AI Agents" value={agents?.stats?.ready ?? 0} desc="Ready" icon={Bot} />
            <DashboardCard title="AI Provider" value={agents?.stats?.aiProvider || "local"} desc={agents?.stats?.aiConfigured ? "Configured" : "Using local engine"} icon={Activity} />
            <DashboardCard title="Exam Types" value={stats?.content?.examTypes ?? 0} desc="Active" icon={BookOpen} />
            <DashboardCard title="Scores" value={stats?.activity?.totalScores ?? 0} desc="AI-evaluated" icon={Award} />
          </div>

          {/* System Health */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold mb-3">System Health</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${health?.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}></span>
                <span className="text-sm">Status: {health?.status || "checking..."}</span>
              </div>
              <div className="text-sm">Version: {health?.version || "—"}</div>
              <div className="text-sm">DB: {health?.checks?.database || "—"} ({health?.checks?.examTypes ?? 0} exams)</div>
            </div>
          </div>

          {/* AI Agent Departments */}
          {agents?.stats?.byDept && (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-semibold mb-3">AI Agent Workforce by Department</h3>
              <DashboardTable
                headers={["Department", "Agents"]}
                rows={Object.entries(agents.stats.byDept).map(([dept, count]) => [
                  dept, <strong key={dept}>{count}</strong>
                ])}
              />
            </div>
          )}

          {/* CRM Links */}
          <DashboardTable
            headers={["System Module", "Status", "Link"]}
            rows={[
              ["AI Agent Workforce", `${agents?.stats?.ready ?? 0} agents ready`, <a key="ai" href="/api/agents/status" className="text-blue-600 hover:underline">View →</a>],
              ["Health Check", health?.status || "—", <a key="h" href="/api/health" className="text-blue-600 hover:underline">View →</a>],
              ["Admin Stats", "Live", <a key="s" href="/api/admin/stats" className="text-blue-600 hover:underline">View →</a>],
              ["Audit Logs", "Live", <a key="a" href="/api/crm/audit-logs" className="text-blue-600 hover:underline">View →</a>],
              ["Settings", "Live", <a key="set" href="/api/admin/settings" className="text-blue-600 hover:underline">View →</a>],
              ["Admin Panel", "Live", <a key="admin" href="/admin/dashboard" className="text-blue-600 hover:underline">Open →</a>],
            ]}
          />
        </>
      )}
    </>
  );
}

export default function SuperAdminDashboard() {
  return (
    <DashboardShell title="Super Admin Portal" nav={NAV} role="SUPER_ADMIN">
      <SuperAdminDashboardContent />
    </DashboardShell>
  );
}
