/**
 * GET /api/questions?practiceSetId=xxx — Fetch questions for a practice set.
 *
 * Returns questions grouped by section. Does NOT include correct answers
 * (security: students shouldn't see answers before submitting).
 */

import { db } from "@/lib/db";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    // Phase 1: Require auth — students must be logged in to fetch questions
    await requireAuth();

    const url = new URL(req.url);
    const practiceSetId = url.searchParams.get("practiceSetId");

    if (!practiceSetId) {
      return badRequest("practiceSetId is required");
    }

    const questions = await db.question.findMany({
      where: { practiceSetId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        section: true,
        type: true,
        prompt: true,
        passage: true,
        options: true,
        wordLimit: true,
        points: true,
        order: true,
        // NOTE: correctAnswer and correctIndex are NOT included (security)
      },
    });

    // Group by section
    const bySection = questions.reduce((acc, q) => {
      if (!acc[q.section]) acc[q.section] = [];
      acc[q.section].push(q);
      return acc;
    }, {} as Record<string, typeof questions>);

    return ok({ questions, bySection, total: questions.length }, "Questions retrieved");
  });
}
