/**
 * GET /api/health — Application health check.
 *
 * Checks:
 *   - Application process (always 200 if this runs)
 *   - Database connectivity (Prisma query)
 *   - Version/build identifier
 *
 * Does NOT expose secrets. Returns a minimal public response.
 */

import { db } from '@/lib/db';
import { ok } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const timestamp = new Date().toISOString();
    const version = process.env.npm_package_version || '1.0.0';

    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let examCount = 0;

    try {
      examCount = await db.examType.count({ where: { isActive: true } });
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    const healthy = dbStatus === 'connected';

    if (!healthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          version,
          timestamp,
          checks: { database: dbStatus, examTypes: examCount },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'healthy',
        version,
        timestamp,
        checks: { database: dbStatus, examTypes: examCount },
      },
      { status: 200 }
    );
  });
}
