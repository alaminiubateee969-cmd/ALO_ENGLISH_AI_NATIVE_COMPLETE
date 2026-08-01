import type { Metadata } from "next";
import { DashboardShell, DashboardCard, DashboardTable } from "@/components/site/dashboard-shell";
export const metadata: Metadata = { title: "Super Admin Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/super-admin/dashboard" },
  { label: "Users", href: "/super-admin/dashboard" },
  { label: "Roles & Permissions", href: "/super-admin/dashboard" },
  { label: "Branches", href: "/super-admin/dashboard" },
  { label: "All CRM", href: "/admin/dashboard" },
  { label: "AI Agents", href: "/api/agents/status" },
  { label: "Audit Logs", href: "/super-admin/dashboard" },
  { label: "System Settings", href: "/super-admin/dashboard" },
  { label: "Integrations", href: "/super-admin/dashboard" },
];

export default function SuperAdminDashboard() {
  return (
    <DashboardShell title="Super Admin Portal" nav={NAV} role="SUPER_ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
        <p className="text-slate-600">Full platform control and configuration.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="AI Agents" value={20} desc="All ready" />
        <DashboardCard title="API Routes" value={53} desc="Active" />
        <DashboardCard title="DB Models" value={25} desc="Tables" />
        <DashboardCard title="Exam Types" value={20} desc="Practice sets" />
      </div>
      <DashboardTable headers={["System Module", "Status", "Link"]} rows={[
        ["AI Agent Workforce", "20 agents ready", <a key="ai" href="/api/agents/status" className="text-blue-600">View</a>],
        ["Health Check", "Live", <a key="h" href="/api/health" className="text-blue-600">View</a>],
        ["Admin Stats", "Live", <a key="s" href="/api/admin/stats" className="text-blue-600">View</a>],
        ["Audit Logs", "Live", <a key="a" href="/api/crm/audit-logs" className="text-blue-600">View</a>],
        ["Settings", "Live", <a key="set" href="/api/admin/settings" className="text-blue-600">View</a>],
      ]} />
    </DashboardShell>
  );
}
