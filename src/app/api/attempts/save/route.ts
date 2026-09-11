import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");
    const schema = z.object({ attemptId: z.string().cuid(), questionId: z.string().cuid(), answer: z.string().min(1).max(10000) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    const { attemptId, questionId, answer } = parsed.data;
    const attempt = await db.attempt.findUnique({ where: { id: attemptId }, select: { userId: true, status: true } });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("Not your attempt");
    if (attempt.status !== "IN_PROGRESS") return badRequest("Attempt is not in progress");
    return ok({ saved: true, questionId, attemptId }, "Answer saved");
  });
}
