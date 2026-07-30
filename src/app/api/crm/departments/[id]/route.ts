/**
 * GET    /api/crm/departments/[id] — Get departments by ID
 * PUT    /api/crm/departments/[id] — Update departments
 * DELETE /api/crm/departments/[id] — Delete departments
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  isActive: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'departments',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    name: true,
    branchId: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
