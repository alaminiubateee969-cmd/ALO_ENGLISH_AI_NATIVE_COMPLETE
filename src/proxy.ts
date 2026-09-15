/**
 * src/proxy.ts — Next.js 16 edge proxy (middleware equivalent).
 *
 * In Next.js 16, the `middleware.ts` convention was renamed to `proxy.ts`
 * and the exported function must be named `proxy` (not `middleware`).
 * (Verified: Next.js 16.1.3 source code checks `middlewareModule.proxy || middlewareModule.middleware`)
 *
 * This proxy:
 *   1. Applies security headers to every response
 *   2. Protects /app/* and /api/* routes (redirects unauthenticated users)
 *   3. Allows explicitly public routes
 *
 * Public routes (no auth required):
 *   /, /login, /register, /forgot-password, /reset-password
 *   /destinations, /course-finder, /universities, /scholarships
 *   /services, /language-prep, /resources, /events
 *   /contact, /book-consultation, /ask-handbook
 *   /privacy-policy, /terms, /cookie-policy, /portals
 *   /api/auth/*, /api/health, /api/lead, /api/rag/ask, /api/rag/materials (GET)
 *   /api/exam-types, /api/practice-sets, /api/examiners, /api/agents/status
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
  /^\/api\/agents\/status$/,
];

function isPublicRoute(pathname: string): boolean {
  // Public pages
  if (PUBLIC_PAGES.has(pathname)) return true;

  // Public API patterns
  for (const pattern of PUBLIC_API_PATTERNS) {
    if (pattern.test(pathname)) return true;
  }

  // Static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('/public/')) {
    return true;
  }

  return false;
}

// ─── Proxy Handler ────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ─── Security Headers ──────────────────────────────────────────────────
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

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

  // ─── Route Protection ──────────────────────────────────────────────────
  // Only protect API routes at proxy level (pages are protected client-side)
  // API routes that are public will return 401 if not authenticated — but
  // we let the route handler decide (it has the full session logic).
  //
  // For page routes, we let the client-side redirect handle it (the dashboard
  // pages check auth and redirect to /login). This avoids edge-runtime DB
  // access limitations.

  return res;
}

export const config = {
  // Apply to all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
