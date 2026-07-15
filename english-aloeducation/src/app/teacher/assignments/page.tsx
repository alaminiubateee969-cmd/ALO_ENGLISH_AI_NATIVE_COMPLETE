import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, TEACHER_NAV } from "@/components/portal/PortalShell";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAssignments(teacherId: string) {
  return prisma.assignment.findMany({
    where: { teacherId },
    orderBy: { dueDate: "desc" },
    include: {
      course: { select: { title: true } },
      _count: { select: { submissions: true } },
    },
  });
}

export default async function TeacherAssignmentsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const assignments = teacher ? await getAssignments(teacher.id) : [];

  return (
    <PortalShell
      role="teacher"
      roleLabel="Teacher"
      navItems={TEACHER_NAV}
      activePath="/teacher/assignments"
      title="Assignments"
      subtitle="Manage assignments you've created"
      userName={session.user.name}
    >
      <Card title="All assignments">
        {assignments.length === 0 ? (
          <EmptyState message="No assignments created yet. Create your first assignment to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Due date</th>
                  <th className="py-2 pr-4">Max score</th>
                  <th className="py-2 pr-4">Submissions</th>
                  <th className="py-2 pr-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const overdue = a.dueDate < new Date();
                  return (
                    <tr key={a.id} className="border-b border-alo-soft-blue">
                      <td className="py-2 pr-4 font-medium text-alo-navy">{a.title}</td>
                      <td className="py-2 pr-4 text-alo-muted">{a.course.title}</td>
                      <td className={`py-2 pr-4 ${overdue ? "text-red-600" : "text-alo-muted"}`}>
                        {formatDateTime(a.dueDate)}
                      </td>
                      <td className="py-2 pr-4">{a.maxScore}</td>
                      <td className="py-2 pr-4">{a._count.submissions}</td>
                      <td className="py-2 pr-4 text-alo-muted">{formatDate(a.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PortalShell>
  );
}
