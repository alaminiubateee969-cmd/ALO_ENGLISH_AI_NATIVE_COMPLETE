/**
 * src/lib/ai/learning/DailyLearningLoop.ts
 *
 * Daily Learning Loop — the system learns from every exam taken.
 *
 * Every day (or on-demand), this loop:
 *   1. Collects all exams taken in the last 24 hours
 *   2. Analyzes patterns: common weaknesses, question difficulty, scoring accuracy
 *   3. Extracts insights per agent (examiner, evaluator, question generator)
 *   4. Stores learnings in AgentLearning table
 *   5. Feeds insights to AgentSelfBuilder for potential improvements
 *
 * This is the "দৈনিক শেখা" (daily learning) the user requested.
 *
 * Used by:
 *   /api/learning/daily (cron-triggered or manual)
 *   scripts/generate-daily-questions.ts
 */

import { db } from "@/lib/db";
import { AgentSelfBuilder } from "./AgentSelfBuilder";
import { PerformanceAnalytics } from "./PerformanceAnalytics";

export type DailyLearningResult = {
  date: string;
  examsAnalyzed: number;
  insightsGenerated: number;
  agentsImproved: number;
  newSpecialistsCreated: number;
  topWeaknesses: Array<{ area: string; occurrences: number }>;
  topStrengths: Array<{ area: string; occurrences: number }>;
  recommendations: string[];
};

type Insight = {
  agentId: string;
  agentType: "EXAMINER" | "EVALUATOR" | "QUESTION_GENERATOR" | "ORCHESTRATOR";
  type: "WEAKNESS" | "STRENGTH" | "INFO";
  area: string;
  severity: number;
  description: string;
  insight: string;
  metricType?: string;
  metricValue?: number;
  examTypeCode?: string;
};

type ScoreWithRelations = {
  id: string;
  userId: string;
  overall: number;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  confidence: number;
  fallbackUsed: boolean;
  attempt: {
    practiceSet: {
      examType: { code: string } | null;
    } | null;
  } | null;
};

