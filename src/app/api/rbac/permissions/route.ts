/**
 * /api/rbac/permissions
 *
 * List all permissions (GET) — requires "roles.view" permission
 */

import { db } from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/rbac";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "roles.view");

    const permissions = await db.permission.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
      include: {
        _count: { select: { roles: true } },
      },
    });

    return ok({ permissions }, "Permissions retrieved");
  });
}
