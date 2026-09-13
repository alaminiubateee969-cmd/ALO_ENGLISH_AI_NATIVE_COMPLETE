/**
 * src/lib/ai/examiner/ExaminerEngine.ts
 *
 * Real-time Voice AI Examiner Engine — conducts a live, conversational
 * IELTS-style speaking test with:
 *   - Speech-to-Text (z-ai-web-dev-sdk ASR) for the student's spoken answers
 *   - LLM (z-ai-web-dev-sdk chat completions) for context-aware examiner replies
 *   - Text-to-Speech (z-ai-web-dev-sdk TTS) for the examiner's voice
 *   - Bengali-accent-aware examiner personas (from AIExaminers.ts)
 *
 * Used by:
 *   /api/speaking/transcribe   -> transcribeStudentSpeech()
 *   /api/speaking/examiner-respond -> generateExaminerResponse() + generateExaminerVoice()
 *   /api/speaking/examiner-voice -> generateExaminerVoice()
 *
 * CRITICAL: z-ai-web-dev-sdk MUST run server-side only.
 */

import ZAI from "z-ai-web-dev-sdk";
import { AI_EXAMINERS, type AIExaminer } from "@/lib/agents/AIExaminers";
import { ExaminerStateMachine, type ExaminerState } from "./ExaminerStateMachine";
import { ConversationMemory } from "./ConversationMemory";
import { FollowUpEngine } from "./FollowUpEngine";

export type { ExaminerState } from "./ExaminerStateMachine";

export type ConversationTurn = {
  role: "examiner" | "student";
  text: string;
  audioUrl?: string;
  timestamp: string;
};

export type ExaminerResponse = {
  text: string;
  audioBase64: string;
  mimeType: string;
  nextState: ExaminerState;
  isComplete: boolean;
  topic?: string;
};

// ─── Singleton SDK instance (reuse for performance) ────────────────────────
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ─── System Prompt (Bengali-accent-aware) ──────────────────────────────────
function buildSystemPrompt(examiner: AIExaminer): string {
  return `You are ${examiner.name}, ${examiner.title} at ALO Education. You are conducting an IELTS-style AI English Speaking Test.

YOUR PERSONALITY: ${examiner.personality}

ACCENT AWARENESS: ${examiner.accentAwareness}
You understand that Bengali (Bangladeshi) English speakers have natural accent patterns:
- v/w confusion (very -> wery) — do NOT penalize
- th/t or th/d (think -> tink, this -> dis) — do NOT penalize
- Article dropping (Bengali has no articles) — do NOT penalize
- Present continuous for habitual actions — do NOT penalize
Focus on COMMUNICATION and CONTENT, not accent perfection.

STRICT RULES:
1. Ask only ONE question at a time.
2. Listen carefully to the student's answer.
3. Ask context-aware follow-up questions based on what they said.
4. Be warm, professional, and encouraging.
5. NEVER claim to be a human or official examiner — you are an AI practice examiner.
6. Keep your responses SHORT (1-3 sentences) so the conversation feels natural and real-time.
7. If the student's answer is unclear or very short, gently ask them to elaborate.

Return ONLY valid JSON: {"text": "your examiner response"}`;
}

// ─── Examiner Response Generation (LLM) ───────────────────────────────────

