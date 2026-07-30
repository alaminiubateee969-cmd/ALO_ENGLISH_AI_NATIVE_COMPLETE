/**
 * GET    /api/crm/messages/[id] — Get messages by ID
 * PUT    /api/crm/messages/[id] — Update messages
 * DELETE /api/crm/messages/[id] — Delete messages
 *
 * Auth: requires COUNSELOR role.
 */

import { createGetByIdHandler, createUpdateHandler, createDeleteHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  senderName: z.string().optional(),
  senderHandle: z.string().optional(),
  recipientName: z.string().optional(),
  recipientHandle: z.string().optional(),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
  partnerId: z.string().optional(),
  applicationId: z.string().optional(),
}).partial();

const config = {
  entityName: 'messages',
  roleName: 'COUNSELOR',
  createSchema: updateSchema,
  updateSchema,
  searchableFields: [],
  select: {
    id: true,
    channel: true,
    direction: true,
    senderName: true,
    recipientName: true,
    body: true,
    status: true,
    createdAt: true,
  },
};

export const GET = createGetByIdHandler(config);
export const PUT = createUpdateHandler(config);
export const DELETE = createDeleteHandler(config);
