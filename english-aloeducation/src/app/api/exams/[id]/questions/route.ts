import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

/**
 * GET /api/exams/[id]/questions
 * List published questions for a given exam type.
 *
 * Public-ish: questions with `isPublished = true` and `isActive = true`
 * are returned. Sensitive fields (`correctAnswer`, `correctIndices`,
 * `numericAnswer`, `modelAnswer`, `explanation`) are stripped so this
 * payload can be safely sent to the browser before submission.
 *
 * Query params:
 *   - sectionId: filter by section
 *   - type: filter by QuestionType
 *   - difficulty: filter by Difficulty
 *   - limit: max 200 (default 100)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const sectionId = searchParams.get("sectionId");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    const examType = await prisma.examType.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!examType || !examType.isActive) {
      return NextResponse.json({ error: "Exam type not found" }, { status: 404 });
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: {
          examTypeId: id,
          isActive: true,
          isPublished: true,
          ...(sectionId ? { sectionId } : {}),
          ...(type ? { type: type as never } : {}),
          ...(difficulty ? { difficulty: difficulty as never } : {}),
        },
        orderBy: [{ sectionId: "asc" }, { createdAt: "asc" }],
        take: limit,
        skip: offset,
        select: {
          id: true,
          questionCode: true,
          sectionId: true,
          type: true,
          difficulty: true,
          prompt: true,
          passage: true,
          audioScript: true,
          imagePrompt: true,
          options: true,
          scoreValue: true,
          tags: true,
          section: {
            select: { id: true, name: true, sortOrder: true },
          },
        },
      }),
      prisma.question.count({
        where: {
          examTypeId: id,
          isActive: true,
          isPublished: true,
          ...(sectionId ? { sectionId } : {}),
          ...(type ? { type: type as never } : {}),
          ...(difficulty ? { difficulty: difficulty as never } : {}),
        },
      }),
    ]);

    return NextResponse.json({ data: questions, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/exams/:id/questions] failed:", err);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}
