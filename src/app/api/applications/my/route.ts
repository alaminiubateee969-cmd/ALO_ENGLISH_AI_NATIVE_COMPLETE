/**
 * GET /api/applications/my — List current user's applications
 * GET /api/applications/my/[id] — Get a specific application with Form B data
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, notFound, forbidden } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const url = new URL(req.url);
    const draftId = url.searchParams.get("draftId");

    if (draftId) {
      // Get specific application with Form B data
      const draft = await db.applicationDraft.findUnique({
        where: { id: draftId },
        include: {
          course: { include: { university: true } },
          formB: true,
          documents: true,
        },
      });

      if (!draft) return notFound("Application not found");
      if (draft.userId !== user.id && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.role !== "COUNSELOR") {
        return forbidden("Access denied");
      }

      return ok({ application: draft }, "Application retrieved");
    }

    // List all user's applications
    const applications = await db.applicationDraft.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: { include: { university: true } },
      },
    });

    return ok({ applications }, "Applications retrieved");
  });
}
