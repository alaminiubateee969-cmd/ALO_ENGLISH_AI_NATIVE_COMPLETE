/**
 * GET /api/exam/analytics — Admin-only content counts and objective-indicator analytics.
 *
 * Only score rows written by the current deterministic objective scorer are
 * included. Historical subjective or unvalidated score rows are excluded.
 */

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const examTypes = await db.examType.findMany({
      where: { isActive: true },
      include: { practiceSets: { where: { isActive: true } } },
    });

    const analytics: Array<{
      examType: { id: string; code: string; name: string };
      practiceSetCount: number;
      questionCount: number;
      attemptCount: number;
      submittedCount: number;
      completionRate: number;
      objectiveIndicatorCount: number;
      averageObjectiveIndicator: number | null;
      bestObjectiveIndicator: number | null;
      scoreDisclosure: string;
    }> = [];
    for (const examType of examTypes) {
      const practiceSetIds = examType.practiceSets.map((set) => set.id);
      const [questionCount, attemptCount, submittedCount, indicators] = await Promise.all([
        practiceSetIds.length > 0
          ? db.question.count({ where: { practiceSetId: { in: practiceSetIds } } })
          : Promise.resolve(0),
        practiceSetIds.length > 0
          ? db.attempt.count({ where: { practiceSetId: { in: practiceSetIds } } })
          : Promise.resolve(0),
        practiceSetIds.length > 0
          ? db.attempt.count({
              where: {
                practiceSetId: { in: practiceSetIds },
                status: { in: ["SUBMITTED", "SCORED"] },
              },
            })
          : Promise.resolve(0),
        practiceSetIds.length > 0
          ? db.score.findMany({
              where: {
                providerUsed: "deterministic_objective",
                attempt: { practiceSetId: { in: practiceSetIds } },
              },
              select: { overall: true },
            })
          : Promise.resolve([]),
      ]);

      const averageObjectiveIndicator = indicators.length > 0
        ? Math.round((indicators.reduce((sum, score) => sum + score.overall, 0) / indicators.length) * 10) / 10
        : null;
      const bestObjectiveIndicator = indicators.length > 0
        ? Math.round(Math.max(...indicators.map((score) => score.overall)) * 10) / 10
        : null;

      analytics.push({
        examType: { id: examType.id, code: examType.code, name: examType.name },
        practiceSetCount: examType.practiceSets.length,
        questionCount,
        attemptCount,
        submittedCount,
        completionRate: attemptCount > 0 ? Math.round((submittedCount / attemptCount) * 100) : 0,
        objectiveIndicatorCount: indicators.length,
        averageObjectiveIndicator,
        bestObjectiveIndicator,
        scoreDisclosure: "Generic answer-accuracy indicators only; not official or publisher-equivalent scores.",
      });
    }

    return ok({ analytics }, "Objective practice analytics retrieved");
  });
}
