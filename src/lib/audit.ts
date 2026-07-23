/**
 * src/lib/audit.ts — Audit logging utility.
 *
 * Every privileged or mutating action MUST be logged via this helper.
 * Audit logs are immutable (insert-only) and retained for 365 days.
 */

import { db } from './db';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'EXAM_START'
  | 'EXAM_SUBMIT'
  | 'SCORE_GENERATED'
  | 'ADMIN_SETTINGS_UPDATE'
  | 'ADMIN_USER_UPDATE'
  | 'BACKUP_CREATED'
  | 'RESTORE_PERFORMED'
  | 'ROLE_CHANGE';

/**
 * Record an audit log entry.
 *
 * @param action    What happened (from AuditAction enum).
 * @param userId    Who did it (null for anonymous).
 * @param resource  What was acted upon.
 * @param metadata  Additional JSON-serializable context.
 * @param ipAddress The client IP (from x-forwarded-for or x-real-ip).
 */
export async function audit(
  action: AuditAction,
  options: {
    userId?: string | null;
    resource?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string | null;
  } = {}
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action,
        userId: options.userId ?? null,
        resource: options.resource ?? null,
        ipAddress: options.ipAddress ?? null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
  } catch (err) {
    // Audit logging must NEVER break the request. Log and continue.
    console.error('[audit-log-failed]', action, err);
  }
}

/**
 * Extract the client IP from request headers.
 * Checks X-Forwarded-For (Caddy) then X-Real-IP.
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return null;
}
