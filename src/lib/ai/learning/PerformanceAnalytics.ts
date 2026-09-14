/**
 * src/lib/ai/learning/PerformanceAnalytics.ts
 *
 * Performance Analytics — tracks question difficulty, discrimination,
 * and exam analytics over time.
 *
 * Updates the ExamAnalytics table after each exam, enabling:
 *   - Adaptive question selection (harder questions for strong students)
 *   - Question quality monitoring (flag bad questions)
 *   - Difficulty calibration
 *
 * Used by:
 *   DailyLearningLoop (batch update)
 *   /api/learning/analytics (read endpoint)
 */

import { db } from "@/lib/db";

export class PerformanceAnalytics {
  /**
   * Update question analytics for all questions used in the given period.
   * Calculates difficulty (proportion correct) and discrimination
   * (how well the question distinguishes strong from weak students).
   */
  static async updateQuestionAnalytics(since: Date): Promise<number> {
    // Fetch all submitted attempts in the period
    const attempts = await db.attempt.findMany({
      where: {
        status: "SUBMITTED",
        submittedAt: { gte: since },
      },
      include: {
        practiceSet: {
          include: { examType: true },
        },
        score: true,
      },
    });

    if (attempts.length === 0) return 0;

    let updatedCount = 0;

    // Group by exam type + question to compute analytics
    // Since answers are stored as JSON in the attempt (not normalized per question),
    // we compute section-level analytics from scores
    const examTypeStats: Record<string, { scores: number[]; count: number }> = {};

    for (const attempt of attempts) {
      const code = attempt.practiceSet?.examType?.code;
      if (!code) continue;
      if (!examTypeStats[code]) examTypeStats[code] = { scores: [], count: 0 };
      if (attempt.score) {
        examTypeStats[code].scores.push(attempt.score.overall);
        examTypeStats[code].count++;
      }
    }

    for (const [code, stats] of Object.entries(examTypeStats)) {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      const stdDev = this.stdDev(stats.scores);

      // Upsert exam analytics
      const existing = await db.examAnalytics.findFirst({
        where: { examTypeCode: code, questionId: null },
      });

      if (existing) {
        await db.examAnalytics.update({
          where: { id: existing.id },
          data: {
            totalAttempts: { increment: stats.count },
            avgScore: avgScore,
            difficulty: 1 - avgScore / 9.0, // higher difficulty = lower scores
            discrimination: stdDev / 9.0, // higher variance = better discrimination
            lastUpdated: new Date(),
          },
        });
      } else {
        await db.examAnalytics.create({
          data: {
            examTypeCode: code,
            questionId: null,
            totalAttempts: stats.count,
            avgScore: avgScore,
            difficulty: 1 - avgScore / 9.0,
            discrimination: stdDev / 9.0,
          },
        });
      }
      updatedCount++;
    }

    return updatedCount;
  }

  /**
   * Get analytics summary for a specific exam type.
   */
  static async getExamTypeAnalytics(examTypeCode: string): Promise<{
    totalAttempts: number;
    avgScore: number;
    difficulty: number;
    discrimination: number;
    sectionBreakdown: { listening: number | null; reading: number | null; writing: number | null; speaking: number | null };
  } | null> {
    const analytics = await db.examAnalytics.findFirst({
      where: { examTypeCode: examTypeCode, questionId: null },
    });

    if (!analytics) return null;

    // Get section averages from scores
    const scores = await db.score.findMany({
      where: {
        attempt: {
          practiceSet: { examType: { code: examTypeCode } },
        },
      },
      select: { listening: true, reading: true, writing: true, speaking: true },
    });

    const sectionAvg = (field: "listening" | "reading" | "writing" | "speaking") => {
      const values = scores.map((s) => s[field]).filter((v): v is number => v != null);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    };

    return {
      totalAttempts: analytics.totalAttempts,
      avgScore: analytics.avgScore,
      difficulty: analytics.difficulty,
      discrimination: analytics.discrimination,
      sectionBreakdown: {
        listening: sectionAvg("listening"),
        reading: sectionAvg("reading"),
        writing: sectionAvg("writing"),
        speaking: sectionAvg("speaking"),
      },
    };
  }

  /**
   * Get the overall learning dashboard data.
   */
  static async getDashboard(): Promise<{
    totalExams: number;
    totalStudents: number;
    avgScore: number;
    topWeaknesses: Array<{ area: string; occurrences: number }>;
    recentLearnings: Array<{ agentId: string; observation: string; date: Date }>;
    activeSpecialists: number;
    totalEvolutions: number;
  }> {
    const [totalScores, totalStudents, activeSpecialists, totalEvolutions, recentLearnings, topWeaknesses] = await Promise.all([
      db.score.count(),
      db.user.count({ where: { role: "STUDENT" } }),
      db.agentSpecialist.count({ where: { isActive: true } }),
      db.agentEvolution.count(),
      db.agentLearning.findMany({
        take: 10,
        orderBy: { learnDate: "desc" },
        select: { agentId: true, observation: true, learnDate: true },
      }),
      db.learningMemory.groupBy({
        by: ["weaknessArea"],
        _sum: { occurrences: true },
        orderBy: { _sum: { occurrences: "desc" } },
        take: 5,
      }),
    ]);

    const avgScoreResult = await db.score.aggregate({ _avg: { overall: true } });

    return {
      totalExams: totalScores,
      totalStudents,
      avgScore: avgScoreResult._avg.overall || 0,
      topWeaknesses: topWeaknesses.map((w) => ({
        area: w.weaknessArea,
        occurrences: w._sum.occurrences || 0,
      })),
      recentLearnings: recentLearnings.map((l) => ({
        agentId: l.agentId,
        observation: l.observation,
        date: l.learnDate,
      })),
      activeSpecialists,
      totalEvolutions,
    };
  }

  // ─── Standard Deviation Helper ─────────────────────────────────────

  private static stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
}
