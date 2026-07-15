import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getPayments() {
  const [payments, agg] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        enrollment: {
          select: {
            student: { include: { user: { select: { name: true } } } },
            course: { select: { title: true } },
          },
        },
      },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { status: true },
    }),
  ]);
  return { payments, agg };
}

export default async function AdminPaymentsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const { payments, agg } = await getPayments();
  const paid = agg.find((a) => a.status === "paid");
  const pending = agg.find((a) => a.status === "pending");
  const failed = agg.find((a) => a.status === "failed");

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/payments"
      title="Payments"
      subtitle="All payment transactions"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Paid" value={formatCurrency(paid?._sum.amount ?? 0)} accent="green" />
        <StatTile label="Pending" value={formatCurrency(pending?._sum.amount ?? 0)} accent="orange" />
        <StatTile label="Failed" value={formatCurrency(failed?._sum.amount ?? 0)} accent="navy" />
        <StatTile label="Transactions" value={payments.length} accent="blue" />
      </div>

      <Card title="Transactions" className="mt-6">
        {payments.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Txn ID</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-mono text-xs">{p.paymentCode}</td>
                    <td className="py-2 pr-4 font-medium text-alo-navy">
                      {p.enrollment?.student.user.name ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs">{p.enrollment?.course.title ?? "—"}</td>
                    <td className="py-2 pr-4">{formatCurrency(p.amount, p.currency)}</td>
                    <td className="py-2 pr-4">{p.method ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-alo-faint">{p.transactionId ?? "—"}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(p.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {p.status}
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
