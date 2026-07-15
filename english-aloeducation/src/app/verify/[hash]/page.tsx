import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ hash: string }> };

async function fetchCertificate(hash: string) {
  return prisma.certificate.findUnique({
    where: { verificationHash: hash },
    select: {
      certificateCode: true,
      studentName: true,
      examName: true,
      overallScore: true,
      bandEstimate: true,
      cefrLevel: true,
      certificateType: true,
      status: true,
      issuedAt: true,
      result: {
        select: {
          resultCode: true,
          listeningScore: true,
          readingScore: true,
          writingScore: true,
          speakingScore: true,
          examType: { select: { name: true, code: true, scoreScale: true } },
        },
      },
    },
  });
}

export default async function VerifyCertificatePage({ params }: Params) {
  const { hash } = await params;
  const cert = await fetchCertificate(hash);
  if (!cert) notFound();

  const isRevoked = cert.status === "revoked";

  return (
    <main className="bg-alo-soft-gray min-h-screen">
      <section className="bg-alo-navy text-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-blue-200">Certificate verification</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            {isRevoked ? "Certificate revoked" : "Verified certificate"}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div
          className={`rounded-2xl border bg-white p-8 shadow-alo-lg ${
            isRevoked ? "border-red-300" : "border-green-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                isRevoked ? "bg-red-50" : "bg-green-50"
              }`}
            >
              {isRevoked ? "⚠️" : "✅"}
            </span>
            <div>
              <p className="text-sm text-alo-muted">Status</p>
              <p className={`font-semibold ${isRevoked ? "text-red-700" : "text-green-700"}`}>
                {isRevoked ? "This certificate has been revoked." : "Authentic & valid"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Field label="Recipient" value={cert.studentName} />
            <Field label="Exam" value={cert.examName} />
            <Field label="Overall score" value={cert.overallScore} />
            <Field label="Band estimate" value={cert.bandEstimate ?? "—"} />
            <Field label="CEFR level" value={cert.cefrLevel ?? "—"} />
            <Field label="Certificate type" value={cert.certificateType} />
            <Field label="Certificate code" value={cert.certificateCode} mono />
            <Field label="Issued on" value={formatDate(cert.issuedAt)} />
          </div>

          {!isRevoked && cert.result && (
            <div className="mt-8 rounded-xl bg-alo-soft-blue p-6">
              <h3 className="text-sm font-semibold text-alo-navy">Section breakdown</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <ScoreCell label="Listening" value={cert.result.listeningScore} />
                <ScoreCell label="Reading" value={cert.result.readingScore} />
                <ScoreCell label="Writing" value={cert.result.writingScore} />
                <ScoreCell label="Speaking" value={cert.result.speakingScore} />
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-alo-faint">
            This certificate was issued by ALO English Education. If you
            believe this verification is incorrect, please contact
            certificates@aloeducation.com.
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-alo-faint">{label}</p>
      <p className={`mt-1 font-semibold text-alo-navy ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <p className="text-xs text-alo-faint">{label}</p>
      <p className="mt-1 text-lg font-bold text-alo-blue">
        {value === null || value === undefined ? "—" : value}
      </p>
    </div>
  );
}
