import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

const createNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
});

/**
 * GET /api/notifications
 * List notifications for the authenticated user.
 *
 * Query params:
 *   - unreadOnly=true → return only unread notifications
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  try {
    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({ data: notifications, total, unreadCount, limit, offset });
  } catch (err) {
    console.error("[GET /api/notifications] failed:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Create a notification for a specific user. Admins/staff may target
 * any user; other roles may only target themselves.
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

  const parsed = createNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;

  // Non-admins can only create notifications for themselves.
  const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "TEACHER", "EXAMINER", "EMPLOYEE"]);
  if (!ADMIN_ROLES.has(session.user.role) && d.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: d.userId,
        title: d.title,
        body: d.body,
        type: d.type,
      },
    });

    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/notifications] failed:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
