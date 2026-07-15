import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const createCertificateSchema = z.object({
  resultId: z.string().min(1),
  certificateType: z.string().max(50).default("completion"),
  studentName: z.string().max(200).optional(),
  examName: z.string().max(200).optional(),
  overallScore: z.string().max(50).optional(),
  bandEstimate: z.string().max(20).optional().nullable(),
  cefrLevel: z.string().max(20).optional().nullable(),
  pdfPath: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/certificates
 * List certificates for the authenticated student (or all for admins).
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

    const [certs, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          result: {
            select: {
              id: true,
              resultCode: true,
              examTypeId: true,
              examType: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({ data: certs, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/certificates] failed:", err);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}

/**
 * POST /api/certificates
 * Issue a certificate from an existing ExamResult. Admin only.
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

  const parsed = createCertificateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const result = await prisma.examResult.findUnique({
      where: { id: parsed.data.resultId },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
        examType: { select: { name: true } },
        certificate: { select: { id: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }
    if (result.certificate) {
      return NextResponse.json(
        { error: "Certificate already issued for this result", id: result.certificate.id },
        { status: 409 },
      );
    }

    const certCode = generateCode("CERT");
    const verificationHash = generateCode("VRF", 24);

    const cert = await prisma.certificate.create({
      data: {
        certificateCode: certCode,
        studentId: result.studentId,
        resultId: result.id,
        studentName: parsed.data.studentName ?? result.student.user.name,
        examName: parsed.data.examName ?? result.examType.name,
        overallScore: parsed.data.overallScore ?? String(result.overallScore),
        bandEstimate: parsed.data.bandEstimate ?? result.bandEstimate,
        cefrLevel: parsed.data.cefrLevel ?? result.cefrEstimate,
        certificateType: parsed.data.certificateType,
        verificationHash,
        pdfPath: parsed.data.pdfPath ?? null,
      },
    });

    return NextResponse.json({ data: cert }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/certificates] failed:", err);
    return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
  }
}
