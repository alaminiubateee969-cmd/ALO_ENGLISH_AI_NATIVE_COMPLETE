/**
 * GET /api/teacher/overview — the teacher portal's single data endpoint.
 *
 * Auth: requires the TEACHER role.
 *
 * Teachers guide practice: they need to see students and how those students
 * are actually performing — recent attempts, scores and which exams they sit.
 * This is a read-only, purpose-built aggregate. Teachers deliberately do NOT
 * get the counselor CRM surface (no leads, no applications, no document
 * writes); anything a teacher needs to change goes through the staff who own
 * that record.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { forbidden, ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (user.role !== "TEACHER") {
      return forbidden("Only teachers can open the teacher portal.");
    }

    const [studentCount, teacherCount, materialCount, recentStudents, recentAttempts, examCounts] =
      await Promise.all([
        db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
        db.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
        db.studyMaterial.count({ where: { isActive: true, isPublic: true } }),
        db.user.findMany({
          where: { role: "STUDENT" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            studentProfile: { select: { studentCode: true, status: true } },
          },
        }),
        db.attempt.findMany({
          where: { status: { in: ["SUBMITTED", "SCORED"] } },
          orderBy: { submittedAt: "desc" },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            attemptNumber: true,
            user: { select: { name: true, email: true } },
            practiceSet: {
              select: {
                title: true,
                examType: { select: { code: true, name: true } },
              },
            },
            score: { select: { overall: true, providerUsed: true } },
          },
        }),
        db.attempt.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

    return ok({
      overview: {
        activeStudents: studentCount,
        teachers: teacherCount,
        studyMaterials: materialCount,
        attemptsByStatus: examCounts.map((row) => ({ status: row.status, count: row._count._all })),
      },
      students: recentStudents,
      recentAttempts: recentAttempts,
    }, "Teacher overview retrieved");
  });
}
