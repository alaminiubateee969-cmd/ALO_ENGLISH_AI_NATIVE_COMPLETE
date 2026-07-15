import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateCode } from "@/lib/utils";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  interest: z.string().max(200).optional().or(z.literal("")),
  source: z.string().max(100).default("website"),
  targetCountry: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

/**
 * POST /api/leads
 * Public lead-capture endpoint used by the marketing site contact form.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const leadCode = generateCode("LEAD");

  try {
    const lead = await prisma.lead.create({
      data: {
        leadCode,
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        interest: data.interest?.trim() || null,
        source: data.source,
        targetCountry: data.targetCountry?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json({ id: lead.id, leadCode: lead.leadCode }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads] failed:", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}

/**
 * GET /api/leads
 * Admin-only listing of all captured leads.
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
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(source ? { source } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({
        where: {
          ...(status ? { status } : {}),
          ...(source ? { source } : {}),
        },
      }),
    ]);

    return NextResponse.json({ data: leads, total, limit, offset });
  } catch (err) {
    console.error("[GET /api/leads] failed:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
