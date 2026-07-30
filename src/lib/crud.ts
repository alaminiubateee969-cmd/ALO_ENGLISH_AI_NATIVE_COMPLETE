/**
 * src/lib/crud.ts — Generic CRUD helpers for CRM entities.
 *
 * Every CRM API route uses these helpers to ensure consistent:
 *   - Authentication (requireAuth)
 *   - Authorization (role-based)
 *   - Input validation (Zod)
 *   - Audit logging
 *   - Pagination
 *   - Error handling
 */

import { db } from './db';
import { requireAuth, requireRole } from './auth';
import { ok, badRequest, notFound, forbidden, created, internalError } from './responses';
import { withErrorHandler } from './responses';
import { audit, getClientIp } from './audit';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export type CrudConfig = {
  entityName: string;
  roleName: string; // e.g. 'ADMIN', 'COUNSELOR'
  createSchema: z.ZodSchema;
  updateSchema: z.ZodSchema;
  select: Record<string, boolean>;
  include?: Record<string, boolean>;
  searchableFields?: string[];
};

/**
 * Create a GET (list) + POST (create) route handler.
 */
export function createListHandler<T>(config: CrudConfig) {
  return async function GET(req: NextRequest): Promise<Response> {
    return withErrorHandler(async () => {
      await requireRole(config.entityName === 'audit-logs' ? 'ADMIN' : config.roleName as any);

      const url = new URL(req.url);
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
      const search = url.searchParams.get('search') || '';

      
      const model = db[config.entityName.replace(/-/g, '') as keyof typeof db] as any;
      if (!model) return internalError('Entity not found');

      const where: Record<string, unknown> = {};
      if (search && config.searchableFields) {
        where.OR = config.searchableFields.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        }));
      }

      const [records, total] = await Promise.all([
        model.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: config.select,
        }),
        model.count({ where }),
      ]);

      return ok({
        [config.entityName.replace(/-/g, '')]: records,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      }, `${config.entityName} list retrieved`);
    });
  };
}

export function createCreateHandler<T>(config: CrudConfig) {
  return async function POST(req: NextRequest): Promise<Response> {
    return withErrorHandler(async () => {
      const user = await requireRole(config.roleName as any);

      const body = await req.json().catch(() => null);
      if (!body) return badRequest('Invalid JSON body');

      const parsed = config.createSchema.safeParse(body);
      if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
      }

      
      const model = db[config.entityName.replace(/-/g, '') as keyof typeof db] as any;
      if (!model) return internalError('Entity not found');

      const record = await model.create({
        data: parsed.data,
        select: config.select,
      });

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
  return async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
    return withErrorHandler(async () => {
      await requireRole(config.roleName as any);
      const { id } = await params;

      
      const model = db[config.entityName.replace(/-/g, '') as keyof typeof db] as any;
      if (!model) return internalError('Entity not found');

      const record = await model.findUnique({
        where: { id },
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
      const user = await requireRole(config.roleName as any);
      const { id } = await params;

      const body = await req.json().catch(() => null);
      if (!body) return badRequest('Invalid JSON body');

      const parsed = config.updateSchema.safeParse(body);
      if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
      }

      
      const model = db[config.entityName.replace(/-/g, '') as keyof typeof db] as any;
      if (!model) return internalError('Entity not found');

      const existing = await model.findUnique({ where: { id } });
      if (!existing) return notFound(`${config.entityName} not found`);

      const record = await model.update({
        where: { id },
        data: parsed.data,
        select: config.select,
      });

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
      const user = await requireRole(config.roleName as any);
      const { id } = await params;

      
      const model = db[config.entityName.replace(/-/g, '') as keyof typeof db] as any;
      if (!model) return internalError('Entity not found');

      const existing = await model.findUnique({ where: { id } });
      if (!existing) return notFound(`${config.entityName} not found`);

      await model.delete({ where: { id } });

      await audit(`${config.entityName.toUpperCase()}_DELETE` as any, {
        userId: user.id,
        resource: `${config.entityName}:${id}`,
        ipAddress: getClientIp(req),
      });

      return ok({}, `${config.entityName} deleted`);
    });
  };
}
