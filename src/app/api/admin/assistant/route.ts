/**
 * POST /api/admin/assistant — Super Admin AI chat
 * GET /api/admin/ai-config — Get AI provider config
 * POST /api/admin/ai-config — Save AI provider config
 */

import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { askAssistant, getAssistantConfig, saveAssistantConfig, AI_PROVIDERS, type ChatMessage } from "@/lib/ai/admin-assistant/AdminAssistantEngine";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return badRequest("Admin access required");

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      message: z.string().min(1).max(5000),
      history: z.array(z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        timestamp: z.string(),
      })).optional().default([]),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const config = await getAssistantConfig();
    const response = await askAssistant(parsed.data.message, parsed.data.history as ChatMessage[], config);

    return ok(response, "Assistant response");
  });
}

export async function GET() {
  return withErrorHandler(async () => {
    const user = await requireAuth();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return badRequest("Admin access required");
    const config = await getAssistantConfig();
    return ok({ config, providers: AI_PROVIDERS }, "AI config retrieved");
  });
}
