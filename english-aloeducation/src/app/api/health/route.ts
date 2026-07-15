import { NextResponse } from "next/server";

/**
 * Lightweight health-check endpoint used by load balancers /
 * monitoring tools. Public — no auth required.
 *
 * GET /api/health → 200 { status, app, version, timestamp }
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      app: "english-aloeducation",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
