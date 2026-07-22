import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Force Node.js runtime (needs Prisma which uses Node APIs).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — Application health check.
 *
 * Checks:
 *   - Application process (always 200 if this runs)
 *   - Database connectivity (Prisma query)
 *   - Version/build identifier
 *
 * Does NOT expose secrets. Returns a minimal public response.
 * Detailed infrastructure checks require admin access (future: /api/health/detailed).
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";

  let dbStatus: "connected" | "disconnected" = "disconnected";
  let examCount = 0;

  try {
    // Lightweight query: count exam types. If this succeeds, DB is connected.
    examCount = await db.examType.count({ where: { isActive: true } });
    dbStatus = "connected";
  } catch {
    // Don't leak the error message.
    dbStatus = "disconnected";
  }

  const healthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      version,
      timestamp,
      checks: {
        database: dbStatus,
        examTypes: examCount,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
