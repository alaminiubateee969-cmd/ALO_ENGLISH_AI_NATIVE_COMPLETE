import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStudents() {
  return prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      student: {
        select: {
          studentCode: true,
          currentLevel: true,
          targetCountry: true,
          _count: { select: { enrollments: true, examAttempts: true } },
        },
      },
    },
  });
}

export default async function AdminStudentsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const students = await getStudents();
  const active = students.filter((s) => s.status === "active").length;

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/students"
      title="Student management"
      subtitle="All registered students"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total students" value={students.length} accent="blue" />
        <StatTile label="Active" value={active} accent="green" />
        <StatTile label="Suspended" value={students.length - active} accent="orange" />
      </div>

      <Card title="Students" className="mt-6">
        {students.length === 0 ? (
          <EmptyState message="No students registered yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Level</th>
                  <th className="py-2 pr-4">Country</th>
                  <th className="py-2 pr-4">Enrollments</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-alo-navy">{s.name}</p>
                      <p className="text-xs text-alo-faint">{s.email}</p>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{s.student?.studentCode ?? "—"}</td>
                    <td className="py-2 pr-4">{s.student?.currentLevel ?? "—"}</td>
                    <td className="py-2 pr-4">{s.student?.targetCountry ?? "—"}</td>
                    <td className="py-2 pr-4">{s.student?._count.enrollments ?? 0}</td>
                    <td className="py-2 pr-4">{s.student?._count.examAttempts ?? 0}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(s.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {s.status}
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
