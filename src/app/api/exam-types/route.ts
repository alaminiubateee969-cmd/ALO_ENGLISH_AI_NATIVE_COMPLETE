/**
 * GET /api/exam-types — List all active exam types.
 *
 * Public endpoint (no auth required).
 * Returns exam types with practice set counts and question counts.
 */

import { db } from '@/lib/db';
import { ok } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const examTypes = await db.examType.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
      include: {
        practiceSets: {
          include: {
            _count: { select: { questions: true } },
          },
        },
      },
    });

    return ok(
      {
        examTypes: examTypes.map((et) => ({
          id: et.id,
          code: et.code,
          name: et.name,
          category: et.category,
          practiceSetCount: et.practiceSets.length,
          questionCount: et.practiceSets.reduce((sum, ps) => sum + ps._count.questions, 0),
        })),
      },
      'Exam types retrieved'
    );
  });
}
