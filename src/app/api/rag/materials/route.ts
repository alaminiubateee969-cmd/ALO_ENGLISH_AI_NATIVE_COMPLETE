/**
 * /api/rag/materials
 *
 * List study materials (GET, public) or upload new material (POST, admin).
 */

import { RagEngine } from "@/lib/ai/rag/RagEngine";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;
    const materials = await RagEngine.listMaterials(category);
    return ok({ materials }, "Study materials retrieved");
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    // Phase 1: Lock down — only ADMIN+ can upload study materials
    const user = await requireAuth();
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return badRequest("Only admins can upload study materials");
    }

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON");

    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
      category: z.string().min(1).max(50),
      content: z.string().min(100).max(100000),
      isPublic: z.boolean().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const result = await RagEngine.uploadMaterial({
      ...parsed.data,
      uploadedById: user.id,
    });

    return ok(result, "Study material uploaded");
  });
}
