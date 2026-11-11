/**
 * Admin-only read-only exam content inventory.
 *
 * POST is deliberately disabled: the previous endpoint created daily-set
 * records by reusing practice sets and marked them generated. It did not
 * generate or verify new content.
 */

import { ExamOrchestrator } from "@/lib/ai/learning/ExamOrchestrator";
import { requireRole } from "@/lib/auth";
import { ok, serviceUnavailable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const report = await ExamOrchestrator.getStatusReport();
    return ok(report, "Read-only exam content inventory");
  });
}

export async function POST(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const result = await ExamOrchestrator.ensureDailyQuestionSets();
    return serviceUnavailable(result.reason);
  });
}
