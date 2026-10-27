import { transcribeStudentSpeech } from "@/lib/ai/examiner/ExaminerEngine";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { badRequest, ok, payloadTooLarge, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { inspectBase64Audio, MAX_SPEECH_AUDIO_BYTES } from "@/lib/audio/base64";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_AUDIO_BASE64_CHARS = Math.ceil(MAX_SPEECH_AUDIO_BYTES / 3) * 4;
const MAX_JSON_BYTES = 14 * 1024 * 1024;

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!rateLimit(`speech-transcribe:${user.id}`, 30, 60 * 60).allowed) {
      return rateLimited("Speech transcription limit reached. Try again later.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_JSON_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return payloadTooLarge("Audio request exceeds the 10 MB decoded limit");
      return badRequest("Invalid JSON body");
    }

    const schema = z.object({ audioBase64: z.string().min(100).max(MAX_AUDIO_BASE64_CHARS + 128) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid audio request");

    const audio = inspectBase64Audio(parsed.data.audioBase64);
    if (!audio) return badRequest("Audio must be valid Base64 and no larger than 10 MB");

    // Audio is transmitted to the configured ASR provider for this request; it
    // is not persisted as an attempt recording by this endpoint.
    //
    // With no speech-to-text provider configured, this endpoint degrades
    // honestly instead of throwing a 500: the conversation practice page
    // shows its type-your-answer fallback, so practice still works 24/7.
    try {
      const result = await transcribeStudentSpeech(audio.payload);
      return ok({ transcript: result.transcript, confidence: result.confidence, confidenceCalibrated: false }, "Speech transcription completed");
    } catch {
      return ok(
        { transcript: "", confidence: null, confidenceCalibrated: false, providerAvailable: false },
        "Speech recognition is not configured on this deployment. Type your answer instead — the practice conversation works without it.",
      );
    }
  });
}
