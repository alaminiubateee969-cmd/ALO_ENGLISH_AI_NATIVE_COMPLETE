import { generateExaminerVoice } from "@/lib/ai/examiner/ExaminerEngine";
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
    const schema = z.object({ text: z.string().min(1).max(1024) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");
    const { text } = parsed.data;
    const voice = await generateExaminerVoice(text);
    return ok({ audioBase64: voice.audioBase64, mimeType: voice.mimeType }, "Voice generated");
  });
}
