/**
 * POST /api/attempts/start — Start a new practice attempt.
 *
 * Requires authentication (STUDENT role).
 * Validates the practice set exists and is active.
 * Creates an Attempt record with status IN_PROGRESS.
 * Audit logs the start.
 */

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ok, badRequest, notFound, internalError } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    const schema = z.object({ practiceSetId: z.string().cuid() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { practiceSetId } = parsed.data;

    // Verify practice set exists and is active.
    const practiceSet = await db.practiceSet.findFirst({
      where: { id: practiceSetId, isActive: true },
    });
    if (!practiceSet) return notFound('Practice set not found');

    // Create attempt.
    const attempt = await db.attempt.create({
      data: {
        userId: user.id,
        practiceSetId,
        status: 'IN_PROGRESS',
      },
    });

    await audit('EXAM_START', {
      userId: user.id,
      resource: 'attempt:' + attempt.id,
      ipAddress: getClientIp(req),
      metadata: { practiceSetId },
    });

    return ok({ attempt: { id: attempt.id, startedAt: attempt.startedAt } }, 'Attempt started');
  });
}
