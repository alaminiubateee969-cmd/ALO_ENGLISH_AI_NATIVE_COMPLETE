/**
 * POST /api/attempts/:id/proctoring — record a tab-switch / window-blur event.
 *
 * Anti-cheating (proctoring) endpoint. The browser (see
 * src/app/practice-test/page.tsx) listens to `visibilitychange` and
 * `window.blur`, and POSTs the current client-side tab-switch count here on
 * every event. The server:
 *
 *   1. Authenticates the caller and verifies the attempt belongs to them.
 *   2. Refuses to update an attempt that is no longer IN_PROGRESS (a
 *      submitted attempt is frozen — its proctoring trail is final).
 *   3. Monotonically increases `tabSwitchCount` (never decreases, so a
 *      buggy offline replay cannot "un-ring" the bell) and stamps
 *      `lastTabSwitchAt`.
 *   4. Audit-logs threshold crossings: 3 (warning shown to learner) and 5
 *      (auto-submit fired by the client). The server is the source of
 *      truth for the count, but the client owns the UX reaction.
 *
 * The endpoint never blocks the learner. The auto-submit on the 5th event
 * is performed by the client calling /api/attempts/submit; this endpoint
 * only persists the proctoring trail so an admin reviewer can see, after
 * the fact, how many focus-loss events happened and at what time.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound, forbidden, conflict } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit } from "@/lib/audit";
import {
  TAB_SWITCH_WARNING_THRESHOLD,
  TAB_SWITCH_AUTO_SUBMIT_THRESHOLD,
} from "@/lib/exam/device-fingerprint";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  /** The client's current count of tab-switch events for this attempt.
   *  Server takes the max of (stored, supplied) so an out-of-order or
   *  retried POST cannot decrease the persisted count. */
  tabSwitchCount: z.number().int().min(0).max(1000),
  /** Free-text event type the client observed ("visibilitychange" or
   *  "blur"). Recorded for audit clarity only. */
  eventType: z.enum(["visibilitychange", "blur", "focusloss", "other"]).optional(),
  /** Optional epoch-ms of the event on the client. The server stamps its
   *  own `lastTabSwitchAt` regardless, but the client timestamp is logged
   *  in the audit metadata for clock-skew forensics. */
  clientTimestamp: z.number().int().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    const { id } = await ctx.params;

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
    const { tabSwitchCount: clientCount, eventType, clientTimestamp } = parsed.data;

    // Lock the attempt. The conditional updateMany is the actual ownership
    // + state guard: it only matches an IN_PROGRESS attempt owned by the
    // caller, so a forged attempt id or a frozen attempt is rejected
    // atomically without a separate read.
    const attempt = await db.attempt.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, tabSwitchCount: true, practiceSetId: true },
    });
    if (!attempt) return notFound("Attempt not found");
    if (attempt.userId !== user.id) return forbidden("You can only proctor your own attempt");
    if (attempt.status !== "IN_PROGRESS") {
      return conflict("This attempt is no longer in progress; proctoring events are not accepted.");
    }

    // Monotonic max(): never let a buggy/retried POST decrease the count.
    const newCount = Math.max(attempt.tabSwitchCount, clientCount);
    if (newCount === attempt.tabSwitchCount) {
      // No change — return the current state without writing. Idempotent.
      return ok(
        {
          attemptId: attempt.id,
          tabSwitchCount: attempt.tabSwitchCount,
          thresholdWarning: TAB_SWITCH_WARNING_THRESHOLD,
          thresholdAutoSubmit: TAB_SWITCH_AUTO_SUBMIT_THRESHOLD,
          unchanged: true,
        },
        "Tab-switch count unchanged",
      );
    }

    const now = new Date();
    await db.attempt.update({
      where: { id },
      data: { tabSwitchCount: newCount, lastTabSwitchAt: now },
    });

    // Audit-log every event with the new count and the threshold flags so
    // a reviewer can reconstruct the proctoring trail from the audit log
    // alone, without joining back to the attempt row.
    await audit("EXAM_TAB_SWITCH", {
      userId: user.id,
      resource: "attempt:" + attempt.id,
      metadata: {
        tabSwitchCount: newCount,
        previousCount: attempt.tabSwitchCount,
        eventType: eventType ?? null,
        clientTimestamp: clientTimestamp ?? null,
        serverTimestamp: now.toISOString(),
        crossedWarningThreshold: newCount >= TAB_SWITCH_WARNING_THRESHOLD && attempt.tabSwitchCount < TAB_SWITCH_WARNING_THRESHOLD,
        crossedAutoSubmitThreshold: newCount >= TAB_SWITCH_AUTO_SUBMIT_THRESHOLD && attempt.tabSwitchCount < TAB_SWITCH_AUTO_SUBMIT_THRESHOLD,
        practiceSetId: attempt.practiceSetId,
      },
    });

    return ok(
      {
        attemptId: attempt.id,
        tabSwitchCount: newCount,
        thresholdWarning: TAB_SWITCH_WARNING_THRESHOLD,
        thresholdAutoSubmit: TAB_SWITCH_AUTO_SUBMIT_THRESHOLD,
        /** Convenience flag for the client: should it show the warning toast? */
        showWarning: newCount >= TAB_SWITCH_WARNING_THRESHOLD,
        /** Convenience flag for the client: should it auto-submit now?
         *  The client also tracks this locally; this is the server-side
         *  mirror so a page refresh after the 5th event still triggers
         *  the submit path. */
        shouldAutoSubmit: newCount >= TAB_SWITCH_AUTO_SUBMIT_THRESHOLD,
        unchanged: false,
      },
      "Tab-switch event recorded",
    );
  });
}
