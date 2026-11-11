import { db } from "@/lib/db";
import { AuthError, requireAuth, requireRole } from "@/lib/auth";

/** Factory metadata operators. This does not grant customer-data access. */
export async function requireFactoryOperator() {
  return requireRole("ADMIN", "SUPER_ADMIN");
}

export type FactoryTenantAccess = {
  user: { id: string; role: string };
  companyId: string;
  role: "COMPANY_ADMIN" | "OPERATOR" | "VIEWER";
};

/**
 * Every tenant operation goes through this membership check. Deliberately no
 * ADMIN/SUPER_ADMIN bypass: privileged factory access must be explicit,
 * company-specific and auditable.
 */
export async function requireTenantAccess(companyId: string, write = false): Promise<FactoryTenantAccess> {
  const user = await requireAuth();
  const membership = await db.factoryMembership.findFirst({
    where: { companyId, userId: user.id, status: "ACTIVE", company: { status: "ACTIVE" } },
    select: { role: true },
  });
  if (!membership) throw new AuthError("Explicit company membership is required", 403);
  if (write && membership.role === "VIEWER") throw new AuthError("Company write permission is required", 403);
  return { user, companyId, role: membership.role as FactoryTenantAccess["role"] };
}

/** Query fragment used by every tenant read, including reports and exports. */
export function tenantScope(companyId: string, extra: Record<string, unknown> = {}) {
  return { companyId, ...extra };
}
