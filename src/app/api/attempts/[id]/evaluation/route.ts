/**
 * GET /api/attempts/:id/evaluation — the platform's own evaluation of the
 * subjective sections of an attempt.
 *
 * Returns one document per assessed section (WRITING, SPEAKING). Each
 * document says which engine produced it: an external model, or the built-in
 * rule engine used as a fallback when no model was available.
 *
 * The evaluation is qualitative. It never contains a band, a grade or a
 * score, and the disclosure stored with it says so in the learner's own
 * response.
 *
 * Ownership is enforced: a learner can only read the evaluation of their own
 * attempt. An administrator can read any attempt.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

/** Roles that may read any attempt's evaluation, not only their own. */
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const { id } = await ctx.params;

    const attempt = await db.attempt.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        practiceSet: { select: { examType: { select: { code: true, name: true } } } },
      },
    });

    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id && !ADMIN_ROLES.has(user.role)) {
      return forbidden("You can only read the evaluation of your own attempt");
    }

    const rows = await db.attemptEvaluation.findMany({
      where: { attemptId: id },
      orderBy: { section: "asc" },
      select: {
        id: true,
        section: true,
        examTypeCode: true,
        taskType: true,
        providerUsed: true,
        fallbackUsed: true,
        payload: true,
        createdAt: true,
      },
    });

    const evaluations = rows.map((row) => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(row.payload);
      } catch {
        payload = null;
      }
      return {
        id: row.id,
        section: row.section,
        examTypeCode: row.examTypeCode,
        taskType: row.taskType,
        providerUsed: row.providerUsed,
        fallbackUsed: row.fallbackUsed,
        createdAt: row.createdAt,
        evaluation: payload,
      };
    });

    return ok(
      {
        attemptId: attempt.id,
        exam: attempt.practiceSet.examType,
        status: attempt.status,
        evaluations,
        disclosure:
          "Practice feedback from the platform's own evaluation agent. It is not a band, a grade or a score, and it is not calibrated against human raters.",
      },
      "Evaluation loaded",
    );
  });
}
