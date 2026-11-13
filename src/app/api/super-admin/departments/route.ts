/**
 * GET /api/super-admin/departments — the 100-department registry with stats.
 *
 * Returns every department with its employee count, skill count, DCC status
 * and DCC score. Accepts an optional `?category=` filter.
 *
 * Protected: SUPER_ADMIN only.
 */

import { requireRole } from "@/lib/auth";
import { ok, withErrorHandler } from "@/lib/responses";
import { departmentSummaries } from "@/lib/enterprise/registries";
import { DEPARTMENTS } from "@/lib/enterprise/seed-departments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";

    const summaries = departmentSummaries().filter((d) => {
      if (category && d.category !== category) return false;
      if (q && !d.name.toLowerCase().includes(q) && !d.mission.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    const categories = Array.from(
      new Set(DEPARTMENTS.map((d) => d.category)),
    ).sort();

    return ok(
      {
        total: summaries.length,
        categories,
        departments: summaries,
      },
      "Department registry",
    );
  });
}
