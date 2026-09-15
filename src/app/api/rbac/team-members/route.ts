/**
 * /api/rbac/team-members
 *
 * List team members (GET) — requires "teams.view" permission
 * Add a member to a team (POST) — requires "teams.manage" permission
 */

import { db } from "@/lib/db";
import { requireSession, requirePermission, invalidatePermissionCache } from "@/lib/rbac";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "teams.view");

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    const where = teamId ? { teamId } : {};
    const members = await db.teamMember.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        team: { select: { id: true, name: true, slug: true } },
        role: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ members }, "Team members retrieved");
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "teams.manage");

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      teamId: z.string().cuid(),
      userId: z.string().cuid(),
      roleId: z.string().cuid(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { teamId, userId, roleId } = parsed.data;

    // Check for existing membership
    const existing = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existing) {
      // Update role instead of creating new
      const updated = await db.teamMember.update({
        where: { id: existing.id },
        data: { roleId },
      });
      invalidatePermissionCache(userId);
      return ok({ member: updated }, "Team member role updated");
    }

    const member = await db.teamMember.create({
      data: { teamId, userId, roleId },
    });

    invalidatePermissionCache(userId);

    const ip = getClientIp(req);
    await audit("TEAM_MEMBER_ADDED", {
      userId: user.id,
      resource: `team:${teamId}:user:${userId}`,
      ipAddress: ip,
      metadata: { roleId, memberUserId: userId },
    });

    return ok({ member }, "Team member added");
  });
}

export async function DELETE(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireSession();
    await requirePermission(user, "teams.manage");

    const url = new URL(req.url);
    const memberId = url.searchParams.get("memberId");
    if (!memberId) return badRequest("memberId is required");

    const member = await db.teamMember.delete({ where: { id: memberId } });
    invalidatePermissionCache(member.userId);

    const ip = getClientIp(req);
    await audit("TEAM_MEMBER_REMOVED", {
      userId: user.id,
      resource: `team:${member.teamId}:user:${member.userId}`,
      ipAddress: ip,
      metadata: { memberUserId: member.userId },
    });

    return ok({ deleted: true }, "Team member removed");
  });
}
