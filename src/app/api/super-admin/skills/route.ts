/**
 * GET /api/super-admin/skills — the skill registry.
 *
 * Returns every skill the AI workforce may carry, derived from the
 * employee skill vocabulary. Accepts an optional `?category=` filter.
 *
 * Protected: SUPER_ADMIN only.
 */

import { requireRole } from "@/lib/auth";
import { ok, withErrorHandler } from "@/lib/responses";
import { SKILLS } from "@/lib/enterprise/registries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";

    const filtered = SKILLS.filter((s) => {
      if (category && s.category !== category) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    const categories = Array.from(new Set(SKILLS.map((s) => s.category))).sort();

    return ok(
      {
        total: filtered.length,
        categories,
        skills: filtered,
      },
      "Skill registry",
    );
  });
}
