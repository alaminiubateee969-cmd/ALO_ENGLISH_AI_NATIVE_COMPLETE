import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const createAttemptSchema = z.object({
  studentId: z.string().min(1),
  examTypeId: z.string().min(1),
  mockTestId: z.string().optional().nullable(),
  mode: z.enum(["quick", "full"]).default("quick"),
});

/**
 * POST /api/exam-attempts
 * Start a new exam attempt for the authenticated student.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students may start attempts" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { studentId, examTypeId, mockTestId, mode } = parsed.data;

  try {
    // Ensure the student record belongs to the authenticated user.
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true },
    });
    if (!student || student.userId !== session.user.id) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const examType = await prisma.examType.findUnique({
      where: { id: examTypeId },
      select: { id: true, isActive: true, duration: true },
    });
    if (!examType || !examType.isActive) {
      return NextResponse.json({ error: "Exam type not found" }, { status: 404 });
    }

    if (mockTestId) {
      const mt = await prisma.mockTest.findUnique({
        where: { id: mockTestId },
        select: { id: true, examTypeId: true, isPublished: true },
      });
      if (!mt || !mt.isPublished || mt.examTypeId !== examTypeId) {
        return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
      }
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + examType.duration * 60 * 1000);

    const attempt = await prisma.examAttempt.create({
      data: {
        attemptCode: generateCode("ATT"),
        studentId,
        examTypeId,
        mockTestId: mockTestId ?? null,
        mode,
        status: "IN_PROGRESS",
        startedAt,
        expiresAt,
      },
    });

    return NextResponse.json({ data: attempt }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/exam-attempts] failed:", err);
    return NextResponse.json({ error: "Failed to start attempt" }, { status: 500 });
  }
}

/**
 * GET /api/exam-attempts
 * List attempts for the authenticated student (or all attempts for admins).
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

    const [attempts, total] = await Promise.all([
      prisma.examAttempt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          examType: { select: { id: true, name: true, slug: true, code: true } },
          mockTest: { select: { id: true, title: true } },
        },
      }),
      prisma.examAttempt.count({ where }),
    ]);

    return NextResponse.json({ data: attempts, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/exam-attempts] failed:", err);
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
