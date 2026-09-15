/**
 * src/lib/ai/rag/RagEngine.ts
 *
 * RAG (Retrieval-Augmented Generation) Engine — ExamCite-style.
 *
 * Allows students to ask questions about study materials and get
 * AI-generated answers grounded in the source content (no hallucinations).
 *
 * Used by:
 *   /api/rag/ask — ask a question
 *   /api/rag/materials — list/upload study materials
 *   /ask-handbook — free public chat page (no signup required)
 */

import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export type RagAnswer = {
  answer: string;
  citedFrom: string | null;
  materialTitle: string | null;
  confidence: "high" | "medium" | "low";
  chunksUsed: number;
};

export type StudyMaterialSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  chunkCount: number;
  isPublic: boolean;
};

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export class RagEngine {
  static async ask(
    question: string,
    materialId?: string,
    category?: string
  ): Promise<RagAnswer> {
    const context = await this.retrieveContext(question, materialId, category);

    if (!context.chunks || context.chunks.length === 0) {
      return {
        answer: "I don't have study material covering that topic yet. Please try asking about IELTS, TOEFL, PTE, grammar, vocabulary, or upload relevant study material.",
        citedFrom: null,
        materialTitle: null,
        confidence: "low",
        chunksUsed: 0,
      };
    }

    const answer = await this.generateAnswer(question, context.chunks, context.materialTitle);

    return {
      answer: answer.text,
      citedFrom: context.chunks[0]?.substring(0, 200) + "...",
      materialTitle: context.materialTitle,
      confidence: answer.confidence,
      chunksUsed: context.chunks.length,
    };
  }

  private static async retrieveContext(
    question: string,
    materialId?: string,
    category?: string
  ): Promise<{ chunks: string[]; materialTitle: string | null }> {
    const where: {
      isActive: boolean;
      isPublic: boolean;
      id?: string;
      category?: string;
    } = {
      isActive: true,
      isPublic: true,
    };
    if (materialId) where.id = materialId;
    if (category) where.category = category;

    const materials = await db.studyMaterial.findMany({ where, take: 10 });

    if (materials.length === 0) {
      return { chunks: [], materialTitle: null };
    }

    const keywords = this.extractKeywords(question);

    const scored: Array<{ material: typeof materials[0]; score: number; chunks: string[] }> = [];

    for (const material of materials) {
      const chunks = this.chunkText(material.content, 500);
      const scoredChunks = chunks
        .map((chunk) => ({ chunk, score: this.scoreChunk(chunk, keywords) }))
        .filter((sc) => sc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (scoredChunks.length > 0) {
        scored.push({
          material,
          score: scoredChunks.reduce((sum, sc) => sum + sc.score, 0),
          chunks: scoredChunks.map((sc) => sc.chunk),
        });
      }
    }

    if (scored.length === 0) {
      return {
        chunks: [this.chunkText(materials[0].content, 500)[0]].filter(Boolean),
        materialTitle: materials[0].title,
      };
    }

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    return { chunks: best.chunks, materialTitle: best.material.title };
  }

  private static async generateAnswer(
    question: string,
    contextChunks: string[],
    materialTitle: string | null
  ): Promise<{ text: string; confidence: "high" | "medium" | "low" }> {
    const zai = await getZAI();
    const context = contextChunks.join("\n\n---\n\n");

    const systemPrompt = `You are an AI study assistant for ALO Education. Answer the student's question using ONLY the provided study material context.

Rules:
1. Answer based ONLY on the provided context — do not make up information.
2. If the context doesn't contain the answer, say "I don't have enough information to answer that."
3. Be clear, concise, and helpful.
4. Cite the source material in your answer (e.g., "According to [material title]...").
5. Use examples from the context when relevant.

Source material: ${materialTitle || "Study material"}

Context:
${context}`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        thinking: { type: "disabled" },
      });

      const text = completion.choices[0]?.message?.content || "I couldn't generate an answer. Please try rephrasing your question.";
      const confidence: "high" | "medium" | "low" =
        contextChunks.length >= 3 ? "high" : contextChunks.length >= 1 ? "medium" : "low";

      return { text, confidence };
    } catch (err) {
      console.error("[RagEngine] LLM failed:", err);
      return {
        text: "I'm having trouble generating an answer right now. Please try again later.",
        confidence: "low",
      };
    }
  }

  static async uploadMaterial(params: {
    title: string;
    description?: string;
    category: string;
    content: string;
    uploadedById?: string;
    isPublic?: boolean;
  }): Promise<{ id: string; chunkCount: number }> {
    const chunks = this.chunkText(params.content, 500);
    const material = await db.studyMaterial.create({
      data: {
        title: params.title,
        description: params.description || null,
        category: params.category,
        sourceType: "TEXT",
        content: params.content,
        chunkCount: chunks.length,
        uploadedById: params.uploadedById || null,
        isPublic: params.isPublic ?? true,
        isActive: true,
      },
    });
    return { id: material.id, chunkCount: chunks.length };
  }

  static async listMaterials(category?: string): Promise<StudyMaterialSummary[]> {
    const where: { isActive: boolean; isPublic: boolean; category?: string } = {
      isActive: true,
      isPublic: true,
    };
    if (category) where.category = category;

    const materials = await db.studyMaterial.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      chunkCount: m.chunkCount,
      isPublic: m.isPublic,
    }));
  }

  private static extractKeywords(text: string): string[] {
    const stopwords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "must", "can", "shall", "to", "of", "in",
      "for", "on", "with", "at", "by", "from", "as", "into", "through",
      "during", "before", "after", "above", "below", "and", "or", "but",
      "if", "then", "else", "when", "where", "why", "how", "all", "any",
      "each", "few", "more", "most", "other", "some", "i", "you", "he",
      "she", "we", "they", "me", "him", "her", "us", "my", "your", "his",
      "its", "our", "their", "this", "that", "these", "those", "what",
      "which", "who", "whom", "am", "it", "so", "very", "just", "also",
      "about", "there", "here", "not", "no", "yes",
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z']/g, ""))
      .filter((w) => w.length > 2 && !stopwords.has(w));
  }

  private static chunkText(text: string, chunkSize: number): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length <= chunkSize) {
        current += sentence;
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks;
  }

  private static scoreChunk(chunk: string, keywords: string[]): number {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    return score;
  }
}
