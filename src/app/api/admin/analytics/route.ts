/**
 * GET /api/admin/analytics — the counters, read back.
 *
 * Returns totals by event, the busiest pages, a per-day series and the newest
 * counters. Every figure here comes from aggregate rows; there is no visitor to
 * look up, which is why this endpoint can be opened by an admin without exposing
 * anybody's behaviour.
 *
 * Auth: ADMIN or SUPER_ADMIN.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { badRequest, ok, withErrorHandler } from '@/lib/responses';
import { ANALYTICS_RETENTION_DAYS } from '@/lib/analytics/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(ANALYTICS_RETENTION_DAYS).optional(),
});

function sinceDay(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN', 'SUPER_ADMIN');

    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return badRequest(`days must be between 1 and ${ANALYTICS_RETENTION_DAYS}.`);
    const days = parsed.data.days ?? 30;
    const from = sinceDay(days);

    const [byEvent, byPath, byDay, recent, total] = await Promise.all([
      db.analyticsCounter.groupBy({ by: ['event'], where: { day: { gte: from } }, _sum: { count: true } }),
      db.analyticsCounter.groupBy({
        by: ['path'],
        where: { day: { gte: from }, path: { not: '' } },
        _sum: { count: true },
        orderBy: { _sum: { count: 'desc' } },
        take: 25,
      }),
      db.analyticsCounter.groupBy({ by: ['day'], where: { day: { gte: from } }, _sum: { count: true } }),
      db.analyticsCounter.findMany({ where: { day: { gte: from } }, orderBy: [{ day: 'desc' }, { count: 'desc' }], take: 50 }),
      db.analyticsCounter.aggregate({ where: { day: { gte: from } }, _sum: { count: true } }),
    ]);

    return ok({
      window: { days, from },
      total: total._sum.count ?? 0,
      byEvent: byEvent
        .map((row) => ({ event: row.event, count: row._sum.count ?? 0 }))
        .sort((left, right) => right.count - left.count),
      topPaths: byPath.map((row) => ({ path: row.path, count: row._sum.count ?? 0 })),
      byDay: byDay.map((row) => ({ day: row.day, count: row._sum.count ?? 0 })).sort((left, right) => left.day.localeCompare(right.day)),
      recent: recent.map((row) => ({ day: row.day, event: row.event, path: row.path || null, label: row.label || null, count: row.count })),
      retentionDays: ANALYTICS_RETENTION_DAYS,
      methodology:
        'Aggregate counters only. No cookie, session, IP address, user agent, referrer or free text is stored, so these figures cannot be broken down per visitor — by design. See src/lib/analytics/events.ts.',
    });
  });
}
