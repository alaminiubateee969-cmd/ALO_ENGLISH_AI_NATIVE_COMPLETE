/**
 * POST /api/crm/messages/queue/run — drain the outbound queue.
 *
 * Called by the host scheduler (a cron job or a platform scheduled task), not by
 * an in-process timer: a timer inside a function that is not running is not a
 * timer, and a timer inside a process that is scaled to two instances fires
 * twice. One HTTP endpoint is the only shape that behaves the same in both.
 *
 * Who may call it:
 *   - a scheduler holding CRON_SECRET, which is compared in constant time; or
 *   - an authenticated ADMIN / SUPER_ADMIN, for a manual run.
 *
 * If CRON_SECRET is unset this endpoint refuses anonymous callers entirely — an
 * unconfigured deployment must not expose a way to trigger sends. It never
 * reports a credential, only whether one is configured.
 *
 * Every message picked up here is re-decided by the same policy gate as a new
 * send: consent may have been withdrawn, or an opt-out recorded, between the
 * deferral and now. A queue must never become a way around the rules.
 */

import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getCurrentUser } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { forbidden, ok, serviceUnavailable, unauthorized, withErrorHandler } from '@/lib/responses';
import type { CrmRole } from '@/lib/crm/permissions';
import { deliverOutbound } from '@/lib/crm/outbound';
import { prismaOutboundStore, prismaRunnerStore } from '@/lib/crm/prisma-outbound-store';
import { defaultAdapterFor } from '@/lib/crm/outbound-providers';
import { OUTBOX_RUN_SECRET_ENV, runDueSends } from '@/lib/crm/outbox-runner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const expected = process.env[OUTBOX_RUN_SECRET_ENV]?.trim();
    const header = req.headers.get('x-alo-cron-secret');

    let triggeredBy = 'scheduler';
    if (expected) {
      if (!secretMatches(header, expected)) return unauthorized('The scheduler secret did not match.');
    } else {
      // No scheduler secret: fall back to an authenticated admin, and refuse
      // everyone else rather than exposing an anonymous send trigger.
      const user = await getCurrentUser();
      const role = user?.role as CrmRole | undefined;
      if (!role) {
        return serviceUnavailable(
          `${OUTBOX_RUN_SECRET_ENV} is not configured, so only an authenticated administrator can run the queue.`,
        );
      }
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') return forbidden('Only an administrator may run the outbound queue manually.');
      triggeredBy = user?.id ?? 'admin';
    }

    const summary = await runDueSends({
      store: prismaRunnerStore,
      deliver: (draft) => deliverOutbound(draft, { store: prismaOutboundStore, adapterFor: (provider) => defaultAdapterFor(provider) }),
    });

    if (summary.considered > 0) {
      await audit('MESSAGES_SEND', {
        resource: 'MessageOutbox:run',
        metadata: {
          triggeredBy,
          considered: summary.considered,
          sent: summary.sent,
          refused: summary.refused,
          deferred: summary.deferred,
          notConfigured: summary.notConfigured,
          failed: summary.failed,
        },
      });
    }

    return ok(summary);
  });
}
