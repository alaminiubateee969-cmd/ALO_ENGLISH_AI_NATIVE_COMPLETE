/**
 * POST /api/certificate/generate — Issue a certificate for a submitted attempt.
 *
 * Auth: requires a signed-in user. The attempt must belong to the caller and
 * must already be SUBMITTED or SCORED — this route never grades an attempt, it
 * only formalises the result into a verifiable certificate.
 *
 * Body: { attemptId: string }
 *
 * The route is idempotent: calling it twice for the same attempt returns the
 * same certificate row without allocating a second number.
 *
 * Side effects:
 *   - PDF generated and persisted on disk under <dataRoot>/storage/certificates/
 *   - Certificate row created in the database
 *   - Email queued in the file outbox (and the certificate.emailedAt stamped)
 *   - Audit log entry written
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { issueCertificateForAttempt, resolveStoragePath } from "@/lib/certificate/CertificateGenerator";
import { queueEmail, buildCertificateEmail } from "@/lib/email/EmailService";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  attemptId: z.string().cuid(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    }

    const { attemptId } = parsed.data;

    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true, status: true, user: { select: { id: true, email: true, name: true } } },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only generate a certificate for your own attempt");
    if (attempt.status !== "SUBMITTED" && attempt.status !== "SCORED") {
      return conflict("You can only generate a certificate after submitting the attempt");
    }

    const issued = await issueCertificateForAttempt(attemptId);

    // Queue the certificate email.
    const email = buildCertificateEmail({
      studentName: issued.studentName,
      studentEmail: issued.studentEmail,
      examTypeName: issued.examTypeName,
      certificateNumber: issued.certificateNumber,
      verificationUrl: issued.verificationUrl,
      overallScore: issued.overallScore,
    });
    if (issued.filePath) {
      email.attachmentPath = resolveStoragePath(issued.filePath);
      email.attachmentName = `${issued.certificateNumber}.pdf`;
    }
    email.certificateId = issued.id;

    const queued = await queueEmail(email);

    const ip = getClientIp(req);
    await audit("DOCUMENTS_CREATE", {
      userId: user.id,
      resource: "certificate:" + issued.id,
      ipAddress: ip,
      metadata: {
        attemptId,
        certificateNumber: issued.certificateNumber,
        examTypeCode: issued.examTypeCode,
        overall: issued.overallScore,
        emailQueued: queued.ok,
        emailError: queued.error ?? null,
      },
    });

    return ok(
      {
        certificate: {
          id: issued.id,
          certificateNumber: issued.certificateNumber,
          examTypeName: issued.examTypeName,
          examTypeCode: issued.examTypeCode,
          overallScore: issued.overallScore,
          listeningScore: issued.listeningScore,
          readingScore: issued.readingScore,
          writingScore: issued.writingScore,
          speakingScore: issued.speakingScore,
          issuedAt: issued.issuedAt,
          verificationUrl: issued.verificationUrl,
          downloadUrl: `/api/certificate/${issued.id}?format=pdf`,
          publicUrl: `/certificate/${issued.certificateNumber}`,
        },
        email: {
          queued: queued.ok,
          recipient: issued.studentEmail,
          error: queued.error ?? null,
        },
      },
      "Certificate generated"
    );
  });
}
