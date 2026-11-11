/**
 * GET  /api/crm/departments — List departments (paginated, searchable)
 * POST /api/crm/departments — Create a new departments
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  branchId: z.string().cuid(),
  isActive: z.boolean().optional(),
});

const config = {
  entityName: 'departments',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name",],
  select: {
    id: true,
    name: true,
    branchId: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
