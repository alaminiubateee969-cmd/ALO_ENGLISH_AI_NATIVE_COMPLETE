"use client";

/**
 * /certificate/[id]
 *
 * Public certificate view. Renders an HTML preview that mirrors the PDF
 * layout, with a Download PDF button and a "Talk to a counselor" CTA that
 * creates a CRM lead automatically (POST /api/certificate/[id]/express-interest).
 *
 * The page accepts either the internal cuid or the public certificate number
 * (ALO-CERT-YYYY-NNNNNN) in the [id] segment, so the same URL printed on the
 * PDF and sent in the email works for everyone.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

type CertificateData = {
  id: string;
  certificateNumber: string;
  studentName: string;
  examTypeCode: string;
  examTypeName: string;
  overallScore: number | null;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  interestedInCounseling: boolean;
  interestedLeadId: string | null;
  interestedAt: string | null;
  emailedAt: string | null;
  issuedAt: string;
  verificationUrl: string;
  downloadUrl: string;
  publicUrl: string;
};

type ApiResponse =
  | { success: true; status: number; message: string; data: { certificate: CertificateData } }
  | { success: false; status: number; message: string; error: string };

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expressing, setExpressing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/certificate/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const body: ApiResponse = await res.json();
        if (cancelled) return;
        if (!body.success) {
          setError(body.message || "Certificate not found");
          setCert(null);
        } else {
          setCert(body.data.certificate);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load certificate");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onExpressInterest = async () => {
    if (!cert) return;
    setExpressing(true);
    try {
      const res = await fetch(`/api/certificate/${cert.id}/express-interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        toast.error(body.message || "Could not register your interest");
        return;
      }
      toast.success(body.data?.message || "Interest registered");
      setCert((prev) =>
        prev
          ? {
              ...prev,
              interestedInCounseling: true,
              interestedLeadId: body.data?.lead?.id ?? prev.interestedLeadId,
              interestedAt: new Date().toISOString(),
            }
          : prev,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setExpressing(false);
    }
  };

  const issuedDate = useMemo(() => {
    if (!cert) return "";
    return new Date(cert.issuedAt).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [cert]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Toaster richColors position="top-center" />

      {/* Top bar */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#0B1F3A] flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-[#E8501A]" />
            </div>
            <div>
              <div className="text-base font-bold text-[#0B1F3A] leading-tight">ALO Education</div>
              <div className="text-[11px] text-slate-500 leading-tight">English Test Platform</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/" className="text-sm text-slate-600 hover:text-[#0B1F3A] hidden sm:inline">
              Back to platform
            </Link>
            {cert && (
              <a
                href={cert.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            Loading certificate…
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>Certificate not found</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-3">
                <Link href="/">
                  <Button variant="outline" size="sm">Return to platform</Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        ) : cert ? (
          <div className="space-y-6">
            {/* Certificate card — mirrors the PDF layout */}
            <Card className="relative overflow-hidden p-0 sm:p-0 border-[#0B1F3A]/20 shadow-lg">
              {/* Double border frame */}
              <div className="pointer-events-none absolute inset-3 border-2 border-[#0B1F3A] rounded-md" />
              <div className="pointer-events-none absolute inset-4 border border-[#E8501A] rounded-sm" />

              <div className="relative px-6 sm:px-12 py-10 sm:py-12 flex flex-col items-center text-center">
                {/* Brand */}
                <div className="flex flex-col items-center gap-1 mb-6">
                  <div className="h-12 w-12 rounded-full bg-[#0B1F3A] flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-[#E8501A]" />
                  </div>
                  <div className="text-xl font-bold tracking-wide text-[#0B1F3A]">ALO EDUCATION</div>
                  <div className="text-[10px] tracking-widest text-slate-500">
                    YOUR DREAM — OUR COMMITMENT
                  </div>
                </div>

                {/* Title */}
                <div className="text-[#E8501A] text-2xl sm:text-3xl font-bold tracking-wide">
                  Certificate of Completion
                </div>
                <div className="mt-2 h-[2px] w-32 bg-[#E8501A]" />

                {/* Recipient */}
                <div className="mt-6 text-sm text-slate-500">This certificate is proudly presented to</div>
                <div className="mt-2 text-3xl sm:text-4xl font-bold text-[#0B1F3A] break-words max-w-full">
                  {cert.studentName || "Student"}
                </div>

                <div className="mt-4 text-sm text-slate-500">for successfully completing the</div>
                <div className="mt-1 text-xl sm:text-2xl font-bold text-[#0057B8]">
                  {cert.examTypeName}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-slate-500">
                  practice assessment on the ALO Education English Test Platform.
                </div>

                {/* Score panel */}
                <ScorePanel cert={cert} />

                {/* Date / signature row */}
                <div className="mt-8 w-full max-w-md grid grid-cols-2 gap-6 text-left">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Date Issued</div>
                    <div className="mt-1 text-sm font-semibold text-[#0B1F3A]">{issuedDate}</div>
                    <div className="mt-2 h-px bg-slate-300" />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Authorised by</div>
                    <div className="mt-1 text-sm font-semibold text-[#0B1F3A]">ALO Education Faculty</div>
                    <div className="mt-2 h-px bg-slate-300" />
                  </div>
                </div>

                {/* Verification block */}
                <div className="mt-6 w-full max-w-md rounded-md border border-[#0057B8] bg-[#F1F5F9] px-4 py-3">
                  <div className="text-[11px] font-bold text-[#0B1F3A]">Certificate Number</div>
                  <div className="mt-1 font-mono text-base font-bold text-[#0057B8]">
                    {cert.certificateNumber}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 break-all">
                    Verify online: {cert.verificationUrl}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 text-[10px] leading-relaxed text-slate-400 max-w-md">
                  This certificate confirms participation in an original exam-aligned practice
                  assessment. Scores shown are practice indicators derived from objective answer
                  accuracy, not official exam scores or publisher-equivalent results. Writing and
                  speaking assessments are qualitative practice feedback and are not calibrated
                  against human raters.
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#0057B8]/10 flex items-center justify-center shrink-0">
                    <Download className="h-5 w-5 text-[#0057B8]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#0B1F3A]">Download or share</div>
                    <p className="mt-1 text-sm text-slate-600">
                      Save a PDF copy of your certificate or share the verification link with
                      an institution.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={cert.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          void navigator.clipboard?.writeText(cert.verificationUrl);
                          toast.success("Verification link copied");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Copy verification link
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#E8501A]/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-[#E8501A]" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#0B1F3A]">Talk to a counselor</div>
                    <p className="mt-1 text-sm text-slate-600">
                      Interested in your next step? We&apos;ll connect you with the right
                      educational portal.
                    </p>
                    {cert.interestedInCounseling ? (
                      <Alert className="mt-3 border-[#16A34A]/30 bg-[#16A34A]/5">
                        <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                        <AlertTitle className="text-[#16A34A]">Request received</AlertTitle>
                        <AlertDescription className="text-slate-600">
                          A counselor will reach out using the contact details on your account.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={expressing}
                          onClick={() => void onExpressInterest()}
                        >
                          {expressing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                          Express interest
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" /> {cert.examTypeCode}
              </Badge>
              {cert.emailedAt && (
                <Badge variant="outline" className="gap-1">
                  <Mail className="h-3 w-3" /> Emailed {new Date(cert.emailedAt).toLocaleDateString()}
                </Badge>
              )}
              <span className="ml-auto">
                Issued {new Date(cert.issuedAt).toLocaleString()}
              </span>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} ALO Education. Practice assessments only.</span>
          <Link href="/" className="hover:text-[#0B1F3A]">
            alo-education.example
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ScorePanel({ cert }: { cert: CertificateData }) {
  const fmt = (v: number | null) =>
    v === null || v === undefined || !Number.isFinite(v) ? "—" : (Math.round(v * 10) / 10).toFixed(1);
  const skills = [
    { label: "LISTENING", value: fmt(cert.listeningScore) },
    { label: "READING", value: fmt(cert.readingScore) },
    { label: "WRITING", value: fmt(cert.writingScore) },
    { label: "SPEAKING", value: fmt(cert.speakingScore) },
  ];
  return (
    <div className="mt-6 w-full max-w-md">
      <div className="flex gap-2 justify-center flex-wrap">
        <div className="rounded-md bg-[#0B1F3A] text-white px-3 py-2 min-w-[88px] flex flex-col items-center">
          <div className="text-[10px] tracking-wider opacity-80">OVERALL</div>
          <div className="text-2xl font-bold leading-tight">{fmt(cert.overallScore)}</div>
        </div>
        {skills.map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-[#0057B8] px-3 py-2 min-w-[80px] flex flex-col items-center"
          >
            <div className="text-[10px] tracking-wider text-slate-500">{s.label}</div>
            <div className="text-2xl font-bold text-[#0057B8] leading-tight">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
