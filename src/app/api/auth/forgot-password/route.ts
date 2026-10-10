/**
 * POST /api/auth/forgot-password — password recovery is intentionally blocked
 * until a verified email-delivery provider is configured and tested.
 *
 * Do not create an undisclosed reset token, put it in logs, or claim that an
 * email was sent. The response is independent of whether the account exists.
 */

import { badRequest, serviceUnavailable, withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid email");

    return serviceUnavailable(
      "Password reset is unavailable because verified email delivery is not configured. No reset token was issued.",
    );
  });
}
