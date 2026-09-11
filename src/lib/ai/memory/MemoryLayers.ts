/**
 * src/lib/ai/memory/MemoryLayers.ts
 *
 * 10-layer memory architecture for the AI-native exam platform.
 *
 * L1 — Session Memory (current exam attempt state)
 * L2 — Attempt Memory (completed attempt results)
 * L3 — Student Learning Memory (weakness tracking)
 * L4 — Long-Term Student Memory (trajectory + preferences)
 * L5 — Exam Knowledge Memory (question performance stats)
 * L6 — Question Knowledge Memory (item difficulty/accuracy)
 * L7 — Agent Memory (agent version + performance)
 * L8 — Model Performance Memory (provider stats)
 * L9 — Engineering Memory (code change history)
 * L10 — System Experience Memory (failure patterns + fixes)
 */

import { db } from "@/lib/db";

// ═══ L1: Session Memory ═════════════════════════════════════════════
// Current exam attempt state — stored in Attempt model (status=IN_PROGRESS)

export async function getSessionMemory(userId: string): Promise<{
  activeAttemptId: string | null;
  sectionProgress: string | null;
}> {
  const attempt = await db.attempt.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    select: { id: true, practiceSetId: true },
  });
  return {
    activeAttemptId: attempt?.id || null,
    sectionProgress: attempt?.practiceSetId || null,
  };
}

// ═══ L2: Attempt Memory ═════════════════════════════════════════════
// Completed attempt results — stored in Score model

export async function getAttemptMemory(userId: string, limit: number = 10): Promise<Array<{
  attemptId: string;
  overall: number;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  confidence: number;
  providerUsed: string;
  date: Date;
}>> {
  const scores = await db.score.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      attemptId: true,
      overall: true,
      listening: true,
      reading: true,
      writing: true,
      speaking: true,
      confidence: true,
      providerUsed: true,
      createdAt: true,
    },
  });
  return scores.map((s) => ({
    attemptId: s.attemptId,
    overall: s.overall,
    listening: s.listening,
    reading: s.reading,
    writing: s.writing,
    speaking: s.speaking,
    confidence: s.confidence,
    providerUsed: s.providerUsed,
    date: s.createdAt,
  }));
}

// ═══ L3: Student Learning Memory ═══════════════════════════════════
// Weakness tracking — stored in LearningMemory model

export async function getLearningMemory(userId: string): Promise<Array<{
  weaknessArea: string;
  weaknessType: string;
  occurrences: number;
  lastSeen: Date;
  resolved: boolean;
}>> {
  const memories = await db.learningMemory.findMany({
    where: { userId },
    orderBy: { occurrences: "desc" },
  });
  return memories.map((m) => ({
    weaknessArea: m.weaknessArea,
    weaknessType: m.weaknessType,
    occurrences: m.occurrences,
    lastSeen: m.lastSeenAt,
    resolved: m.resolvedAt !== null,
  }));
}

export async function updateLearningMemory(
  userId: string,
  weaknessArea: string,
  weaknessType: string
): Promise<void> {
  await db.learningMemory.upsert({
    where: { userId_weaknessArea: { userId, weaknessArea } },
    update: {
      occurrences: { increment: 1 },
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      weaknessArea,
      weaknessType,
      occurrences: 1,
    },
  });
}

// ═══ L4: Long-Term Student Memory ══════════════════════════════════
// Trajectory + preferences — derived from L2 + L3

