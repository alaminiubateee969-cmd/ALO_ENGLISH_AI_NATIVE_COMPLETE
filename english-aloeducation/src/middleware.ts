import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Role-based middleware for English.ALOEducation Web_CRM.
 *
 * Path prefix → required role(s):
 *   /admin/*      → SUPER_ADMIN, ADMIN
 *   /student/*    → STUDENT
 *   /teacher/*    → TEACHER
 *   /examiner/*   → EXAMINER
 *   /ambassador/* → AMBASSADOR
 *   /employee/*   → EMPLOYEE
 *
 * Public paths (no auth required):
 *   /, /login, /register, /api/auth/*, /api/health, POST /api/leads
 */

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
];

const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/api/health",
  "/api/leads",
];

function isPublic(pathname: string, method: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;

  // /api/leads is only public for POST (lead capture). The GET handler
  // is admin-only and will re-validate inside the route itself.
  if (pathname === "/api/leads" && method === "POST") return true;

  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

const ROLE_RULES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/student", roles: ["STUDENT"] },
  { prefix: "/teacher", roles: ["TEACHER"] },
  { prefix: "/examiner", roles: ["EXAMINER"] },
  { prefix: "/ambassador", roles: ["AMBASSADOR"] },
  { prefix: "/employee", roles: ["EMPLOYEE"] },
  // Mirror the same rules for API endpoints scoped to each role.
  { prefix: "/api/admin", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/api/student", roles: ["STUDENT"] },
  { prefix: "/api/teacher", roles: ["TEACHER"] },
  { prefix: "/api/examiner", roles: ["EXAMINER"] },
  { prefix: "/api/ambassador", roles: ["AMBASSADOR"] },
  { prefix: "/api/employee", roles: ["EMPLOYEE"] },
];

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname, search } = req.nextUrl;
    const token = req.nextauth.token;
    const role = (token?.role as string | undefined) ?? undefined;

    // Find the first matching rule (longest prefix matching is overkill
    // here because the prefixes are mutually exclusive).
    const rule = ROLE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));

    if (!rule) {
      // Authenticated but no specific role rule → allow through.
      return NextResponse.next();
    }

    if (!role || !rule.roles.includes(role)) {
      // Forbidden: signed in but wrong role.
      const url = new URL("/login", req.nextUrl.origin);
      url.searchParams.set("error", "AccessDenied");
      url.searchParams.set("from", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // `authorized` decides whether `withAuth` should invoke the
      // middleware function at all. Returning `true` here for public
      // paths means they will skip the redirect-to-login logic and
      // pass straight through (and the inner middleware won't even be
      // called for them).
      authorized: ({ req }) => {
        const { pathname } = req.nextUrl;
        const method = req.method ?? "GET";
        if (isPublic(pathname, method)) return true;

        // For protected paths, require a token (i.e. a signed-in user).
        return Boolean(req.nextauth.token);
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  },
);

export const config = {
  // Run middleware on everything except Next internals, static assets,
  // and the upload directory (which is served as static files).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads|.*\\..*).*)",
  ],
};
