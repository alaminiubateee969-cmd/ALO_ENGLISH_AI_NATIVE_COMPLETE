import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const createVoucherSchema = z.object({
  voucherType: z.string().min(1).max(50),
  studentId: z.string().optional().nullable(),
  usageLimit: z.number().int().min(1).default(1),
  expiresAt: z.string().datetime().optional().nullable(),
  status: z.string().max(50).default("available"),
});

/**
 * GET /api/vouchers
 * List vouchers. Students only see their own; admins/staff see all.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    let studentId: string | undefined;

    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!student) {
        return NextResponse.json({ data: [], total: 0, limit, offset });
      }
      studentId = student.id;
    }

    const where = studentId ? { studentId } : {};

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({ data: vouchers, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/vouchers] failed:", err);
    return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 });
  }
}

/**
 * POST /api/vouchers
 * Admin-only voucher creation.
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

  const parsed = createVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const voucherCode = generateCode("VCH", 8);

  try {
    const voucher = await prisma.voucher.create({
      data: {
        voucherCode,
        voucherType: d.voucherType,
        studentId: d.studentId ?? null,
        usageLimit: d.usageLimit,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        status: d.status,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ data: voucher }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/vouchers] failed:", err);
    return NextResponse.json({ error: "Failed to create voucher" }, { status: 500 });
  }
}


