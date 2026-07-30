/**
 * GET  /api/crm/users — List users (paginated, searchable)
 * POST /api/crm/users — Create a new users
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  supervisorId: z.string().optional(),
  status: z.string().optional(),
});

const config = {
  entityName: 'users',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["email","name","role",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
