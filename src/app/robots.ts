/**
 * src/app/robots.ts
 *
 * Replaces the previous hand-written `public/robots.txt`, which allowed every
 * crawler everywhere — including /admin, /student, /partner and /api. The
 * static file could not reference the sitemap without hard-coding the host.
 *
 * Crawling rules are a hint, not a security boundary: every protected route
 * still enforces authentication and ownership on the server. What this file
 * buys is that crawlers stop wasting requests on authenticated pages and that
 * the sitemap is discoverable.
 *
 * @see src/lib/public-routes.ts — shared route list
 */

import type { MetadataRoute } from 'next';
import { NON_INDEXABLE_PREFIXES, resolveSiteUrl } from '@/lib/public-routes';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl();

  // "/api/" is a machine surface; robots.txt uses the prefix form without the
  // trailing slash so it also matches "/api" itself.
  const disallow = NON_INDEXABLE_PREFIXES.map((prefix) =>
    prefix.endsWith('/') ? prefix.slice(0, -1) : prefix,
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallow.length > 0 ? disallow : undefined,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
