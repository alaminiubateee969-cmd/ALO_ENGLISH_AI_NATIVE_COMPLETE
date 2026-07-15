import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyPaymentsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const payments = student
    ? await prisma.payment.findMany({
        where: { enrollment: { studentId: student.id } },
        orderBy: { createdAt: "desc" },
        include: {
          enrollment: {
            select: {
              course: { select: { title: true } },
            },
          },
        },
      })
    : [];

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = payments.filter((p) => p.status === "pending").length;

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/payments"
      title="Payment history"
      subtitle="All your payment transactions"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total paid" value={formatCurrency(totalPaid)} accent="green" />
        <StatTile label="Transactions" value={payments.length} accent="blue" />
        <StatTile label="Pending" value={pending} accent="orange" />
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
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Method</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-mono text-xs text-alo-navy">{p.paymentCode}</td>
                    <td className="py-2 pr-4 font-medium text-alo-navy">
                      {p.enrollment?.course.title ?? "—"}
                    </td>
                    <td className="py-2 pr-4">{formatCurrency(p.amount, p.currency)}</td>
                    <td className="py-2 pr-4">{p.method ?? "—"}</td>
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
