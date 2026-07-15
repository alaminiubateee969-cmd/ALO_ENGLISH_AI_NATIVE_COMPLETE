import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyAssignmentsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const submissions = student
    ? await prisma.assignmentSubmission.findMany({
        where: { studentId: student.id },
        orderBy: { submittedAt: "desc" },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              maxScore: true,
              course: { select: { title: true } },
            },
          },
        },
      })
    : [];

  // Also fetch pending assignments (from enrolled courses) that haven't been submitted.
  const pendingAssignments = student
    ? await prisma.assignment.findMany({
        where: {
          course: { enrollments: { some: { studentId: student.id } } },
          submissions: { none: { where: { studentId: student.id } } },
          dueDate: { gte: new Date() },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
        include: { course: { select: { title: true } } },
      })
    : [];

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/assignments"
      title="Assignments"
      subtitle="Your pending and submitted assignments"
      userName={session.user.name}
    >
      <Card title="Pending assignments" className="mb-6">
        {pendingAssignments.length === 0 ? (
          <EmptyState message="No pending assignments. You're all caught up!" />
        ) : (
          <ul className="divide-y divide-alo-soft-blue">
            {pendingAssignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-alo-navy">{a.title}</p>
                  <p className="text-xs text-alo-faint">{a.course.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-alo-orange">Due {formatDate(a.dueDate)}</p>
                  <p className="text-xs text-alo-faint">Max {a.maxScore} pts</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Submitted assignments">
        {submissions.length === 0 ? (
          <EmptyState message="No submissions yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Assignment</th>
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-medium text-alo-navy">{s.assignment.title}</td>
                    <td className="py-2 pr-4 text-alo-muted">{s.assignment.course.title}</td>
                    <td className="py-2 pr-4 text-alo-muted">{formatDate(s.submittedAt)}</td>
                    <td className="py-2 pr-4">
                      {s.score !== null ? `${s.score} / ${s.assignment.maxScore}` : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.status === "graded"
                            ? "bg-emerald-50 text-emerald-700"
                            : s.status === "returned"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-blue-50 text-blue-700"
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
