/**
 * GET  /api/crm/courses — List courses (paginated, searchable)
 * POST /api/crm/courses — Create a new courses
 *
 * Auth: requires ADMIN role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  level: z.string().optional(),
  duration: z.string().optional(),
  tuitionFee: z.number().optional(),
  currency: z.string().optional(),
  entryRequirements: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

const config = {
  entityName: 'courses',
  roleName: 'ADMIN',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["name","level",],
  select: {
    id: true,
    universityId: true,
    name: true,
    level: true,
    duration: true,
    tuitionFee: true,
    isPublished: true,
    createdAt: true,
  },
};

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
