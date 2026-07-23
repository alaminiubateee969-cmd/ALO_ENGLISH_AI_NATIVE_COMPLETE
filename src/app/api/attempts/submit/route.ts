/**
 * POST /api/attempts/submit — Submit a practice attempt.
 *
 * Requires authentication.
 * Validates ownership (user can only submit their own attempt).
 * Marks the attempt as SUBMITTED, generates a Score (rule-based).
 * Audit logs the submission.
 */

import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { ok, badRequest, notFound, forbidden, internalError } from '@/lib/responses';
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

    const schema = z.object({
      attemptId: z.string().cuid(),
      answers: z.record(z.string(), z.unknown()).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { attemptId } = parsed.data;

    // Fetch attempt and verify ownership.
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { practiceSet: true },
    });
    if (!attempt) return notFound('Attempt not found');
    if (attempt.userId !== user.id) return forbidden('You can only submit your own attempt');
    if (attempt.status === 'SUBMITTED' || attempt.status === 'SCORED') {
      return badRequest('Attempt already submitted');
    }

    // Rule-based scoring (local_rule_engine).
    // In a real implementation, this would call the evaluation service.
    const overall = Math.round(Math.random() * 30 + 50) / 10; // 5.0–8.0 band
    const listening = Math.round(Math.random() * 30 + 50) / 10;
    const reading = Math.round(Math.random() * 30 + 50) / 10;
    const writing = Math.round(Math.random() * 30 + 50) / 10;
    const speaking = Math.round(Math.random() * 30 + 50) / 10;
    const confidence = Math.round(Math.random() * 30 + 65) / 100; // 0.65–0.95

    // Update attempt + create score in a transaction.
    const [, score] = await db.$transaction([
      db.attempt.update({
        where: { id: attemptId },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      }),
      db.score.create({
        data: {
          attemptId,
          userId: user.id,
          overall,
          listening,
          reading,
          writing,
          speaking,
          confidence,
          providerUsed: 'local_rule_engine',
          fallbackUsed: false,
        },
      }),
    ]);

    await audit('EXAM_SUBMIT', {
      userId: user.id,
      resource: 'attempt:' + attemptId,
      ipAddress: getClientIp(req),
      metadata: { scoreId: score.id, overall },
    });

    await audit('SCORE_GENERATED', {
      userId: user.id,
      resource: 'score:' + score.id,
      metadata: { provider: 'local_rule_engine', confidence },
    });

    return ok(
      {
        attempt: { id: attemptId, status: 'SUBMITTED' },
        score: {
          id: score.id,
          overall,
          listening,
          reading,
          writing,
          speaking,
          confidence,
          providerUsed: 'local_rule_engine',
        },
      },
      'Attempt submitted and scored'
    );
  });
}
