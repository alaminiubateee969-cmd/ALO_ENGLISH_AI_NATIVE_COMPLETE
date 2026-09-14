/**
 * src/lib/ai/learning/AgentSelfBuilder.ts
 *
 * Agent Self-Builder — agents create new specialized agents based on
 * performance gaps identified by the DailyLearningLoop.
 *
 * The "ডান হাত বাম হাত" (right hand, left hand) gradual building the user
 * described: agents slowly build new specialist agents one by one.
 *
 * When a pattern is detected (e.g., "Bengali students consistently drop
 * articles in speaking"), this builder:
 *   1. Creates a new AgentSpecialist with a focused config
 *   2. Records an AgentEvolution entry
 *   3. The new specialist handles future exams matching that pattern
 *
 * All changes are tracked for auditability.
 */

import { db } from "@/lib/db";

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

export type EvolutionResult = {
  agentsImproved: number;
  newSpecialistsCreated: number;
  evolutions: Array<{
    agentId: string;
    changeType: string;
    description: string;
  }>;
};

export class AgentSelfBuilder {
  /**
   * Evaluate insights and evolve agents accordingly.
   * This is the core self-improvement loop.
   */
  static async evaluateAndEvolve(insights: Insight[]): Promise<EvolutionResult> {
    const evolutions: Array<{ agentId: string; changeType: string; description: string }> = [];
    let agentsImproved = 0;
    let newSpecialistsCreated = 0;

    for (const insight of insights) {
      // Only act on weaknesses with sufficient severity (at least 3 occurrences)
      if (insight.type !== "WEAKNESS" || insight.severity < 3) continue;

      const action = this.determineAction(insight);

      if (action.type === "CREATE_SPECIALIST") {
        // Check if a specialist for this area already exists
        const existing = await db.agentSpecialist.findFirst({
          where: {
            specialization: action.specialization!,
            isActive: true,
          },
        });

        if (!existing) {
          // Create new specialist agent
          const specialist = await db.agentSpecialist.create({
            data: {
              name: action.name!,
              specialization: action.specialization!,
              parentAgentId: insight.agentId,
              examTypeCode: insight.examTypeCode || null,
              config: JSON.stringify(action.config),
              createdById: "auto",
            },
          });

          // Record the evolution
          await db.agentEvolution.create({
            data: {
              agentId: insight.agentId,
              version: await this.getNextVersion(insight.agentId),
              changeType: "NEW_SPECIALIST",
              description: `Created new specialist agent "${specialist.name}" for ${action.specialization}. Trigger: ${insight.description}`,
              triggerMetric: insight.metricType || null,
              triggerValue: insight.metricValue || null,
              newConfig: JSON.stringify(action.config),
              approvedBy: "auto",
              deployedAt: new Date(),
              isActive: true,
            },
          });

          newSpecialistsCreated++;
          evolutions.push({
            agentId: insight.agentId,
            changeType: "NEW_SPECIALIST",
            description: `Created specialist: ${specialist.name}`,
          });
        }
      } else if (action.type === "PARAMETER_TUNING") {
        // Adjust agent parameters based on the insight
        await db.agentEvolution.create({
          data: {
            agentId: insight.agentId,
            version: await this.getNextVersion(insight.agentId),
            changeType: "PARAMETER_TUNING",
            description: action.description,
            triggerMetric: insight.metricType || null,
            triggerValue: insight.metricValue || null,
            newConfig: JSON.stringify(action.config),
            approvedBy: "auto",
            deployedAt: new Date(),
            isActive: true,
          },
        });

        agentsImproved++;
        evolutions.push({
          agentId: insight.agentId,
          changeType: "PARAMETER_TUNING",
          description: action.description,
        });
      }
    }

    return { agentsImproved, newSpecialistsCreated, evolutions };
  }

  // ─── Determine what action to take for an insight ──────────────────

