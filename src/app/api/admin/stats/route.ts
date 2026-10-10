/**
 * GET /api/admin/stats — Admin dashboard statistics.
 *
 * Requires ADMIN role.
 * Returns aggregate counts for the admin dashboard.
 */

import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ok, internalError } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN', 'SUPER_ADMIN');

    const [
      totalUsers,
      totalStudents,
      totalExaminers,
      totalExamTypes,
      totalPracticeSets,
      totalAttempts,
      totalScores,
      submittedAttempts,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'STUDENT' } }),
      db.user.count({ where: { role: 'EXAMINER' } }),
      db.examType.count({ where: { isActive: true } }),
      db.practiceSet.count({ where: { isActive: true } }),
      db.attempt.count(),
      db.score.count(),
      db.attempt.count({ where: { status: 'SUBMITTED' } }),
    ]);

    return ok(
      {
        users: { total: totalUsers, students: totalStudents, examiners: totalExaminers },
        content: { examTypes: totalExamTypes, practiceSets: totalPracticeSets },
        activity: {
          totalAttempts,
          submittedAttempts,
          totalScores,
          completionRate: totalAttempts > 0
            ? Math.round((submittedAttempts / totalAttempts) * 100)
            : 0,
        },
      },
      'Admin statistics retrieved'
    );
  });
}
