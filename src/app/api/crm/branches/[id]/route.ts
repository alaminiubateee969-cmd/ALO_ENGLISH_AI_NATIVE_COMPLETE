/**
 * GET    /api/crm/branches/[id] — Get branches by ID
 * PUT    /api/crm/branches/[id] — Update branches
 * DELETE /api/crm/branches/[id] — Delete branches
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'branches',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    name: true,
    address: true,
    phone: true,
    email: true,
    timezone: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
