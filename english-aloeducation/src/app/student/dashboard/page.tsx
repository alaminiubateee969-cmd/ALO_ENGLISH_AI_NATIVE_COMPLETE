import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStudentData(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      studentCode: true,
      currentLevel: true,
      targetScore: true,
      targetCountry: true,
      _count: {
        select: {
          enrollments: true,
          examAttempts: true,
          certificates: true,
          assignments: true,
        },
      },
    },
  });
  if (!student) return null;

  const [enrollments, recentResults, upcomingClasses, certificates, attempts] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: student.id },
      take: 5,
      orderBy: { enrolledAt: "desc" },
      include: { course: { select: { id: true, title: true, slug: true } } },
    }),
    prisma.examResult.findMany({
      where: { studentId: student.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { examType: { select: { name: true } } },
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id, date: { gte: new Date() } },
      take: 5,
      orderBy: { date: "asc" },
      include: { class: { select: { name: true } } },
    }),
    prisma.certificate.findMany({
      where: { studentId: student.id },
      take: 5,
      orderBy: { issuedAt: "desc" },
    }),
    prisma.examAttempt.findMany({
      where: { studentId: student.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { examType: { select: { name: true } } },
    }),
  ]);

  return { student, enrollments, recentResults, upcomingClasses, certificates, attempts };
}

export default async function StudentDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const data = await getStudentData(session.user.id);
  if (!data) {
    return (
      <PortalShell
        role="student"
        roleLabel="Student"
        navItems={STUDENT_NAV}
        activePath="/student/dashboard"
        title="Dashboard"
        userName={session.user.name}
      >
        <EmptyState message="Your student profile is still being set up. Please check back shortly." />
      </PortalShell>
    );
  }

  const { student, enrollments, recentResults, upcomingClasses, certificates, attempts } = data;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length)
    : 0;

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/dashboard"
      title={`Welcome back, ${session.user.name?.split(" ")[0] ?? "Student"}`}
      subtitle={`Student code: ${student.studentCode} · ${student.currentLevel ?? "Level not set"}`}
      userName={session.user.name}
    >
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active courses" value={student._count.enrollments} accent="blue" />
        <StatTile label="Exam attempts" value={student._count.examAttempts} accent="orange" />
        <StatTile label="Certificates" value={student._count.certificates} accent="green" />
        <StatTile label="Avg. progress" value={`${avgProgress}%`} accent="navy" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Enrollments */}
        <Card title="My enrollments" action={<Link href="/student/courses" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {enrollments.length === 0 ? (
            <EmptyState message="No enrollments yet. Browse the course catalog to get started." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {enrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/courses/${e.course.slug}`} className="font-medium text-alo-navy hover:text-alo-blue">
                      {e.course.title}
                    </Link>
                    <p className="text-xs text-alo-faint">Enrolled {formatDate(e.enrolledAt)} · {e.status}</p>
                  </div>
                  <div className="text-right">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-alo-soft-blue">
                      <div className="h-full bg-alo-blue" style={{ width: `${e.progress ?? 0}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-alo-faint">{e.progress ?? 0}%</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent results */}
        <Card title="Recent exam results" action={<Link href="/student/exams" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {recentResults.length === 0 ? (
            <EmptyState message="No exam attempts yet. Take a mock test to see your scores here." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {recentResults.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{r.examType.name}</p>
                    <p className="text-xs text-alo-faint">{formatDate(r.createdAt)} · {r.resultCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-alo-blue">{r.overallScore}</p>
                    <p className="text-xs text-alo-faint">Band {r.bandEstimate}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming classes */}
        <Card title="Upcoming classes">
          {upcomingClasses.length === 0 ? (
            <EmptyState message="No upcoming classes scheduled." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {upcomingClasses.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <span className="font-medium text-alo-navy">{a.class.name}</span>
                  <span className="text-sm text-alo-faint">{formatDateTime(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent certificates */}
        <Card title="Certificates" action={<Link href="/student/certificates" className="text-sm text-alo-blue hover:underline">View all</Link>}>
          {certificates.length === 0 ? (
            <EmptyState message="No certificates yet. Complete a mock test to earn your first certificate." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {certificates.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{c.examName}</p>
                    <p className="text-xs text-alo-faint">Issued {formatDate(c.issuedAt)} · {c.certificateCode}</p>
                  </div>
                  <Link
                    href={`/verify/${c.verificationHash}`}
                    className="rounded-md bg-alo-soft-blue px-3 py-1 text-xs font-medium text-alo-blue hover:bg-blue-100"
                  >
                    Verify
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent attempts */}
      {attempts.length > 0 && (
        <Card title="Recent exam attempts" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Exam</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-medium text-alo-navy">{a.examType.name}</td>
                    <td className="py-2 pr-4">{a.status}</td>
                    <td className="py-2 pr-4 text-alo-muted">{a.startedAt ? formatDate(a.startedAt) : "—"}</td>
                    <td className="py-2 pr-4">{a.overallScore ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PortalShell>
  );
}
