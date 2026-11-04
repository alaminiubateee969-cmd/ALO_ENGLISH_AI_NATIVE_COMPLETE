import { requireFactoryOperator } from "@/lib/factory/access";
import { validateApplication } from "@/lib/factory/lifecycle";
import { notFound, ok, unprocessable, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    try {
      const result = await validateApplication(id, user.id);
      return result.passed ? ok(result, "Configuration validated") : unprocessable("Configuration validation failed; review the checks");
    } catch (error) {
      if (error instanceof Error && error.message === "Application not found") return notFound(error.message);
      throw error;
    }
  });
}
