/**
 * GET /api/super-admin/dcc — the Dynamic Capability Certification dashboard.
 *
 * Returns every department's DCC assessment: SOP coverage, knowledge
 * coverage, skill coverage, test pass rate, KPI achievement, security &
 * audit compliance, self-recovery success, human-escalation rate, and the
 * overall status (CERTIFIED / CONDITIONALLY_CERTIFIED / FAILED / EXPIRED /
 * UNDER_REVIEW).
 *
 * Accepts an optional `?status=` filter and an optional `?department=` for
 * a single department drilldown.
 *
 * Protected: SUPER_ADMIN only.
 */

import { requireRole } from "@/lib/auth";
import { ok, withErrorHandler } from "@/lib/responses";
import { DCC_ASSESSMENTS } from "@/lib/enterprise/registries";
import { DEPARTMENT_MAP } from "@/lib/enterprise/seed-departments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set([
  "CERTIFIED",
  "CONDITIONALLY_CERTIFIED",
  "FAILED",
  "EXPIRED",
  "UNDER_REVIEW",
]);

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const departmentId = url.searchParams.get("department");

    if (status && !VALID_STATUSES.has(status)) {
      return ok(
        { total: 0, assessments: [], error: `invalid status: ${status}` },
        "Invalid status filter",
      );
    }

    const rows = DCC_ASSESSMENTS.filter((a) => {
      if (status && a.status !== status) return false;
      if (departmentId && a.departmentId !== departmentId) return false;
      return true;
    }).map((a) => {
      const dept = DEPARTMENT_MAP[a.departmentId];
      return {
        ...a,
        departmentName: dept?.name ?? a.departmentId,
        category: dept?.category ?? "Unknown",
        mission: dept?.mission ?? "",
      };
    });

    const statusCounts = {
      CERTIFIED: DCC_ASSESSMENTS.filter((a) => a.status === "CERTIFIED").length,
      CONDITIONALLY_CERTIFIED: DCC_ASSESSMENTS.filter(
        (a) => a.status === "CONDITIONALLY_CERTIFIED",
      ).length,
      FAILED: DCC_ASSESSMENTS.filter((a) => a.status === "FAILED").length,
      EXPIRED: DCC_ASSESSMENTS.filter((a) => a.status === "EXPIRED").length,
      UNDER_REVIEW: DCC_ASSESSMENTS.filter((a) => a.status === "UNDER_REVIEW").length,
    };

    const averages = {
      sopCoverage: avg(DCC_ASSESSMENTS.map((a) => a.sopCoverage)),
      knowledgeCoverage: avg(DCC_ASSESSMENTS.map((a) => a.knowledgeCoverage)),
      skillCoverage: avg(DCC_ASSESSMENTS.map((a) => a.skillCoverage)),
      testPassRate: avg(DCC_ASSESSMENTS.map((a) => a.testPassRate)),
      kpiAchievement: avg(DCC_ASSESSMENTS.map((a) => a.kpiAchievement)),
      securityCompliance: avg(DCC_ASSESSMENTS.map((a) => a.securityCompliance)),
      auditCompliance: avg(DCC_ASSESSMENTS.map((a) => a.auditCompliance)),
      selfRecoverySuccess: avg(DCC_ASSESSMENTS.map((a) => a.selfRecoverySuccess)),
      humanEscalationRate: avg(DCC_ASSESSMENTS.map((a) => a.humanEscalationRate)),
    };

    return ok(
      {
        total: rows.length,
        statusCounts,
        averages,
        statuses: [...VALID_STATUSES],
        assessments: rows,
      },
      "DCC assessments",
    );
  });
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}
