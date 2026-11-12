/**
 * GET /api/subjects — List all subjects (public)
 */

import { db } from "@/lib/db";
import { ok } from "@/lib/responses";
import { withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withErrorHandler(async () => {
    const subjects = await db.subject.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return ok({ subjects }, "Subjects retrieved");
  });
}
