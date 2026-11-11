/**
 * GET /api/learning-memory — read-only practice focus suggestions.
 *
 * Only current deterministic listening/reading indicators are considered.
 * Historical subjective scores, confidence, and previously generated memories
 * are not used because their provenance and calibration are not verified.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const scores = await db.score.findMany({
      where: { userId: user.id, providerUsed: "deterministic_objective" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { overall: true, listening: true, reading: true },
    });

    if (scores.length === 0) {
      return ok({
        practiceFocus: [],
        message: "Submit an attempt with objective listening or reading questions to see non-calibrated practice focus suggestions.",
        objectiveIndicatorCount: 0,
        disclosure: "These suggestions use a simple threshold on generic practice indicators; they are not validated learning diagnoses or official scores.",
      }, "No objective practice history available");
    }

    const practiceFocus: Array<{
      section: "listening" | "reading";
      averageIndicator: number;
      attempts: number;
      suggestion: string;
    }> = [];

    for (const section of ["listening", "reading"] as const) {
      const values = scores
        .map((score) => score[section])
        .filter((value): value is number => value !== null && Number.isFinite(value));
      if (values.length === 0) continue;
      const averageIndicator = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
      if (averageIndicator < 6) {
        practiceFocus.push({
          section,
          averageIndicator,
          attempts: values.length,
          suggestion: section === "listening"
            ? "Review missed listening questions and practise note-taking with authorized materials."
            : "Review missed reading questions and practise locating evidence in the passage.",
        });
      }
    }

    return ok({
      practiceFocus,
      objectiveIndicatorCount: scores.length,
      disclosure: "Simple, unvalidated practice focus suggestions from objective answer accuracy only; not a learning diagnosis or official score.",
    }, "Practice focus suggestions retrieved");
  });
}
