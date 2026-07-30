/**
 * GET  /api/crm/messages — List messages (paginated, searchable)
 * POST /api/crm/messages — Create a new messages
 *
 * Auth: requires COUNSELOR role.
 */

import { createListHandler, createCreateHandler } from '@/lib/crud';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  senderName: z.string().optional(),
  senderHandle: z.string().optional(),
  recipientName: z.string().optional(),
  recipientHandle: z.string().optional(),
  leadId: z.string().optional(),
  studentId: z.string().optional(),
  partnerId: z.string().optional(),
  applicationId: z.string().optional(),
});

const config = {
  entityName: 'messages',
  roleName: 'COUNSELOR',
  createSchema,
  updateSchema: createSchema.partial(),
  searchableFields: ["body","senderName",],
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

export const GET = createListHandler(config);
export const POST = createCreateHandler(config);
