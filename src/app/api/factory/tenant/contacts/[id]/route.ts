import { db } from "@/lib/db";
import { requireTenantAccess, tenantScope } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { badRequest, notFound, ok, withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  companyId: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(160).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).optional(),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const companyId = req.headers.get("x-factory-company-id")?.trim() ?? "";
    const access = await requireTenantAccess(companyId);
    const { id } = await ctx.params;
    const contact = await db.factoryContact.findFirst({ where: tenantScope(access.companyId, { id }) });
    if (!contact) return notFound("Contact not found in this company");
    await factoryAudit({ actorUserId: access.user.id, action: "TENANT_CONTACT_READ", resource: id, companyId: access.companyId });
    return ok({ contact });
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid contact update");
    const access = await requireTenantAccess(parsed.data.companyId, true);
    const { id } = await ctx.params;
    const existing = await db.factoryContact.findFirst({ where: tenantScope(access.companyId, { id }) });
    if (!existing) return notFound("Contact not found in this company");
    const { companyId: _companyId, ...input } = parsed.data;
    const contact = await db.factoryContact.update({ where: { id: existing.id }, data: { ...input, email: input.email === "" ? null : input.email, phone: input.phone === "" ? null : input.phone, notes: input.notes === "" ? null : input.notes } });
    await factoryAudit({ actorUserId: access.user.id, action: "TENANT_CONTACT_UPDATED", resource: id, companyId: access.companyId });
    return ok({ contact });
  });
}
