import { db } from "@/lib/db";
import { requireTenantAccess, tenantScope } from "@/lib/factory/access";
import { factoryAudit } from "@/lib/factory/audit";
import { badRequest, conflict, created, ok, withErrorHandler } from "@/lib/responses";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function companyIdFrom(req: Request): string {
  const id = req.headers.get("x-factory-company-id")?.trim() ?? "";
  if (!id) throw new Error("x-factory-company-id is required");
  return id;
}

const contactSchema = z.object({
  companyId: z.string().min(1).max(128),
  name: z.string().trim().min(1).max(160),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""),
  phone: z.string().trim().max(50).default(""),
  notes: z.string().trim().max(5000).default(""),
});

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const access = await requireTenantAccess(companyIdFrom(req));
    const contacts = await db.factoryContact.findMany({ where: tenantScope(access.companyId), orderBy: { createdAt: "desc" }, take: 500 });
    await factoryAudit({ actorUserId: access.user.id, action: "TENANT_CONTACTS_READ", resource: access.companyId, companyId: access.companyId, metadata: { resultCount: contacts.length } });
    return ok({ contacts, companyId: access.companyId });
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const parsed = contactSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues.map((issue) => issue.message).join("; "));
    const access = await requireTenantAccess(parsed.data.companyId, true);
    const input = parsed.data;
    if (input.email) {
      const duplicate = await db.factoryContact.findFirst({ where: tenantScope(access.companyId, { email: input.email }), select: { id: true } });
      if (duplicate) return conflict("A contact with this email already exists in this company");
    }
    const contact = await db.factoryContact.create({ data: { companyId: access.companyId, name: input.name, email: input.email || null, phone: input.phone || null, notes: input.notes || null, createdBy: access.user.id } });
    await factoryAudit({ actorUserId: access.user.id, action: "TENANT_CONTACT_CREATED", resource: contact.id, companyId: access.companyId });
    return created({ contact }, "Company-scoped contact created");
  });
}
