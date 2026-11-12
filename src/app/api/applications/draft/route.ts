/**
 * POST /api/applications/draft — Create a draft application (Form A)
 * GET  /api/applications/my — List current user's applications
 *
 * Form A: Public-facing apply form that creates a lead + draft application.
 * If user is not logged in, redirects to login first.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireAuth();

    const body = await req.json().catch(() => null);
    if (!body) return badRequest("Invalid JSON body");

    const schema = z.object({
      courseId: z.string().cuid().optional(),
      universityId: z.string().cuid().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid");

    const { courseId, universityId } = parsed.data;

    // Verify course exists if provided
    if (courseId) {
      const course = await db.course.findUnique({ where: { id: courseId } });
      if (!course) return notFound("Course not found");
    }

    // Check if user already has a draft for this course
    const existingDraft = await db.applicationDraft.findFirst({
      where: {
        userId: user.id,
        courseId: courseId || null,
        status: { in: ["DRAFT", "IN_REVIEW"] },
      },
    });

    if (existingDraft) {
      return ok({ draftId: existingDraft.id, existing: true }, "You already have a draft application for this course");
    }

    // Create draft application
    const draft = await db.applicationDraft.create({
      data: {
        userId: user.id,
        courseId: courseId || null,
        universityId: universityId || null,
        status: "DRAFT",
        source: "FORM_A",
      },
    });

    const ip = getClientIp(req);
    await audit("LEAD_CREATE", {
      userId: user.id,
      resource: "application-draft:" + draft.id,
      ipAddress: ip,
      metadata: { courseId, universityId, source: "FORM_A" },
    });

    return ok({ draftId: draft.id, existing: false }, "Draft application created");
  });
}
