import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

/**
 * GET /api/results
 * List exam results for the authenticated student (or all results for
 * admins / examiners).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    let studentId: string | undefined;

    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ data: [], total: 0, limit, offset });
      }
      studentId = student.id;
    }

    const where = studentId ? { studentId } : {};

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          examType: { select: { id: true, name: true, slug: true, code: true } },
          attempt: {
            select: {
              id: true,
              attemptCode: true,
              mode: true,
              submittedAt: true,
            },
          },
          certificate: { select: { id: true, certificateCode: true } },
        },
      }),
      prisma.examResult.count({ where }),
    ]);

    return NextResponse.json({ data: results, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/results] failed:", err);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
