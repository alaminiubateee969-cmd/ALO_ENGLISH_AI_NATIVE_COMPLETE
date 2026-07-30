/**
 * GET    /api/crm/countries/[id] — Get countries by ID
 * PUT    /api/crm/countries/[id] — Update countries
 * DELETE /api/crm/countries/[id] — Delete countries
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  flag: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'countries',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    name: true,
    code: true,
    flag: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
