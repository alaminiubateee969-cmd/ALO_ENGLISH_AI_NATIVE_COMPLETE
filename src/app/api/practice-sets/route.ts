/**
 * GET /api/practice-sets — List practice sets (optionally filtered by exam type).
 *
 * Public endpoint.
 * Query params: ?examTypeId=xxx
 */

import { db } from '@/lib/db';
import { ok, internalError } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const url = new URL(req.url);
    const examTypeId = url.searchParams.get('examTypeId');

    const where: { isActive: boolean; examTypeId?: string } = { isActive: true };
    if (examTypeId) {
      where.examTypeId = examTypeId;
    }

    const sets = await db.practiceSet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        examType: { select: { code: true, name: true } },
      },
    });

    return ok(
      {
        practiceSets: sets.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          durationMin: s.durationMin,
          examType: s.examType,
        })),
      },
      'Practice sets retrieved'
    );
  });
}
