import type { Metadata } from "next";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
export const metadata: Metadata = { title: "Employee Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Leads", href: "/employee/dashboard" },
  { label: "Students", href: "/employee/dashboard" },
  { label: "Applications", href: "/employee/dashboard" },
  { label: "Tasks", href: "/employee/dashboard" },
  { label: "Documents", href: "/employee/dashboard" },
  { label: "Inbox", href: "/employee/dashboard" },
  { label: "Reports", href: "/employee/dashboard" },
  { label: "Settings", href: "/employee/dashboard" },
];

export default function EmployeeDashboard() {
  return (
    <DashboardShell title="Employee Portal" nav={NAV} role="COUNSELOR">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Employee Dashboard</h2>
        <p className="text-slate-600">Manage your assigned leads, students, and tasks.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="My Leads" value={0} />
        <DashboardCard title="My Students" value={0} />
        <DashboardCard title="Open Tasks" value={0} />
        <DashboardCard title="Unread Messages" value={0} />
      </div>
    </DashboardShell>
  );
}
