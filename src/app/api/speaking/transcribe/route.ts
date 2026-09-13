import { transcribeStudentSpeech } from "@/lib/ai/examiner/ExaminerEngine";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");
    const schema = z.object({ audioBase64: z.string().min(100) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");
    const { audioBase64 } = parsed.data;
    const result = await transcribeStudentSpeech(audioBase64);
    return ok({ transcript: result.transcript, confidence: result.confidence }, "Speech transcribed");
  });
}
