import type { Metadata } from "next";
import { DashboardShell, DashboardCard } from "@/components/site/dashboard-shell";
export const metadata: Metadata = { title: "Partner Dashboard" };

const NAV = [
  { label: "Dashboard", href: "/partner/dashboard" },
  { label: "Leads", href: "/partner/dashboard" },
  { label: "Students", href: "/partner/dashboard" },
  { label: "Applications", href: "/partner/dashboard" },
  { label: "Commission", href: "/partner/dashboard" },
  { label: "Marketing", href: "/partner/dashboard" },
  { label: "Messages", href: "/partner/dashboard" },
  { label: "Reports", href: "/partner/dashboard" },
  { label: "Settings", href: "/partner/dashboard" },
];

export default function PartnerDashboard() {
  return (
    <DashboardShell title="Partner Portal" nav={NAV} role="PARTNER">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Partner Dashboard</h2>
        <p className="text-slate-600">Track your referrals and commissions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <DashboardCard title="Referred Leads" value={0} />
        <DashboardCard title="Active Students" value={0} />
        <DashboardCard title="Total Commission" value="$0" />
        <DashboardCard title="Pending Payouts" value="$0" />
      </div>
    </DashboardShell>
  );
}
