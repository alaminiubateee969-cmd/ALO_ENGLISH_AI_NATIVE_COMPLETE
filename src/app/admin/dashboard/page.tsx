import type { Metadata } from "next";
import { DashboardShell, DashboardCard, DashboardTable } from "@/components/site/dashboard-shell";
export const metadata: Metadata = { title: "Admin Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/dashboard" },
  { label: "Leads", href: "/admin/dashboard" },
  { label: "Students", href: "/admin/dashboard" },
  { label: "Applications", href: "/admin/dashboard" },
  { label: "Universities", href: "/admin/dashboard" },
  { label: "Courses", href: "/admin/dashboard" },
  { label: "Scholarships", href: "/admin/dashboard" },
  { label: "Partners", href: "/admin/dashboard" },
  { label: "Communications", href: "/admin/dashboard" },
  { label: "Audit Logs", href: "/admin/dashboard" },
  { label: "Settings", href: "/admin/dashboard" },
];

export default function AdminDashboard() {
  return (
    <DashboardShell title="Admin Portal" nav={NAV} role="ADMIN">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-slate-600">Platform overview and management.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="Total Users" value="-" />
        <DashboardCard title="Total Leads" value="-" />
        <DashboardCard title="Total Students" value="-" />
        <DashboardCard title="Applications" value="-" />
      </div>
      <DashboardTable headers={["Entity", "Action", "View"]} rows={[
        ["Users", "Manage", <a key="u" href="/api/crm/users" className="text-blue-600">API</a>],
        ["Leads", "Manage", <a key="l" href="/api/crm/leads" className="text-blue-600">API</a>],
        ["Students", "Manage", <a key="s" href="/api/crm/students" className="text-blue-600">API</a>],
        ["Applications", "Manage", <a key="a" href="/api/crm/applications" className="text-blue-600">API</a>],
        ["Universities", "Manage", <a key="uni" href="/api/crm/universities" className="text-blue-600">API</a>],
        ["Settings", "Manage", <a key="set" href="/api/admin/settings" className="text-blue-600">API</a>],
      ]} />
    </DashboardShell>
  );
}
