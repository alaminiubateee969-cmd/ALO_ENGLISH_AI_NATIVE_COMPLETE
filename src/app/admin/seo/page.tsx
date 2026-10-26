"use client";

/**
 * /admin/seo — the state of the public pages' metadata, and the phrase gaps.
 *
 * WHAT THIS SCREEN IS
 * ───────────────────
 * It audits this repository rather than reporting on the internet. Every figure
 * comes from the page metadata that is actually served, compared against the
 * sitemap that is actually submitted, so a finding here is always actionable:
 * which page has no description, which two pages share one, which phrase two
 * pages are competing for, and which page the sitemap submits without a
 * description existing for it.
 *
 * WHAT IT DELIBERATELY IS NOT
 * ───────────────────────────
 * No rankings, no traffic estimates, no keyword difficulty. Those need a data
 * provider and would be guesses dressed as measurements. The keyword section
 * below compares the business's phrases against the pages that exist — a gap
 * list to write for, not a position to chase.
 */

import { useEffect, useState } from "react";
import { DashboardShell, DashboardTable, DashboardCard } from "@/components/site/dashboard-shell";
import { RefreshCw, AlertTriangle, ShieldCheck, Search } from "lucide-react";

type Finding = { code: string; path: string; severity: "ERROR" | "WARNING" | "INFO"; message: string; fix: string };
type PageRow = { path: string; title: string; titleLength: number; descriptionLength: number; primaryKeyword: string; findings: number };
type KeywordRow = { keyword: string; mentionedBy: string[]; ownedBy: string[]; gap: "COVERED" | "NO_OWNER" | "NO_MENTION"; note: string };

type SeoAudit = {
  counts: { pages: number; errors: number; warnings: number; infos: number };
  findings: Finding[];
  pages: PageRow[];
  clean: string[];
  keywords: KeywordRow[];
  methodology: string;
};

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "SEO audit", href: "/admin/seo" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Review queue", href: "/employee/review-queue" },
  { label: "Consent register", href: "/employee/consent" },
  { label: "Logout", href: "/login" },
];

const SEVERITY_STYLE: Record<Finding["severity"], string> = {
  ERROR: "bg-red-50 text-red-700 border-red-200",
  WARNING: "bg-amber-50 text-amber-800 border-amber-200",
  INFO: "bg-slate-50 text-slate-600 border-slate-200",
};

const GAP_STYLE: Record<KeywordRow["gap"], string> = {
  COVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO_OWNER: "bg-amber-50 text-amber-800 border-amber-200",
  NO_MENTION: "bg-red-50 text-red-700 border-red-200",
};

function SeoAuditScreen() {
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  // The fetch is a promise chain rather than an awaited call in the effect body,
  // for the same reason `useApi` in dashboard-shell is: setting state
  // synchronously inside an effect triggers a second render pass before the
  // request has even started. `attempt` is what the refresh button increments.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/seo/audit", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload.success) {
          setError(payload.message || "The audit could not run.");
          setAudit(null);
          return;
        }
        setError("");
        setAudit(payload.data);
      })
      .catch((caught: Error) => {
        if (!cancelled) setError(caught.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">SEO audit</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {audit?.methodology ??
              "Checks the metadata this site actually serves against the sitemap it actually submits."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Re-run audit
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" /> {error}
        </div>
      )}

      {audit && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="Pages audited" value={audit.counts.pages} desc="Indexable public routes" icon={Search} />
            <DashboardCard title="Errors" value={audit.counts.errors} desc="Fix before the next release" icon={AlertTriangle} />
            <DashboardCard title="Warnings" value={audit.counts.warnings} desc="Truncation and competition" icon={AlertTriangle} />
            <DashboardCard
              title="Clean pages"
              value={audit.clean.length}
              desc="Every check passed"
              icon={ShieldCheck}
            />
          </div>

          <section>
            <h3 className="mb-2 text-lg font-bold">Findings</h3>
            <p className="mb-3 text-sm text-slate-600">
              Errors first: a missing description or a duplicate title means a search engine invents or repeats one.
            </p>
            <DashboardTable
              headers={["Severity", "Page", "Problem", "Fix"]}
              rows={audit.findings.map((finding) => [
                <span key="s" className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[finding.severity]}`}>
                  {finding.severity}
                </span>,
                <code key="p" className="text-xs">{finding.path}</code>,
                finding.message,
                <span key="f" className="text-slate-500">{finding.fix}</span>,
              ])}
            />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-bold">Page by page</h3>
            <DashboardTable
              headers={["Page", "Title", "Title length", "Description length", "Primary phrase", "Findings"]}
              rows={audit.pages.map((page) => [
                <code key="p" className="text-xs">{page.path}</code>,
                page.title || <span className="text-red-700">missing</span>,
                page.titleLength,
                page.descriptionLength,
                page.primaryKeyword || <span className="text-red-700">none</span>,
                page.findings === 0 ? <span className="text-emerald-700">none</span> : page.findings,
              ])}
            />
          </section>

          <section>
            <h3 className="mb-2 text-lg font-bold">Phrase coverage</h3>
            <p className="mb-3 max-w-3xl text-sm text-slate-600">
              Business phrases against the pages that exist. A phrase with no page is a writing task, not a ranking
              target — and a phrase two pages fight over is a defect on both of them.
            </p>
            <DashboardTable
              headers={["Phrase", "Owned by", "Mentioned on", "Status"]}
              rows={audit.keywords.map((row) => [
                row.keyword,
                row.ownedBy.length > 0 ? row.ownedBy.join(", ") : <span className="text-slate-400">no owner</span>,
                row.mentionedBy.length > 0 ? row.mentionedBy.join(", ") : <span className="text-slate-400">nowhere</span>,
                <span key="g" className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${GAP_STYLE[row.gap]}`}>
                  {row.gap.replace("_", " ")}
                </span>,
              ])}
            />
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminSeoPage() {
  return (
    <DashboardShell title="SEO audit" nav={NAV} roles={["ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"]}>
      <SeoAuditScreen />
    </DashboardShell>
  );
}
