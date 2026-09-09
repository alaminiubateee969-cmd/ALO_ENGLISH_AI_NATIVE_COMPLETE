/**
 * GET /api/examiners — List all AI examiners (5 Bengali examiners).
 */

import { AI_EXAMINERS } from "@/lib/agents/AIExaminers";
import { ok } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return ok(
    {
      examiners: AI_EXAMINERS.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        avatarDescription: e.avatarDescription,
        personality: e.personality,
        accentAwareness: e.accentAwareness,
        evaluationFocus: e.evaluationFocus,
        greetingMessage: e.greetingMessage,
      })),
      total: AI_EXAMINERS.length,
    },
    "AI examiners retrieved"
  );
}
