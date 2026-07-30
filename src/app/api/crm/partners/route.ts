/**
 * GET  /api/crm/partners — List partners (paginated, searchable)
 * POST /api/crm/partners — Create a new partners
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  commissionRate: z.number().optional(),
  status: z.string().optional(),
});

const config = {
  entityName: 'partners',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["organizationName","contactName","email",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
