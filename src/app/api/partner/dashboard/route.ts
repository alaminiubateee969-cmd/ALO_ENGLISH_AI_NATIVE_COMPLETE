/**
 * GET /api/partner/dashboard — partner-owned referral and commission totals.
 * Responses intentionally omit referred students' names, email addresses,
 * phone numbers, notes and application/document details.
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
      select: { id: true, referralCode: true, status: true },
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
        select: { id: true, referralCode: true, status: true },
      });
      if (!partner) return notFound("Partner profile not found");
    }

    const [referralCount, convertedCount, recentReferrals, pending, paid] = await Promise.all([
      db.lead.count({ where: { partnerId: partner.id } }),
      db.lead.count({ where: { partnerId: partner.id, status: "CONVERTED" } }),
      db.lead.findMany({
        where: { partnerId: partner.id },
        select: {
          id: true,
          status: true,
          country: true,
          courseInterest: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.commission.aggregate({
        where: { partnerId: partner.id, status: "PENDING" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.commission.aggregate({
        where: { partnerId: partner.id, status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return ok(
      {
        referralCode: partner.referralCode,
        referrals: { total: referralCount, converted: convertedCount, recent: recentReferrals },
        commissions: {
          pendingCount: pending._count._all,
          pendingAmount: pending._sum.amount ?? 0,
          paidCount: paid._count._all,
          paidAmount: paid._sum.amount ?? 0,
        },
      },
      "Partner dashboard retrieved",
    );
  });
}
