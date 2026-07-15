import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

/**
 * GET /api/audit-logs
 * Admin-only paginated listing of audit log entries.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const actorId = searchParams.get("actorId");
  const action = searchParams.get("action");

  const where = {
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
  };

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ data: logs, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/audit-logs] failed:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
