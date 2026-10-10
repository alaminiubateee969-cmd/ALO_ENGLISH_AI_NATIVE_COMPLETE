/**
 * GET /api/practice-sets — List active practice sets for active exam types.
 * Only sets with question rows are exposed here; attempt creation performs the
 * stricter gradeability and capacity checks before reserving quota.
 */

import { db } from "@/lib/db";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const examTypeId = new URL(req.url).searchParams.get("examTypeId");
    const sets = await db.practiceSet.findMany({
      where: {
        isActive: true,
        examType: { isActive: true },
        questions: { some: {} },
        ...(examTypeId ? { examTypeId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        examType: { select: { code: true, name: true } },
        _count: { select: { questions: true } },
      },
    });

    return ok(
      {
        practiceSets: sets.map((set) => ({
          id: set.id,
          title: set.title,
          description: set.description,
          durationMin: set.durationMin,
          questionCount: set._count.questions,
          examType: set.examType,
        })),
      },
      "Active practice sets retrieved",
    );
  });
}
