import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, TEACHER_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getTeacherData(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true, teacherCode: true, _count: { select: { classes: true, assignments: true } } },
  });
  if (!teacher) return null;

  const [classes, assignments, recentSubmissions] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        course: { select: { title: true } },
        _count: { select: { attendances: true, schedules: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        course: { select: { title: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.assignmentSubmission.findMany({
      where: { assignment: { teacherId: teacher.id } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        assignment: { select: { title: true, maxScore: true } },
        student: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return { teacher, classes, assignments, recentSubmissions };
}

export default async function TeacherDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const data = await getTeacherData(session.user.id);

  if (!data) {
    return (
      <PortalShell
        role="teacher"
        roleLabel="Teacher"
        navItems={TEACHER_NAV}
        activePath="/teacher/dashboard"
        title="Teacher dashboard"
        userName={session.user.name}
      >
        <EmptyState message="Your teacher profile is being set up. Please contact an administrator." />
      </PortalShell>
    );
  }

  const { teacher, classes, assignments, recentSubmissions } = data;

  return (
    <PortalShell
      role="teacher"
      roleLabel="Teacher"
      navItems={TEACHER_NAV}
      activePath="/teacher/dashboard"
      title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Teacher"}`}
      subtitle={`Teacher code: ${teacher.teacherCode}`}
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="My classes" value={teacher._count.classes} accent="blue" />
        <StatTile label="Assignments" value={teacher._count.assignments} accent="orange" />
        <StatTile label="Recent submissions" value={recentSubmissions.length} accent="green" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="My classes" action={<Link href="/teacher/classes" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {classes.length === 0 ? (
            <EmptyState message="No classes assigned yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {classes.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{c.name}</p>
                    <p className="text-xs text-alo-faint">{c.course.title}</p>
                  </div>
                  <span className="text-xs text-alo-faint">{c._count.schedules} sessions/wk</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Upcoming assignments" action={<Link href="/teacher/assignments" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {assignments.length === 0 ? (
            <EmptyState message="No assignments created yet." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{a.title}</p>
                    <p className="text-xs text-alo-faint">{a.course.title} · {a._count.submissions} submitted</p>
                  </div>
                  <span className="text-xs font-medium text-alo-orange">Due {formatDate(a.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent submissions to grade" className="mt-6">
        {recentSubmissions.length === 0 ? (
          <EmptyState message="No submissions waiting for review." />
        ) : (
          <ul className="divide-y divide-alo-soft-blue">
            {recentSubmissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-alo-navy">{s.student.user.name}</p>
                  <p className="text-xs text-alo-faint">{s.assignment.title}</p>
                </div>
                <span className={`text-xs font-medium ${
                  s.status === "graded" ? "text-emerald-600" : "text-alo-orange"
                }`}>
                  {s.status === "graded" ? `Graded: ${s.score}/${s.assignment.maxScore}` : "Awaiting grading"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PortalShell>
  );
}
