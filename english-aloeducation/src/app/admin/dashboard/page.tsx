import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getKpis() {
  const [totalStudents, activeEnrollments, revenueAgg, totalLeads, examAttempts] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count({ where: { status: "active" } }),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.lead.count(),
    prisma.examAttempt.count(),
  ]);

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentAttempts = await prisma.examAttempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      examType: { select: { name: true } },
      student: { include: { user: { select: { name: true } } } },
    },
  });

  return {
    totalStudents,
    activeEnrollments,
    revenue: Number(revenueAgg._sum.amount ?? 0),
    totalLeads,
    examAttempts,
    recentLeads,
    recentAttempts,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const kpis = await getKpis();

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/dashboard"
      title="Admin dashboard"
      subtitle="Operational overview across the platform"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Total students" value={kpis.totalStudents} accent="blue" />
        <StatTile label="Active enrollments" value={kpis.activeEnrollments} accent="green" />
        <StatTile label="Revenue (paid)" value={formatCurrency(kpis.revenue)} accent="orange" />
        <StatTile label="Leads" value={kpis.totalLeads} accent="navy" />
        <StatTile label="Exam attempts" value={kpis.examAttempts} accent="blue" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Recent leads" action={<Link href="/admin/leads" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {kpis.recentLeads.length === 0 ? (
            <EmptyState message="No leads captured yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {kpis.recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{l.name}</p>
                    <p className="text-xs text-alo-faint">
                      {l.email ?? l.phone ?? "—"} · {l.source} · {l.interest ?? "General"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-alo-orange">{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent exam attempts" action={<Link href="/admin/exam-attempts" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {kpis.recentAttempts.length === 0 ? (
            <EmptyState message="No exam attempts yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {kpis.recentAttempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{a.student.user.name}</p>
                    <p className="text-xs text-alo-faint">{a.examType.name} · {formatDate(a.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-alo-blue">{a.overallScore ?? "—"}</p>
                    <p className="text-xs text-alo-faint">{a.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
