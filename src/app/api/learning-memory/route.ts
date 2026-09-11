/**
 * GET /api/learning-memory — Get student's weakness profile for personalized practice.
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
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (scores.length === 0) {
      return ok({
        weaknesses: [],
        message: "Take practice tests to get personalized recommendations.",
        totalTests: 0,
      }, "No learning history yet");
    }

    const weaknesses: Array<{ area: string; type: string; avgScore: number; occurrences: number }> = [];
    const sections = ["listening", "reading", "writing", "speaking"] as const;

    for (const section of sections) {
      const sectionScores = scores
        .map((s) => (s as any)[section])
        .filter((v): v is number => v !== null && v !== undefined && v > 0);

      if (sectionScores.length > 0) {
        const avg = sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length;
        if (avg < 6.0) {
          weaknesses.push({
            area: section,
            type: section === "writing" || section === "speaking" ? "PRODUCTION" : "RECEPTION",
            avgScore: Math.round(avg * 10) / 10,
            occurrences: sectionScores.length,
          });
        }
      }
    }

    const memories = await db.learningMemory.findMany({
      where: { userId: user.id, resolvedAt: null },
      orderBy: { occurrences: "desc" },
    });

    for (const w of weaknesses) {
      await db.learningMemory.upsert({
        where: { userId_weaknessArea: { userId: user.id, weaknessArea: w.area } },
        update: { occurrences: { increment: 1 }, lastSeenAt: new Date() },
        create: {
          userId: user.id,
          weaknessArea: w.area,
          weaknessType: w.type,
          occurrences: 1,
        },
      });
    }

    const recommendations: string[] = [];
    for (const w of weaknesses) {
      if (w.area === "writing") recommendations.push("Practice timed writing essays focusing on task achievement and coherence.");
      if (w.area === "speaking") recommendations.push("Practice speaking with cue cards and record yourself for fluency improvement.");
      if (w.area === "listening") recommendations.push("Listen to English podcasts daily and practice note-taking.");
      if (w.area === "reading") recommendations.push("Practice skimming and scanning techniques with timed reading exercises.");
    }

    return ok({
      weaknesses,
      memories: memories.map((m) => ({
        area: m.weaknessArea,
        type: m.weaknessType,
        occurrences: m.occurrences,
        lastSeen: m.lastSeenAt,
      })),
      recommendations,
      totalTests: scores.length,
      avgOverall: scores.length > 0
        ? Math.round((scores.reduce((sum, s) => sum + s.overall, 0) / scores.length) * 10) / 10
        : 0,
    }, "Learning memory retrieved");
  });
}
