/**
 * POST /api/attempts/start — Start and reserve a database-backed attempt.
 *
 * Quota reservation, attempt creation, question selection, and the frozen
 * AttemptQuestion rows share one transaction. A failed start cannot burn a
 * quota slot, and the conditional update prevents concurrent starts from
 * consuming the same final slot.
 *
 * Per-exam-type quota (user spec): the FreeQuota row is keyed by
 * (userId, examTypeCode), so a student gets 3 free IELTS-A sittings AND 3
 * free TOEFL sittings. Additional sittings require a completed Payment.
 *
 * Device verification (user spec): the request optionally carries a
 * `deviceFingerprint` payload (collected by
 * src/lib/exam/device-fingerprint.ts on the client). The server re-derives
 * `deviceId` from the validated JSON — so a malicious client cannot spoof
 * another learner's device — and freezes both onto the Attempt row. Same-
 * device reuse detection is informational only (the count is exposed in
 * the response and the audit log; it never blocks a start).
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict, unprocessable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { computeClock, deadlineFor } from "@/lib/exam/timer";
import { ListeningAudioNotReadyError, QuestionShortageError } from "@/lib/exam/selection";
import { selectQuestionsWithAntiRepeat, persistAntiRepeatSelection, type AntiRepeatSelection } from "@/lib/exam/anti-repeat";
import { freeAttemptLimitForRole, quotaSummary, reconcileAttemptsUsed, reserveQuotaAttempt } from "@/lib/exam/quota";
import {
  DeviceFingerprintSchema,
  DEVICE_FINGERPRINT_MAX_BYTES,
  deriveDeviceId,
  describeDevice,
  detectDeviceReuse,
} from "@/lib/exam/device-fingerprint";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  // Seeds may use stable slugs as IDs; validate path-safe syntax instead of
  // assuming every pre-existing practice-set identifier is a cuid.
  practiceSetId: z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
  /**
   * Optional device fingerprint payload, collected client-side by
   * `collectDeviceFingerprint()`. The server validates the shape, derives
   * `deviceId` itself (never trusts a client-supplied id), and persists
   * both onto the Attempt row for the informational same-device check and
   * the post-exam audit trail. Absent on legacy clients / pre-fingerprint
   * page loads — the attempt still starts, but no device is recorded.
   */
  deviceFingerprint: DeviceFingerprintSchema.optional(),
});

