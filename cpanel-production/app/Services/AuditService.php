<?php
/**
 * app/Services/AuditService.php — Append-only audit log writer.
 *
 * Writes to exam_audit_logs with IP, user agent, actor, action, entity.
 * The table is protected by DB triggers (see install.sql) that prevent
 * UPDATE/DELETE — only INSERT is allowed.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class AuditService
{
    public const ACTION_LOGIN_SUCCESS       = 'auth.login.success';
    public const ACTION_LOGIN_FAILED        = 'auth.login.failed';
    public const ACTION_LOGOUT              = 'auth.logout';
    public const ACTION_PASSWORD_RESET_REQ  = 'auth.password_reset.request';
    public const ACTION_PASSWORD_RESET_DONE = 'auth.password_reset.done';
    public const ACTION_PASSWORD_CHANGE     = 'auth.password.change';
    public const ACTION_QUOTA_CHECK         = 'quota.check';
    public const ACTION_QUOTA_CONSUME       = 'quota.consume';
    public const ACTION_QUOTA_ADJUST        = 'quota.adjust';
    public const ACTION_ATTEMPT_START       = 'attempt.start';
    public const ACTION_ATTEMPT_SAVE        = 'attempt.save';
    public const ACTION_ATTEMPT_SUBMIT      = 'attempt.submit';
    public const ACTION_ATTEMPT_AUTOSUBMIT  = 'attempt.autosubmit';
    public const ACTION_VOUCHER_GENERATE    = 'voucher.generate';
    public const ACTION_VOUCHER_REDEEM      = 'voucher.redeem';
    public const ACTION_QUESTION_CREATE     = 'question.create';
    public const ACTION_QUESTION_UPDATE     = 'question.update';
    public const ACTION_QUESTION_DELETE     = 'question.delete';
    public const ACTION_QUESTION_PUBLISH    = 'question.publish';
    public const ACTION_WEEKLY_UPDATE_RUN   = 'weekly_update.run';
    public const ACTION_CRM_SYNC            = 'crm.sync';
    public const ACTION_CRM_PUSH            = 'crm.push';
    public const ACTION_SETTINGS_UPDATE     = 'settings.update';
    public const ACTION_USER_CREATE         = 'user.create';
    public const ACTION_USER_UPDATE         = 'user.update';
    public const ACTION_USER_SUSPEND        = 'user.suspend';
    public const ACTION_FILE_UPLOAD         = 'file.upload';
    public const ACTION_FILE_DOWNLOAD       = 'file.download';
    public const ACTION_DATA_EXPORT         = 'data.export';

    /**
     * Log an audit event. Never throws — failures are silently logged
     * via error_log so they cannot break the user request flow.
     *
     * @param int|null          $actorUserId
     * @param string            $action
     * @param string            $entityType  e.g. 'attempt', 'voucher', 'user'
     * @param int|string|null   $entityId
     * @param array             $details     Structured details (JSON-encoded).
     */
    public static function log(
        ?int $actorUserId,
        string $action,
        string $entityType = '',
        int|string|null $entityId = null,
        array $details = []
    ): void {
        try {
            Database::insert('exam_audit_logs', [
                'actor_user_id' => $actorUserId,
                'action'        => $action,
                'entity_type'   => $entityType,
                'entity_id'     => $entityId === null ? null : (string) $entityId,
                'details_json'  => json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'ip_address'    => self::clientIp(),
                'user_agent'    => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
                'created_at'    => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            // Audit logging MUST NOT break request flow.
            @error_log('[audit] failed: ' . $e->getMessage());
        }
    }

    private static function clientIp(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        // Respect first X-Forwarded-For value only when trusted proxy is configured.
        $trusted = array_filter(array_map('trim', explode(',', (string)(getenv('TRUSTED_PROXIES') ?: ''))));
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR']) && in_array($ip, $trusted, true)) {
            $chain = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $candidate = trim($chain[0]);
            if (filter_var($candidate, FILTER_VALIDATE_IP) !== false) {
                $ip = $candidate;
            }
        }
        return (string) $ip;
    }
}
