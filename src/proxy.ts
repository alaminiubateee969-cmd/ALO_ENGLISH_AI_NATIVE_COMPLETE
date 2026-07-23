/**
 * src/proxy.ts — Next.js edge proxy for security headers.
 *
 * In Next.js 16, the `middleware.ts` convention was renamed to `proxy.ts`
 * and the exported function must be named `proxy` (not `middleware`).
 *
 * Applies security headers to EVERY response:
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY
 *   - Referrer-Policy: strict-origin-when-cross-origin
 *   - X-DNS-Prefetch-Control: off
 *   - Strict-Transport-Security (production only, when behind HTTPS proxy)
 *
 * This runs on every request before the route handler.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();

  // Security headers (defense-in-depth; Caddy also sets these).
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS only in production (behind HTTPS proxy).
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return res;
}

export const config = {
  // Apply to all routes.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
