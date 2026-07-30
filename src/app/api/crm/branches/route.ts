/**
 * GET  /api/crm/branches — List branches (paginated, searchable)
 * POST /api/crm/branches — Create a new branches
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const config = {
  entityName: 'branches',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
