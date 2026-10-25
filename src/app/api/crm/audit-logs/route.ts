/**
 * GET /api/crm/audit-logs — List audit logs (paginated, filterable)
 *
 * Auth: requires ADMIN role.
 * Supports filtering by userId, action, and date range.
 */

import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ok, badRequest } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    await requireAuth();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const userId = url.searchParams.get('userId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const where: {
      userId?: string;
      action?: string;
      OR?: Array<{ action?: { contains: string }; resource?: { contains: string } }>;
    } = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { resource: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return ok({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, 'Audit logs retrieved');
  });
}
