/**
 * GET /api/exam-types — List active exam types and their active practice-bank depth.
 *
 * Public endpoint. Counts include active practice sets only. `available` means
 * at least one active set currently contains questions; it is not a claim that
 * the bank is full-length, quality-reviewed, officially equivalent, or ready
 * for a high-stakes sitting.
 */

import { db } from "@/lib/db";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const examTypes = await db.examType.findMany({
      where: { isActive: true },
      orderBy: { category: "asc" },
      include: {
        practiceSets: {
          where: { isActive: true },
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
    });

    return ok(
      {
        examTypes: examTypes.map((examType) => {
          const questionCount = examType.practiceSets.reduce(
            (sum, set) => sum + set._count.questions,
            0,
          );
          return {
            id: examType.id,
            code: examType.code,
            name: examType.name,
            category: examType.category,
            practiceSetCount: examType.practiceSets.length,
            questionCount,
            available: questionCount > 0,
          };
        }),
      },
      "Active exam types retrieved",
    );
  });
}
