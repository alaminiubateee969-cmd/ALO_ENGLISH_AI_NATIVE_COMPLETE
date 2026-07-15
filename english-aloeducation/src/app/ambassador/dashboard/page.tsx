import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, AMBASSADOR_NAV } from "@/components/portal/PortalShell";
import { CopyButton } from "@/components/portal/CopyButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAmbassadorData(userId: string) {
  const ambassador = await prisma.ambassador.findUnique({
    where: { userId },
    select: {
      id: true,
      ambassadorCode: true,
      referralCode: true,
      organization: true,
      _count: { select: { referrals: true } },
    },
  });
  if (!ambassador) return null;

  const referrals = await prisma.referral.findMany({
    where: { ambassadorId: ambassador.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const converted = referrals.filter((r) => r.status === "converted").length;
  const pendingCommission = referrals.filter(
    (r) => r.status === "converted" && r.commissionStatus === "pending",
  ).length;

  const vouchers = await prisma.voucher.findMany({
    where: { createdBy: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { ambassador, referrals, converted, pendingCommission, vouchers };
}

export default async function AmbassadorDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const data = await getAmbassadorData(session.user.id);

  if (!data) {
    return (
      <PortalShell
        role="ambassador"
        roleLabel="Ambassador"
        navItems={AMBASSADOR_NAV}
        activePath="/ambassador/dashboard"
        title="Ambassador dashboard"
        userName={session.user.name}
      >
        <EmptyState message="Your ambassador profile is being set up. Please contact an administrator." />
      </PortalShell>
    );
  }

  const { ambassador, referrals, converted, pendingCommission, vouchers } = data;
  const shareUrl = `https://english.aloeducation.com/register?ref=${ambassador.referralCode}`;

  return (
    <PortalShell
      role="ambassador"
      roleLabel="Ambassador"
      navItems={AMBASSADOR_NAV}
      activePath="/ambassador/dashboard"
      title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Ambassador"}`}
      subtitle={`Ambassador code: ${ambassador.ambassadorCode}${ambassador.organization ? ` · ${ambassador.organization}` : ""}`}
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total referrals" value={ambassador._count.referrals} accent="blue" />
        <StatTile label="Converted" value={converted} accent="green" />
        <StatTile label="Pending commission" value={pendingCommission} accent="orange" />
      </div>

      <Card title="Your referral link" className="mt-6">
        <p className="text-sm text-alo-muted">
          Share this link with prospective students. Anyone who registers
          through it will be tracked as your referral.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-alo-card bg-alo-soft-gray px-3 py-2 font-mono text-xs text-alo-navy"
          />
          <CopyButton text={shareUrl} />
        </div>
        <p className="mt-2 text-xs text-alo-faint">Referral code: <span className="font-mono font-semibold text-alo-navy">{ambassador.referralCode}</span></p>
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Recent referrals" action={<Link href="/ambassador/referrals" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {referrals.length === 0 ? (
            <EmptyState message="No referrals yet. Share your link to start earning commission." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {referrals.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{r.leadName}</p>
                    <p className="text-xs text-alo-faint">{r.leadEmail ?? r.leadPhone ?? "—"} · {formatDate(r.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${r.status === "converted" ? "text-emerald-600" : "text-alo-orange"}`}>
                      {r.status}
                    </p>
                    <p className="text-xs text-alo-faint">{r.commissionStatus}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Vouchers you've issued">
          {vouchers.length === 0 ? (
            <EmptyState message="No vouchers issued yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {vouchers.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-alo-navy">{v.voucherCode}</p>
                    <p className="text-xs text-alo-faint">{v.voucherType} · {formatDate(v.createdAt)}</p>
                  </div>
                  <span className="text-xs text-alo-faint">
                    {v.usedCount}/{v.usageLimit} used
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
