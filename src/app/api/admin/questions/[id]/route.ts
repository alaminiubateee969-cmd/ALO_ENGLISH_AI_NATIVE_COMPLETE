/**
 * GET    /api/admin/questions/[id] — fetch one question (with key)
 * PATCH  /api/admin/questions/[id] — edit (merged draft is re-validated)
 * DELETE /api/admin/questions/[id] — delete
 *
 * Admin-only. Past attempts are unaffected by edits/deletes because attempt
 * questions are frozen snapshots (AttemptQuestion) taken at start time.
 */

import { type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { badRequest, notFound, ok, unprocessable, withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { validateQuestionDraft, type QuestionDraft } from "@/lib/exam/question-validation";

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

    const question = await db.question.findUnique({ where: { id }, select: QUESTION_SELECT });
    if (!question) return notFound("No such question");

    return ok({ question });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.question.findUnique({ where: { id }, select: QUESTION_SELECT });
    if (!existing) return notFound("No such question");

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return badRequest("A JSON body is required");

    // Merge onto the stored row so a partial edit cannot strip the answer key
    // (e.g. fixing a typo in the prompt must not unkey the question).
    const merged: QuestionDraft = {
      section: existing.section,
      type: existing.type,
      prompt: existing.prompt,
      passage: existing.passage,
      audioUrl: existing.audioUrl,
      imageUrl: existing.imageUrl,
      options: existing.options,
      correctIndex: existing.correctIndex,
      correctAnswer: existing.correctAnswer,
      correctIndices: existing.correctIndices,
      wordLimit: existing.wordLimit,
      points: existing.points,
      order: existing.order,
      ...body,
    };

    const result = validateQuestionDraft(merged);
    if (!result.ok) return unprocessable(`Question is not valid: ${result.issues.join("; ")}`);

    const question = await db.question.update({
      where: { id },
      data: result.value,
      select: QUESTION_SELECT,
    });

    await audit("QUESTION_UPDATE", {
      userId: user.id,
      resource: `question:${id}`,
      ipAddress: getClientIp(req),
      metadata: { changed: Object.keys(body) },
    });

    return ok({ question });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.question.findUnique({
      where: { id },
      select: { id: true, practiceSetId: true },
    });
    if (!existing) return notFound("No such question");

    await db.question.delete({ where: { id } });

    await audit("QUESTION_DELETE", {
      userId: user.id,
      resource: `question:${id}`,
      ipAddress: getClientIp(req),
      metadata: { practiceSetId: existing.practiceSetId },
    });

    return ok({ deleted: true, id });
  });
}
