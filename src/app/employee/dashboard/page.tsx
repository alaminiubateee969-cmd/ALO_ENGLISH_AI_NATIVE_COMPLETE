"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, FileText, MessageSquare, TrendingUp } from "lucide-react";


const NAV = [
  { label: "Dashboard", href: "/employee/dashboard" },
  { label: "Leads", href: "/api/crm/leads" },
  { label: "Students", href: "/api/crm/students" },
  { label: "Applications", href: "/api/crm/applications" },
  { label: "Tasks", href: "/api/crm/tasks" },
  { label: "Documents", href: "/api/crm/documents" },
  { label: "Messages", href: "/api/crm/messages" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Logout", href: "/login" },
];

function EmployeeDashboardContent() {
  const { data: leadsData, loading: leadsLoading } = useApi<{
    pagination: { total: number };
    leads: Array<{ id: string; name: string; email: string; phone: string; status: string; createdAt: string }>;
  }>("/api/crm/leads?limit=5");

  const { data: tasksData, loading: tasksLoading } = useApi<{
    pagination: { total: number };
    tasks: Array<{ id: string; title: string; status: string; priority: string; dueDate: string | null }>;
  }>("/api/crm/tasks?limit=5");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Employee Dashboard</h2>
        <p className="text-slate-600">Manage your assigned leads, students, and tasks — real data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="My Leads" value={leadsData?.pagination?.total ?? 0} desc="Total assigned" icon={Users} />
        <DashboardCard title="Open Tasks" value={tasksData?.pagination?.total ?? 0} desc="To complete" icon={FileText} />
        <DashboardCard title="New Leads" value={leadsData?.leads?.filter((l: any) => l.status === "NEW").length ?? 0} desc="Not yet contacted" icon={TrendingUp} />
        <DashboardCard title="Pending Tasks" value={tasksData?.tasks?.filter((t: any) => t.status === "PENDING").length ?? 0} desc="Awaiting action" icon={MessageSquare} />
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Recent Leads</h3>
        {leadsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading...</div>
        ) : leadsData?.leads && leadsData.leads.length > 0 ? (
          <DashboardTable
            headers={["Name", "Email", "Phone", "Status", "Created"]}
            rows={leadsData.leads.map((l) => [
              l.name,
              l.email || "—",
              l.phone || "—",
              <span key={l.id} className={`rounded-full px-2 py-0.5 text-xs ${
                l.status === "NEW" ? "bg-blue-50 text-blue-700" :
                l.status === "CONTACTED" ? "bg-yellow-50 text-yellow-700" :
                l.status === "QUALIFIED" ? "bg-purple-50 text-purple-700" :
                l.status === "CONVERTED" ? "bg-green-50 text-green-700" :
                "bg-slate-100 text-slate-700"
              }`}>{l.status}</span>,
              new Date(l.createdAt).toLocaleDateString(),
            ])}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            No leads assigned to you yet.
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-3">My Tasks</h3>
        {tasksLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading...</div>
        ) : tasksData?.tasks && tasksData.tasks.length > 0 ? (
          <DashboardTable
            headers={["Task", "Status", "Priority", "Due Date"]}
            rows={tasksData.tasks.map((t) => [
              t.title,
              <span key={t.id} className={`rounded-full px-2 py-0.5 text-xs ${
                t.status === "PENDING" ? "bg-yellow-50 text-yellow-700" :
                t.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" :
                t.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                "bg-slate-100 text-slate-700"
              }`}>{t.status}</span>,
              <span key={t.id + "p"} className={`rounded-full px-2 py-0.5 text-xs ${
                t.priority === "URGENT" ? "bg-red-50 text-red-700" :
                t.priority === "HIGH" ? "bg-orange-50 text-orange-700" :
                t.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-700" :
                "bg-slate-100 text-slate-600"
              }`}>{t.priority}</span>,
              t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—",
            ])}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            No tasks assigned to you yet.
          </div>
        )}
      </div>
    </>
  );
}

export default function EmployeeDashboard() {
  return (
    <DashboardShell title="Employee Portal" nav={NAV} role="COUNSELOR">
      <EmployeeDashboardContent />
    </DashboardShell>
  );
}
