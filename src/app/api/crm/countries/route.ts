/**
 * GET  /api/crm/countries — List countries (paginated, searchable)
 * POST /api/crm/countries — Create a new countries
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().length(2).toUpperCase(),
  flag: z.string().optional(),
  isActive: z.boolean().optional(),
});

const config = {
  entityName: 'countries',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name","code",],
  select: {
    id: true,
    name: true,
    code: true,
    flag: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
