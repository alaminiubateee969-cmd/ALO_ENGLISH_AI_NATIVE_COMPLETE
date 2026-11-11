/**
 * GET /api/admin/practice-sets  — list all practice sets (active + inactive)
 * POST /api/admin/practice-sets — create a practice set
 *
 * Admin-only. Unlike the public /api/practice-sets (active sets only), this
 * surface manages the full lifecycle including drafts.
 */

import { type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { badRequest, created, notFound, ok, withErrorHandler } from "@/lib/responses";
import { audit, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const url = new URL(req.url);
    const examTypeId = url.searchParams.get("examTypeId");
    const examTypeCode = url.searchParams.get("examTypeCode");

    const sets = await db.practiceSet.findMany({
      where: {
        ...(examTypeId ? { examTypeId } : {}),
        ...(examTypeCode ? { examType: { code: examTypeCode } } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        examType: { select: { id: true, code: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: [{ examType: { code: "asc" } }, { title: "asc" }],
    });

    return ok({ practiceSets: sets });
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole("ADMIN", "SUPER_ADMIN");

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return badRequest("A JSON body is required");

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (title.length < 3) return badRequest("title must be at least 3 characters");

    const durationMin = Number(body.durationMin ?? 60);
    if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 600) {
      return badRequest("durationMin must be an integer between 1 and 600");
    }

    const examType = await db.examType.findFirst({
      where: {
        ...(typeof body.examTypeId === "string" ? { id: body.examTypeId } : {}),
        ...(typeof body.examTypeCode === "string" ? { code: body.examTypeCode } : {}),
      },
      select: { id: true, code: true },
    });
    if (!examType) return notFound("No exam type matches examTypeId/examTypeCode");

    const set = await db.practiceSet.create({
      data: {
        examTypeId: examType.id,
        title,
        description:
          typeof body.description === "string" && body.description.trim().length > 0
            ? body.description.trim()
            : null,
        durationMin,
        // New sets always start as drafts; activation is a deliberate step
        // once questions exist (enforced in the PATCH handler).
        isActive: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        isActive: true,
        createdAt: true,
        examType: { select: { id: true, code: true, name: true } },
      },
    });

    await audit("PRACTICE_SET_CREATE", {
      userId: user.id,
      resource: `practiceSet:${set.id}`,
      ipAddress: getClientIp(req),
      metadata: { examTypeCode: examType.code, title },
    });

    return created({ practiceSet: set });
  });
}
