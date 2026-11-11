/**
 * GET  /api/admin/practice-sets/[id]/questions — list questions WITH keys
 * POST /api/admin/practice-sets/[id]/questions — add a validated question
 *
 * Admin-only. Answer keys are returned here because this surface is for
 * content authoring; the student-facing question delivery endpoints never do.
 * Creation goes through the shared question validator so every stored item is
 * gradeable by the exam engine (or deliberately subjective).
 */

import { type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { badRequest, created, notFound, ok, unprocessable, withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { validateQuestionDraft } from "@/lib/exam/question-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUESTION_SELECT = {
  id: true,
  practiceSetId: true,
  section: true,
  type: true,
  prompt: true,
  passage: true,
  audioUrl: true,
  imageUrl: true,
  options: true,
  correctAnswer: true,
  correctIndex: true,
  correctIndices: true,
  wordLimit: true,
  points: true,
  order: true,
  createdAt: true,
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const set = await db.practiceSet.findUnique({ where: { id }, select: { id: true } });
    if (!set) return notFound("No such practice set");

    const questions = await db.question.findMany({
      where: { practiceSetId: id },
      select: QUESTION_SELECT,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return ok({ questions });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const set = await db.practiceSet.findUnique({ where: { id }, select: { id: true } });
    if (!set) return notFound("No such practice set");

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return badRequest("A JSON body is required");

    const result = validateQuestionDraft(body);
    if (!result.ok) return unprocessable(`Question is not valid: ${result.issues.join("; ")}`);

    const data = { ...result.value };
    // Default new questions to the end of the set.
    if (body.order === undefined || body.order === null) {
      data.order = await db.question.count({ where: { practiceSetId: id } });
    }

    const question = await db.question.create({
      data: { ...data, practiceSetId: id },
      select: QUESTION_SELECT,
    });

    await audit("QUESTION_CREATE", {
      userId: user.id,
      resource: `question:${question.id}`,
      ipAddress: getClientIp(req),
      metadata: { practiceSetId: id, type: question.type, section: question.section },
    });

    return created({ question });
  });
}
