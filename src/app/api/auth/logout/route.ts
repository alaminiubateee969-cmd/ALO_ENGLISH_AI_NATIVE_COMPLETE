/**
 * POST /api/auth/logout — Clear the session.
 *
 * Requires authentication.
 * Audit logs the logout.
 */

import { clearSessionCookie, getCurrentUser } from '@/lib/auth';
import { ok, unauthorized, internalError } from '@/lib/responses';
import { audit, getClientIp } from '@/lib/audit';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized('Not authenticated');

    const ip = getClientIp(req);
    await clearSessionCookie();
    await audit('LOGOUT', { userId: user.id, ipAddress: ip });

    return ok({}, 'Logged out successfully');
  });
}
