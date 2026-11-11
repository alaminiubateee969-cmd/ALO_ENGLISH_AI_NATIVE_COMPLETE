import { requireFactoryOperator } from "@/lib/factory/access";
import { createFactoryBackup } from "@/lib/factory/backup";
import { created, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const { id } = await ctx.params;
    const backup = await createFactoryBackup(id, user.id);
    return created({ backup }, "Consistent backup and company definition written; backup integrity verified");
  });
}
