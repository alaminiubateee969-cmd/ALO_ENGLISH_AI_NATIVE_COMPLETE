/**
 * POST /api/analytics/events — the first-party analytics beacon.
 *
 * Accepts a small batch of events and increments aggregate counters. It is the
 * only write path into the analytics table, and it is deliberately reachable
 * without authentication: a visitor is not signed in, and asking them to be would
 * mean either no analytics or analytics with an identity attached.
 *
 * What that costs, stated plainly: this endpoint is open, so it is rate-limited
 * per source address, capped at a small batch, and normalises everything through
 * `src/lib/analytics/events.ts` before a row is touched. The IP address is used to
 * count requests in memory and is never written to the database.
 *
 * Auth: none. Rate limited.
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp } from '@/lib/audit';
import { badRequest, ok, rateLimited, withErrorHandler } from '@/lib/responses';
import { rateLimit } from '@/lib/rate-limit';
import {
  ANALYTICS_MAX_EVENTS_PER_REQUEST,
  normaliseAnalyticsBatch,
} from '@/lib/analytics/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const ip = getClientIp(req) ?? 'unknown';
    // One visitor page load can legitimately carry several events; a burst of
    // sixty a minute is a person browsing, more than that is a script.
    const limit = rateLimit(`analytics:${ip}`, 60, 60);
    if (!limit.allowed) {
      return rateLimited('Too many analytics events from this address.');
    }

    const payload = await req.json().catch(() => null);
    const raw = Array.isArray(payload) ? payload : (payload as { events?: unknown } | null)?.events;
    if (!Array.isArray(raw)) return badRequest(`Send { events: [...] } with at most ${ANALYTICS_MAX_EVENTS_PER_REQUEST} events.`);

    const { counters, rejections } = normaliseAnalyticsBatch(raw);

    // One transaction per batch: a beacon that half-succeeds would leave the day's
    // counters quietly wrong, which is worse than losing the batch.
    await db.$transaction(
      counters.map((counter) =>
        db.analyticsCounter.upsert({
          where: {
            day_event_path_label: {
              day: counter.day,
              event: counter.event,
              path: counter.path ?? '',
              label: counter.label ?? '',
            },
          },
          create: {
            day: counter.day,
            event: counter.event,
            path: counter.path ?? '',
            label: counter.label ?? '',
            count: counter.count,
          },
          update: { count: { increment: counter.count } },
        }),
      ),
    );

    return ok({
      recorded: counters.reduce((total, counter) => total + counter.count, 0),
      countersWritten: counters.length,
      // Rejections are returned rather than swallowed: a caller sending something
      // that cannot be stored should learn why, and a silent drop is how a
      // privacy rule becomes a mystery.
      rejections,
      stored: 'Aggregate counts only: event, path, label and day. No identifier of any kind is written.',
    });
  });
}
