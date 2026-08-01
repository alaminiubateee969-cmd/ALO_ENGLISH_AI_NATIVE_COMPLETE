import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({
      token: z.string().min(32),
      password: z.string().min(12, "Password must be at least 12 characters"),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input");

    const { token, password } = parsed.data;

    const reset = await db.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return badRequest("Invalid or expired reset token");
    }

    const passwordHash = hashPassword(password);
    await db.$transaction([
      db.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      db.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await audit("PASSWORD_CHANGE", {
      userId: reset.userId,
      ipAddress: getClientIp(req),
      resource: "reset-password",
    });

    return ok({}, "Password reset successfully");
  });
}
