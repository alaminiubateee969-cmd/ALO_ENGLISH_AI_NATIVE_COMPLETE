/**
 * GET /api/courses/[id] — Get course detail with intakes + university
 */

import { db } from "@/lib/db";
import { ok, notFound } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const course = await db.course.findUnique({
      where: { id },
      include: {
        university: {
          include: { country: true },
        },
        intakes: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (!course) return notFound("Course not found");

    return ok({
      course: {
        id: course.id,
        name: course.name,
        level: course.level,
        duration: course.duration,
        tuitionFee: course.tuitionFee,
        currency: course.currency,
        description: course.description,
        entryRequirements: course.entryRequirements,
        university: {
          id: course.university.id,
          name: course.university.name,
          city: course.university.city,
          country: course.university.country?.name || null,
          website: course.university.website,
          description: course.university.description,
        },
        intakes: course.intakes.map((i) => ({
          id: i.id,
          month: i.month,
          year: i.year,
          deadline: i.deadline,
        })),
      },
    }, "Course detail retrieved");
  });
}
