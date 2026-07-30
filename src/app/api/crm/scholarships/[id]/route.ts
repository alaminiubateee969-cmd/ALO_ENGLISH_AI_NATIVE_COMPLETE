/**
 * GET    /api/crm/scholarships/[id] — Get scholarships by ID
 * PUT    /api/crm/scholarships/[id] — Update scholarships
 * DELETE /api/crm/scholarships/[id] — Delete scholarships
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().optional(),
  eligibility: z.string().optional(),
  deadline: z.coerce.date().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'scholarships',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    universityId: true,
    name: true,
    amount: true,
    deadline: true,
    isActive: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
