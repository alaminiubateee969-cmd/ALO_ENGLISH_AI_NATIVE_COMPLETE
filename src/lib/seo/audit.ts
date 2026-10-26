/**
 * src/lib/seo/audit.ts
 *
 * A pre-flight check for the public pages: is each one actually described to a
 * search engine, and is the description different from the others?
 *
 * WHY THIS IS A MODULE AND NOT A DASHBOARD OF NUMBERS
 * ──────────────────────────────────────────────────
 * Most "SEO panels" report keyword rankings, which this application cannot know
 * without an external service and a visitor identifier it deliberately does not
 * keep. What it *can* know, offline and exactly, is the state of its own
 * metadata: which indexable route has no description, which two routes describe
 * themselves with the same sentence, which title would be truncated by a search
 * result, and which routes duplicate each other's target phrase. Those are the
 * defects a human can fix today, in this repository, with no third-party data —
 * so those are what the audit reports.
 *
 * Everything is pure: the caller supplies the route list and the metadata map, so
 * the rules are testable without a network or a build.
 */

export type SeoPageInput = {
  path: string;
  /** Document title as rendered after the template. */
  title: string;
  description: string;
  /** The phrase the page is meant to be found for. */
  primaryKeyword: string;
  /** Secondary phrases the page mentions; reported for coverage, not ranked. */
  supportingKeywords?: readonly string[];
  /** Whether the page declares an OpenGraph block. */
  hasOpenGraph?: boolean;
};

export type SeoFindingCode =
  | 'TITLE_MISSING'
  | 'TITLE_TOO_LONG'
  | 'TITLE_TOO_SHORT'
  | 'TITLE_DUPLICATE'
  | 'DESCRIPTION_MISSING'
  | 'DESCRIPTION_TOO_LONG'
  | 'DESCRIPTION_TOO_SHORT'
  | 'DESCRIPTION_DUPLICATE'
  | 'KEYWORD_MISSING'
  | 'KEYWORD_NOT_IN_TITLE'
  | 'KEYWORD_NOT_IN_DESCRIPTION'
  | 'KEYWORD_CANNIBALISED'
  | 'OPENGRAPH_MISSING'
  | 'ROUTE_NOT_IN_SITEMAP'
  | 'SITEMAP_ROUTE_UNLISTED';

export type SeoFinding = {
  code: SeoFindingCode;
  path: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  fix: string;
};

export type SeoAuditInput = {
  /** Paths that are meant to be indexed (src/lib/public-routes.ts). */
  sitemapPaths: readonly string[];
  pages: readonly SeoPageInput[];
  /**
   * Characters the root layout's title template appends, e.g. " — ALO Education".
   *
   * Without this the audit would judge the string a page declares, which is not
   * what a search result shows: "Cookie Policy" renders as "Cookie Policy — ALO
   * Education". Counting the suffix is the difference between reporting a stub
   * title and reporting the truth.
   */
  titleTemplateSuffixLength?: number;
};

export type SeoAuditReport = {
  findings: SeoFinding[];
  counts: { pages: number; errors: number; warnings: number; infos: number };
  /** One row per page, so a screen can show the whole picture, not just defects. */
  pages: Array<{
    path: string;
    title: string;
    titleLength: number;
    descriptionLength: number;
    primaryKeyword: string;
    findings: number;
  }>;
  /** Pages that pass every check. */
  clean: string[];
};

/** Title length beyond which search results truncate. Not a ranking rule. */
export const TITLE_MAX = 60;
/** Below this, a title reads as a stub. */
export const TITLE_MIN = 15;
/** Description length beyond which search results truncate. */
export const DESCRIPTION_MAX = 160;
export const DESCRIPTION_MIN = 50;

