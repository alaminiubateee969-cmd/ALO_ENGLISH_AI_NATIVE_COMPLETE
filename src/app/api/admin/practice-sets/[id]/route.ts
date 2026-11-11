/**
 * GET    /api/admin/practice-sets/[id] — fetch one set (with counts)
 * PATCH  /api/admin/practice-sets/[id] — update fields / activate / deactivate
 * DELETE /api/admin/practice-sets/[id] — delete (refused once attempts exist)
 *
 * Admin-only. Activation requires at least one question so an empty set can
 * never be offered to students. Deletion is refused when attempts reference
 * the set — deactivate instead, so attempt history stays interpretable.
 */

import { type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { badRequest, conflict, notFound, ok, unprocessable, withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SET_SELECT = {
  id: true,
  title: true,
  description: true,
  durationMin: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  examType: { select: { id: true, code: true, name: true } },
  _count: { select: { questions: true, attempts: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const set = await db.practiceSet.findUnique({ where: { id }, select: SET_SELECT });
    if (!set) return notFound("No such practice set");

    return ok({ practiceSet: set });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.practiceSet.findUnique({
      where: { id },
      select: { id: true, isActive: true, _count: { select: { questions: true } } },
    });
    if (!existing) return notFound("No such practice set");

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return badRequest("A JSON body is required");

    const data: {
      title?: string;
      description?: string | null;
      durationMin?: number;
      isActive?: boolean;
    } = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (title.length < 3) return badRequest("title must be at least 3 characters");
      data.title = title;
    }
    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" && body.description.trim().length > 0
          ? body.description.trim()
          : null;
    }
    if (body.durationMin !== undefined) {
      const durationMin = Number(body.durationMin);
      if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 600) {
        return badRequest("durationMin must be an integer between 1 and 600");
      }
      data.durationMin = durationMin;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return badRequest("isActive must be a boolean");
      if (body.isActive === true && !existing.isActive && existing._count.questions === 0) {
        return unprocessable(
          "This practice set has no questions yet. Add at least one question before activating it.",
        );
      }
      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) return badRequest("Nothing to update");

    const set = await db.practiceSet.update({ where: { id }, data, select: SET_SELECT });

    await audit("PRACTICE_SET_UPDATE", {
      userId: user.id,
      resource: `practiceSet:${id}`,
      ipAddress: getClientIp(req),
      metadata: { changed: Object.keys(data), isActive: data.isActive ?? existing.isActive },
    });

    return ok({ practiceSet: set });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await db.practiceSet.findUnique({
      where: { id },
      select: { id: true, _count: { select: { attempts: true } } },
    });
    if (!existing) return notFound("No such practice set");
    if (existing._count.attempts > 0) {
      return conflict(
        `This practice set has ${existing._count.attempts} attempt(s). Deactivate it instead of deleting so attempt history stays intact.`,
      );
    }

    await db.practiceSet.delete({ where: { id } });

    await audit("PRACTICE_SET_DELETE", {
      userId: user.id,
      resource: `practiceSet:${id}`,
      ipAddress: getClientIp(req),
    });

    return ok({ deleted: true, id });
  });
}
