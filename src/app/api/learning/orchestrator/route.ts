/**
 * /api/learning/orchestrator
 *
 * Exam orchestrator endpoints:
 *   GET  — returns the status report for all exam types
 *   POST — ensures daily question sets are generated
 */

import { ExamOrchestrator } from "@/lib/ai/learning/ExamOrchestrator";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    await requireAuth();
    const report = await ExamOrchestrator.getStatusReport();
    return ok(report, "Exam orchestrator status report");
  });
}

export async function POST() {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return badRequest("Only admins can trigger daily question generation");
    }
    const result = await ExamOrchestrator.ensureDailyQuestionSets();
    return ok(result, `Daily question sets: ${result.generated} generated, ${result.skipped} already exist`);
  });
}
