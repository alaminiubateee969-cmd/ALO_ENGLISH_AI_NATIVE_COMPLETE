/**
 * Generic CRM CRUD handlers. These enforce authentication, role and record
 * ownership in the query itself; client-side visibility is not an access rule.
 */

import { db } from "./db";
import { requireRole } from "./auth";
import { applyCrmOwnership, buildCrmScope, type CrudScopeUser } from "./crud-scope";
import { ok, badRequest, notFound, forbidden, created, serviceUnavailable } from "./responses";
import { withErrorHandler } from "./responses";
import { audit, getClientIp } from "./audit";
import type { NextRequest } from "next/server";
import { z } from "zod";

/** Map URL collection names to Prisma model accessors. */
function getModelAccessor(entityName: string): string {
  const singularMap: Record<string, string> = {
    leads: "lead",
    students: "student",
    partners: "partner",
    applications: "application",
    universities: "university",
    courses: "course",
    scholarships: "scholarship",
    countries: "country",
    branches: "branch",
    departments: "department",
    documents: "document",
    messages: "message",
    tasks: "task",
    appointments: "appointment",
    notifications: "notification",
    users: "user",
    commissions: "commission",
    "audit-logs": "auditLog",
  };
  return singularMap[entityName] || entityName.replace(/-/g, "").replace(/s$/, "");
}

/** Get a Prisma delegate for an entity name. */
function getModel(entityName: string): any {
  const accessor = getModelAccessor(entityName);
  const model = (db as any)[accessor];
  if (!model || typeof model.findMany !== "function") {
    throw new Error(`Unknown entity: ${entityName} (accessor: ${accessor})`);
  }
  return model;
}

export type CrudConfig = {
  entityName: string;
  roleName: string;
  createSchema: z.ZodSchema;
  updateSchema: z.ZodSchema;
  select: Record<string, boolean>;
  include?: Record<string, boolean>;
  searchableFields?: string[];
};

function rolesFor(config: CrudConfig): string[] {
  // The top-level administrator inherits the platform-admin CRM surface.
  return config.roleName === "ADMIN" ? ["ADMIN", "SUPER_ADMIN"] : [config.roleName];
}

async function requireCrudUser(config: CrudConfig): Promise<CrudScopeUser> {
  return requireRole(...rolesFor(config));
}

function combineWhere(
  scope: Record<string, unknown> | null,
  filter?: Record<string, unknown>,
): Record<string, unknown> {
  if (!scope || Object.keys(scope).length === 0) return filter ?? {};
  if (!filter || Object.keys(filter).length === 0) return scope;
  return { AND: [scope, filter] };
}

async function counselorOwns(entityName: string, id: unknown, user: CrudScopeUser): Promise<boolean> {
  if (typeof id !== "string" || id.length === 0) return false;
  const scope = buildCrmScope(entityName, user);
  if (!scope) return true;
  const model = getModel(entityName);
  const found = await model.findFirst({
    where: combineWhere(scope, { id }),
    select: { id: true },
  });
  return Boolean(found);
}

/** Validate foreign-key references before a counselor can create or reassign a record. */
async function relatedRecordsAreOwned(
  entityName: string,
  data: Record<string, unknown>,
  user: CrudScopeUser,
): Promise<boolean> {
  if (user.role !== "COUNSELOR") return true;

  const owns = async (model: string, key: string, required = false) => {
    const id = data[key];
    if (id === undefined || id === null || id === "") return !required;
    return counselorOwns(model, id, user);
  };

  switch (entityName) {
    case "applications":
      return owns("students", "studentId", true);
    case "appointments":
    case "tasks":
    case "messages":
      return (await owns("students", "studentId"))
        && (await owns("leads", "leadId"))
        && (await owns("applications", "applicationId"));
    case "documents": {
      if (!(await owns("students", "studentId", true))) return false;
      if (!(await owns("applications", "applicationId"))) return false;
      if (data.applicationId && data.studentId) {
        const application = await db.application.findFirst({
          where: combineWhere(buildCrmScope("applications", user), { id: data.applicationId as string }),
          select: { studentId: true },
        });
        if (!application || application.studentId !== data.studentId) return false;
      }
      return true;
    }
    default:
      return true;
  }
}

function counselorMutationBlocked(entityName: string, user: CrudScopeUser): boolean {
  // File records have no verified private upload/storage lifecycle. The
  // read-only endpoint returns metadata only; do not accept client file paths.
  return user.role === "COUNSELOR" && entityName === "documents";
}

