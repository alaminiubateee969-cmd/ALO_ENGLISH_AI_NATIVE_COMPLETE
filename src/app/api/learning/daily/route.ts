/**
 * /api/learning/daily
 *
 * Run the daily learning loop.
 * Can be triggered by cron or manually.
 *
 * POST — runs the loop and returns results.
 */

import { DailyLearningLoop } from "@/lib/ai/learning/DailyLearningLoop";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    // Only admins/super-admins can trigger the learning loop
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return badRequest("Only admins can trigger the daily learning loop");
    }

    const body = await req.json().catch(() => ({}));
    const schema = z.object({
      daysBack: z.number().min(1).max(90).optional().default(1),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const result = await DailyLearningLoop.run(parsed.data.daysBack);
    return ok(result, `Daily learning complete: ${result.examsAnalyzed} exams analyzed, ${result.insightsGenerated} insights generated`);
  });
}

// GET — returns the latest learning results (read-only)
export async function GET() {
  return withErrorHandler(async () => {
    await requireAuth();
    const { db } = await import("@/lib/db");
    // Return recent learnings
    const recentLearnings = await db.agentLearning.findMany({
      take: 20,
      orderBy: { learnDate: "desc" },
    });
    return ok({ recentLearnings }, "Recent learnings retrieved");
  });
}
