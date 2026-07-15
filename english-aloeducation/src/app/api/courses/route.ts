import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

/**
 * GET /api/courses
 * Public catalog of active courses. Supports `?category=` filtering
 * and `?limit=` (default 50, max 200).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
          ...(level ? { level } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: {
              enrollments: true,
              classes: true,
            },
          },
        },
      }),
      prisma.course.count({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
          ...(level ? { level } : {}),
        },
      }),
    ]);

    const data = courses.map((c) => ({
      ...c,
      price: toNumber(c.price),
    }));

    return NextResponse.json({ data, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/courses] failed:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
