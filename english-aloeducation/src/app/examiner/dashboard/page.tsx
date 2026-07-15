import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, EXAMINER_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getExaminerData(userId: string) {
  const examiner = await prisma.examiner.findUnique({
    where: { userId },
    select: { id: true, examinerCode: true, specializations: true },
  });
  if (!examiner) return null;

  const [writingQueue, speakingQueue, myReviews] = await Promise.all([
    prisma.writingReview.findMany({
      where: { examinerId: examiner.id, status: { in: ["pending", "in_review"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.speakingReview.findMany({
      where: { examinerId: examiner.id, status: { in: ["pending", "in_review"] } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.writingReview.count({ where: { examinerId: examiner.id, status: "completed" } }),
  ]);

  return { examiner, writingQueue, speakingQueue, myReviews };
}

export default async function ExaminerDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const data = await getExaminerData(session.user.id);

  if (!data) {
    return (
      <PortalShell
        role="examiner"
        roleLabel="Examiner"
        navItems={EXAMINER_NAV}
        activePath="/examiner/dashboard"
        title="Examiner dashboard"
        userName={session.user.name}
      >
        <EmptyState message="Your examiner profile is being set up. Please contact an administrator." />
      </PortalShell>
    );
  }

  const { examiner, writingQueue, speakingQueue, myReviews } = data;

  return (
    <PortalShell
      role="examiner"
      roleLabel="Examiner"
      navItems={EXAMINER_NAV}
      activePath="/examiner/dashboard"
      title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Examiner"}`}
      subtitle={`Examiner code: ${examiner.examinerCode}${examiner.specializations ? ` · ${examiner.specializations}` : ""}`}
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Writing queue" value={writingQueue.length} accent="blue" />
        <StatTile label="Speaking queue" value={speakingQueue.length} accent="orange" />
        <StatTile label="Completed reviews" value={myReviews} accent="green" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Writing review queue" action={<Link href="/examiner/writing-review" className="text-sm text-alo-blue hover:underline">Open queue</Link>}>
          {writingQueue.length === 0 ? (
            <EmptyState message="No writing submissions awaiting review." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {writingQueue.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{w.wordCount} words</p>
                    <p className="text-xs text-alo-faint line-clamp-1">{w.answerText.slice(0, 100)}…</p>
                  </div>
                  <span className="text-xs text-alo-faint">{formatDateTime(w.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Speaking review queue" action={<Link href="/examiner/speaking-review" className="text-sm text-alo-blue hover:underline">Open queue</Link>}>
          {speakingQueue.length === 0 ? (
            <EmptyState message="No speaking submissions awaiting review." />
          ) : (
            <ul className="divide-y divide-alo-soft-blue">
              {speakingQueue.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-alo-navy">{Math.round(s.durationSec / 60)} min recording</p>
                    <p className="text-xs text-alo-faint font-mono">{s.audioPath}</p>
                  </div>
                  <span className="text-xs text-alo-faint">{formatDateTime(s.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PortalShell>
  );
}
