import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getCourses() {
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { enrollments: true, classes: true } } },
    }),
    prisma.course.count(),
  ]);
  return { courses, total };
}

export default async function AdminCoursesPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const { courses, total } = await getCourses();
  const active = courses.filter((c) => c.isActive).length;
  const totalRevenue = courses.reduce(
    (sum, c) => sum + Number(c.price) * c._count.enrollments,
    0,
  );

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/courses"
      title="Course management"
      subtitle="All courses in the catalog"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total courses" value={total} accent="blue" />
        <StatTile label="Active" value={active} accent="green" />
        <StatTile label="Enrollment revenue" value={formatCurrency(totalRevenue)} accent="orange" />
      </div>

      <Card title="Courses" className="mt-6">
        {courses.length === 0 ? (
          <EmptyState message="No courses created yet. Run the seed script to add sample courses." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Enrollments</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-medium text-alo-navy">{c.title}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{c.courseCode}</td>
                    <td className="py-2 pr-4 uppercase text-xs">{c.category}</td>
                    <td className="py-2 pr-4">{formatCurrency(c.price, c.currency)}</td>
                    <td className="py-2 pr-4">{c._count.enrollments}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(c.createdAt)}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.isActive ? "active" : "inactive"}
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
