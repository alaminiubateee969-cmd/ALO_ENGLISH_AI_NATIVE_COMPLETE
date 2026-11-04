import { db } from "@/lib/db";
import { requireFactoryOperator } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { moduleSchema } from "@/lib/factory/validation";
import { badRequest, created, withErrorHandler } from "@/lib/responses";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const user = await requireFactoryOperator();
    const parsed = moduleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const input = parsed.data;
    const reusableModule = await db.$transaction(async (tx) => {
      const createdModule = await tx.factoryModule.create({ data: { slug: input.slug, name: input.name, category: input.category, description: input.description } });
      await tx.factoryModuleVersion.create({ data: { moduleId: createdModule.id, version: input.version, capabilities: JSON.stringify(input.capabilities), dependencies: JSON.stringify(input.dependencies), compatibility: input.compatibility, acceptanceTests: JSON.stringify(input.acceptanceTests), releaseNotes: input.releaseNotes } });
      return createdModule;
    });
    await factoryAudit({ actorUserId: user.id, action: "MODULE_VERSION_CREATED", resource: reusableModule.id, metadata: { version: input.version } });
    return created({ module: reusableModule }, "Reusable module version created");
  });
}
