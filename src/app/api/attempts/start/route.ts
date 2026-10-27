/**
 * POST /api/attempts/start — Start and reserve a database-backed attempt.
 *
 * Quota reservation, attempt creation, question selection, and the frozen
 * AttemptQuestion rows share one transaction. A failed start cannot burn a
 * quota slot, and the conditional update prevents concurrent starts from
 * consuming the same final slot.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict, unprocessable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { computeClock, deadlineFor } from "@/lib/exam/timer";
import { selectQuestions, persistSelection, ListeningAudioNotReadyError, QuestionShortageError, type SelectionResult } from "@/lib/exam/selection";
import { freeAttemptLimitForRole, quotaSummary, reconcileAttemptsUsed, reserveQuotaAttempt } from "@/lib/exam/quota";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  // Seeds may use stable slugs as IDs; validate path-safe syntax instead of
  // assuming every pre-existing practice-set identifier is a cuid.
  practiceSetId: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
});

type StartOutcome =
  | { kind: "missing" }
  | { kind: "active"; attemptId: string }
  | { kind: "quota"; attemptsUsed: number; freeLimit: number; paidAttempts: number; totalAllowed: number }
  | {
      kind: "started";
      attempt: { id: string; startedAt: Date; expiresAt: Date | null; durationMin: number | null; attemptNumber: number };
      practiceSet: { id: string; title: string; durationMin: number; examType: { code: string; name: string } };
      selection: SelectionResult;
      quota: ReturnType<typeof quotaSummary>;
      completedAttempts: number;
    };

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    const { practiceSetId } = parsed.data;

    let outcome: StartOutcome;
    try {
      outcome = await db.$transaction(async (tx) => {
        const practiceSet = await tx.practiceSet.findFirst({
          where: {
            id: practiceSetId,
            isActive: true,
            examType: { isActive: true },
          },
          select: {
            id: true,
            title: true,
            durationMin: true,
            examType: { select: { code: true, name: true } },
          },
        });
        if (!practiceSet) return { kind: "missing" as const };

        const existingAttempt = await tx.attempt.findFirst({
          where: { userId: user.id, status: "IN_PROGRESS" },
          orderBy: { startedAt: "desc" },
          select: { id: true },
        });
        if (existingAttempt) return { kind: "active" as const, attemptId: existingAttempt.id };

        const defaultLimit = freeAttemptLimitForRole(user.role);
        const quota = await tx.freeQuota.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            attemptsUsed: 0,
            attemptsLimit: defaultLimit,
            isAloStudent: user.role === "STUDENT",
          },
          // Practice is free and unlimited now. Legacy rows created under the
          // old 3/1 policy are refreshed to the unlimited default here, on
          // their next attempt, so no historical row can keep blocking a
          // learner.
          update: { attemptsLimit: defaultLimit },
        });

        const [completedAttempts, paidAggregate] = await Promise.all([
          tx.attempt.count({
            where: { userId: user.id, status: { in: ["SUBMITTED", "SCORED"] } },
          }),
          tx.payment.aggregate({
            where: { userId: user.id, status: "COMPLETED" },
            _sum: { attemptsPaid: true },
          }),
        ]);
        const attemptsUsed = reconcileAttemptsUsed(quota.attemptsUsed, completedAttempts);
        if (attemptsUsed > quota.attemptsUsed) {
          await tx.freeQuota.update({ where: { userId: user.id }, data: { attemptsUsed } });
        }
        const paidAttempts = paidAggregate._sum.attemptsPaid ?? 0;
        const totalAllowed = quota.attemptsLimit + paidAttempts;

        // Select before reserving, so a short/ungradeable bank is not charged
        // against the learner's quota. The whole callback is still atomic.
        const selection = await selectQuestions({ db: tx, userId: user.id, practiceSetId });
        const reserved = await reserveQuotaAttempt(tx, user.id, totalAllowed);
        if (!reserved) {
          return { kind: "quota" as const, attemptsUsed, freeLimit: quota.attemptsLimit, paidAttempts, totalAllowed };
        }

        const attemptNumber = (await tx.attempt.count({ where: { userId: user.id, practiceSetId } })) + 1;
        const startedAt = new Date();
        const attempt = await tx.attempt.create({
          data: {
            userId: user.id,
            practiceSetId,
            status: "IN_PROGRESS",
            attemptNumber,
            startedAt,
            durationMin: practiceSet.durationMin,
            expiresAt: deadlineFor(startedAt, practiceSet.durationMin),
          },
          select: {
            id: true,
            startedAt: true,
            expiresAt: true,
            durationMin: true,
            attemptNumber: true,
          },
        });
        await persistSelection({ db: tx, attemptId: attempt.id, questionIds: selection.questionIds });

        return {
          kind: "started" as const,
          attempt,
          practiceSet,
          selection,
          quota: quotaSummary({
            attemptsUsed: attemptsUsed + 1,
            attemptsLimit: quota.attemptsLimit,
            paidAttempts,
          }),
          completedAttempts,
        };
      });
    } catch (error) {
      if (error instanceof ListeningAudioNotReadyError) {
        return unprocessable(
          "This practice set contains listening questions without a matching READY audio asset. No attempt or quota was created; choose another set or retry after media validation.",
        );
      }
      if (error instanceof QuestionShortageError) {
        return unprocessable(
          `${error.message} This practice set cannot provide a complete gradeable sitting. Choose another active set or contact support.`,
        );
      }
      throw error;
    }

    if (outcome.kind === "missing") return notFound("Active practice set not found");
    if (outcome.kind === "active") return conflict("You already have an in-progress attempt. Reload the practice page to resume it before starting another.");
    if (outcome.kind === "quota") {
      // Unreachable under the unlimited-free policy (limit is 2 billion);
      // kept as a defensive fail-safe so a misconfigured row degrades to a
      // clear message instead of an unhandled error.
      return forbidden(
        `No attempt quota remains (${outcome.freeLimit} free + ${outcome.paidAttempts} completed payment-record attempts). ` +
          "Practice is free and unlimited — if you see this message, contact support; your quota row needs a one-line fix.",
      );
    }

    await audit("EXAM_START", {
      userId: user.id,
      resource: "attempt:" + outcome.attempt.id,
      ipAddress: getClientIp(req),
      metadata: {
        practiceSetId,
        questionCount: outcome.selection.questionIds.length,
        shortage: outcome.selection.shortage?.reason ?? null,
        completedAttempts: outcome.completedAttempts,
        quotaLimit: outcome.quota.totalAllowed,
      },
    });

    return ok(
      {
        attempt: {
          id: outcome.attempt.id,
          startedAt: outcome.attempt.startedAt,
          attemptNumber: outcome.attempt.attemptNumber,
          durationMin: outcome.attempt.durationMin,
          practiceSet: outcome.practiceSet,
        },
        clock: computeClock(outcome.attempt),
        questions: { ids: outcome.selection.questionIds, count: outcome.selection.questionIds.length },
        shortage: outcome.selection.shortage,
        quota: outcome.quota,
      },
      "Attempt started",
    );
  });
}
