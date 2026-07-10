<?php
/**
 * cron/cleanup_expired_sessions.php — Daily hygiene sweep.
 *
 * Runs at 03:30 daily. Cleans up:
 *   - expired sessions (if stored in DB)
 *   - expired vouchers (status -> 'expired')
 *   - expired mock attempts (auto-submitted if not yet submitted; or
 *     marked 'expired' if empty)
 *   - stale audit-log compression (>180 days)
 *
 * Logs summary to logs/cron.log. Idempotent.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

use App\Core\Database;
use App\Services\TestEngineService;
use App\Services\VoucherService;
use App\Services\AuditService;

$job = 'cleanup_expired_sessions';
cronLog($job, 'Starting daily cleanup sweep.');

if (!cronLock($job)) {
    cronLog($job, 'Another instance is running. Exiting.', 'WARN');
    exit(0);
}

try {
    $now = date('Y-m-d H:i:s');

    // ---------- 1. Auto-submit expired mock attempts ----------
    $autoSubmitted = TestEngineService::autoSubmitIfExpired();
    cronLog($job, "Auto-submitted expired attempts: {$autoSubmitted}");

    // ---------- 2. Mark empty expired attempts as 'expired' ----------
    $expiredAttempts = Database::update(
        'exam_mock_attempts',
        ['status' => 'expired', 'updated_at' => $now],
        'status = :s AND expires_at < :now AND id NOT IN (SELECT attempt_id FROM exam_answers)',
        ['s' => 'in_progress', 'now' => $now]
    );
    cronLog($job, "Marked empty expired attempts as expired: {$expiredAttempts}");

    // ---------- 3. Expire vouchers past their expiry ----------
    $expiredVouchers = VoucherService::expire();
    cronLog($job, "Expired vouchers: {$expiredVouchers}");

    // ---------- 4. Expire password reset tokens past TTL ----------
    $expiredTokens = Database::update(
        'exam_users',
        [
            'password_reset_token'   => null,
            'password_reset_expires' => null,
            'updated_at'             => $now,
        ],
        'password_reset_expires IS NOT NULL AND password_reset_expires < :now',
        ['now' => $now]
    );
    cronLog($job, "Expired password reset tokens cleared: {$expiredTokens}");

    // ---------- 5. Soft-delete stale consultation bookings ----------
    $staleBookings = Database::update(
        'exam_consultation_bookings',
        ['status' => 'expired', 'updated_at' => $now],
        "status = 'pending' AND requested_slot_at < :now",
        ['now' => $now]
    );
    cronLog($job, "Expired stale consultation bookings: {$staleBookings}");

    // ---------- 6. (Optional) Compress very old audit logs (>180 days) ----------
    // Audit logs are append-only (DB triggers prevent UPDATE/DELETE).
    // We DO NOT touch them here; an admin may export+archive via UI.

    AuditService::log(null, 'cron.cleanup_expired_sessions', 'system', null, [
        'auto_submitted'         => $autoSubmitted,
        'expired_attempts'       => $expiredAttempts,
        'expired_vouchers'       => $expiredVouchers,
        'expired_reset_tokens'   => $expiredTokens,
        'stale_bookings'         => $staleBookings,
    ]);

    cronLog($job, 'Cleanup sweep complete.');
    exit(0);

} catch (\Throwable $e) {
    cronLog($job, 'FATAL: ' . $e->getMessage(), 'ERROR');
    exit(1);
} finally {
    cronUnlock($job);
}