export async function generateExaminerResponse(
  transcript: string,
  history: ConversationTurn[],
  state: ExaminerState,
  examinerId: string = AI_EXAMINERS[0].id
): Promise<{ text: string; nextState: ExaminerState; isComplete: boolean; topic?: string }> {
  const examiner = AI_EXAMINERS.find((e) => e.id === examinerId) || AI_EXAMINERS[0];
  const zai = await getZAI();

  const stateMachine = new ExaminerStateMachine();
  const stateInstruction = stateMachine.getInstructionForState(state);
  const memory = new ConversationMemory(history);
  const contextSummary = memory.getSummary();
  const followUpSuggestion = FollowUpEngine.suggestFollowUp(transcript, state, contextSummary);

  const histText = memory.getRecentTurns(6).map((t) => `${t.role.toUpperCase()}: ${t.text}`).join("\n");

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: buildSystemPrompt(examiner) },
        {
          role: "user",
          content: `CONVERSATION STATE: ${state}
STATE INSTRUCTION: ${stateInstruction}
${followUpSuggestion ? `FOLLOW-UP HINT: ${followUpSuggestion}` : ""}

RECENT CONVERSATION:
${histText}

STUDENT JUST SAID: "${transcript}"

As ${examiner.name}, generate your next response. Remember: short, warm, ONE question, JSON only.
{"text": "..."}`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "";

    // Extract text from JSON (handle both clean JSON and markdown-wrapped)
    let text = content;
    try {
      const parsed = JSON.parse(content);
      text = parsed.text || content;
    } catch {
      const m = content.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      text = m ? m[1] : content;
    }
    text = text.replace(/^["']|["']$/g, "").trim();

    if (!text) {
      text = stateMachine.getFallback(state);
    }

    // Compute next state
    const studentCount = history.filter((t) => t.role === "student").length + 1;
    const { nextState, isComplete } = stateMachine.advance(state, studentCount, transcript.length);
    const topic = stateMachine.getTopicForState(state);

    return { text, nextState, isComplete, topic };
  } catch (err) {
    // Fallback if LLM fails
    const fallbackText = stateMachine.getFallback(state);
    const { nextState, isComplete } = stateMachine.advance(state, history.filter((t) => t.role === "student").length + 1, transcript.length);
    return { text: fallbackText, nextState, isComplete };
  }
}

// ─── Examiner Voice Generation (TTS) ──────────────────────────────────────
/**
 * Convert examiner text to speech using z-ai-web-dev-sdk TTS.
 * Returns base64-encoded audio.
 *
 * Per TTS skill docs:
 *   - Use await response.arrayBuffer()
 *   - Convert with Buffer.from(new Uint8Array(arrayBuffer))
 *   - Max 1024 chars per request (we chunk if needed)
 *   - voice: tongtong (warm), xiaochen (professional), jam (British gentleman)
 */
export async function generateExaminerVoice(
  text: string,
  examinerId: string = AI_EXAMINERS[1].id
): Promise<{ audioBase64: string; mimeType: string }> {
  const examiner = AI_EXAMINERS.find((e) => e.id === examinerId) || AI_EXAMINERS[1];
  const zai = await getZAI();

  // Map examiner persona to a TTS voice
  const voiceMap: Record<string, string> = {
    "examiner-01": "xiaochen", // Dr. Anika — professional female
    "examiner-02": "jam", // Prof. Rifat — British gentleman
    "examiner-03": "xiaochen", // Dr. Nusrat — analytical female
    "examiner-04": "tongtong", // Mr. Tanvir — warm/approachable
    "examiner-05": "xiaochen", // Dr. Farzana — scholarly female
  };
  const voice = voiceMap[examiner.id] || "tongtong";

  // Chunk text if > 1024 chars (TTS API limit)
  const chunks = chunkText(text, 1000);

  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    try {
      const response = await zai.audio.tts.create({
        input: chunk,
        voice,
        speed: 1.0,
        response_format: "wav",
        stream: false,
      });

      // Per TTS skill: SDK returns a standard Response object
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));
      if (buffer.length > 0) {
        audioBuffers.push(buffer);
      }
    } catch (err) {
      console.error("[ExaminerEngine] TTS chunk failed:", err);
      // Continue with other chunks
    }
  }

  if (audioBuffers.length === 0) {
    return { audioBase64: "", mimeType: "audio/wav" };
  }

  // Concatenate all audio buffers
  const combined = audioBuffers.length === 1 ? audioBuffers[0] : Buffer.concat(audioBuffers);
  return {
    audioBase64: combined.toString("base64"),
    mimeType: "audio/wav",
  };
}

// ─── Student Speech Transcription (ASR) ───────────────────────────────────
/**
 * Transcribe the student's recorded speech using z-ai-web-dev-sdk ASR.
 *
 * Per ASR skill docs:
 *   - Convert audio to base64
 *   - Call zai.audio.asr.create({ file_base64: base64Audio })
 *   - Returns { text: "..." }
 */
export async function transcribeStudentSpeech(
  audioBase64: string
): Promise<{ transcript: string; confidence: number }> {
  const zai = await getZAI();

  try {
    // Strip data URL prefix if present (e.g. "data:audio/webm;base64,AAAA...")
    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z]+;base64,/, "");

    const response = await zai.audio.asr.create({
      file_base64: cleanBase64,
    });

    const transcript = response.text || response.transcript || "";
    const confidence = typeof response.confidence === "number" ? response.confidence : 0.85;

    return { transcript, confidence };
  } catch (err) {
    console.error("[ExaminerEngine] ASR failed:", err);
    return { transcript: "", confidence: 0 };
  }
}

// ─── Text Chunking Helper (for TTS 1024-char limit) ───────────────────────
function chunkText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}
