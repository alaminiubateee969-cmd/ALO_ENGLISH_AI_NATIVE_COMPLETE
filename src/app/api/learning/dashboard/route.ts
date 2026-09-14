/**
 * /api/learning/dashboard
 *
 * Returns the learning dashboard data:
 *   - Total exams, students, avg score
 *   - Top weaknesses across all students
 *   - Recent agent learnings
 *   - Active specialist agents
 *   - Total agent evolutions
 */

import { PerformanceAnalytics } from "@/lib/ai/learning/PerformanceAnalytics";
import { requireAuth } from "@/lib/auth";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const dashboard = await PerformanceAnalytics.getDashboard();
    return ok(dashboard, "Learning dashboard data");
  });
}
