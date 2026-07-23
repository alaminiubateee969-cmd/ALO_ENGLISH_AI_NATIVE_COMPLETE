/**
 * GET /api/admin/settings — List all settings.
 * POST /api/admin/settings — Update a setting.
 *
 * Requires ADMIN role.
 */

import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ok, badRequest, internalError } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { withErrorHandler } from '@/lib/responses';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    await requireRole('ADMIN');
    const settings = await db.setting.findMany({ orderBy: { key: 'asc' } });
    return ok({ settings }, 'Settings retrieved');
  });
}

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole('ADMIN');

    const body = await req.json().catch(() => null);
    if (!body) return badRequest('Invalid JSON body');

    const schema = z.object({
      key: z.string().min(1).max(100).regex(/^[a-z_]+$/, 'Key must be lowercase snake_case'),
      value: z.string().max(2000),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Validation failed');
    }

    const { key, value } = parsed.data;

    const setting = await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await audit('ADMIN_SETTINGS_UPDATE', {
      userId: user.id,
      resource: 'setting:' + key,
      ipAddress: getClientIp(req),
      metadata: { key, previousValue: 'redacted', newValue: value },
    });

    return ok({ setting }, 'Setting updated');
  });
}
