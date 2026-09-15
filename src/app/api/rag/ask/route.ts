/**
 * /api/rag/ask
 *
 * Ask a question to the RAG engine.
 * Public (no auth required) — like ExamCite's free handbook chat.
 *
 * POST { question, materialId?, category? } → { answer, citedFrom, materialTitle, confidence }
 */

import { RagEngine } from "@/lib/ai/rag/RagEngine";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      question: z.string().min(3).max(500),
      materialId: z.string().optional(),
      category: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { question, materialId, category } = parsed.data;
    const result = await RagEngine.ask(question, materialId, category);

    return ok(result, "Answer generated");
  });
}