/** Create a GET (list) + POST (create) route handler. */
export function createListHandler<T>(config: CrudConfig) {
  return async function GET(req: NextRequest): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireCrudUser(config);
      const scope = buildCrmScope(config.entityName, user);
      const url = new URL(req.url);
      const pageRaw = Number.parseInt(url.searchParams.get("page") || "1", 10);
      const limitRaw = Number.parseInt(url.searchParams.get("limit") || "20", 10);
      const page = Number.isFinite(pageRaw) ? Math.min(1_000_000, Math.max(1, pageRaw)) : 1;
      const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 20;
      const search = (url.searchParams.get("search") || "").trim().slice(0, 100);

      const filter: Record<string, unknown> = {};
      if (search && config.searchableFields?.length) {
        filter.OR = config.searchableFields.map((field) => ({
          [field]: { contains: search },
        }));
      }
      const where = combineWhere(scope, filter);
      const model = getModel(config.entityName);
      const [records, total] = await Promise.all([
        model.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: config.select,
        }),
        model.count({ where }),
      ]);

      return ok({
        [config.entityName.replace(/-/g, "")]: records,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, `${config.entityName} list retrieved`);
    });
  };
}

export function createCreateHandler<T>(config: CrudConfig) {
  return async function POST(req: NextRequest): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireCrudUser(config);
      if (counselorMutationBlocked(config.entityName, user)) {
        return serviceUnavailable("Document changes are disabled until a private upload and retention flow is verified.");
      }
      if (user.role === "STUDENT" && config.entityName === "notifications") {
        return forbidden("System notifications can only be created by server workflows");
      }

      const body = await req.json().catch(() => null);
      if (!body) return badRequest("Invalid JSON body");
      const parsed = config.createSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");

      const data = applyCrmOwnership(
        config.entityName,
        parsed.data as Record<string, unknown>,
        user,
      );
      if (!(await relatedRecordsAreOwned(config.entityName, data, user))) {
        return forbidden("You can only link records within your assigned scope");
      }

      const model = getModel(config.entityName);
      const record = await model.create({ data, select: config.select });
      await audit(`${config.entityName.toUpperCase()}_CREATE` as any, {
        userId: user.id,
        resource: `${config.entityName}:${record.id}`,
        ipAddress: getClientIp(req),
      });
      return created(record, `${config.entityName} created`);
    });
  };
}

export function createGetByIdHandler(config: CrudConfig) {
  return async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireCrudUser(config);
      const { id } = await params;
      const scope = buildCrmScope(config.entityName, user);
      const model = getModel(config.entityName);
      const record = await model.findFirst({
        where: combineWhere(scope, { id }),
        select: config.select,
      });
      if (!record) return notFound(`${config.entityName} not found`);
      return ok(record, `${config.entityName} retrieved`);
    });
  };
}

export function createUpdateHandler(config: CrudConfig) {
  return async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireCrudUser(config);
      if (counselorMutationBlocked(config.entityName, user)) {
        return serviceUnavailable("Document changes are disabled until a private upload and retention flow is verified.");
      }

      const { id } = await params;
      const scope = buildCrmScope(config.entityName, user);
      const where = combineWhere(scope, { id });
      const model = getModel(config.entityName);
      const existing = await model.findFirst({ where });
      if (!existing) return notFound(`${config.entityName} not found`);

      const body = await req.json().catch(() => null);
      if (!body) return badRequest("Invalid JSON body");
      const parsed = config.updateSchema.safeParse(body);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Validation failed");
      if (Object.keys(parsed.data as Record<string, unknown>).length === 0) {
        return badRequest("Provide at least one field to update");
      }

      const candidate = { ...existing, ...(parsed.data as Record<string, unknown>) };
      if (!(await relatedRecordsAreOwned(config.entityName, candidate, user))) {
        return forbidden("You can only link records within your assigned scope");
      }
      const data = applyCrmOwnership(
        config.entityName,
        parsed.data as Record<string, unknown>,
        user,
      );
      const result = await model.updateMany({ where, data });
      if (!result.count) return notFound(`${config.entityName} not found`);
      const record = await model.findFirst({ where, select: config.select });
      if (!record) return notFound(`${config.entityName} not found`);

      await audit(`${config.entityName.toUpperCase()}_UPDATE` as any, {
        userId: user.id,
        resource: `${config.entityName}:${id}`,
        ipAddress: getClientIp(req),
      });
      return ok(record, `${config.entityName} updated`);
    });
  };
}

export function createDeleteHandler(config: CrudConfig) {
  return async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireCrudUser(config);
      if (counselorMutationBlocked(config.entityName, user)) {
        return serviceUnavailable("Document changes are disabled until a private upload and retention flow is verified.");
      }

      const { id } = await params;
      const scope = buildCrmScope(config.entityName, user);
      const where = combineWhere(scope, { id });
      const model = getModel(config.entityName);
      const result = await model.deleteMany({ where });
      if (!result.count) return notFound(`${config.entityName} not found`);

      await audit(`${config.entityName.toUpperCase()}_DELETE` as any, {
        userId: user.id,
        resource: `${config.entityName}:${id}`,
        ipAddress: getClientIp(req),
      });
      return ok({}, `${config.entityName} deleted`);
    });
  };
}
