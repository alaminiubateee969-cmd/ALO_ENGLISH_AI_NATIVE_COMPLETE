/**
 * src/proxy.ts — Next.js 16 edge proxy (middleware equivalent).
 *
 * In Next.js 16, the `middleware.ts` convention was renamed to `proxy.ts`
 * and the exported function must be named `proxy` (not `middleware`).
 * (Verified: Next.js 16.1.3 source code checks `middlewareModule.proxy || middlewareModule.middleware`)
 *
 * This proxy applies security headers. It does not authenticate users or
 * redirect protected routes; every API handler must enforce auth/authorization,
 * and page-level checks are presentation only. The route lists below document
 * the intended public surface and are consumed by the inventory generator.
 *
 * Public routes (no auth required):
 *   /, /login, /register, /forgot-password, /reset-password
 *   /destinations, /course-finder, /universities, /scholarships
 *   /services, /language-prep, /exam-prep, /resources, /events
 *   /contact, /book-consultation, /ask-handbook
 *   /privacy-policy, /terms, /cookie-policy, /portals
 *   /api/auth/*, /api/health, /api/lead, /api/rag/ask, /api/rag/materials (GET)
 *   /api/exam-types, /api/practice-sets, /api/examiners
 *   /api/webhooks/*  (public endpoint, but NOT unauthenticated: every request
 *                     must carry a valid provider HMAC signature, checked in the
 *                     route before any database work. See
 *                     src/lib/crm/webhook-signature.ts and docs/COMMUNICATION_HUB.md.)
 *   /_next/*, /favicon.ico, /public/*
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Public Route Allowlist ───────────────────────────────────────────────

const PUBLIC_PAGES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/destinations',
  '/course-finder',
  '/universities',
  '/scholarships',
  '/services',
  '/language-prep',
  // "/exam-prep" is public content: it is linked from the site header, the
  // footer and /resources, and it only reads the public exam-types API. It was
  // missing from this list, which made it absent from ROUTE_INVENTORY.csv and
  // caused tests/sitemap.test.ts to fail once the sitemap was generated.
  '/exam-prep',
  '/resources',
  '/events',
  '/contact',
  '/book-consultation',
  '/ask-handbook',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
  '/portals',
]);

const PUBLIC_API_PATTERNS = [
  /^\/api\/auth\/.+/,        // login, register, forgot/reset password, me (me will check internally)
  /^\/api\/health$/,
  /^\/api\/lead$/,           // public lead capture
  /^\/api\/rag\/ask$/,       // public RAG handbook
  /^\/api\/rag\/materials$/, // public list (GET)
  /^\/api\/exam-types$/,
  /^\/api\/practice-sets$/,
  /^\/api\/examiners$/,
  /^\/api\/webhooks\/.+/,      // signature-verified inbound providers (see route)
  /^\/api\/analytics\/events$/, // anonymous beacon; aggregate counters only, rate limited,
                                 // and nothing about a visitor is stored (src/lib/analytics/events.ts)
];

// ─── Proxy Handler ────────────────────────────────────────────────────────

export function proxy(_req: NextRequest) {
  const res = NextResponse.next();

  // ─── Security Headers ──────────────────────────────────────────────────
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  // Microphone access is required only by the same-origin speaking practice routes.
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), interest-cohort=()');

  // HSTS only in production (behind HTTPS proxy)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content-Security-Policy (allows inline styles/scripts for Next.js, blocks external)
  if (process.env.NODE_ENV === 'production') {
    res.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: https: blob:; " +
      "audio-src 'self' data: blob:; " +
      "media-src 'self' data: blob:; " +
      "connect-src 'self' ws: wss:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
  }

  // Authentication and role/ownership checks are enforced by route handlers;
  // this edge proxy intentionally does not make access-control decisions.
  return res;
}

export const config = {
  // Apply to all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
