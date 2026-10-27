/**
 * GET  /api/crm/commissions — List commissions (paginated, searchable)
 * POST /api/crm/commissions — Create a new commissions
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  partnerId: z.string().cuid(),
  amount: z.number().min(0),
  studentId: z.string().optional(),
  status: z.string().optional(),
});

const config = {
  entityName: 'commissions',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["status",],
  select: {
    id: true,
    partnerId: true,
    studentId: true,
    amount: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
