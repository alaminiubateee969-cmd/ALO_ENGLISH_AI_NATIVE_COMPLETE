/**
 * GET /api/attempts/active — Restore the most recent in-progress attempt for
 * the authenticated learner, including its frozen questions, saved answers,
 * and server-derived clock. This recovers starts whose response was lost and
 * attempts whose tab/session storage was cleared.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { computeClock } from "@/lib/exam/timer";
import { loadAttemptAnswers, loadAttemptQuestions } from "@/lib/exam/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const attempt = await db.attempt.findFirst({
      where: { userId: user.id, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        userId: true,
        practiceSetId: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        expiresAt: true,
        durationMin: true,
        attemptNumber: true,
        // Proctoring fields so the resume path can show the existing
        // tab-switch count without an extra round-trip.
        deviceId: true,
        tabSwitchCount: true,
        lastTabSwitchAt: true,
        practiceSet: {
          select: {
            id: true,
            title: true,
            durationMin: true,
            examType: { select: { code: true, name: true } },
          },
        },
      },
    });

    if (!attempt) return ok({ attempt: null }, "No active attempt");
    const [questions, answers] = await Promise.all([
      loadAttemptQuestions(db, attempt.id),
      loadAttemptAnswers(db, attempt.id),
    ]);

    return ok(
      {
        attempt: {
          id: attempt.id,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          attemptNumber: attempt.attemptNumber,
          practiceSetId: attempt.practiceSetId,
          practiceSet: attempt.practiceSet,
          proctoring: {
            deviceId: attempt.deviceId,
            tabSwitchCount: attempt.tabSwitchCount,
            lastTabSwitchAt: attempt.lastTabSwitchAt,
          },
        },
        clock: computeClock(attempt),
        questions,
        answers,
      },
      "Active attempt restored",
    );
  });
}
