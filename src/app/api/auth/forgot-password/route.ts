import { db } from "@/lib/db";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { randomBytes } from "crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid email");

    const { email } = parsed.data;

    // Always return success (don't leak whether email exists)
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await db.passwordReset.create({
        data: { userId: user.id, token, expiresAt },
      });
      await audit("PASSWORD_CHANGE", {
        userId: user.id,
        ipAddress: getClientIp(req),
        resource: "forgot-password:" + email,
      });
      // In production: send email with reset link containing token
      console.log(`[password-reset] Token generated for ${email}: ${token}`);
    }

    return ok({}, "If an account exists, a reset link has been sent");
  });
}
