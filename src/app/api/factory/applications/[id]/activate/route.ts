import { requireFactoryOperator } from "@/lib/factory/access";
import { activateApplication } from "@/lib/factory/lifecycle";
import { badRequest, ok, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({})) as { note?: unknown };
    if (typeof body.note !== "string" || body.note.trim().length < 3) return badRequest("An approval note is required");
    const result = await activateApplication(id, user.id, body.note.trim());
    return ok(result, "Human-approved release activated");
  });
}
