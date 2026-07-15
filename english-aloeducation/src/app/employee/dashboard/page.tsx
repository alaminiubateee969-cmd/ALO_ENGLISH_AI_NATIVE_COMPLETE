import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, EMPLOYEE_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getEmployeeData(userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    select: { id: true, employeeCode: true, department: true, position: true },
  });

  const [recentLeads, openVouchers, notifications] = await Promise.all([
    prisma.lead.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.voucher.findMany({
      where: { createdBy: userId, status: "available" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { employee, recentLeads, openVouchers, notifications };
}

export default async function EmployeeDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const data = await getEmployeeData(session.user.id);

  if (!data?.employee) {
    return (
      <PortalShell
        role="employee"
        roleLabel="Employee"
        navItems={EMPLOYEE_NAV}
        activePath="/employee/dashboard"
        title="Employee dashboard"
        userName={session.user.name}
      >
        <EmptyState message="Your employee profile is being set up. Please contact an administrator." />
      </PortalShell>
    );
  }

  const { employee, recentLeads, openVouchers, notifications } = data;

  return (
    <PortalShell
      role="employee"
      roleLabel="Employee"
      navItems={EMPLOYEE_NAV}
      activePath="/employee/dashboard"
      title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Team"}`}
      subtitle={`Employee code: ${employee.employeeCode}${employee.department ? ` · ${employee.department}` : ""}${employee.position ? ` · ${employee.position}` : ""}`}
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="My leads" value={recentLeads.length} accent="blue" />
        <StatTile label="Active vouchers" value={openVouchers.length} accent="orange" />
        <StatTile label="Notifications" value={notifications.length} accent="navy" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="My assigned leads">
          {recentLeads.length === 0 ? (
            <EmptyState message="No leads assigned to you yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{l.name}</p>
                    <p className="text-xs text-alo-faint">{l.email ?? l.phone ?? "—"} · {l.interest ?? "General"}</p>
                  </div>
                  <span className="text-xs font-medium text-alo-orange">{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active vouchers">
          {openVouchers.length === 0 ? (
            <EmptyState message="No active vouchers issued by you." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {openVouchers.map((v) => (
                <li key={v.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-alo-navy">{v.voucherCode}</p>
                    <p className="text-xs text-alo-faint">{v.voucherType} · {v.usedCount}/{v.usageLimit} used</p>
                  </div>
                  <span className="text-xs text-alo-faint">{formatDateTime(v.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent notifications" className="mt-6">
        {notifications.length === 0 ? (
          <EmptyState message="No notifications yet." />
        ) : (
          <ul className="divide-y divide-alo-soft-blue">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start justify-between py-3">
                <div>
                  <p className="font-medium text-alo-navy">{n.title}</p>
                  <p className="text-sm text-alo-muted">{n.body}</p>
                </div>
                <span className="ml-4 shrink-0 text-xs text-alo-faint">{formatDateTime(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/contact" className="rounded-lg bg-alo-soft-blue px-4 py-2 text-sm font-semibold text-alo-blue hover:bg-blue-100">
          Capture a new lead
        </Link>
      </div>
    </PortalShell>
  );
}
