import { DashboardShell } from "@/components/site/dashboard-shell";
import { AmbassadorMarketingKit } from "@/components/alo/ambassador-marketing-kit";

const NAV = [
  { label: "Dashboard", href: "/partner/dashboard" },
  { label: "Marketing Kit", href: "/partner/marketing" },
];

export const metadata = { title: "Partner Marketing Kit" };

export default function PartnerMarketingPage() {
  return (
    <DashboardShell title="Partner Portal" nav={NAV} role="PARTNER">
      <AmbassadorMarketingKit />
    </DashboardShell>
  );
}
