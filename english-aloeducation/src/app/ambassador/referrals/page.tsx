import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, AMBASSADOR_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getReferrals(ambassadorId: string) {
  return prisma.referral.findMany({
    where: { ambassadorId },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AmbassadorReferralsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const ambassador = await prisma.ambassador.findUnique({
    where: { userId: session.user.id },
    select: { id: true, referralCode: true },
  });

  const referrals = ambassador ? await getReferrals(ambassador.id) : [];
  const converted = referrals.filter((r) => r.status === "converted").length;
  const paidOut = referrals.filter((r) => r.commissionStatus === "paid").length;

  return (
    <PortalShell
      role="ambassador"
      roleLabel="Ambassador"
      navItems={AMBASSADOR_NAV}
      activePath="/ambassador/referrals"
      title="My referrals"
      subtitle="Track every referral you've made"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total referrals" value={referrals.length} accent="blue" />
        <StatTile label="Converted" value={converted} accent="green" />
        <StatTile label="Commission paid" value={paidOut} accent="orange" />
      </div>

      <Card title="All referrals" className="mt-6">
        {referrals.length === 0 ? (
          <EmptyState message="No referrals yet. Share your referral link from the dashboard." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Referred on</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Commission</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-medium text-alo-navy">{r.leadName}</td>
                    <td className="py-2 pr-4">{r.leadEmail ?? "—"}</td>
                    <td className="py-2 pr-4">{r.leadPhone ?? "—"}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(r.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "converted"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "lost"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs ${r.commissionStatus === "paid" ? "text-emerald-600" : "text-alo-orange"}`}>
                        {r.commissionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PortalShell>
  );
}
