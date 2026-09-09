"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Users, GraduationCap, DollarSign, TrendingUp } from "lucide-react";


const NAV = [
  { label: "Dashboard", href: "/partner/dashboard" },
  { label: "Leads", href: "/api/crm/leads" },
  { label: "Students", href: "/api/crm/students" },
  { label: "Applications", href: "/api/crm/applications" },
  { label: "Commission", href: "/api/crm/commissions" },
  { label: "Messages", href: "/api/crm/messages" },
  { label: "Logout", href: "/login" },
];

function PartnerDashboardContent() {
  const { data: leadsData, loading: leadsLoading } = useApi<{
    pagination: { total: number };
    leads: Array<{ id: string; name: string; email: string; status: string; createdAt: string }>;
  }>("/api/crm/leads?limit=5");

  const { data: commissionsData, loading: commissionsLoading } = useApi<{
    pagination: { total: number };
    commissions: Array<{ id: string; amount: number; status: string; createdAt: string }>;
  }>("/api/crm/commissions?limit=5");

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Partner Dashboard</h2>
        <p className="text-slate-600">Track your referrals and commissions — real data from the database.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="Referred Leads" value={leadsData?.pagination?.total ?? 0} desc="Total leads" icon={Users} />
        <DashboardCard title="Commissions" value={commissionsData?.pagination?.total ?? 0} desc="Records" icon={DollarSign} />
        <DashboardCard title="Pending Payouts" value={commissionsData?.commissions?.filter((c: any) => c.status === "PENDING").length ?? 0} desc="Awaiting" icon={TrendingUp} />
        <DashboardCard title="Paid Out" value={commissionsData?.commissions?.filter((c: any) => c.status === "PAID").length ?? 0} desc="Completed" icon={GraduationCap} />
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3">Recent Referred Leads</h3>
        {leadsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading...</div>
        ) : leadsData?.leads && leadsData.leads.length > 0 ? (
          <DashboardTable
            headers={["Name", "Email", "Status", "Date"]}
            rows={leadsData.leads.map((l) => [
              l.name,
              l.email || "—",
              <span key={l.id} className={`rounded-full px-2 py-0.5 text-xs ${l.status === "CONVERTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{l.status}</span>,
              new Date(l.createdAt).toLocaleDateString(),
            ])}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            No leads yet. Start referring students to earn commissions.
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-3">Commission History</h3>
        {commissionsLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">Loading...</div>
        ) : commissionsData?.commissions && commissionsData.commissions.length > 0 ? (
          <DashboardTable
            headers={["Amount", "Status", "Date"]}
            rows={commissionsData.commissions.map((c) => [
              `$${c.amount}`,
              <span key={c.id} className={`rounded-full px-2 py-0.5 text-xs ${c.status === "PAID" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{c.status}</span>,
              new Date(c.createdAt).toLocaleDateString(),
            ])}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            No commission records yet.
          </div>
        )}
      </div>
    </>
  );
}

export default function PartnerDashboard() {
  return (
    <DashboardShell title="Partner Portal" nav={NAV} role="PARTNER">
      <PartnerDashboardContent />
    </DashboardShell>
  );
}
