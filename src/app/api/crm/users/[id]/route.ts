/**
 * GET    /api/crm/users/[id] — Get users by ID
 * PUT    /api/crm/users/[id] — Update users
 * DELETE /api/crm/users/[id] — Delete users
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  supervisorId: z.string().optional(),
  status: z.string().optional(),
}).partial();

const config = {
  entityName: 'users',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    phone: true,
    status: true,
    branchId: true,
    departmentId: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
