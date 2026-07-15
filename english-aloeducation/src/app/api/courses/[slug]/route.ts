import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

/**
 * GET /api/courses/[slug]
 * Public course detail by slug.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        classes: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        resources: true,
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course || !course.isActive) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...course,
        price: toNumber(course.price),
      },
    });
  } catch (err) {
    console.error("[GET /api/courses/:slug] failed:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}
