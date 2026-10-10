/**
 * Legacy daily-learning endpoint is disabled.
 *
 * Historical score/confidence inputs are not validated, and the former loop
 * could mutate learning records, question analytics, and agent configuration.
 * No such automatic changes are performed until a separately reviewed gate is
 * implemented.
 */

import { requireRole } from "@/lib/auth";
import { ok, serviceUnavailable } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISABLED_MESSAGE =
  "Automatic learning and agent self-evolution are disabled until score calibration, data provenance, and change-approval controls are verified.";

export async function POST(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    return serviceUnavailable(DISABLED_MESSAGE);
  });
}

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    return ok({
      status: "NOT_VERIFIED",
      automatedChangesApplied: false,
      historicalLearningRecordsExposed: false,
      message: DISABLED_MESSAGE,
    }, "Automatic learning is disabled");
  });
}
