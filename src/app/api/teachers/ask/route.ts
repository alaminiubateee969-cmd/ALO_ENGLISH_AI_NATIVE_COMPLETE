/**
 * POST /api/teachers/ask — ask an AI teacher a question.
 *
 * Auth: any logged-in user (students practise; teachers/counsellors can test
 * what their students see). Rate-limited per user.
 *
 * Body: { teacherId, question, history? }
 * Returns: { text, usedAi, materialTitle, citedFrom }
 *
 * Works with zero AI providers configured: the engine grounds answers in the
 * study-material library and the teacher's built-in subject guidance, and
 * only uses the LLM when a provider exists (usedAi reports which happened).
 */

import { answerQuestion, type TeacherTurn } from "@/lib/ai/teachers/TeacherEngine";
import { AI_TEACHERS } from "@/lib/agents/AITeachers";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { badRequest, ok, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 128 * 1024;

const TEACHER_IDS = AI_TEACHERS.map((t) => t.id) as [string, ...string[]];

const schema = z.object({
  teacherId: z.enum(TEACHER_IDS),
  question: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["teacher", "student"]),
        text: z.string().max(2000),
        timestamp: z.string().max(64).optional(),
      }),
    )
    .max(12)
    .optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!rateLimit(`teachers-ask:${user.id}`, 40, 60 * 60).allowed) {
      return rateLimited("You have reached the AI-teacher question limit for this hour. Practice never disappears — try again shortly.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return badRequest("Question payload is too large");
      }
      return badRequest("Invalid JSON body");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Invalid question");
    }

    const { teacherId, question, history = [] } = parsed.data;
    const answer = await answerQuestion(teacherId, question, history as TeacherTurn[]);

    return ok(
      {
        teacherId,
        text: answer.text,
        usedAi: answer.usedAi,
        materialTitle: answer.materialTitle,
        citedFrom: answer.citedFrom,
      },
      "Answer generated",
    );
  });
}
