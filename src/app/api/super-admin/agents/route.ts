/**
 * GET /api/super-admin/agents — the AI workforce registry, with filters.
 *
 * Returns every AI employee across the 100 departments, flattened. Accepts
 * optional `?department=`, `?role=`, `?provider=` and `?q=` filters.
 *
 * Protected: SUPER_ADMIN only.
 */

import { requireRole } from "@/lib/auth";
import { ok, withErrorHandler } from "@/lib/responses";
import { employeeSummaries } from "@/lib/enterprise/registries";
import type { EmployeeRole } from "@/lib/enterprise/seed-departments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES: ReadonlySet<string> = new Set<EmployeeRole>([
  "Manager",
  "Lead",
  "Specialist",
  "Coordinator",
  "Analyst",
  "Architect",
  "Auditor",
  "Engineer",
  "Scientist",
  "Officer",
]);

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const department = url.searchParams.get("department");
    const role = url.searchParams.get("role") ?? undefined;
    const provider = url.searchParams.get("provider");
    const q = url.searchParams.get("q")?.toLowerCase().trim() ?? "";
    const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 200;

    if (role && !VALID_ROLES.has(role)) {
      return ok(
        { total: 0, agents: [], error: `invalid role: ${role}` },
        "Invalid role filter",
      );
    }

    const all = employeeSummaries();
    const filtered = all
      .filter((e) => {
        if (department && e.department !== department) return false;
        if (role && e.role !== role) return false;
        if (provider && e.preferredProvider !== provider) return false;
        if (q) {
          const haystack = `${e.code} ${e.name} ${e.departmentName} ${e.skills.join(" ")}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .slice(0, limit);

    return ok(
      {
        total: filtered.length,
        workforceTotal: all.length,
        roles: [...VALID_ROLES],
        providers: Array.from(new Set(all.map((e) => e.preferredProvider))).sort(),
        agents: filtered,
      },
      "AI workforce registry",
    );
  });
}