  private static determineAction(insight: Insight): {
    type: "CREATE_SPECIALIST" | "PARAMETER_TUNING" | "NO_ACTION";
    name?: string;
    specialization?: string;
    description: string;
    config: Record<string, unknown>;
  } {
    const area = insight.area.toLowerCase();

    // Speaking weakness → create a speaking coach specialist
    if (area.includes("speaking_low")) {
      return {
        type: "CREATE_SPECIALIST",
        name: `Speaking Coach — ${insight.examTypeCode || "General"}`,
        specialization: "Speaking-Fluency-Coaching",
        description: `New specialist for speaking fluency coaching, triggered by low speaking scores.`,
        config: {
          focus: "fluency",
          promptStrategy: "encourage_elaboration",
          minResponseLength: 50,
          followUpStyle: "elaboration_prompt",
          accentAwareness: true,
        },
      };
    }

    // Writing weakness → create a writing coach specialist
    if (area.includes("writing_low")) {
      return {
        type: "CREATE_SPECIALIST",
        name: `Writing Coach — ${insight.examTypeCode || "General"}`,
        specialization: "Writing-Structure-Coaching",
        description: `New specialist for writing structure coaching, triggered by low writing scores.`,
        config: {
          focus: "task_achievement",
          promptStrategy: "structure_guidance",
          wordLimitEnforcement: true,
          feedbackStyle: "detailed",
        },
      };
    }

    // Listening weakness → create a listening specialist
    if (area.includes("listening_low")) {
      return {
        type: "CREATE_SPECIALIST",
        name: `Listening Coach — ${insight.examTypeCode || "General"}`,
        specialization: "Listening-Comprehension-Coaching",
        description: `New specialist for listening comprehension coaching.`,
        config: {
          focus: "listening",
          promptStrategy: "keyword_highlighting",
          playbackSpeed: 0.9,
          repetitionAllowed: true,
        },
      };
    }

    // Reading weakness → create a reading specialist
    if (area.includes("reading_low")) {
      return {
        type: "CREATE_SPECIALIST",
        name: `Reading Coach — ${insight.examTypeCode || "General"}`,
        specialization: "Reading-Strategy-Coaching",
        description: `New specialist for reading strategy coaching.`,
        config: {
          focus: "reading",
          promptStrategy: "skimming_scanning_guidance",
          timeManagement: true,
        },
      };
    }

    // Low confidence → tune confidence thresholds
    if (area.includes("low_evaluator_confidence")) {
      return {
        type: "PARAMETER_TUNING",
        description: `Lowered auto-deploy confidence threshold due to persistent low evaluator confidence. More exams will route to human review.`,
        config: {
          change: "confidence_threshold_adjustment",
          previousThreshold: 0.7,
          newThreshold: 0.6,
          reason: "Evaluators showing uncertainty — route more to review",
        },
      };
    }

    // High fallback rate → tune model router
    if (area.includes("high_fallback_rate")) {
      return {
        type: "PARAMETER_TUNING",
        description: `Adjusted model router fallback strategy due to high fallback rate. Added retry logic before falling back to rule engine.`,
        config: {
          change: "fallback_retry_addition",
          maxRetries: 2,
          retryDelayMs: 1000,
          reason: "Primary provider failing too often",
        },
      };
    }

    return {
      type: "NO_ACTION",
      description: "No action needed for this insight.",
      config: {},
    };
  }

  // ─── Get next version number for an agent ──────────────────────────

  private static async getNextVersion(agentId: string): Promise<number> {
    const lastEvolution = await db.agentEvolution.findFirst({
      where: { agentId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (lastEvolution?.version || 0) + 1;
  }

  // ─── Get all active specialists (for the orchestrator to use) ──────

  static async getActiveSpecialists(examTypeCode?: string): Promise<Array<{
    id: string;
    name: string;
    specialization: string;
    config: Record<string, unknown>;
    performance: number;
    totalExams: number;
  }>> {
    const where: { isActive: boolean; examTypeCode?: string } = { isActive: true };
    if (examTypeCode) where.examTypeCode = examTypeCode;

    const specialists = await db.agentSpecialist.findMany({ where });

    return specialists.map((s) => ({
      id: s.id,
      name: s.name,
      specialization: s.specialization,
      config: JSON.parse(s.config),
      performance: s.performance,
      totalExams: s.totalExams,
    }));
  }

  // ─── Update specialist performance after an exam ───────────────────

  static async updateSpecialistPerformance(
    specialistId: string,
    examScore: number
  ): Promise<void> {
    const specialist = await db.agentSpecialist.findUnique({
      where: { id: specialistId },
    });

    if (!specialist) return;

    // Rolling average: new_perf = (old_perf * n + new_score) / (n+1)
    // Normalize exam score (0-9) to 0-1
    const normalizedScore = examScore / 9.0;
    const newTotal = specialist.totalExams + 1;
    const newPerformance =
      (specialist.performance * specialist.totalExams + normalizedScore) / newTotal;

    await db.agentSpecialist.update({
      where: { id: specialistId },
      data: {
        performance: newPerformance,
        totalExams: newTotal,
      },
    });
  }
}
