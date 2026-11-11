/**
 * POST /api/certificate/[id]/express-interest
 *
 * Marks the certificate as `interestedInCounseling=true` and creates a CRM
 * lead automatically so a counselor can connect the student to the relevant
 * educational portal.
 *
 * Auth: requires a signed-in user. The certificate must belong to the caller.
 *
 * Body: optionally { note?: string, preferredDestination?: string }
 *
 * Idempotent: calling twice does not create a second lead. The certificate row
 * keeps the first lead's id.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { findCertificateById, findCertificateByNumber } from "@/lib/certificate/CertificateGenerator";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  note: z.string().max(1000).optional(),
  preferredDestination: z.string().max(100).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const { id } = await ctx.params;
    if (!id) return badRequest("Missing certificate id");

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    // Allow either cuid or public certificate number in the URL.
    const cert = (await findCertificateById(id)) ?? (await findCertificateByNumber(id));
    if (!cert) return notFound("Certificate not found");
    if (cert.userId !== user.id) {
      return forbidden("You can only express interest for your own certificate");
    }

    if (cert.interestedInCounseling) {
      return conflict("You have already expressed interest in counseling for this certificate");
    }

    // Build the lead note from the certificate context so a counselor opens it
    // and immediately sees what the student just did.
    const examLine = `${cert.examTypeName} (${cert.examTypeCode})`;
    const scoreLine =
      cert.overallScore === null || !Number.isFinite(cert.overallScore)
        ? "no numeric practice indicator"
        : `overall practice indicator ${(Math.round(cert.overallScore * 10) / 10).toFixed(1)}`;
    const destLine = parsed.data.preferredDestination
      ? `Preferred destination: ${parsed.data.preferredDestination}.`
      : "";
    const userNote = parsed.data.note ? `Student note: ${parsed.data.note}.` : "";
    const leadNotes =
      `Auto-created from certificate ${cert.certificateNumber}. ` +
      `Exam: ${examLine}. ${scoreLine}. ${destLine} ${userNote}`.trim();

    // Pull the student's name/email from the user record so the lead has real
    // contact info.
    const userRow = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, phone: true },
    });

    // Create the lead in the CRM. Source is "WEBSITE" because the interest was
    // expressed on the platform's certificate page.
    const lead = await db.lead.create({
      data: {
        name: userRow?.name || userRow?.email || "Student",
        email: userRow?.email ?? null,
        phone: userRow?.phone ?? null,
        source: "WEBSITE",
        status: "NEW",
        courseInterest: cert.examTypeName,
        englishStatus: scoreLine,
        notes: leadNotes,
      },
      select: { id: true, name: true, email: true, status: true },
    });

    // Stamp the certificate so the UI shows "request received" and a repeat
    // call is a no-op.
    const now = new Date();
    await db.certificate.update({
      where: { id: cert.id },
      data: {
        interestedInCounseling: true,
        interestedLeadId: lead.id,
        interestedAt: now,
      },
    });

    const ip = getClientIp(req);
    await audit("LEAD_CREATE", {
      userId: user.id,
      resource: "lead:" + lead.id,
      ipAddress: ip,
      metadata: {
        source: "CERTIFICATE_INTEREST",
        certificateId: cert.id,
        certificateNumber: cert.certificateNumber,
        examTypeCode: cert.examTypeCode,
        preferredDestination: parsed.data.preferredDestination ?? null,
      },
    });
    await audit("DOCUMENTS_UPDATE", {
      userId: user.id,
      resource: "certificate:" + cert.id,
      ipAddress: ip,
      metadata: {
        action: "express_interest",
        leadId: lead.id,
      },
    });

    return ok(
      {
        interested: true,
        lead: {
          id: lead.id,
          status: lead.status,
        },
        certificate: {
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          interestedInCounseling: true,
          interestedAt: now,
        },
        message:
          "Thanks for your interest. A counselor will reach out and connect you to the relevant educational portal.",
      },
      "Interest registered"
    );
  });
}
