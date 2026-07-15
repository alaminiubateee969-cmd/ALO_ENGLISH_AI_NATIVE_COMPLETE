import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, STUDENT_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyExamAttemptsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const attempts = student
    ? await prisma.examAttempt.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: {
          examType: { select: { id: true, name: true, code: true } },
          mockTest: { select: { title: true } },
        },
      })
    : [];

  const completed = attempts.filter((a) => a.status === "COMPLETED" || a.status === "SUBMITTED").length;
  const inProgress = attempts.filter((a) => a.status === "IN_PROGRESS").length;
  const avgScore = attempts
    .filter((a) => a.overallScore !== null)
    .reduce((sum, a, _, arr) => sum + (a.overallScore ?? 0) / arr.length, 0);

  return (
    <PortalShell
      role="student"
      roleLabel="Student"
      navItems={STUDENT_NAV}
      activePath="/student/exams"
      title="My exam attempts"
      subtitle="All your mock tests and quick practice attempts"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total attempts" value={attempts.length} accent="blue" />
        <StatTile label="Completed" value={completed} accent="green" />
        <StatTile label="Avg. score" value={avgScore ? avgScore.toFixed(1) : "—"} accent="orange" />
      </div>

      <Card title="Attempt history" className="mt-6">
        {attempts.length === 0 ? (
          <EmptyState message="No attempts yet. Take your first mock test to begin." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Exam</th>
                  <th className="py-2 pr-4">Mode</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Score</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-mono text-xs text-alo-navy">{a.attemptCode}</td>
                    <td className="py-2 pr-4 font-medium text-alo-navy">
                      {a.examType.name}
                      {a.mockTest && <span className="block text-xs text-alo-faint">{a.mockTest.title}</span>}
                    </td>
                    <td className="py-2 pr-4">{a.mode}</td>
                    <td className="py-2 pr-4 text-alo-muted">{a.startedAt ? formatDateTime(a.startedAt) : "—"}</td>
                    <td className="py-2 pr-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-2 pr-4 font-semibold text-alo-blue">
                      {a.overallScore ?? "—"}
                      {a.bandEstimate && <span className="ml-1 text-xs text-alo-faint">({a.bandEstimate})</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-8 text-center">
        <Link
          href="/mock-tests"
          className="inline-block rounded-lg bg-alo-orange px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Start new mock test
        </Link>
      </div>
    </PortalShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    SUBMITTED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    EXPIRED: "bg-red-50 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? map.NOT_STARTED}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
