import { requireFactoryOperator } from "@/lib/factory/access";
import { provisionApplication } from "@/lib/factory/lifecycle";
import { ok, serviceUnavailable, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const result = await provisionApplication(id, user.id);
    if (result.status === "BLOCKED") return serviceUnavailable(result.message ?? "Dedicated provisioning is blocked");
    return ok(result, "Shared application provisioned to staging with real control-plane checks");
  });
}
