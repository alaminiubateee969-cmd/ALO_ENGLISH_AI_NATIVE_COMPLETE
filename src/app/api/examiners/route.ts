/**
 * GET /api/examiners — List all AI examiners (5 Bengali examiners).
 */

import { AI_EXAMINERS } from "@/lib/agents/AIExaminers";
import { ok } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/examiners — List all AI examiners (10 Bengali practice guides:
 * 5 female + 5 male, each with a unique skill specialization).
 *
 * The list is public so the practice picker, landing page and portals can show
 * the faculty without a session; an actual conversation still requires login
 * via the speaking routes.
 */
export async function GET(): Promise<Response> {
  return ok(
    {
      examiners: AI_EXAMINERS.map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        specialization: e.specialization,
        gender: e.gender,
        avatarUrl: e.avatarUrl,
        avatarDescription: e.avatarDescription,
        personality: e.personality,
        accentAwareness: e.accentAwareness,
        evaluationFocus: e.evaluationFocus,
        greetingMessage: e.greetingMessage,
      })),
      total: AI_EXAMINERS.length,
      femaleCount: AI_EXAMINERS.filter((e) => e.gender === 'female').length,
      maleCount: AI_EXAMINERS.filter((e) => e.gender === 'male').length,
    },
    "AI examiners retrieved"
  );
}
