import { generateExaminerResponse, generateExaminerVoice } from "@/lib/ai/examiner/ExaminerEngine";
import type { ExaminerState, ConversationTurn } from "@/lib/ai/examiner/ExaminerEngine";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { ok, badRequest, payloadTooLarge, rateLimited } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { RequestBodyTooLargeError, readJsonWithLimit } from "@/lib/http/read-json-with-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_REQUEST_BYTES = 128 * 1024;
const STATES = [
  "introduction",
  "part1_questions",
  "part2_instructions",
  "part2_preparation",
  "part2_long_turn",
  "part2_followup",
  "part3_discussion",
  "closing",
  "completed",
] as const;

const schema = z.object({
  transcript: z.string().max(4_000),
  history: z.array(z.object({
    role: z.enum(["examiner", "student"]),
    text: z.string().max(4_000),
    timestamp: z.string().max(64),
  })).max(12).optional(),
  currentState: z.enum(STATES),
  examinerId: z.string().max(64).optional(),
});

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!rateLimit(`speaking-respond:${user.id}`, 30, 60 * 60).allowed) {
      return rateLimited("Speaking practice request limit reached. Try again later.");
    }

    let body: unknown;
    try {
      body = await readJsonWithLimit(req, MAX_REQUEST_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return payloadTooLarge("Speaking practice request is too large");
      }
      return badRequest("Invalid JSON body");
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid speaking practice request");

    const { transcript, history = [], currentState, examinerId } = parsed.data;

    const response = await generateExaminerResponse(
      transcript,
      history as ConversationTurn[],
      currentState as ExaminerState,
      examinerId
    );

    let audioBase64 = "";
    let audioMimeType = "audio/wav";
    try {
      const voiceResult = await generateExaminerVoice(response.text, examinerId);
      audioBase64 = voiceResult.audioBase64;
      audioMimeType = voiceResult.mimeType;
    } catch {
      // TTS is optional; the client can fall back to browser speech synthesis.
      console.error("[examiner-respond] TTS generation failed");
    }

    return ok({
      text: response.text,
      audioBase64,
      audioMimeType,
      nextState: response.nextState,
      isComplete: response.isComplete,
      topic: response.topic,
    }, "Practice response generated");
  });
}
