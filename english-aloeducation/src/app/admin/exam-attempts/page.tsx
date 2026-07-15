import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, ADMIN_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAttempts() {
  const [attempts, statusAgg] = await Promise.all([
    prisma.examAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        examType: { select: { name: true, code: true } },
        student: { include: { user: { select: { name: true, email: true } } } },
      },
    }),
    prisma.examAttempt.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
  ]);
  return { attempts, statusAgg };
}

export default async function AdminExamAttemptsPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const { attempts, statusAgg } = await getAttempts();
  const inProgress = statusAgg.find((s) => s.status === "IN_PROGRESS")?._count.status ?? 0;
  const completed = statusAgg.find((s) => s.status === "COMPLETED")?._count.status ?? 0;
  const submitted = statusAgg.find((s) => s.status === "SUBMITTED")?._count.status ?? 0;

  return (
    <PortalShell
      role="admin"
      roleLabel="Admin"
      navItems={ADMIN_NAV}
      activePath="/admin/exam-attempts"
      title="Exam attempts"
      subtitle="Monitor all exam attempts across the platform"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Total attempts" value={attempts.length} accent="blue" />
        <StatTile label="In progress" value={inProgress} accent="orange" />
        <StatTile label="Submitted" value={submitted} accent="navy" />
        <StatTile label="Completed" value={completed} accent="green" />
      </div>

      <Card title="All attempts" className="mt-6">
        {attempts.length === 0 ? (
          <EmptyState message="No exam attempts recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-alo-soft-blue text-left text-xs uppercase text-alo-faint">
                  <th className="py-2 pr-4">Attempt code</th>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Exam</th>
                  <th className="py-2 pr-4">Mode</th>
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-alo-soft-blue">
                    <td className="py-2 pr-4 font-mono text-xs text-alo-navy">{a.attemptCode}</td>
                    <td className="py-2 pr-4">
                      <p className="font-medium text-alo-navy">{a.student.user.name}</p>
                      <p className="text-xs text-alo-faint">{a.student.user.email}</p>
                    </td>
                    <td className="py-2 pr-4">{a.examType.name}</td>
                    <td className="py-2 pr-4">{a.mode}</td>
                    <td className="py-2 pr-4 text-alo-muted">{a.startedAt ? formatDateTime(a.startedAt) : "—"}</td>
                    <td className="py-2 pr-4 text-alo-muted">{a.submittedAt ? formatDateTime(a.submittedAt) : "—"}</td>
                    <td className="py-2 pr-4 font-semibold text-alo-blue">{a.overallScore ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full bg-alo-soft-blue px-2.5 py-0.5 text-xs font-medium text-alo-blue">
                        {a.status.replace(/_/g, " ")}
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
