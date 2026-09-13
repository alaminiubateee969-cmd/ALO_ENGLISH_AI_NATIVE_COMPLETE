import { generateExaminerResponse, generateExaminerVoice } from "@/lib/ai/examiner/ExaminerEngine";
import type { ExaminerState, ConversationTurn } from "@/lib/ai/examiner/ExaminerEngine";
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
    const schema = z.object({
      transcript: z.string(),
      history: z.array(z.object({
        role: z.enum(["examiner", "student"]),
        text: z.string(),
        timestamp: z.string(),
      })).optional(),
      currentState: z.string(),
      examinerId: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { transcript, history = [], currentState, examinerId } = parsed.data;

    // Generate examiner response using LLM (with Bengali accent awareness)
    const response = await generateExaminerResponse(
      transcript,
      history as ConversationTurn[],
      currentState as ExaminerState,
      examinerId
    );

    // Generate examiner voice using TTS (mapped to persona voice)
    let audioBase64 = "";
    let audioMimeType = "audio/wav";
    try {
      const voiceResult = await generateExaminerVoice(response.text, examinerId);
      audioBase64 = voiceResult.audioBase64;
      audioMimeType = voiceResult.mimeType;
    } catch {
      // TTS failed — return text only, frontend can use browser speech synthesis as fallback
      console.error("[examiner-respond] TTS generation failed");
    }

    return ok({
      text: response.text,
      audioBase64,
      audioMimeType,
      nextState: response.nextState,
      isComplete: response.isComplete,
      topic: response.topic,
    }, "Examiner response generated");
  });
}
