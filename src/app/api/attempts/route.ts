/**
 * GET /api/attempts — List the current user's attempts.
 *
 * Requires authentication.
 * Returns paginated list of the user's attempts + scores.
 */

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ok, internalError } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));

    const [attempts, total] = await Promise.all([
      db.attempt.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          practiceSet: {
            include: { examType: { select: { code: true, name: true } } },
          },
          score: true,
        },
      }),
      db.attempt.count({ where: { userId: user.id } }),
    ]);

    return ok(
      {
        attempts: attempts.map((a) => ({
          id: a.id,
          status: a.status,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          examType: a.practiceSet.examType,
          practiceSet: { title: a.practiceSet.title },
          score: a.score
            ? {
                overall: a.score.overall,
                confidence: a.score.confidence,
                providerUsed: a.score.providerUsed,
              }
            : null,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Attempts retrieved'
    );
  });
}