function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function auditSeo(input: SeoAuditInput): SeoAuditReport {
  const findings: SeoFinding[] = [];
  const sitemap = new Set(input.sitemapPaths);
  const listed = new Set(input.pages.map((page) => page.path));

  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const keywordOwners = new Map<string, string[]>();

  for (const page of input.pages) {
    const title = page.title?.trim() ?? '';
    const description = page.description?.trim() ?? '';
    const keyword = page.primaryKeyword?.trim() ?? '';

    const suffixLength = input.titleTemplateSuffixLength ?? 0;
    const renderedTitleLength = title.length + (title ? suffixLength : 0);

    if (!title) {
      findings.push({
        code: 'TITLE_MISSING',
        path: page.path,
        severity: 'ERROR',
        message: 'The page has no title, so search results show the site name only.',
        fix: 'Add a title of 15–60 characters that names what the page offers.',
      });
    } else {
      if (renderedTitleLength > TITLE_MAX) {
        findings.push({
          code: 'TITLE_TOO_LONG',
          path: page.path,
          severity: 'WARNING',
          message: `The rendered title is ${renderedTitleLength} characters (${title.length} plus the site suffix); results truncate after about ${TITLE_MAX}.`,
          fix: 'Shorten the title, or move the descriptive half into the description.',
        });
      }
      if (renderedTitleLength < TITLE_MIN) {
        findings.push({
          code: 'TITLE_TOO_SHORT',
          path: page.path,
          severity: 'WARNING',
          message: `The rendered title is only ${renderedTitleLength} characters.`,
          fix: 'Say what the page is: test, destination, service or guide.',
        });
      }
      const key = normalise(title);
      titles.set(key, [...(titles.get(key) ?? []), page.path]);
    }

    if (!description) {
      findings.push({
        code: 'DESCRIPTION_MISSING',
        path: page.path,
        severity: 'ERROR',
        message: 'The page has no description, so the search engine invents one from page text.',
        fix: `Add a description of ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`,
      });
    } else {
      if (description.length > DESCRIPTION_MAX) {
        findings.push({
          code: 'DESCRIPTION_TOO_LONG',
          path: page.path,
          severity: 'WARNING',
          message: `The description is ${description.length} characters and will be cut off.`,
          fix: 'Keep the first 160 characters a complete sentence.',
        });
      }
      if (description.length < DESCRIPTION_MIN) {
        findings.push({
          code: 'DESCRIPTION_TOO_SHORT',
          path: page.path,
          severity: 'WARNING',
          message: `The description is only ${description.length} characters.`,
          fix: 'Explain what the page contains and what to do on it.',
        });
      }
      const key = normalise(description);
      descriptions.set(key, [...(descriptions.get(key) ?? []), page.path]);
    }

    if (!keyword) {
      findings.push({
        code: 'KEYWORD_MISSING',
        path: page.path,
        severity: 'ERROR',
        message: 'No primary phrase is recorded for this page.',
        fix: 'Name the one phrase the page should be found for.',
      });
    } else {
      const lowerTitle = normalise(title);
      const lowerDescription = normalise(description);
      if (!lowerTitle.includes(normalise(keyword))) {
        findings.push({
          code: 'KEYWORD_NOT_IN_TITLE',
          path: page.path,
          severity: 'INFO',
          message: `The title does not contain the phrase "${keyword}".`,
          fix: 'Work the phrase into the title if it reads naturally; do not force it.',
        });
      }
      if (!lowerDescription.includes(normalise(keyword))) {
        findings.push({
          code: 'KEYWORD_NOT_IN_DESCRIPTION',
          path: page.path,
          severity: 'INFO',
          message: `The description does not contain the phrase "${keyword}".`,
          fix: 'Mention the phrase once, in a sentence that would help a reader.',
        });
      }
      keywordOwners.set(normalise(keyword), [...(keywordOwners.get(normalise(keyword)) ?? []), page.path]);
    }

    if (!page.hasOpenGraph) {
      findings.push({
        code: 'OPENGRAPH_MISSING',
        path: page.path,
        severity: 'INFO',
        message: 'No OpenGraph block: a share on a social platform will use the site default.',
        fix: 'Add an openGraph block with a title and description.',
      });
    }

    if (!sitemap.has(page.path)) {
      findings.push({
        code: 'ROUTE_NOT_IN_SITEMAP',
        path: page.path,
        severity: 'ERROR',
        message: 'A page with metadata that is not in the sitemap will not be submitted for crawling.',
        fix: 'Add the path to INDEXABLE_PUBLIC_ROUTES, or stop describing it as indexable.',
      });
    }
  }

  for (const path of input.sitemapPaths) {
    if (!listed.has(path)) {
      findings.push({
        code: 'SITEMAP_ROUTE_UNLISTED',
        path,
        severity: 'ERROR',
        message: 'The sitemap submits this path, but no metadata is recorded for it here.',
        fix: 'Add the page to SEO_PAGE_METADATA with a title, description and primary phrase.',
      });
    }
  }

  for (const [title, paths] of titles) {
    if (paths.length > 1) {
      findings.push({
        code: 'TITLE_DUPLICATE',
        path: paths[0],
        severity: 'ERROR',
        message: `${paths.length} pages share the title "${title}" (${paths.join(', ')}).`,
        fix: 'Give each page a title describing that page.',
      });
    }
  }

  for (const [description, paths] of descriptions) {
    if (paths.length > 1) {
      findings.push({
        code: 'DESCRIPTION_DUPLICATE',
        path: paths[0],
        severity: 'ERROR',
        message: `${paths.length} pages share one description (${paths.join(', ')}).`,
        fix: 'Write a description per page; a shared one tells a crawler the pages are the same.',
      });
    }
  }

  for (const [keyword, paths] of keywordOwners) {
    if (paths.length > 1) {
      findings.push({
        code: 'KEYWORD_CANNIBALISED',
        path: paths[0],
        severity: 'WARNING',
        message: `"${keyword}" is the primary phrase for ${paths.length} pages (${paths.join(', ')}); they compete with each other.`,
        fix: 'Keep the phrase on the page it fits best and give the others their own.',
      });
    }
  }

  const pages = input.pages.map((page) => ({
    path: page.path,
    title: page.title,
    titleLength: (page.title?.length ?? 0) + ((page.title?.length ?? 0) > 0 ? (input.titleTemplateSuffixLength ?? 0) : 0),
    descriptionLength: page.description?.length ?? 0,
    primaryKeyword: page.primaryKeyword,
    findings: findings.filter((finding) => finding.path === page.path).length,
  }));

  const order: Record<SeoFinding['severity'], number> = { ERROR: 0, WARNING: 1, INFO: 2 };
  const sorted = [...findings].sort((left, right) => {
    if (order[left.severity] !== order[right.severity]) return order[left.severity] - order[right.severity];
    return left.path.localeCompare(right.path);
  });

  return {
    findings: sorted,
    counts: {
      pages: input.pages.length,
      errors: sorted.filter((finding) => finding.severity === 'ERROR').length,
      warnings: sorted.filter((finding) => finding.severity === 'WARNING').length,
      infos: sorted.filter((finding) => finding.severity === 'INFO').length,
    },
    pages,
    clean: pages.filter((page) => page.findings === 0).map((page) => page.path),
  };
}

