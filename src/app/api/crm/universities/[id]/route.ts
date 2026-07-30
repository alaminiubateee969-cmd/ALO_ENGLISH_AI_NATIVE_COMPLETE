/**
 * GET    /api/crm/universities/[id] — Get universities by ID
 * PUT    /api/crm/universities/[id] — Update universities
 * DELETE /api/crm/universities/[id] — Delete universities
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  city: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'universities',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    name: true,
    countryId: true,
    city: true,
    website: true,
    isPublished: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
