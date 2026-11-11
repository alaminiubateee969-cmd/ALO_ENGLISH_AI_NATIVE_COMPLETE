/**
 * GET /api/admin/seo/audit — the state of the public pages' metadata.
 *
 * Runs the pure audit (`src/lib/seo/audit.ts`) over the sitemap and the maintained
 * metadata table, and adds the business-phrase coverage. No external service and
 * no visitor data is involved: this is a check of this repository's own pages.
 *
 * Auth: ADMIN, SUPER_ADMIN or MARKETING_MANAGER — the roles that own public copy.
 */

import { requireRole } from '@/lib/auth';
import { ok, withErrorHandler } from '@/lib/responses';
import { INDEXABLE_PUBLIC_ROUTES } from '@/lib/public-routes';
import { auditSeo, describeSeoReport, keywordCoverage } from '@/lib/seo/audit';
import { BUSINESS_KEYWORDS, SEO_PAGE_METADATA, SITE_TITLE_SUFFIX } from '@/lib/seo/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN', 'SUPER_ADMIN', 'MARKETING_MANAGER');

    const report = auditSeo({
      sitemapPaths: INDEXABLE_PUBLIC_ROUTES.map((route) => route.path),
      pages: SEO_PAGE_METADATA,
      titleTemplateSuffixLength: SITE_TITLE_SUFFIX.length,
    });

    return ok({
      counts: report.counts,
      findings: report.findings,
      pages: report.pages,
      clean: report.clean,
      keywords: keywordCoverage(SEO_PAGE_METADATA, BUSINESS_KEYWORDS),
      summary: describeSeoReport(report),
      methodology:
        'The metadata this site actually serves, compared with the sitemap it actually submits. No rankings, traffic or keyword difficulty: those need a data provider, and a panel that showed estimates as if they were measurements would be worse than this one.',
      checkCommand: 'npx tsc --noEmit && bun test tests/seo-audit.test.ts',
    });
  });
}
