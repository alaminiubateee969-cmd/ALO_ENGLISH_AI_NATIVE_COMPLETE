/**
 * GET /api/partner/profile — safe partner profile fields for the partner portal.
 * A referral code is a public attribution handle, not an auth secret.
 */

import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { forbidden, notFound, ok, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("PARTNER");
    let partner = await db.partner.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        organizationName: true,
        contactName: true,
        status: true,
        referralCode: true,
      },
    });

    if (!partner) return notFound("Partner profile not found");
    if (partner.status !== "ACTIVE") return forbidden("This partner profile is not active.");

    if (!partner.referralCode) {
      const referralCode = `ALO-${randomBytes(5).toString("hex").toUpperCase()}`;
      const generated = await db.partner.updateMany({
        where: { id: partner.id, referralCode: null },
        data: { referralCode },
      });
      if (generated.count > 0) {
        await audit("PARTNERS_UPDATE", {
          userId: user.id,
          resource: `partners:${partner.id}`,
          metadata: { operation: "referral-code-generated" },
        });
      }
      partner = await db.partner.findUnique({
        where: { id: partner.id },
        select: {
          id: true,
          organizationName: true,
          contactName: true,
          status: true,
          referralCode: true,
        },
      });
      if (!partner) return notFound("Partner profile not found");
    }

    return ok({ partner }, "Partner profile retrieved");
  });
}
