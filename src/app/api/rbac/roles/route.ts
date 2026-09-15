/**
 * /api/rbac/roles
 *
 * List all roles (GET) — requires "roles.view" permission
 * Create a new role (POST) — requires "roles.manage" permission
 */

import { db } from "@/lib/db";
import { requireSession, requirePermission } from "@/lib/rbac";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "roles.view");

    const roles = await db.role.findMany({
      include: {
        _count: { select: { permissions: true, members: true } },
      },
      orderBy: { slug: "asc" },
    });

    return ok({ roles }, "Roles retrieved");
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "roles.manage");

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(50).regex(/^[A-Z_]+$/),
      description: z.string().max(500).optional(),
      teamId: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { name, slug, description, teamId } = parsed.data;

    const existing = await db.role.findUnique({ where: { slug } });
    if (existing) return badRequest("Role with this slug already exists");

    const role = await db.role.create({
      data: { name, slug, description, teamId: teamId || null },
    });

    const ip = getClientIp(req);
    await audit("ROLE_CREATED", {
      userId: user.id,
      resource: "role:" + role.id,
      ipAddress: ip,
      metadata: { slug, name },
    });

    return ok({ role }, "Role created");
  });
}
