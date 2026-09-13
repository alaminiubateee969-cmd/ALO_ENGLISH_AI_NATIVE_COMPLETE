import ZAI from 'z-ai-web-dev-sdk';

export type ExaminerState = "introduction" | "part1_questions" | "part2_instructions" | "part2_preparation" | "part2_long_turn" | "part3_discussion" | "closing" | "completed";

export type ConversationTurn = { role: "examiner" | "student"; text: string; audioUrl?: string; timestamp: string };

const SYSTEM_PROMPT = `You are an AI English Speaking Examiner for ALO Education. Conduct an IELTS-style speaking test.
Rules: Be professional. Ask ONE question. Listen and ask contextual follow-ups. Never claim to be a human/official examiner.
Return JSON: {"text": "your examiner response"}`;

export async function generateExaminerResponse(transcript: string, history: ConversationTurn[], state: ExaminerState): Promise<{ text: string; nextState: ExaminerState; isComplete: boolean }> {
  const zai = await ZAI.create();
  const histText = history.map(t => `${t.role}: ${t.text}`).join("\n");
  const stateInstr: Record<string, string> = {
    introduction: "Introduce yourself as AI Examiner. Ask student to introduce themselves.",
    part1_questions: "Ask general questions (hobbies, work, hometown) based on their answers.",
    part2_instructions: "Explain Part 2: cue card topic 'Describe a memorable journey'. 1 min prep, 2 min speak.",
    part2_preparation: "Say: 'Take your time to prepare. Start when ready.'",
    part2_long_turn: "If they finish early, ask them to elaborate.",
    part3_discussion: "Ask abstract discussion questions about travel/journeys.",
    closing: "Thank them. Say test is complete. Results coming soon.",
    completed: "Test complete.",
  };
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `State: ${state}\nInstruction: ${stateInstr[state]}\nHistory:\n${histText}\n\nStudent said: "${transcript}"\n\nGenerate examiner response as JSON: {"text": "..."}` },
      ],
      thinking: { type: "disabled" },
    });
    const content = completion.choices[0]?.message?.content || "";
    let text = content;
    try { text = JSON.parse(content).text || content; } catch { const m = content.match(/"text"\s*:\s*"([^"]+)"/); text = m ? m[1] : content; }
    let nextState = state; let isComplete = false;
    const studentCount = history.filter(t => t.role === "student").length;
    if (state === "introduction" && transcript.length > 20) nextState = "part1_questions";
    else if (state === "part1_questions" && studentCount >= 3) nextState = "part2_instructions";
    else if (state === "part2_instructions") nextState = "part2_preparation";
    else if (state === "part2_preparation") nextState = "part2_long_turn";
    else if (state === "part2_long_turn" && transcript.length > 50) nextState = "part3_discussion";
    else if (state === "part3_discussion" && studentCount >= 6) nextState = "closing";
    else if (state === "closing") { nextState = "completed"; isComplete = true; }
    return { text, nextState, isComplete };
  } catch {
    const fallbacks: Record<string, string> = {
      introduction: "Hello, I am your AI Examiner. Welcome to the speaking test. Could you introduce yourself?",
      part1_questions: "That's interesting. Can you tell me more about that?",
      part2_instructions: "Now in Part 2, your topic is: Describe a memorable journey. You have 1 minute to prepare and 2 minutes to speak.",
      part2_preparation: "Take your time to prepare. Start when you're ready.",
      part2_long_turn: "Can you tell me more about that?",
      part3_discussion: "How has travel changed in recent years?",
      closing: "Thank you for your participation. The test is complete.",
      completed: "Test complete.",
    };
    return { text: fallbacks[state] || fallbacks.part1_questions, nextState: state, isComplete: state === "closing" };
  }
}

export async function generateExaminerVoice(text: string): Promise<{ audioBase64: string; mimeType: string }> {
  const zai = await ZAI.create();
  const tts = await zai.audio.tts.create({ input: text, voice: "tongtong", response_format: "wav" });
  const buf = tts.buffer || tts.audio || Buffer.from("");
  return { audioBase64: Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64"), mimeType: "audio/wav" };
}

export async function transcribeStudentSpeech(audioBase64: string): Promise<{ transcript: string; confidence: number }> {
  const zai = await ZAI.create();
  const asr = await zai.audio.asr.create({ file: audioBase64 } as any);
  return { transcript: asr.text || asr.transcript || "", confidence: asr.confidence || 0.8 };
}
