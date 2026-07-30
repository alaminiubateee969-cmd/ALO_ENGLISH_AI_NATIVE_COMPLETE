/**
 * GET    /api/crm/partners/[id] — Get partners by ID
 * PUT    /api/crm/partners/[id] — Update partners
 * DELETE /api/crm/partners/[id] — Delete partners
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionRate: z.number().optional(),
  status: z.string().optional(),
}).partial();

const config = {
  entityName: 'partners',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    organizationName: true,
    contactName: true,
    email: true,
    phone: true,
    status: true,
    commissionRate: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