type StartOutcome =
  | { kind: "missing" }
  | { kind: "active"; attemptId: string }
  | { kind: "quota"; examTypeCode: string; attemptsUsed: number; freeLimit: number; paidAttempts: number; totalAllowed: number }
  | {
      kind: "started";
      attempt: { id: string; startedAt: Date; expiresAt: Date | null; durationMin: number | null; attemptNumber: number };
      practiceSet: { id: string; title: string; durationMin: number; examType: { code: string; name: string } };
      selection: AntiRepeatSelection;
      quota: ReturnType<typeof quotaSummary>;
      completedAttempts: number;
      device: { deviceId: string | null; label: string | null; reuseCount: number; lastSeenAt: Date | null } | null;
    };

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    const { practiceSetId, deviceFingerprint: rawFingerprint } = parsed.data;

    // ── Device fingerprint: validate + cap JSON size, then re-derive the
    // ── device id on the server. A client cannot spoof another learner's
    // ── device id, only its own presentation. The JSON is stored verbatim
    // ── so an audit can re-inspect the original components later.
    let deviceSummary: { deviceId: string; fingerprintJson: string; label: string } | null = null;
    if (rawFingerprint) {
      const fingerprintJson = JSON.stringify(rawFingerprint);
      if (fingerprintJson.length > DEVICE_FINGERPRINT_MAX_BYTES) {
        return badRequest(`Device fingerprint payload too large (>${DEVICE_FINGERPRINT_MAX_BYTES} bytes).`);
      }
      const deviceId = await deriveDeviceId(rawFingerprint);
      deviceSummary = {
        deviceId,
        fingerprintJson,
        label: describeDevice(rawFingerprint),
      };
    }

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

        const examTypeCode = practiceSet.examType.code;

        const existingAttempt = await tx.attempt.findFirst({
          where: { userId: user.id, status: "IN_PROGRESS" },
          orderBy: { startedAt: "desc" },
          select: { id: true },
        });
        if (existingAttempt) return { kind: "active" as const, attemptId: existingAttempt.id };

        // ── Per-exam-type free quota. (userId, examTypeCode) is the unique
        // ── key. The default limit is 3 for students, lifted to the
        // ── effectively-unlimited ceiling for SUPER_ADMIN/ADMIN. The row
        // ── is upserted so the first start of a new exam type for a user
        // ── creates the row inside the same transaction as the attempt.
        const defaultLimit = freeAttemptLimitForRole(user.role);
        const quota = await tx.freeQuota.upsert({
          where: { userId_examTypeCode: { userId: user.id, examTypeCode } },
          create: {
            userId: user.id,
            examTypeCode,
            attemptsUsed: 0,
            attemptsLimit: defaultLimit,
            isAloStudent: user.role === "STUDENT",
          },
          // Refresh the limit on every start so a role change (student →
          // admin, or a future tier change) is reflected without manual
          // SQL. `attemptsUsed` is preserved across the upsert.
          update: { attemptsLimit: defaultLimit },
        });

        // Paid attempts are scoped to the exam type too: a Payment row
        // purchased for IELTS-A cannot be spent on TOEFL. The Payment
        // table currently has no examTypeCode column, so for now paid
        // attempts are still aggregated globally; this is documented in
        // the response as `paidAttemptsGlobal`. When per-exam-type
        // payments are added, this query will be filtered by examTypeCode.
        const [completedAttempts, paidAggregate] = await Promise.all([
          tx.attempt.count({
            where: {
              userId: user.id,
              practiceSet: { examType: { code: examTypeCode } },
              status: { in: ["SUBMITTED", "SCORED"] },
            },
          }),
          tx.payment.aggregate({
            where: { userId: user.id, status: "COMPLETED" },
            _sum: { attemptsPaid: true },
          }),
        ]);
        const attemptsUsed = reconcileAttemptsUsed(quota.attemptsUsed, completedAttempts);
        if (attemptsUsed > quota.attemptsUsed) {
          await tx.freeQuota.update({
            where: { userId_examTypeCode: { userId: user.id, examTypeCode } },
            data: { attemptsUsed },
          });
        }
        const paidAttempts = paidAggregate._sum.attemptsPaid ?? 0;
        const totalAllowed = quota.attemptsLimit + paidAttempts;

        // Select before reserving, so a short/ungradeable bank is not charged
        // against the learner's quota. The whole callback is still atomic.
        //
        // The selection is routed through the anti-repeat system: today's 5
        // daily variants are generated (idempotently), the student is
        // assigned a variant they have not seen before, and the chosen
        // variant's questions are re-shuffled per-attempt. The variant
        // exposure is recorded inside this same transaction so a failed
        // start cannot leave a dangling exposure row.
        const selection = await selectQuestionsWithAntiRepeat(tx, user.id, practiceSetId);
        const reserved = await reserveQuotaAttempt(tx, user.id, totalAllowed, examTypeCode);
        if (!reserved) {
          return {
            kind: "quota" as const,
            examTypeCode,
            attemptsUsed,
            freeLimit: quota.attemptsLimit,
            paidAttempts,
            totalAllowed,
          };
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
            // Device verification: stamp the attempt with the server-derived
            // device id and the validated fingerprint JSON. Both are null
            // for legacy clients that did not send a payload.
            deviceId: deviceSummary?.deviceId ?? null,
            deviceFingerprint: deviceSummary?.fingerprintJson ?? null,
          },
          select: {
            id: true,
            startedAt: true,
            expiresAt: true,
            durationMin: true,
            attemptNumber: true,
            deviceId: true,
          },
        });
        await persistAntiRepeatSelection(tx, {
          attemptId: attempt.id,
          userId: user.id,
          selection,
        });

        return {
          kind: "started" as const,
          attempt,
          practiceSet,
          selection,
          quota: quotaSummary({
            attemptsUsed: attemptsUsed + 1,
            attemptsLimit: quota.attemptsLimit,
            paidAttempts,
            examTypeCode,
          }),
          completedAttempts,
          device: deviceSummary
            ? {
                deviceId: deviceSummary.deviceId,
                label: deviceSummary.label,
                // Filled in after the transaction commits (see below) —
                // kept null inside the tx so the read does not block on
                // the just-written row.
                reuseCount: 0,
                lastSeenAt: null,
              }
            : null,
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
      return forbidden(
        `You have used all ${outcome.freeLimit} free ${outcome.examTypeCode} mock tests. ` +
          "Additional mock tests require payment. Visit your dashboard to purchase attempts, or contact your branch.",
      );
    }

    // ── Same-device reuse check (informational). Run AFTER the transaction
    // ── commits so the read does not see the just-written attempt (and so
    // ── a failed start never leaves a stale reuse signal). The count
    // ── excludes the attempt we just created.
    let deviceReuse: { reuseCount: number; lastSeenAt: Date | null } | null = null;
    if (outcome.device?.deviceId) {
      deviceReuse = await detectDeviceReuse(user.id, outcome.device.deviceId, outcome.attempt.id);
      outcome.device.reuseCount = deviceReuse.reuseCount;
      outcome.device.lastSeenAt = deviceReuse.lastSeenAt;
    }

    await audit("EXAM_START", {
      userId: user.id,
      resource: "attempt:" + outcome.attempt.id,
      ipAddress: getClientIp(req),
      metadata: {
        practiceSetId,
        questionCount: outcome.selection.questionIds.length,
        shortage: outcome.selection.shortage?.reason ?? null,
        listeningAudioMissingCount: outcome.selection.listeningAudioMissingCount,
        completedAttempts: outcome.completedAttempts,
        quotaLimit: outcome.quota.totalAllowed,
        quotaExamTypeCode: outcome.quota.examTypeCode,
        quotaAttemptsUsed: outcome.quota.attemptsUsed,
        // Anti-repeat bookkeeping. `variantIndex` is 1..5; `isFreshVariant`
        // records whether the student drew a variant they had never seen
        // before (true) or cycled back to a previously-seen one (false).
        // `dailySetDate` is the `YYYY-MM-DD` of the variant set used.
        antiRepeatVariantIndex: outcome.selection.variantIndex,
        antiRepeatIsFreshVariant: outcome.selection.isFreshVariant,
        antiRepeatDailySetDate: outcome.selection.dailySetDate,
        // Device verification bookkeeping. `deviceId` is the server-derived
        // hash; `deviceLabel` is the human-readable summary; `deviceReuse`
        // is the count of prior attempts by this user on the same device
        // (informational, never blocks).
        deviceId: outcome.device?.deviceId ?? null,
        deviceLabel: outcome.device?.label ?? null,
        deviceReuseCount: outcome.device?.reuseCount ?? 0,
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
        // Listening media disclosure: >0 means those questions are served
        // with the transcript fallback because no verified audio asset
        // exists on this deployment yet. The client shows a banner.
        media: {
          listeningAudioMissingCount: outcome.selection.listeningAudioMissingCount,
          transcriptFallback: outcome.selection.listeningAudioMissingCount > 0,
        },
        shortage: outcome.selection.shortage,
        // Anti-repeat summary for the client. The student-facing UI may
        // surface "You are taking daily variant N of 5 — fresh" so the
        // anti-repeat policy is visible rather than hidden.
        antiRepeat: {
          variantIndex: outcome.selection.variantIndex,
          totalVariants: 5,
          isFreshVariant: outcome.selection.isFreshVariant,
          dailySetDate: outcome.selection.dailySetDate,
        },
        quota: outcome.quota,
        // Device verification summary for the client. The student-facing UI
        // surfaces the device label and the same-device reuse notice so the
        // proctoring posture is visible rather than hidden.
        device: outcome.device,
      },
      "Attempt started",
    );
  });
}
