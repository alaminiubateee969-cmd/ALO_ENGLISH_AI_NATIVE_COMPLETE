"use client";

import { DashboardShell, DashboardCard, DashboardTable, useApi } from "@/components/site/dashboard-shell";
import { Award, DollarSign, Users } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/partner/dashboard" },
  { label: "Marketing Kit", href: "/partner/marketing" },
];

type PartnerDashboardData = {
  referralCode: string;
  referrals: {
    total: number;
    converted: number;
    recent: Array<{
      id: string;
      status: string;
      country: string | null;
      courseInterest: string | null;
      createdAt: string;
    }>;
  };
  commissions: {
    pendingCount: number;
    pendingAmount: number;
    paidCount: number;
    paidAmount: number;
  };
};

function PartnerDashboardContent() {
  const { data, loading, error } = useApi<PartnerDashboardData>("/api/partner/dashboard");

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading your partner activity…</div>;
  }

  if (error || !data) {
    return (
      <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Partner dashboard data is unavailable.</p>
        <p className="mt-1">{error || "Make sure your signed-in account is linked to an active partner profile."}</p>
      </div>
    );
  }

  const rows = data.referrals.recent.map((lead) => [
    <span key={`${lead.id}-id`} className="font-mono text-xs">…{lead.id.slice(-6)}</span>,
    <span key={`${lead.id}-status`} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{lead.status.replaceAll("_", " ")}</span>,
    lead.courseInterest || "—",
    lead.country || "—",
    new Date(lead.createdAt).toLocaleDateString(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Partner Dashboard</h2>
        <p className="mt-1 text-slate-600">Your referral and commission summary. Referred students’ private contact details are not shown here.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Referrals" value={data.referrals.total} desc="Attributed to your code" icon={Users} />
        <DashboardCard title="Converted" value={data.referrals.converted} desc="Marked converted in CRM" icon={Award} />
        <DashboardCard title="Pending commission" value={data.commissions.pendingAmount.toLocaleString()} desc={`${data.commissions.pendingCount} records · amount in CRM currency`} icon={DollarSign} />
        <DashboardCard title="Paid commission" value={data.commissions.paidAmount.toLocaleString()} desc={`${data.commissions.paidCount} records · amount in CRM currency`} icon={DollarSign} />
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <span className="font-semibold">Referral code:</span> <code className="ml-1 rounded bg-white px-2 py-1 font-mono">{data.referralCode}</code>
      </div>

      <section aria-labelledby="recent-referrals-title">
        <h3 id="recent-referrals-title" className="mb-3 font-semibold text-slate-900">Recent referrals</h3>
        <DashboardTable headers={["Reference", "Stage", "Course interest", "Country", "Date"]} rows={rows} />
        {data.referrals.total === 0 && (
          <p className="mt-3 text-sm text-slate-500">No referrals yet. Open the Marketing Kit to copy your tracked link and download branded assets.</p>
        )}
      </section>
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
