/**
 * POST /api/admin/ai-config — Save AI provider config (API key, model, enabled)
 */

import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { saveAssistantConfig, AI_PROVIDERS, type AdminAssistantConfig } from "@/lib/ai/admin-assistant/AdminAssistantEngine";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return badRequest("Admin access required");

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      provider: z.string(),
      apiKey: z.string(),
      model: z.string(),
      enabled: z.boolean(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const config: AdminAssistantConfig = parsed.data;
    await saveAssistantConfig(config);

    return ok({ config }, "AI config saved");
  });
}
