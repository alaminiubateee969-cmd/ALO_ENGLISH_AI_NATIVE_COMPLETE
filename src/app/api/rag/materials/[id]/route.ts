/**
 * GET /api/rag/materials/[id] — one published study material, with content.
 *
 * Public (no session): the materials library is part of the platform's free
 * study surface. Only rows that are both active and public can be fetched;
 * inactive or private uploads 404 rather than leaking.
 */

import { db } from "@/lib/db";
import { notFound, ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const { id } = await params;
    if (!id || id.length > 64) return notFound("Material not found");

    const material = await db.studyMaterial.findFirst({
      where: { id, isActive: true, isPublic: true },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        content: true,
        chunkCount: true,
        createdAt: true,
      },
    });
    if (!material) return notFound("Material not found");

    return ok({ material }, "Study material retrieved");
  });
}
