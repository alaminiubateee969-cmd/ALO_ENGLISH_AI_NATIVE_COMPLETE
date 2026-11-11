export type CrudScopeUser = {
  id: string;
  role: string;
  branchId?: string | null;
};

/**
 * Object-level access rules for the generic CRM CRUD handlers. `null` means an
 * unrestricted platform administrator. Unknown role/entity combinations fail
 * closed with an impossible identifier predicate.
 */
export function buildCrmScope(entityName: string, user: CrudScopeUser): Record<string, unknown> | null {
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return null;

  if (user.role === "COUNSELOR") {
    const counselorId = user.id;
    const scopes: Record<string, Record<string, unknown>> = {
      leads: { counselorId },
      students: { counselorId },
      applications: {
        OR: [
          { assignedTo: counselorId },
          { student: { is: { counselorId } } },
        ],
      },
      appointments: { assigneeId: counselorId },
      documents: { student: { is: { counselorId } } },
      messages: {
        OR: [
          { senderId: counselorId },
          { lead: { is: { counselorId } } },
          { student: { is: { counselorId } } },
        ],
      },
      tasks: {
        OR: [
          { assigneeId: counselorId },
          { lead: { is: { counselorId } } },
          { student: { is: { counselorId } } },
          { application: { is: { student: { is: { counselorId } } } } },
        ],
      },
    };
    return scopes[entityName] ?? { id: "__no_counselor_scope__" };
  }

  if (user.role === "STUDENT" && entityName === "notifications") {
    return { userId: user.id };
  }

  return { id: "__no_scope_for_role__" };
}

/**
 * Ignore client-selected ownership fields for counselor-managed CRM records.
 * Relationship IDs are checked separately against the same scope before a
 * write; ownership is always assigned by the server.
 */
export function applyCrmOwnership<T extends Record<string, unknown>>(
  entityName: string,
  data: T,
  user: CrudScopeUser,
): T {
  if (user.role !== "COUNSELOR") return data;

  switch (entityName) {
    case "leads":
      return { ...data, counselorId: user.id, branchId: user.branchId ?? null, partnerId: null } as T;
    case "students":
      return { ...data, counselorId: user.id, branchId: user.branchId ?? null, partnerId: null } as T;
    case "applications":
      return { ...data, assignedTo: user.id } as T;
    case "appointments":
    case "tasks":
      return { ...data, assigneeId: user.id } as T;
    case "documents":
      return { ...data, uploadedBy: user.id } as T;
    case "messages":
      return { ...data, senderId: user.id, partnerId: null } as T;
    default:
      return data;
  }
}
