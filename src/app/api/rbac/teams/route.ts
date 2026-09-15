/**
 * /api/rbac/teams
 *
 * List all teams (GET) — requires "teams.view" permission
 * Create a new team (POST) — requires "teams.manage" permission
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
    await requirePermission(user, "teams.view");

    const teams = await db.team.findMany({
      include: {
        _count: { select: { members: true, roles: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok({ teams }, "Teams retrieved");
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "teams.manage");

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
      description: z.string().max(500).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { name, slug, description } = parsed.data;

    const existing = await db.team.findUnique({ where: { slug } });
    if (existing) return badRequest("Team with this slug already exists");

    const team = await db.team.create({
      data: { name, slug, description },
    });

    const ip = getClientIp(req);
    await audit("TEAM_CREATED", {
      userId: user.id,
      resource: "team:" + team.id,
      ipAddress: ip,
      metadata: { slug, name },
    });

    return ok({ team }, "Team created");
  });
}
