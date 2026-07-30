/**
 * GET    /api/crm/courses/[id] — Get courses by ID
 * PUT    /api/crm/courses/[id] — Update courses
 * DELETE /api/crm/courses/[id] — Delete courses
 *
 * Auth: requires ADMIN role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  level: z.string().optional(),
  duration: z.string().optional(),
  tuitionFee: z.number().optional(),
  currency: z.string().optional(),
  entryRequirements: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).partial();

const config = {
  entityName: 'courses',
  roleName: 'ADMIN',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
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

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
