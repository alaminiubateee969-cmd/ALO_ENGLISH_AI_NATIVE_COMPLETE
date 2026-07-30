/**
 * GET    /api/crm/commissions/[id] — Get commissions by ID
 * PUT    /api/crm/commissions/[id] — Update commissions
 * DELETE /api/crm/commissions/[id] — Delete commissions
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  studentId: z.string().optional(),
  status: z.string().optional(),
}).partial();

const config = {
  entityName: 'commissions',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    partnerId: true,
    studentId: true,
    amount: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
