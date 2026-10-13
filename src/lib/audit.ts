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
  | 'ROLE_CHANGE'
  | 'LEAD_CREATE'
  | 'LEADS_CREATE'
  | 'STUDENTS_CREATE'
  | 'PARTNERS_CREATE'
  | 'APPLICATIONS_CREATE'
  | 'UNIVERSITIES_CREATE'
  | 'COURSES_CREATE'
  | 'SCHOLARSHIPS_CREATE'
  | 'COUNTRIES_CREATE'
  | 'BRANCHES_CREATE'
  | 'DEPARTMENTS_CREATE'
  | 'DOCUMENTS_CREATE'
  | 'MESSAGES_CREATE'
  | 'TASKS_CREATE'
  | 'APPOINTMENTS_CREATE'
  | 'NOTIFICATIONS_CREATE'
  | 'USERS_CREATE'
  | 'COMMISSIONS_CREATE'
  | 'AUDIT-LOGS_CREATE'
  | 'LEADS_UPDATE'
  | 'STUDENTS_UPDATE'
  | 'PARTNERS_UPDATE'
  | 'APPLICATIONS_UPDATE'
  | 'UNIVERSITIES_UPDATE'
  | 'COURSES_UPDATE'
  | 'SCHOLARSHIPS_UPDATE'
  | 'COUNTRIES_UPDATE'
  | 'BRANCHES_UPDATE'
  | 'DEPARTMENTS_UPDATE'
  | 'DOCUMENTS_UPDATE'
  | 'MESSAGES_UPDATE'
  | 'TASKS_UPDATE'
  | 'APPOINTMENTS_UPDATE'
  | 'NOTIFICATIONS_UPDATE'
  | 'USERS_UPDATE'
  | 'COMMISSIONS_UPDATE'
  | 'AUDIT-LOGS_UPDATE'
  | 'LEADS_DELETE'
  | 'STUDENTS_DELETE'
  | 'PARTNERS_DELETE'
  | 'APPLICATIONS_DELETE'
  | 'UNIVERSITIES_DELETE'
  | 'COURSES_DELETE'
  | 'SCHOLARSHIPS_DELETE'
  | 'COUNTRIES_DELETE'
  | 'BRANCHES_DELETE'
  | 'DEPARTMENTS_DELETE'
  | 'DOCUMENTS_DELETE'
  /** A document was read or an attempt to read it was refused. */
  | 'DOCUMENTS_DOWNLOAD'
  /** An outbound message was queued, refused, deferred, sent or failed. */
  | 'MESSAGES_SEND'
  /** A delivery receipt from a provider was applied to a message. */
  | 'MESSAGES_RECEIPT'
  /** A consent decision was recorded in the register, or a capture was promoted. */
  | 'CONSENT_RECORD'
  /** A review-queue entry was linked, dismissed or deferred. */
  | 'REVIEW_RESOLVE'
  | 'MESSAGES_DELETE'
  | 'TASKS_DELETE'
  | 'APPOINTMENTS_DELETE'
  | 'NOTIFICATIONS_DELETE'
  | 'USERS_DELETE'
  | 'COMMISSIONS_DELETE'
  | 'AUDIT-LOGS_DELETE'
  // Phase 1: RBAC + Multi-tenancy audit actions
  | 'ROLE_CREATED'
  | 'ROLE_UPDATED'
  | 'ROLE_DELETED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'SESSION_REVOKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'BLOG_POST_CREATED'
  | 'BLOG_POST_PUBLISHED'
  | 'BLOG_POST_UPDATED';

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
