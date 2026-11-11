import { generateExaminerVoice } from "@/lib/ai/examiner/ExaminerEngine";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ok, badRequest, payloadTooLarge, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!rateLimit(`speaking-voice:${user.id}`, 60, 60 * 60).allowed) {
      return rateLimited("Speaking voice request limit reached. Try again later.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, 8 * 1024);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return payloadTooLarge("Voice request is too large");
      return badRequest("Invalid JSON body");
    }

    const schema = z.object({
      text: z.string().min(1).max(1_024),
      examinerId: z.string().max(64).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid voice request");

    const { text, examinerId } = parsed.data;
    try {
      const voice = await generateExaminerVoice(text, examinerId);
      return ok({ audioBase64: voice.audioBase64, mimeType: voice.mimeType }, "Practice voice generated");
    } catch {
      // No TTS provider configured (or the provider failed). Return empty
      // audio instead of a 500: the client automatically falls back to the
      // browser's built-in speech synthesis, so the practice conversation
      // keeps working with zero providers configured.
      return ok(
        { audioBase64: "", mimeType: "audio/wav", unavailable: true },
        "Voice synthesis is not configured; the browser's built-in speech is used instead.",
      );
    }
  });
}