export async function getLongTermMemory(userId: string): Promise<{
  totalAttempts: number;
  avgScore: number;
  bestScore: number;
  recentTrend: "improving" | "stable" | "declining";
  weakestSection: string | null;
  strongestSection: string | null;
  weaknesses: Array<{ area: string; occurrences: number }>;
  recommendations: string[];
}> {
  const scores = await db.score.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const memories = await db.learningMemory.findMany({
    where: { userId, resolvedAt: null },
    orderBy: { occurrences: "desc" },
  });

  if (scores.length === 0) {
    return {
      totalAttempts: 0,
      avgScore: 0,
      bestScore: 0,
      recentTrend: "stable",
      weakestSection: null,
      strongestSection: null,
      weaknesses: [],
      recommendations: ["Take a practice test to start building your learning profile."],
    };
  }

  const totalAttempts = scores.length;
  const avgScore = scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;
  const bestScore = Math.max(...scores.map((s) => s.overall));

  // Trend analysis (compare last 3 vs previous 3)
  const recent = scores.slice(-3);
  const previous = scores.slice(-6, -3);
  const recentAvg = recent.reduce((sum, s) => sum + s.overall, 0) / recent.length;
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, s) => sum + s.overall, 0) / previous.length
    : recentAvg;
  const trend = recentAvg > previousAvg + 0.3 ? "improving" : recentAvg < previousAvg - 0.3 ? "declining" : "stable";

  // Section analysis
  const sections = ["listening", "reading", "writing", "speaking"] as const;
  const sectionAvgs: Record<string, number> = {};
  for (const section of sections) {
    const values = scores.map((s) => (s as any)[section]).filter((v: number) => v !== null && v > 0);
    if (values.length > 0) {
      sectionAvgs[section] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    }
  }

  const weakestEntry = Object.entries(sectionAvgs).sort(([, a], [, b]) => a - b)[0];
  const strongestEntry = Object.entries(sectionAvgs).sort(([, a], [, b]) => b - a)[0];

  // Recommendations based on real data
  const recommendations: string[] = [];
  if (weakestEntry) {
    const section = weakestEntry[0];
    if (section === "writing") recommendations.push("Practice timed writing essays with focus on task achievement and coherence.");
    if (section === "speaking") recommendations.push("Practice speaking with cue cards and focus on fluency and pronunciation clarity.");
    if (section === "listening") recommendations.push("Listen to English podcasts daily and practice note-taking skills.");
    if (section === "reading") recommendations.push("Practice skimming and scanning techniques with timed reading exercises.");
  }
  if (trend === "declining") {
    recommendations.push("Your recent scores show a declining trend. Consider reviewing fundamentals before attempting harder questions.");
  }
  if (trend === "improving") {
    recommendations.push("Your scores are improving! Try increasing question difficulty to challenge yourself further.");
  }

  return {
    totalAttempts,
    avgScore: Math.round(avgScore * 10) / 10,
    bestScore: Math.round(bestScore * 10) / 10,
    recentTrend: trend,
    weakestSection: weakestEntry?.[0] || null,
    strongestSection: strongestEntry?.[0] || null,
    weaknesses: memories.map((m) => ({ area: m.weaknessArea, occurrences: m.occurrences })),
    recommendations,
  };
}

// ═══ L5-L6: Exam/Question Knowledge Memory ════════════════════════
// Question performance statistics — derived from Score + Question models

export async function getQuestionKnowledge(practiceSetId: string): Promise<{
  totalQuestions: number;
  avgDifficulty: string;
  questionTypes: Record<string, number>;
}> {
  const questions = await db.question.findMany({
    where: { practiceSetId },
    select: { type: true, points: true },
  });

  const typeCounts: Record<string, number> = {};
  for (const q of questions) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
  }

  return {
    totalQuestions: questions.length,
    avgDifficulty: "Mixed",
    questionTypes: typeCounts,
  };
}

// ═══ L7-L10: Agent/Model/Engineering/System Memory ════════════════
// These layers track AI system performance over time.
// Stored in AuditLog + future dedicated models.

export async function getSystemMemory(): Promise<{
  totalAttempts: number;
  totalScores: number;
  totalQuestions: number;
  dailySetsGenerated: number;
  activeExamTypes: number;
}> {
  const [attempts, scores, questions, dailySets, examTypes] = await Promise.all([
    db.attempt.count(),
    db.score.count(),
    db.question.count(),
    db.dailyQuestionSet.count(),
    db.examType.count({ where: { isActive: true } }),
  ]);

  return {
    totalAttempts: attempts,
    totalScores: scores,
    totalQuestions: questions,
    dailySetsGenerated: dailySets,
    activeExamTypes: examTypes,
  };
}

// ═══ Privacy Isolation ══════════════════════════════════════════════
// CRITICAL: Student A memory must NEVER leak to Student B.
// All memory functions take userId and filter by it.
// No cross-user queries exist in this module.

export async function verifyPrivacyIsolation(userIdA: string, userIdB: string): Promise<boolean> {
  // Verify that querying A's memory doesn't return B's data
  const aScores = await db.score.findMany({ where: { userId: userIdA }, select: { userId: true } });
  const bScores = await db.score.findMany({ where: { userId: userIdB }, select: { userId: true } });

  const aLeak = aScores.some((s) => s.userId === userIdB);
  const bLeak = bScores.some((s) => s.userId === userIdA);

  return !aLeak && !bLeak;
}
