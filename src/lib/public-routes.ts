/**
 * src/lib/public-routes.ts
 *
 * Single source of truth for which routes are public, indexable, and served to
 * crawlers. Two consumers read this module:
 *
 *   - src/app/sitemap.ts  (what to submit to search engines)
 *   - src/app/robots.ts   (what may be crawled at all)
 *
 * Why a module rather than two lists: the sitemap and the robots policy drifted
 * apart in comparable setups, and a route that is disallowed by robots.txt but
 * listed in the sitemap is reported by search consoles as an error.
 *
 * IMPORTANT: the access-control allowlist lives in src/proxy.ts and is the
 * authority on what is *unauthenticated*. This module only says what is worth
 * *indexing*. `tests/sitemap.test.ts` asserts every path here also appears in
 * the proxy's PUBLIC_PAGES list, so the two cannot silently diverge.
 */

export type PublicRoute = {
  /** Path relative to the site root, always starting with "/". */
  path: string;
  /** Human label, used by tests and internal reporting only. */
  label: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Relative to other pages on this site; not a ranking claim. */
  priority: number;
  /** ISO date (YYYY-MM-DD) of the last meaningful content change. */
  lastModified: string;
};

/**
 * Pages worth indexing. Auth pages (login, register, password reset) are public
 * but deliberately excluded: they carry no content and should not rank.
 */
export const INDEXABLE_PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: '/', label: 'Home', changeFrequency: 'weekly', priority: 1.0, lastModified: '2026-10-14' },
  { path: '/exam-prep', label: 'Exam preparation catalog', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-10-14' },
  { path: '/language-prep', label: 'Language test overview', changeFrequency: 'weekly', priority: 0.9, lastModified: '2026-10-14' },
  { path: '/resources', label: 'Resource hub', changeFrequency: 'weekly', priority: 0.8, lastModified: '2026-10-14' },
  { path: '/destinations', label: 'Destinations', changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-10-14' },
  { path: '/universities', label: 'Universities', changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-10-14' },
  { path: '/scholarships', label: 'Scholarships', changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-10-14' },
  { path: '/course-finder', label: 'Course finder', changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-10-14' },
  { path: '/services', label: 'Services', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-10-14' },
  { path: '/ask-handbook', label: 'Study handbook', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-10-14' },
  { path: '/events', label: 'Events', changeFrequency: 'weekly', priority: 0.6, lastModified: '2026-10-14' },
  { path: '/book-consultation', label: 'Book a consultation', changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-10-14' },
  { path: '/contact', label: 'Contact', changeFrequency: 'yearly', priority: 0.5, lastModified: '2026-10-14' },
  { path: '/portals', label: 'Portal entry', changeFrequency: 'yearly', priority: 0.4, lastModified: '2026-10-14' },
  { path: '/privacy-policy', label: 'Privacy policy', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-10-14' },
  { path: '/terms', label: 'Terms', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-10-14' },
  { path: '/cookie-policy', label: 'Cookie policy', changeFrequency: 'yearly', priority: 0.3, lastModified: '2026-10-14' },
] as const;

/**
 * Path prefixes that must never be indexed or crawled. These are authenticated
 * surfaces or machine endpoints; they are listed here so robots.txt and the
 * default page metadata agree. This list is a crawler hint, never an access
 * control — every handler enforces its own auth (see docs/SECURITY_AUDIT.md).
 */
export const NON_INDEXABLE_PREFIXES: readonly string[] = [
  '/api/',
  '/admin',
  '/student',
  '/partner',
  '/employee',
  '/super-admin',
  '/practice-test',
  '/live-exam',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;

/**
 * Absolute site origin used for canonical URLs, the sitemap, and OpenGraph
 * metadata. Falls back to the configured production hostname; a malformed
 * APP_URL is ignored rather than allowed to crash a build.
 */
export function resolveSiteUrl(): string {
  const configured = process.env.APP_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      return `${url.protocol}//${url.host}`;
    } catch {
      // fall through to the default below
    }
  }
  return 'https://english.aloeducation.com';
}

/** True when a path is excluded from crawling by NON_INDEXABLE_PREFIXES. */
export function isNonIndexable(path: string): boolean {
  return NON_INDEXABLE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}