export class DailyLearningLoop {
  /**
   * Run the daily learning loop.
   * Analyzes all exams from the last 24 hours (or a custom date range).
   */
  static async run(daysBack: number = 1): Promise<DailyLearningResult> {
    const now = new Date();
    const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const dateStr = now.toISOString().split("T")[0];

    // 1. Collect all scored attempts in the period
    const recentScores: ScoreWithRelations[] = await db.score.findMany({
      where: { createdAt: { gte: since } },
      include: {
        attempt: {
          include: {
            practiceSet: { include: { examType: true } },
          },
        },
      },
    });

    if (recentScores.length === 0) {
      return {
        date: dateStr,
        examsAnalyzed: 0,
        insightsGenerated: 0,
        agentsImproved: 0,
        newSpecialistsCreated: 0,
        topWeaknesses: [],
        topStrengths: [],
        recommendations: ["No exams taken in the last 24 hours. Encourage more practice."],
      };
    }

    // 2. Analyze patterns
    const insights = this.analyzePatterns(recentScores);

    // 3. Store learnings per agent
    await this.storeLearnings(insights);

    // 4. Update question analytics (difficulty, discrimination)
    await PerformanceAnalytics.updateQuestionAnalytics(since);

    // 5. Feed insights to AgentSelfBuilder for potential improvements
    const evolutionResult = await AgentSelfBuilder.evaluateAndEvolve(insights);

    // 6. Update learning memory for each student
    await this.updateStudentLearningMemory(recentScores);

    // 7. Generate recommendations
    const recommendations = this.generateRecommendations(insights, recentScores.length);

    return {
      date: dateStr,
      examsAnalyzed: recentScores.length,
      insightsGenerated: insights.length,
      agentsImproved: evolutionResult.agentsImproved,
      newSpecialistsCreated: evolutionResult.newSpecialistsCreated,
      topWeaknesses: insights
        .filter((i) => i.type === "WEAKNESS")
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 5)
        .map((i) => ({ area: i.area, occurrences: i.severity })),
      topStrengths: insights
        .filter((i) => i.type === "STRENGTH")
        .sort((a, b) => b.severity - a.severity)
        .slice(0, 5)
        .map((i) => ({ area: i.area, occurrences: i.severity })),
      recommendations,
    };
  }

  // ─── Pattern Analysis ──────────────────────────────────────────────

  private static analyzePatterns(scores: ScoreWithRelations[]): Insight[] {
    const insights: Insight[] = [];

    // Section-level weakness/strength detection
    const sectionScores: Record<string, number[]> = {
      listening: [],
      reading: [],
      writing: [],
      speaking: [],
    };

    for (const score of scores) {
      if (score.listening != null) sectionScores.listening.push(score.listening);
      if (score.reading != null) sectionScores.reading.push(score.reading);
      if (score.writing != null) sectionScores.writing.push(score.writing);
      if (score.speaking != null) sectionScores.speaking.push(score.speaking);
    }

    for (const [section, values] of Object.entries(sectionScores)) {
      if (values.length === 0) continue;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const examCode = scores[0]?.attempt?.practiceSet?.examType?.code;

      if (avg < 5.0) {
        insights.push({
          agentId: this.getAgentForSection(section),
          agentType: "EVALUATOR",
          type: "WEAKNESS",
          area: `${section}_low_performance`,
          severity: values.length,
          description: `Average ${section} score is ${avg.toFixed(1)}/9.0 across ${values.length} attempts. Students consistently struggle with this section.`,
          insight: `Consider generating more ${section} practice questions and providing targeted coaching prompts.`,
          metricType: "AVG_SCORE",
          metricValue: avg,
          examTypeCode: examCode,
        });
      } else if (avg >= 7.0) {
        insights.push({
          agentId: this.getAgentForSection(section),
          agentType: "EVALUATOR",
          type: "STRENGTH",
          area: `${section}_strong_performance`,
          severity: values.length,
          description: `Average ${section} score is ${avg.toFixed(1)}/9.0 — students perform well.`,
          insight: `This section's question difficulty can be increased to provide more challenge.`,
          metricType: "AVG_SCORE",
          metricValue: avg,
          examTypeCode: examCode,
        });
      }
    }

    // Confidence analysis
    const avgConfidence = scores.reduce((sum, s) => sum + s.confidence, 0) / scores.length;
    if (avgConfidence < 0.6) {
      insights.push({
        agentId: "orchestrator",
        agentType: "ORCHESTRATOR",
        type: "WEAKNESS",
        area: "low_evaluator_confidence",
        severity: scores.length,
        description: `Average evaluator confidence is ${(avgConfidence * 100).toFixed(0)}%. The AI evaluators are uncertain about their scoring.`,
        insight: `Consider adding more training data or adjusting the confidence thresholds. May need human review for borderline cases.`,
        metricType: "CONFIDENCE",
        metricValue: avgConfidence,
      });
    }

    // Provider fallback analysis
    const fallbackCount = scores.filter((s) => s.fallbackUsed).length;
    const fallbackRate = fallbackCount / scores.length;
    if (fallbackRate > 0.3) {
      insights.push({
        agentId: "model-router",
        agentType: "ORCHESTRATOR",
        type: "WEAKNESS",
        area: "high_fallback_rate",
        severity: fallbackCount,
        description: `${(fallbackRate * 100).toFixed(0)}% of exams used the fallback rule engine instead of AI. Primary AI provider may be unavailable.`,
        insight: `Check API key validity and provider status. Consider adding backup providers.`,
        metricType: "FALLBACK_RATE",
        metricValue: fallbackRate,
      });
    }

    // Exam type distribution
    const examTypeCounts: Record<string, number> = {};
    for (const score of scores) {
      const code = score.attempt?.practiceSet?.examType?.code;
      if (code) examTypeCounts[code] = (examTypeCounts[code] || 0) + 1;
    }
    for (const [code, count] of Object.entries(examTypeCounts)) {
      insights.push({
        agentId: "question-generator",
        agentType: "QUESTION_GENERATOR",
        type: "INFO",
        area: `${code}_usage`,
        severity: count,
        description: `${count} ${code} exams taken in this period.`,
        insight: count > 10 ? `High demand for ${code}. Ensure fresh daily questions are generated.` : `Low demand for ${code}. Consider promotional content.`,
        metricType: "USAGE",
        metricValue: count,
        examTypeCode: code,
      });
    }

    return insights;
  }

  // ─── Store Learnings ───────────────────────────────────────────────

  private static async storeLearnings(insights: Insight[]): Promise<void> {
    const learnDate = new Date();
    for (const insight of insights) {
      await db.agentLearning.create({
        data: {
          agentId: insight.agentId,
          agentType: insight.agentType,
          learnDate,
          examTypeCode: insight.examTypeCode || null,
          observation: insight.description,
          insight: insight.insight || null,
          metricType: insight.metricType || null,
          metricValue: insight.metricValue || null,
          sampleSize: insight.severity,
        },
      });
    }
  }

  // ─── Update Student Learning Memory ────────────────────────────────

  private static async updateStudentLearningMemory(scores: ScoreWithRelations[]): Promise<void> {
    for (const score of scores) {
      const userId = score.userId;
      const sections: Array<{ name: string; score: number | null; type: string }> = [
        { name: "listening", score: score.listening, type: "FLUENCY" },
        { name: "reading", score: score.reading, type: "FLUENCY" },
        { name: "writing", score: score.writing, type: "GRAMMAR" },
        { name: "speaking", score: score.speaking, type: "PRONUNCIATION" },
      ];

      for (const section of sections) {
        if (section.score != null && section.score < 5.0) {
          const weaknessArea = `${section.name}_section_weakness`;
          const existing = await db.learningMemory.findUnique({
            where: { userId_weaknessArea: { userId, weaknessArea } },
          });

          if (existing) {
            await db.learningMemory.update({
              where: { id: existing.id },
              data: {
                occurrences: { increment: 1 },
                lastSeenAt: new Date(),
                metadata: JSON.stringify({ lastScore: section.score, date: new Date().toISOString() }),
              },
            });
          } else {
            await db.learningMemory.create({
              data: {
                userId,
                weaknessArea,
                weaknessType: section.type,
                occurrences: 1,
                metadata: JSON.stringify({ lastScore: section.score, date: new Date().toISOString() }),
              },
            });
          }
        }
      }
    }
  }

  // ─── Generate Recommendations ──────────────────────────────────────

  private static generateRecommendations(insights: Insight[], examCount: number): string[] {
    const recs: string[] = [];

    const weaknesses = insights.filter((i) => i.type === "WEAKNESS");
    const strengths = insights.filter((i) => i.type === "STRENGTH");

    if (weaknesses.length === 0 && examCount > 0) {
      recs.push("All sections performing adequately. Continue regular practice.");
    }

    for (const w of weaknesses.slice(0, 3)) {
      recs.push(`⚠️ ${w.insight}`);
    }

    for (const s of strengths.slice(0, 2)) {
      recs.push(`✓ ${s.insight}`);
    }

    if (examCount < 5) {
      recs.push("📊 Low exam volume. Send practice reminders to students.");
    }

    return recs;
  }

  // ─── Helper: Map section to agent ──────────────────────────────────

  private static getAgentForSection(section: string): string {
    const map: Record<string, string> = {
      listening: "examiner-01",
      reading: "examiner-03",
      writing: "writing-eval-agent",
      speaking: "speaking-eval-agent",
    };
    return map[section] || "orchestrator";
  }
}
