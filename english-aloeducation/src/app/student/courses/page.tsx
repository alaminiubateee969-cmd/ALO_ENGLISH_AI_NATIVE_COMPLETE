import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const enrollments = student
    ? await prisma.enrollment.findMany({
        where: { studentId: student.id },
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            select: { id: true, title: true, slug: true, category: true, level: true, duration: true },
          },
        },
      })
    : [];

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/courses"
      title="My courses"
      subtitle="Courses you're currently enrolled in"
      userName={session.user.name}
    >
      {enrollments.length === 0 ? (
        <EmptyState message="You haven't enrolled in any courses yet. Browse the catalog to find your next course." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <Card key={e.id}>
              <span className="inline-flex items-center rounded-full bg-alo-soft-blue px-2.5 py-0.5 text-xs font-semibold uppercase text-alo-blue">
                {e.course.category}
              </span>
              <h3 className="mt-3 font-semibold text-alo-navy">{e.course.title}</h3>
              <p className="mt-1 text-xs text-alo-faint">
                {e.course.level} · {e.course.duration}h · Enrolled {formatDate(e.enrolledAt)}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-alo-muted">
                  <span>Progress</span>
                  <span>{e.progress ?? 0}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-alo-soft-blue">
                  <div className="h-full bg-alo-blue" style={{ width: `${e.progress ?? 0}%` }} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium ${e.status === "active" ? "text-emerald-600" : "text-alo-faint"}`}>
                  {e.status}
                </span>
                <Link
                  href={`/courses/${e.course.slug}`}
                  className="text-xs font-semibold text-alo-blue hover:underline"
                >
                  Continue →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/courses"
          className="inline-block rounded-lg bg-alo-soft-blue px-6 py-2.5 text-sm font-semibold text-alo-blue transition hover:bg-blue-100"
        >
          Browse course catalog
        </Link>
      </div>
    </PortalShell>
  );
}
