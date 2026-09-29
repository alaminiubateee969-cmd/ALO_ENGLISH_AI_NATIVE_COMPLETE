/** Public production readiness probe. Returns 503 for DB or exam-data failure. */
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || 'unknown';
  try {
    await db.$queryRaw`SELECT 1`;
    const [activeExamTypes, playableSets, playableQuestions, orphanStudents] = await Promise.all([
      db.examType.count({ where: { isActive: true } }),
      db.practiceSet.count({ where: {
        isActive: true, durationMin: { gt: 0 }, examType: { isActive: true },
        questions: { some: { status: 'ACTIVE' } },
      } }),
      db.question.count({ where: {
        status: 'ACTIVE', prompt: { not: '' }, points: { gt: 0 },
        practiceSet: { isActive: true, examType: { isActive: true } },
      } }),
      db.student.count({ where: { userId: null } }),
    ]);

    const checks = {
      application: 'running', database: 'connected', requiredTables: 'available',
      activeExamTypes, playableSets, playableQuestions, orphanStudents,
    };
    const healthy = activeExamTypes > 0 && playableSets > 0 && playableQuestions > 0 && orphanStudents === 0;
    return NextResponse.json(
      { status: healthy ? 'healthy' : 'unhealthy', version, timestamp, checks },
      { status: healthy ? 200 : 503 }
    );
  } catch {
    return NextResponse.json({
      status: 'unhealthy', version, timestamp,
      checks: { application: 'running', database: 'disconnected', requiredTables: 'unavailable' },
    }, { status: 503 });
  }
}
