/**
 * PUT /api/crm/partners/:id/user — Link or unlink an active PARTNER account.
 * Auth: requires ADMIN role. A partner user can be linked to only one profile.
 */

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit, getClientIp } from "@/lib/audit";
import { badRequest, conflict, notFound, ok, withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ userId: z.string().cuid().nullable() });

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext): Promise<Response> {
  return withErrorHandler(async () => {
    const actor = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");

    const partner = await db.partner.findUnique({ where: { id }, select: { id: true } });
    if (!partner) return notFound("Partner not found");

    const userId = parsed.data.userId;
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } });
      if (!user) return notFound("User not found");
      if (user.role !== "PARTNER" || user.status !== "ACTIVE") {
        return badRequest("Only active user accounts with the PARTNER role can be linked.");
      }

      const existingLink = await db.partner.findUnique({ where: { userId }, select: { id: true } });
      if (existingLink && existingLink.id !== id) {
        return conflict("This partner account is already linked to another profile.");
      }
    }

    const updated = await db.partner.update({
      where: { id },
      data: { userId },
      select: { id: true, userId: true, organizationName: true, contactName: true, status: true, referralCode: true },
    });

    await audit("PARTNERS_UPDATE", {
      userId: actor.id,
      resource: `partners:${id}`,
      ipAddress: getClientIp(request),
      metadata: { operation: "partner-user-link", linkedUserId: userId },
    });

    return ok({ partner: updated }, userId ? "Partner account linked" : "Partner account unlinked");
  });
}
