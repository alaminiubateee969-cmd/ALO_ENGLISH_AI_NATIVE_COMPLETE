/**
 * tests/seo-audit.test.ts
 *
 * The audit is only trustworthy if it runs against the real pages, so this file
 * does two things:
 *
 *   1. Exercises every rule with synthetic input, including the ones that must
 *      NOT fire.
 *   2. Runs the audit over the actual sitemap and the actual metadata table, and
 *      reads the page and layout files to prove the table has not drifted from
 *      what is served. A dashboard fed by a table nobody verifies is worse than no
 *      dashboard, because it looks authoritative while being wrong.
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INDEXABLE_PUBLIC_ROUTES } from '../src/lib/public-routes';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_MAX,
  TITLE_MIN,
  auditSeo,
  describeSeoReport,
  keywordCoverage,
  type SeoPageInput,
} from '../src/lib/seo/audit';
import { BUSINESS_KEYWORDS, SEO_PAGE_METADATA, SITE_TITLE_SUFFIX, findSeoPage } from '../src/lib/seo/metadata';

const ROOT = join(import.meta.dir, '..');
const sitemapPaths = INDEXABLE_PUBLIC_ROUTES.map((route) => route.path);

function page(overrides: Partial<SeoPageInput> & { path: string }): SeoPageInput {
  return {
    title: 'A perfectly ordinary page title',
    // The fixture has to be genuinely well-formed, including mentioning the phrase
    // it claims to be about: a description that never names it is an INFO finding,
    // and the first version of this fixture tripped exactly that.
    description: 'This description says what an ordinary page contains and what a reader can do once they arrive on it.',
    primaryKeyword: 'ordinary page',
    hasOpenGraph: true,
    ...overrides,
  };
}

describe('the rules', () => {
  test('a well-formed page produces no findings', () => {
    const report = auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x' })] });
    expect(report.findings).toEqual([]);
    expect(report.clean).toEqual(['/x']);
  });

  test('the synthetic fixtures below keep their paths in the sitemap, so only the rule under test fires', () => {
    // Guards the guard: several tests below pass two pages, and a mismatch between
    // `pages` and `sitemapPaths` would add a sitemap finding to every one of them.
    // Two pages with the same phrase would trip the cannibalisation rule, so the
    // fixture gives each page its own phrase — the same trap the real metadata
    // table has to avoid.
    const report = auditSeo({
      sitemapPaths: ['/x', '/y'],
      pages: [
        page({ path: '/x', title: 'The first ordinary page', primaryKeyword: 'ordinary page', description: 'This description says what an ordinary page contains and what a reader can do next.' }),
        page({ path: '/y', title: 'The second page in this fixture', primaryKeyword: 'second page', description: 'This description says what a second page contains and what a reader can do next.' }),
      ],
    });
    // Printed on failure so the next person sees which rule fired, not just that
    // something did.
    expect(report.findings.map((finding) => `${finding.code} ${finding.path}`)).toEqual([]);
  });

  test('a missing title and a missing description are both errors', () => {
    const report = auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x', title: '', description: '' })] });
    const codes = report.findings.map((finding) => finding.code);
    expect(codes).toContain('TITLE_MISSING');
    expect(codes).toContain('DESCRIPTION_MISSING');
    expect(report.counts.errors).toBeGreaterThanOrEqual(2);
  });

  test('a title past the truncation point is a warning, with the length in the message', () => {
    const report = auditSeo({
      sitemapPaths: ['/x'],
      pages: [page({ path: '/x', title: 'T'.repeat(TITLE_MAX + 1) })],
    });
    const finding = report.findings.find((entry) => entry.code === 'TITLE_TOO_LONG');
    expect(finding?.severity).toBe('WARNING');
    expect(finding?.message).toContain(String(TITLE_MAX + 1));
  });

  test('a title below the useful minimum is a warning', () => {
    const report = auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x', title: 'x'.repeat(TITLE_MIN - 1) })] });
    expect(report.findings.map((finding) => finding.code)).toContain('TITLE_TOO_SHORT');
  });

  test('a description outside the window is reported', () => {
    const short = auditSeo({
      sitemapPaths: ['/x'],
      pages: [page({ path: '/x', description: 'x'.repeat(DESCRIPTION_MIN - 1) })],
    });
    expect(short.findings.map((finding) => finding.code)).toContain('DESCRIPTION_TOO_SHORT');

    const long = auditSeo({
      sitemapPaths: ['/x'],
      pages: [page({ path: '/x', description: 'x'.repeat(DESCRIPTION_MAX + 1) })],
    });
    expect(long.findings.map((finding) => finding.code)).toContain('DESCRIPTION_TOO_LONG');
  });

  test('two pages sharing a title or a description is an error naming both', () => {
    const shared = 'A shared title that two pages somehow ended up with';
    const report = auditSeo({
      sitemapPaths: ['/a', '/b'],
      pages: [page({ path: '/a', title: shared }), page({ path: '/b', title: shared })],
    });
    const finding = report.findings.find((entry) => entry.code === 'TITLE_DUPLICATE');
    expect(finding?.severity).toBe('ERROR');
    expect(finding?.message).toContain('/a');
    expect(finding?.message).toContain('/b');
  });

  test('two pages owning one phrase is a warning about competing with each other', () => {
    const report = auditSeo({
      sitemapPaths: ['/a', '/b'],
      pages: [
        page({ path: '/a', primaryKeyword: 'study abroad help' }),
        page({ path: '/b', primaryKeyword: 'Study Abroad Help' }),
      ],
    });
    const finding = report.findings.find((entry) => entry.code === 'KEYWORD_CANNIBALISED');
    expect(finding?.severity).toBe('WARNING');
  });

  test('a described page that is not in the sitemap is an error', () => {
    const report = auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x' }), page({ path: '/y' })] });
    expect(report.findings.map((finding) => finding.code)).toContain('ROUTE_NOT_IN_SITEMAP');
    expect(report.findings.find((finding) => finding.code === 'ROUTE_NOT_IN_SITEMAP')?.path).toBe('/y');
  });

  test('a sitemap entry nobody described is an error too', () => {
    const report = auditSeo({ sitemapPaths: ['/x', '/z'], pages: [page({ path: '/x' })] });
    expect(report.findings.map((finding) => finding.code)).toContain('SITEMAP_ROUTE_UNLISTED');
    expect(report.findings.find((finding) => finding.code === 'SITEMAP_ROUTE_UNLISTED')?.path).toBe('/z');
  });

  test('findings are ordered by severity, errors first', () => {
    const report = auditSeo({
      sitemapPaths: ['/x'],
      pages: [page({ path: '/x', hasOpenGraph: false, description: '' })],
    });
    const severities = report.findings.map((finding) => finding.severity);
    expect(severities[0]).toBe('ERROR');
    expect(severities[severities.length - 1]).toBe('INFO');
  });

  test('every finding offers a fix, not just a complaint', () => {
    const report = auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x', title: '', description: '', primaryKeyword: '' })] });
    expect(report.findings.length).toBeGreaterThan(0);
    for (const finding of report.findings) {
      expect(finding.fix.length).toBeGreaterThan(10);
      expect(finding.message.length).toBeGreaterThan(10);
    }
  });

  test('the report describes itself in one line', () => {
    expect(describeSeoReport(auditSeo({ sitemapPaths: [], pages: [] }))).toBe('No pages to audit.');
    expect(describeSeoReport(auditSeo({ sitemapPaths: ['/x'], pages: [page({ path: '/x' })] }))).toContain('1 pages audited');
  });
});

describe('keyword coverage', () => {
  const pages = [
    page({ path: '/a', primaryKeyword: 'study destinations', supportingKeywords: ['student visa documents'] }),
    page({ path: '/b', primaryKeyword: 'book a consultation' }),
  ];

  test('an owned phrase is reported as covered', () => {
    const [covered] = keywordCoverage(pages, ['study destinations']);
    expect(covered?.gap).toBe('COVERED');
    expect(covered?.ownedBy).toEqual(['/a']);
  });

  test('a phrase only mentioned in passing has no owner', () => {
    const [gap] = keywordCoverage(pages, ['student visa documents']);
    expect(gap?.gap).toBe('NO_OWNER');
    expect(gap?.mentionedBy).toEqual(['/a']);
  });

  test('a phrase nobody mentions at all is the real gap', () => {
    const [gap] = keywordCoverage(pages, ['IELTS preparation Dhaka']);
    expect(gap?.gap).toBe('NO_MENTION');
    expect(gap?.note).toContain('No page mentions');
  });
});

describe('the real pages', () => {
  const report = auditSeo({
    sitemapPaths,
    pages: SEO_PAGE_METADATA,
    titleTemplateSuffixLength: SITE_TITLE_SUFFIX.length,
  });

  test('every indexable route is described here, and vice versa', () => {
    const described = new Set(SEO_PAGE_METADATA.map((page) => page.path));
    const missing = sitemapPaths.filter((path) => !described.has(path));
    const extra = [...described].filter((path) => !sitemapPaths.includes(path));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  test('the audit finds no errors in the shipped metadata', () => {
    const errors = report.findings.filter((finding) => finding.severity === 'ERROR');
    expect(errors.map((finding) => `${finding.path}: ${finding.message}`)).toEqual([]);
  });

  test('no page is left with a duplicated or over-long title or description', () => {
    const codes = report.findings.map((finding) => finding.code);
    expect(codes).not.toContain('TITLE_DUPLICATE');
    expect(codes).not.toContain('DESCRIPTION_DUPLICATE');
    expect(codes).not.toContain('TITLE_TOO_LONG');
    expect(codes).not.toContain('DESCRIPTION_TOO_LONG');
  });

  test('each page is described by a file that really contains that text', () => {
    for (const entry of SEO_PAGE_METADATA) {
      const directory = entry.path === '/' ? 'src/app' : `src/app${entry.path}`;
      const file = join(ROOT, directory, entry.declaredIn === 'LAYOUT' ? 'layout.tsx' : 'page.tsx');
      expect({ path: entry.path, exists: existsSync(file) }).toEqual({ path: entry.path, exists: true });

      const source = readFileSync(file, 'utf8');
      // The strings are compared verbatim, so a writer who edits a page and
      // forgets this table fails here rather than shipping a stale dashboard.
      expect({ path: entry.path, title: source.includes(entry.title) }).toEqual({ path: entry.path, title: true });
      expect({ path: entry.path, description: source.includes(entry.description) }).toEqual({
        path: entry.path,
        description: true,
      });
    }
  });

  test('the client pages get their metadata from a layout, and were not left with the default', () => {
    for (const entry of SEO_PAGE_METADATA) {
      const directory = entry.path === '/' ? 'src/app' : `src/app${entry.path}`;
      const pageSource = readFileSync(join(ROOT, directory, 'page.tsx'), 'utf8');
      const isClient = pageSource.startsWith('"use client"') || pageSource.startsWith("'use client'");
      if (isClient) {
        // A client component cannot export metadata: the layout is the only place
        // it can live, and without one the route serves the root default title.
        expect({ path: entry.path, declaredIn: entry.declaredIn }).toEqual({ path: entry.path, declaredIn: 'LAYOUT' });
      }
    }
  });

  test('the business phrases are reported against the real pages', () => {
    const coverage = keywordCoverage(SEO_PAGE_METADATA, BUSINESS_KEYWORDS);
    expect(coverage).toHaveLength(BUSINESS_KEYWORDS.length);
    // Reported, not required: the gap list is the point of the exercise, and a
    // test that forced every phrase to be covered would push writers to
    // keyword-stuff pages that have nothing to say about them.
    expect(coverage.some((entry) => entry.gap === 'COVERED')).toBe(true);
    for (const entry of coverage) {
      expect(['COVERED', 'NO_OWNER', 'NO_MENTION']).toContain(entry.gap);
      expect(entry.note.length).toBeGreaterThan(5);
    }
  });

  test('the title suffix here matches the one the layout actually applies', () => {
    // Without this, changing the layout's template would silently make every title
    // length in this table wrong.
    const layout = readFileSync(join(ROOT, 'src/app/layout.tsx'), 'utf8');
    const template = layout.match(/template:\s*"([^"]+)"/);
    expect(template?.[1]).toBe(`%s${SITE_TITLE_SUFFIX}`);
  });

  test('every title fits inside the truncation limit once the site suffix is added', () => {
    const tooLong = SEO_PAGE_METADATA.filter((page) => page.title.length + SITE_TITLE_SUFFIX.length > TITLE_MAX);
    expect(tooLong.map((page) => page.path)).toEqual([]);
  });

  test('findSeoPage answers for a described page and is undefined otherwise', () => {
    expect(findSeoPage('/contact')?.title).toContain('Contact');
    expect(findSeoPage('/not-a-page')).toBeUndefined();
  });
});
