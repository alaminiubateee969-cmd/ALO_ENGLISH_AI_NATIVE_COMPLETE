/**
 * src/lib/ai/teachers/TeacherEngine.ts
 *
 * The answer engine behind the AI teachers.
 *
 * Design rule (same as the speaking examiner): the AI teachers must work
 * with ZERO AI providers configured. Every answer is grounded in the
 * platform's own study-material library:
 *
 *   1. keyword tips    — the teacher's built-in guidance for its subject
 *   2. library context — chunks retrieved from StudyMaterial (RAG)
 *   3. LLM answer      — when a provider IS configured, the teacher writes
 *                        a persona-voiced answer from that context
 *
 * If step 3 is unavailable (no provider / provider error), the engine
 * returns the best grounded deterministic answer instead of a 500 — an AI
 * teacher never goes "down".
 *
 * Used by: /api/teachers, /api/teachers/ask
 * CRITICAL: z-ai-web-dev-sdk MUST run server-side only.
 */

import ZAI from "z-ai-web-dev-sdk";
import { AI_TEACHERS, type AiTeacher } from "@/lib/agents/AITeachers";
import { RagEngine } from "@/lib/ai/rag/RagEngine";

export type TeacherTurn = {
  role: "teacher" | "student";
  text: string;
  timestamp?: string;
};

export type TeacherAnswer = {
  text: string;
  usedAi: boolean;
  materialTitle: string | null;
  citedFrom: string | null;
};

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

function buildSystemPrompt(teacher: AiTeacher, materialTitle: string | null, context: string): string {
  return `You are ${teacher.name}, an AI ${teacher.subject} teacher for ALO Education's free English-exam platform. You are not a human teacher, an official examiner, or a scored course, and you never promise exam results.

PERSONALITY: ${teacher.personality}

RULES:
1. Answer the student's question using the study-material context when it is relevant; you may add your own knowledge, but stay accurate and practical.
2. Keep answers focused: 120–220 words. Use short paragraphs or a compact list when it helps.
3. Always end with ONE concrete next action the student can do today on this platform (a drill, a mock section, the study-material library).
4. Be encouraging but honest; never invent scores, dates or policies.

STUDY MATERIAL: ${materialTitle || "none matched"}
CONTEXT:
${context || "(no matching library content — rely on your own expertise)"}`;
}

/**
 * Deterministic grounded answer: the teacher's own tip if the question
 * matches one, otherwise the best library chunk, otherwise the teacher's
 * default advice. Always ends with a next action.
 */
function deterministicAnswer(teacher: AiTeacher, question: string, chunks: string[], materialTitle: string | null): TeacherAnswer {
  const q = question.toLowerCase();

  const tip = teacher.tips.find((t) => t.keywords.some((k) => q.includes(k)));
  if (tip) {
    return {
      text: `${tip.tip}\n\nNext step: run one timed practice section today and apply exactly this tactic — then ask me what to fix next.`,
      usedAi: false,
      materialTitle: materialTitle,
      citedFrom: chunks[0]?.substring(0, 200) || null,
    };
  }

  if (chunks.length > 0) {
    const excerpt = chunks[0].trim().slice(0, 900);
    const second = chunks[1] ? `\n\nAlso relevant: ${chunks[1].trim().slice(0, 250)}…` : "";
    return {
      text: `Here is what your study-material library says about that:\n\n${excerpt}${second}\n\nYou can read the full guide in Study Materials. Next step: turn this into one 15-minute drill today — ask me and I will set it.`,
      usedAi: false,
      materialTitle: materialTitle,
      citedFrom: chunks[0].substring(0, 200) || null,
    };
  }

  return {
    text: `${teacher.defaultAdvice}\n\nNext step: open the Study Materials library and read the ${teacher.subject} guide, then bring me your first question about it.`,
    usedAi: false,
    materialTitle: null,
    citedFrom: null,
  };
}

export async function answerQuestion(
  teacherId: string,
  question: string,
  history: TeacherTurn[] = [],
): Promise<TeacherAnswer> {
  const teacher = AI_TEACHERS.find((t) => t.id === teacherId) || AI_TEACHERS[0];

  // Ground every answer in the library. Search the teacher's subject first,
  // then fall back to the whole library.
  let context = await RagEngine.retrieve(question, teacher.categoryHint).catch(() => ({ chunks: [] as string[], materialTitle: null as string | null }));
  if (context.chunks.length === 0) {
    context = await RagEngine.retrieve(question).catch(() => ({ chunks: [] as string[], materialTitle: null as string | null }));
  }

  try {
    // Created inside the try on purpose: with no provider configured,
    // ZAI.create() throws and the grounded deterministic answer below must
    // take over — an AI teacher never returns a 500 for a missing provider.
    const zai = await getZAI();
    const grounding = context.chunks.slice(0, 3).join("\n\n---\n\n");
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: buildSystemPrompt(teacher, context.materialTitle, grounding) },
        ...history.slice(-8).map((turn) => ({
          role: turn.role === "teacher" ? ("assistant" as const) : ("user" as const),
          content: turn.text.slice(0, 2000),
        })),
        { role: "user", content: question.slice(0, 2000) },
      ],
      thinking: { type: "disabled" },
    });

    const text = (completion.choices[0]?.message?.content || "").trim();
    if (!text) throw new Error("empty completion");

    return {
      text,
      usedAi: true,
      materialTitle: context.materialTitle,
      citedFrom: context.chunks[0]?.substring(0, 200) || null,
    };
  } catch {
    return deterministicAnswer(teacher, question, context.chunks, context.materialTitle);
  }
}
