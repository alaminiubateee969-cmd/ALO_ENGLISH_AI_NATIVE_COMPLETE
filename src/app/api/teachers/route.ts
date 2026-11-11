/**
 * GET /api/teachers — the AI teacher directory (public).
 *
 * Returns the teaching personas: one specialist per exam subject (grammar,
 * vocabulary, IELTS L/R/W/S, TOEFL, PTE, Duolingo, OET, GRE, study planning).
 * Public so the landing page and portals can show the faculty without a
 * session; asking a teacher a question still requires login (see /ask).
 */

import { teacherList } from "@/lib/agents/AITeachers";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    return ok({ teachers: teacherList() }, "AI teachers retrieved");
  });
}
