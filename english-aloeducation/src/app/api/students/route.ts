import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const createStudentSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  targetCountry: z.string().max(100).optional().nullable(),
  targetCourse: z.string().max(200).optional().nullable(),
  targetScore: z.string().max(50).optional().nullable(),
  currentLevel: z.string().max(50).optional().nullable(),
  aloStudentId: z.string().max(100).optional().nullable(),
  aloLeadId: z.string().max(100).optional().nullable(),
});

/**
 * GET /api/students
 * Admin-only listing of all students.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
  const search = searchParams.get("search")?.trim();

  const where = {
    ...(search
      ? {
          OR: [
            { studentCode: { contains: search } },
            { user: { name: { contains: search } } },
            { user: { email: { contains: search } } },
          ],
        }
      : {}),
  };

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ data: students, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/students] failed:", err);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

/**
 * POST /api/students
 * Admin-only creation of a student. Creates the User row (with hashed
 * password) and the linked Student profile in a single transaction.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createStudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(d.password, 12);
    const studentCode = generateCode("STU");

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: d.name.trim(),
          email,
          phone: d.phone?.trim() || null,
          passwordHash,
          role: "STUDENT",
          status: "active",
        },
      });

      const s = await tx.student.create({
        data: {
          userId: user.id,
          studentCode,
          aloStudentId: d.aloStudentId ?? null,
          aloLeadId: d.aloLeadId ?? null,
          targetCountry: d.targetCountry ?? null,
          targetCourse: d.targetCourse ?? null,
          targetScore: d.targetScore ?? null,
          currentLevel: d.currentLevel ?? null,
          profileStatus: "incomplete",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, role: true, status: true },
          },
        },
      });

      return s;
    });

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/students] failed:", err);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