export type KeywordGap = {
  keyword: string;
  /** Pages that mention the phrase anywhere in their metadata. */
  mentionedBy: string[];
  /** Pages that own it as their primary phrase. */
  ownedBy: string[];
  gap: 'NO_OWNER' | 'NO_MENTION' | 'COVERED';
  note: string;
};

/**
 * Keywords that matter to this business but nobody owns. Reported as gaps rather
 * than as a ranking: the point is to notice that "student visa documents" has no
 * page, not to guess what position that page would reach.
 */
export function keywordCoverage(pages: readonly SeoPageInput[], keywords: readonly string[]): KeywordGap[] {
  return keywords.map((keyword) => {
    const needle = normalise(keyword);
    const mentionedBy = pages
      .filter((page) => {
        const haystack = [page.title, page.description, page.primaryKeyword, ...(page.supportingKeywords ?? [])]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .map((page) => page.path);
    const ownedBy = pages.filter((page) => normalise(page.primaryKeyword ?? '') === needle).map((page) => page.path);

    if (ownedBy.length > 0) {
      return { keyword, mentionedBy, ownedBy, gap: 'COVERED' as const, note: `Owned by ${ownedBy[0]}.` };
    }
    if (mentionedBy.length > 0) {
      return {
        keyword,
        mentionedBy,
        ownedBy,
        gap: 'NO_OWNER' as const,
        note: `Mentioned on ${mentionedBy.join(', ')} but not the primary phrase of any page.`,
      };
    }
    return {
      keyword,
      mentionedBy,
      ownedBy,
      gap: 'NO_MENTION' as const,
      note: 'No page mentions this phrase at all.',
    };
  });
}

/** One line for a report or a CI log. */
export function describeSeoReport(report: SeoAuditReport): string {
  if (report.counts.pages === 0) return 'No pages to audit.';
  return `${report.counts.pages} pages audited: ${report.counts.errors} error(s), ${report.counts.warnings} warning(s), ${report.counts.infos} note(s).`;
}
