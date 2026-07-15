import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { Card, EmptyState, PortalShell, StatTile, EXAMINER_NAV } from "@/components/portal/PortalShell";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSpeakingReviews(examinerId: string) {
  return prisma.speakingReview.findMany({
    where: { examinerId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      question: { select: { prompt: true } },
    },
  });
}

export default async function ExaminerSpeakingReviewPage() {
  const session = await getServerSession();
  if (!session?.user) return null;

  const examiner = await prisma.examiner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const reviews = examiner ? await getSpeakingReviews(examiner.id) : [];
  const pending = reviews.filter((r) => r.status === "pending").length;
  const completed = reviews.filter((r) => r.status === "completed").length;

  return (
    <PortalShell
      role="examiner"
      roleLabel="Examiner"
      navItems={EXAMINER_NAV}
      activePath="/examiner/speaking-review"
      title="Speaking review queue"
      subtitle="Evaluate recorded speaking submissions"
      userName={session.user.name}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total assigned" value={reviews.length} accent="blue" />
        <StatTile label="Pending" value={pending} accent="orange" />
        <StatTile label="Completed" value={completed} accent="green" />
      </div>

      <Card title="Speaking submissions" className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState message="No speaking submissions assigned to you yet." />
        ) : (
          <ul className="divide-y divide-alo-soft-blue">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        r.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "in_review"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                      }`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-alo-faint">{Math.round(r.durationSec / 60)}m {r.durationSec % 60}s</span>
                      <span className="text-xs text-alo-faint">{formatDateTime(r.createdAt)}</span>
                    </div>
                    {r.question && (
                      <p className="mt-1 text-xs text-alo-muted line-clamp-1">{r.question.prompt}</p>
                    )}
                    <audio controls preload="none" className="mt-2 h-8 w-full max-w-md">
                      <source src={r.audioPath} />
                    </audio>
                    {r.fluencyScore !== null && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-alo-faint">
                        <span>Fluency: {r.fluencyScore}</span>
                        <span>Pronunciation: {r.pronunciationScore}</span>
                        <span>Grammar: {r.grammarScore}</span>
                        <span>Lexical: {r.lexicalScore}</span>
                      </div>
                    )}
                  </div>
                  <button className="ml-4 shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700">
                    {r.status === "completed" ? "View" : "Review"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PortalShell>
  );
}
