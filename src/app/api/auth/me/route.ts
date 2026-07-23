/**
 * GET /api/auth/me — Get the current authenticated user.
 *
 * Returns the user object if authenticated, 401 otherwise.
 */

import { getCurrentUser } from '@/lib/auth';
import { ok, unauthorized } from '@/lib/responses';
import { withErrorHandler } from '@/lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized('Not authenticated');
    return ok({ user }, 'Current user');
  });
}
