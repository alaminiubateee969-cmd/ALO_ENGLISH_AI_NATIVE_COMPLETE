/**
 * GET /api/exam/analytics — Exam analytics for admin.
 */

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN" as any, "SUPER_ADMIN" as any);

    const examTypes = await db.examType.findMany({
      where: { isActive: true },
      include: { practiceSets: { where: { isActive: true } } },
    });

    const analytics: Array<{
      examType: { id: string; code: string; name: string };
      practiceSetCount: number;
      questionCount: number;
      attemptCount: number;
      completedCount: number;
      completionRate: number;
      averageScore: number;
      bestScore: number;
    }> = [];

    for (const et of examTypes) {
      const practiceSetIds = et.practiceSets.map((ps) => ps.id);
      const questionCount = await db.question.count({
        where: { practiceSetId: { in: practiceSetIds } },
      });
      const attemptCount = practiceSetIds.length > 0
        ? await db.attempt.count({ where: { practiceSetId: { in: practiceSetIds } } })
        : 0;
      const completed = practiceSetIds.length > 0
        ? await db.score.findMany({ where: { attempt: { practiceSetId: { in: practiceSetIds } } } })
        : [];
      const avgScore = completed.length > 0
        ? completed.reduce((sum, s) => sum + s.overall, 0) / completed.length
        : 0;
      const bestScore = completed.length > 0
        ? Math.max(...completed.map((s) => s.overall))
        : 0;

      analytics.push({
        examType: { id: et.id, code: et.code, name: et.name },
        practiceSetCount: et.practiceSets.length,
        questionCount,
        attemptCount,
        completedCount: completed.length,
        completionRate: attemptCount > 0 ? Math.round((completed.length / attemptCount) * 100) : 0,
        averageScore: Math.round(avgScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
      });
    }

    return ok({ analytics }, "Exam analytics retrieved");
  });
}
