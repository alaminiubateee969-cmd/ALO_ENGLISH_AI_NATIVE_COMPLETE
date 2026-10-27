/**
 * GET  /api/crm/scholarships — List scholarships (paginated, searchable)
 * POST /api/crm/scholarships — Create a new scholarships
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  universityId: z.string().cuid(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  eligibility: z.string().optional(),
  deadline: z.coerce.date().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const config = {
  entityName: 'scholarships',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
