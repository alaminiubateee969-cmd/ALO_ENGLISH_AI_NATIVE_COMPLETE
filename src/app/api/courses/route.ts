/**
 * GET /api/courses — List courses with filters (public)
 * GET /api/courses/[id] — Get course detail with intakes + university
 */

import { db } from "@/lib/db";
import { ok, badRequest, notFound } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const level = url.searchParams.get("level") || undefined;
    const country = url.searchParams.get("country") || undefined;
    const intakeMonth = url.searchParams.get("intakeMonth") || undefined;
    const intakeYear = url.searchParams.get("intakeYear") || undefined;
    const universityId = url.searchParams.get("universityId") || undefined;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 200);

    const where: {
      isActive: boolean;
      name?: { contains: string; mode: "insensitive" };
      level?: string;
      university?: {
        countryId?: string;
        id?: string;
        country?: { name: string };
      };
      intakes?: { some: { month: string; year: number } };
    } = { isActive: true };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (level) {
      where.level = level;
    }
    if (universityId) {
      where.university = { id: universityId };
    }
    if (country) {
      // Find country by name
      const countryRec = await db.country.findFirst({ where: { name: country } });
      if (countryRec) {
        where.university = { ...where.university, countryId: countryRec.id };
      }
    }
    if (intakeMonth && intakeYear) {
      where.intakes = {
        some: { month: intakeMonth, year: parseInt(intakeYear) },
      };
    }

    const courses = await db.course.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        university: {
          include: { country: true },
        },
        intakes: {
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    return ok({
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        duration: c.duration,
        tuitionFee: c.tuitionFee,
        currency: c.currency,
        description: c.description,
        entryRequirements: c.entryRequirements,
        university: {
          id: c.university.id,
          name: c.university.name,
          city: c.university.city,
          country: c.university.country?.name || null,
          website: c.university.website,
        },
        intakes: c.intakes.map((i) => ({
          month: i.month,
          year: i.year,
          deadline: i.deadline,
        })),
      })),
      total: courses.length,
    }, "Courses retrieved");
  });
}
