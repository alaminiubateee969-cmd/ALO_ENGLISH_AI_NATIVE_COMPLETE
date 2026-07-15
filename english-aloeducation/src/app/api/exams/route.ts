import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/exams
 * Public list of active exam types (IELTS, PTE, TOEFL, etc.).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const includeSections = searchParams.get("includeSections") === "true";

  try {
    const examTypes = await prisma.examType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: includeSections
        ? {
            sections: {
              orderBy: { sortOrder: "asc" },
            },
          }
        : undefined,
    });

    return NextResponse.json({ data: examTypes });
  } catch (err) {
    console.error("[GET /api/exams] failed:", err);
    return NextResponse.json({ error: "Failed to fetch exam types" }, { status: 500 });
  }
}
