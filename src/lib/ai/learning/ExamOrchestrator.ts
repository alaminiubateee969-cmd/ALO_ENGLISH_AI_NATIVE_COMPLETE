/**
 * Read-only exam-content inventory for administrators.
 *
 * Counts do not establish a complete/current exam bank or official equivalence.
 * Automated daily-set creation, adaptive recommendations, and post-attempt
 * learning are disabled until their evidence and approval controls are tested.
 */

import { db } from "@/lib/db";

export type ExamTypeStatus = {
  code: string;
  name: string;
  isActive: boolean;
  totalQuestions: number;
  totalAttempts: number;
  averageObjectiveIndicator: number | null;
  hasDailySet: boolean;
  status: "NOT_VERIFIED" | "LOW_QUESTIONS" | "NO_QUESTIONS";
};

export type OrchestratorReport = {
  examTypes: ExamTypeStatus[];
  totalQuestions: number;
  totalAttempts: number;
  notVerifiedExams: number;
  issues: string[];
  disclosure: string;
};

const AUTOMATION_DISABLED =
  "Daily question generation and adaptive recommendations are disabled until their source data, scoring, and approval flow are verified.";

export class ExamOrchestrator {
  static async getStatusReport(): Promise<OrchestratorReport> {
    const examTypes = await db.examType.findMany({
      where: { isActive: true },
      include: {
        practiceSets: {
          where: { isActive: true },
          include: { _count: { select: { questions: true } } },
        },
      },
    });

    const today = new Date().toISOString().split("T")[0];
    const issues: string[] = [];
    const statuses: ExamTypeStatus[] = [];

    for (const examType of examTypes) {
      const practiceSetIds = examType.practiceSets.map((set) => set.id);
      const totalQuestions = examType.practiceSets.reduce(
        (sum, set) => sum + set._count.questions,
        0,
      );
      const [totalAttempts, objectiveAverage, dailySet] = await Promise.all([
        db.attempt.count({ where: { practiceSetId: { in: practiceSetIds } } }),
        db.score.aggregate({
          _avg: { overall: true },
          where: {
            providerUsed: "deterministic_objective",
            attempt: { practiceSetId: { in: practiceSetIds } },
          },
        }),
        db.dailyQuestionSet.findUnique({
          where: { examTypeCode_date: { examTypeCode: examType.code, date: today } },
          select: { id: true },
        }),
      ]);

      const status: ExamTypeStatus["status"] = totalQuestions === 0
        ? "NO_QUESTIONS"
        : totalQuestions < 10
          ? "LOW_QUESTIONS"
          : "NOT_VERIFIED";

      if (status === "NO_QUESTIONS") issues.push(`${examType.code} has no questions in active practice sets.`);
      if (status === "LOW_QUESTIONS") issues.push(`${examType.code} has fewer than 10 questions across active practice sets.`);
      if (status === "NOT_VERIFIED") issues.push(`${examType.code} has a non-zero inventory, but full coverage and readiness are not verified.`);
      if (!dailySet) issues.push(`${examType.code} has no daily set record for today; automatic generation is disabled.`);

      statuses.push({
        code: examType.code,
        name: examType.name,
        isActive: examType.isActive,
        totalQuestions,
        totalAttempts,
        averageObjectiveIndicator: objectiveAverage._avg.overall ?? null,
        hasDailySet: Boolean(dailySet),
        status,
      });
    }

    return {
      examTypes: statuses,
      totalQuestions: statuses.reduce((sum, status) => sum + status.totalQuestions, 0),
      totalAttempts: statuses.reduce((sum, status) => sum + status.totalAttempts, 0),
      notVerifiedExams: statuses.filter((status) => status.status === "NOT_VERIFIED").length,
      issues,
      disclosure: `Question and attempt counts are inventory data only, not proof of exam readiness. ${AUTOMATION_DISABLED}`,
    };
  }

  static async ensureDailyQuestionSets(): Promise<{
    status: "BLOCKED";
    generated: 0;
    skipped: 0;
    reason: string;
  }> {
    return { status: "BLOCKED", generated: 0, skipped: 0, reason: AUTOMATION_DISABLED };
  }

  static async onExamSubmitted(_attemptId: string): Promise<void> {
    // Intentionally no-op. Submission does not trigger unvalidated analysis,
    // memory writes, question updates, or agent self-evolution.
  }

  static async getRecommendedExamForStudent(_userId: string): Promise<null> {
    // Historical weakness memories are not used until their source scores and
    // recommendation quality have been independently validated.
    return null;
  }
}
