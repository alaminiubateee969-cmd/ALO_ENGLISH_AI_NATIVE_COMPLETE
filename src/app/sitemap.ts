/**
 * src/app/sitemap.ts
 *
 * Generated sitemap. Replaces nothing — this route did not exist before, which
 * meant the only crawl signals were robots.txt and whatever a crawler happened
 * to discover by following links.
 *
 * The list is static on purpose. A sitemap that queries the database would run
 * during `next build` on the host, where the database may be mid-migration or
 * unreachable, and a failed build takes the site down over a listing file.
 * Per-exam pages are added by extending INDEXABLE_PUBLIC_ROUTES, and
 * tests/sitemap.test.ts keeps that list honest.
 *
 * @see docs/REFERENCE_LINK_AUDIT_2026-10-14.md (Section A, open-seo)
 */

import type { MetadataRoute } from 'next';
import { INDEXABLE_PUBLIC_ROUTES, resolveSiteUrl } from '@/lib/public-routes';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolveSiteUrl();

  return INDEXABLE_PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
