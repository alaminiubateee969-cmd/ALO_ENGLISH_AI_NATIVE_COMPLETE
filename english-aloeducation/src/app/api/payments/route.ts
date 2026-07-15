import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode, toNumber } from "@/lib/utils";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const createPaymentSchema = z.object({
  studentId: z.string().optional().nullable(),
  enrollmentId: z.string().optional().nullable(),
  amount: z.number().nonnegative(),
  currency: z.string().max(10).default("BDT"),
  method: z.string().max(50).optional().nullable(),
  status: z.string().max(50).default("pending"),
  transactionId: z.string().max(200).optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/payments
 * List payments. Students see only their own (via their enrollments);
 * admins/staff see all.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);
  const status = searchParams.get("status");

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

    // Build where clause — student-scoped by enrollment ownership.
    const where = studentId
      ? { enrollment: { studentId }, ...(status ? { status } : {}) }
      : { ...(status ? { status } : {}) };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          enrollment: {
            select: {
              id: true,
              studentId: true,
              courseId: true,
              course: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const data = payments.map((p) => ({
      ...p,
      amount: toNumber(p.amount),
    }));

    return NextResponse.json({ data, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/payments] failed:", err);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

/**
 * POST /api/payments
 * Record a new payment. Admin/staff can create on behalf of any student;
 * students can only create payments tied to their own enrollments.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;

  try {
    // If enrollmentId is supplied, verify ownership for student callers.
    if (d.enrollmentId && session.user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: d.enrollmentId },
        select: { studentId: true },
      });
      if (!student || !enrollment || enrollment.studentId !== student.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Students may not set arbitrary statuses — only "pending".
    const finalStatus =
      session.user.role === "STUDENT" && !ADMIN_ROLES.has(session.user.role)
        ? "pending"
        : d.status;

    const payment = await prisma.payment.create({
      data: {
        paymentCode: generateCode("PAY"),
        studentId: d.studentId ?? null,
        enrollmentId: d.enrollmentId ?? null,
        amount: d.amount,
        currency: d.currency,
        method: d.method ?? null,
        status: finalStatus,
        transactionId: d.transactionId ?? null,
        paidAt: d.paidAt ? new Date(d.paidAt) : null,
      },
    });

    return NextResponse.json(
      { data: { ...payment, amount: toNumber(payment.amount) } },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/payments] failed:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
