/**
 * GET /api/certificate/[id]
 *
 * Two modes:
 *   - default: returns the certificate metadata as JSON
 *   - ?format=pdf: streams the certificate PDF as the response body
 *
 * The metadata endpoint is public-but-scoped: the certificate id (cuid) is
 * unguessable, and the public certificate number is what is printed on the
 * PDF and what appears in the verification URL. The PDF stream is public so
 * the student can open it from the email link without signing in.
 *
 * The [id] segment may be either the internal cuid OR the public certificate
 * number (ALO-CERT-YYYY-NNNNNN). Both resolve here so the same URL works for
 * the API and for the public /certificate/[id] page.
 */

import { NextResponse } from "next/server";
import { ok, notFound, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import {
  findCertificateById,
  findCertificateByNumber,
  streamCertificatePdf,
} from "@/lib/certificate/CertificateGenerator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const { id } = await ctx.params;
    if (!id) return badRequest("Missing certificate id");

    const url = new URL(req.url);
    const format = url.searchParams.get("format");

    // Try cuid first, then the public certificate number.
    const cert = (await findCertificateById(id)) ?? (await findCertificateByNumber(id));
    if (!cert) return notFound("Certificate not found");

    if (format === "pdf") {
      const streamed = await streamCertificatePdf({
        filePath: cert.filePath,
        certificateNumber: cert.certificateNumber,
      });
      if (!streamed) return notFound("Certificate PDF is not available");
      const headers = new Headers({
        "Content-Type": "application/pdf",
        "Content-Length": String(streamed.size),
        "Content-Disposition": `inline; filename="${streamed.fileName}"`,
        "Cache-Control": "private, max-age=300",
      });
      // Stream the file through a ReadableStream so the whole buffer never
      // sits in memory.
      const body = new ReadableStream({
        start(controller) {
          streamed.stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
          streamed.stream.on("end", () => controller.close());
          streamed.stream.on("error", (err) => controller.error(err));
        },
      });
      return new NextResponse(body, { status: 200, headers });
    }

    return ok(
      {
        certificate: {
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          studentName: cert.studentName,
          examTypeCode: cert.examTypeCode,
          examTypeName: cert.examTypeName,
          overallScore: cert.overallScore,
          listeningScore: cert.listeningScore,
          readingScore: cert.readingScore,
          writingScore: cert.writingScore,
          speakingScore: cert.speakingScore,
          interestedInCounseling: cert.interestedInCounseling,
          interestedLeadId: cert.interestedLeadId,
          interestedAt: cert.interestedAt,
          emailedAt: cert.emailedAt,
          issuedAt: cert.issuedAt,
          verificationUrl: cert.verificationUrl,
          downloadUrl: `/api/certificate/${cert.id}?format=pdf`,
          publicUrl: `/certificate/${cert.certificateNumber}`,
        },
      },
      "Certificate retrieved"
    );
  });
}
