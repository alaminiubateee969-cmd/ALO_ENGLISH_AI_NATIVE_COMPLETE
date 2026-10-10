"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Link2, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AMBASSADOR_MARKETING_ASSETS,
  buildMarketingKitAsset,
  type MarketingAssetId,
} from "@/lib/marketing-kit";
import { buildReferralUrl } from "@/lib/referral-code";

type PartnerProfile = {
  id: string;
  organizationName: string;
  contactName: string;
  status: string;
  referralCode: string;
};

type ProfileResponse = {
  success: boolean;
  message?: string;
  data?: { partner?: PartnerProfile };
};

async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Copy is not available in this browser");
}

export function AmbassadorMarketingKit() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const response = await fetch("/api/partner/profile", { signal: controller.signal });
        const payload = (await response.json()) as ProfileResponse;
        if (!response.ok || !payload.success || !payload.data?.partner) {
          throw new Error(payload.message || "Could not load your partner profile.");
        }
        setOrigin(window.location.origin);
        setPartner(payload.data.partner);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load your partner profile.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProfile();
    return () => controller.abort();
  }, []);

  const referralUrl = useMemo(() => {
    if (!partner?.referralCode || !origin) return "";
    try {
      return buildReferralUrl(origin, partner.referralCode);
    } catch {
      return "";
    }
  }, [origin, partner]);

  async function handleCopyLink() {
    if (!referralUrl) return;
    try {
      await copyToClipboard(referralUrl);
      setCopied(true);
      setNotice("Referral link copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice("Could not copy automatically. Select the link and copy it manually.");
    }
  }

  function handleDownload(id: MarketingAssetId) {
    if (!partner?.referralCode) return;
    try {
      const file = buildMarketingKitAsset(id, window.location.origin, partner.referralCode);
      const blob = new Blob([file.content], { type: file.mimeType });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.filename;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setNotice(`${file.filename} downloaded.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Could not create that file.");
    }
  }

  return (
    <section aria-labelledby="marketing-kit-title" className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-alo-orange">Partner resources</p>
        <h2 id="marketing-kit-title" className="mt-2 text-2xl font-bold text-alo-navy sm:text-3xl">Your marketing kit</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-alo-muted">
          Ready-to-download, editable ALO English assets. Each item includes your referral code and a link that attributes new registrations to your partner account.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-alo-card bg-white text-sm text-alo-muted">
          <LoaderCircle className="h-5 w-5 animate-spin text-alo-blue" aria-hidden="true" />
          Loading your partner profile…
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">We could not load your partner code.</p>
          <p className="mt-1">{error}</p>
          <Link className="mt-3 inline-flex min-h-10 items-center font-semibold underline underline-offset-4" href="/login">Sign in with your partner account</Link>
        </div>
      ) : partner ? (
        <>
          <Card className="overflow-hidden border-alo-card shadow-none">
            <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-alo-navy">
                  <Link2 className="h-4 w-4 text-alo-blue" aria-hidden="true" />
                  Your tracked referral link
                </div>
                <p className="mt-1 text-xs text-alo-muted">Referral code: <span className="font-mono font-bold text-alo-navy">{partner.referralCode}</span></p>
                <Input
                  aria-label="Your tracked referral URL"
                  readOnly
                  value={referralUrl}
                  className="mt-3 h-11 border-slate-200 bg-slate-50 font-mono text-xs text-alo-navy"
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                <Button type="button" onClick={handleCopyLink} className="min-h-11 rounded-xl bg-alo-blue px-4 text-white hover:bg-[#004a9e]">
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button asChild variant="outline" className="min-h-11 rounded-xl border-slate-200 text-alo-navy">
                  <Link href={referralUrl} target="_blank" rel="noreferrer">
                    Preview sign-up <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {AMBASSADOR_MARKETING_ASSETS.map((asset) => (
              <Card key={asset.id} className="flex h-full flex-col border-slate-200 shadow-none transition-colors hover:border-alo-blue/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-alo-soft-blue text-alo-blue">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{asset.format}</span>
                  </div>
                  <CardTitle className="pt-2 text-base text-alo-navy">{asset.title}</CardTitle>
                  <CardDescription className="min-h-10 text-xs leading-5">{asset.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownload(asset.id)}
                    className="min-h-11 w-full rounded-xl border-alo-blue/30 text-alo-blue hover:bg-alo-soft-blue"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download {asset.format.split(" · ")[0]}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 rounded-2xl border border-alo-blue/20 bg-alo-soft-blue p-4 text-xs leading-5 text-alo-navy">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-alo-blue" aria-hidden="true" />
            <p>Share only approved, accurate information. ALO English practice scores are estimates, not official exam results. Do not promise admissions, visas, scholarships or guaranteed scores.</p>
          </div>
        </>
      ) : null}

      <p aria-live="polite" role="status" className="min-h-5 text-sm text-alo-muted">{notice}</p>
    </section>
  );
}
