<?php
/**
 * app/Services/QuotaService.php — THE CRITICAL free-quota enforcer.
 *
 * Free quota rule (canonical):
 *   - ALO students (verified via CRM): 3 free mock attempts total,
 *     SHARED across ALL 32 CBT exam types.
 *   - Public students (no ALO link): 1 free mock attempt total,
 *     shared across all exam types.
 *   - Partner students: 2 free attempts.
 *   - Ambassador-referred students: 2 free attempts.
 *
 * This service is BACKEND-ONLY. There is NO client-side override.
 * Every check is logged to exam_audit_logs. The exam_free_quota table
 * holds the per-student remaining balance (UNIQUE on email).
 *
 * Tamper-proofing:
 *   - The DB row is the source of truth, decremented atomically in a
 *     transaction with SELECT ... FOR UPDATE.
 *   - Quota is verified AGAIN on submit (in case the row changed
 *     between start and submit).
 *   - Admins may grant quota only via addQuota(), which audits.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class QuotaService
{
    public const TYPE_ALO       = 'alo';
    public const TYPE_PUBLIC    = 'public';
    public const TYPE_PARTNER   = 'partner';
    public const TYPE_AMBASSADOR = 'ambassador_referred';

    /**
     * Check whether the student may start a new mock attempt.
     *
     * @return array{
     *     allowed: bool,
     *     remaining: int,
     *     quota_type: string,
     *     reason?: string,
     *     alo_verified: bool
     * }
     */
    public static function checkFreeQuota(int $studentId, ?string $email = null, ?string $phone = null): array
    {
        $student = Database::one(
            'SELECT s.id, s.user_id, s.alo_student_id, s.alo_application_id,
                    s.ambassador_id, s.is_partner,
                    u.email, u.phone, u.status
               FROM exam_students s
               JOIN exam_users u ON u.id = s.user_id
              WHERE s.id = :sid
              LIMIT 1',
            ['sid' => $studentId]
        );
        if ($student === null) {
            AuditService::log(null, AuditService::ACTION_QUOTA_CHECK, 'student', $studentId, [
                'result' => 'denied', 'reason' => 'student_not_found',
            ]);
            return [
                'allowed'      => false,
                'remaining'    => 0,
                'quota_type'   => self::TYPE_PUBLIC,
                'reason'       => 'Student record not found.',
                'alo_verified' => false,
            ];
        }

        $email = $email ?? ($student['email'] ?? null);
        $phone = $phone ?? ($student['phone'] ?? null);

        // Determine quota type via CRM eligibility check.
        $alVerified = false;
        $quotaType = self::TYPE_PUBLIC;
        if (!empty($student['alo_student_id']) || !empty($student['alo_application_id'])) {
            $alVerified = CRMIntegrationService::checkEligibility($student);
            $quotaType = $alVerified ? self::TYPE_ALO : self::TYPE_PUBLIC;
        } elseif ((int) ($student['is_partner'] ?? 0) === 1) {
            $quotaType = self::TYPE_PARTNER;
        } elseif (!empty($student['ambassador_id'])) {
            $quotaType = self::TYPE_AMBASSADOR;
        }

        $limit = self::limitForType($quotaType);

        // Get or initialize the quota row (UNIQUE on email).
        $quotaRow = self::getQuotaRow($email, $phone, $quotaType, $limit);

        $remaining = max(0, (int) $quotaRow['remaining'] - self::countCompletedAttempts($studentId));

        $allowed = $remaining > 0;

        AuditService::log((int) ($student['user_id'] ?? 0), AuditService::ACTION_QUOTA_CHECK, 'student', $studentId, [
            'quota_type'   => $quotaType,
            'limit'         => $limit,
            'remaining'     => $remaining,
            'allowed'       => $allowed,
            'alo_verified'  => $alVerified,
        ]);

        return [
            'allowed'      => $allowed,
            'remaining'    => $remaining,
            'quota_type'   => $quotaType,
            'alo_verified' => $alVerified,
            'reason'       => $allowed ? null : 'Free quota exhausted. Apply a voucher or purchase an attempt.',
        ];
    }

    /**
     * Atomically consume one quota slot when an attempt is submitted.
     * MUST be called inside a transaction.
     */
    public static function consumeFreeQuota(int $studentId, int $attemptId): bool
    {
        return Database::transactional(function () use ($studentId, $attemptId): bool {
            $check = self::checkFreeQuota($studentId);
            if (!$check['allowed']) {
                return false;
            }

            $student = Database::one('SELECT user_id, email FROM exam_students s JOIN exam_users u ON u.id=s.user_id WHERE s.id = :sid FOR UPDATE', ['sid' => $studentId]);
            if ($student === null) {
                return false;
            }

            // Lock the quota row.
            $row = Database::one('SELECT * FROM exam_free_quota WHERE email = :e FOR UPDATE', ['e' => $student['email']]);
            if ($row === null) {
                return false;
            }

            $newRemaining = max(0, (int) $row['remaining'] - 1);
            Database::update('exam_free_quota', [
                'remaining'  => $newRemaining,
                'used'       => (int) $row['used'] + 1,
                'updated_at' => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $row['id']]);

            AuditService::log((int) $student['user_id'], AuditService::ACTION_QUOTA_CONSUME, 'attempt', $attemptId, [
                'student_id'    => $studentId,
                'remaining_after' => $newRemaining,
                'quota_type'    => $check['quota_type'],
            ]);
            return true;
        });
    }

    /**
     * Admin: add quota for a student (with justification).
     */
    public static function addQuota(string $email, int $amount, int $adminUserId, string $reason): bool
    {
        if ($amount <= 0 || $amount > 100) {
            throw new RuntimeException('Invalid quota amount (1..100).');
        }
        return Database::transactional(function () use ($email, $amount, $adminUserId, $reason): bool {
            $row = Database::one('SELECT * FROM exam_free_quota WHERE email = :e FOR UPDATE', ['e' => $email]);
            if ($row === null) {
                Database::insert('exam_free_quota', [
                    'email'      => $email,
                    'quota_type' => self::TYPE_PUBLIC,
                    'limit'      => $amount,
                    'remaining'  => $amount,
                    'used'       => 0,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            } else {
                Database::update('exam_free_quota', [
                    'remaining' => (int) $row['remaining'] + $amount,
                    'updated_at' => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $row['id']]);
            }
            AuditService::log($adminUserId, AuditService::ACTION_QUOTA_ADJUST, 'student', null, [
                'email' => $email, 'amount' => $amount, 'reason' => $reason,
            ]);
            return true;
        });
    }

    /**
     * Admin: reset quota to the type default.
     */
    public static function resetQuota(string $email, int $adminUserId, string $reason): bool
    {
        return Database::transactional(function () use ($email, $adminUserId, $reason): bool {
            $row = Database::one('SELECT * FROM exam_free_quota WHERE email = :e FOR UPDATE', ['e' => $email]);
            if ($row === null) {
                return false;
            }
            $limit = self::limitForType((string) $row['quota_type']);
            Database::update('exam_free_quota', [
                'limit'      => $limit,
                'remaining'  => $limit,
                'used'       => 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $row['id']]);
            AuditService::log($adminUserId, AuditService::ACTION_QUOTA_ADJUST, 'student', null, [
                'email' => $email, 'reset' => true, 'reason' => $reason,
            ]);
            return true;
        });
    }

    // ---------- Helpers ----------

    public static function limitForType(string $type): int
    {
        $cfg = require __DIR__ . '/../../config/exams.php';
        return match ($type) {
            self::TYPE_ALO        => (int) ($cfg['free_quota']['alo_student'] ?? 3),
            self::TYPE_PARTNER    => (int) ($cfg['free_quota']['partner_student'] ?? 2),
            self::TYPE_AMBASSADOR => (int) ($cfg['free_quota']['ambassador_referred'] ?? 2),
            default               => (int) ($cfg['free_quota']['public_student'] ?? 1),
        };
    }

    private static function getQuotaRow(?string $email, ?string $phone, string $type, int $limit): array
    {
        $key = $email ?? $phone ?? '';
        if ($key === '') {
            return ['remaining' => 0, 'limit' => 0, 'used' => 0];
        }
        $row = Database::one('SELECT * FROM exam_free_quota WHERE email = :k LIMIT 1', ['k' => $key]);
        if ($row !== null) {
            return $row;
        }
        // Initialize.
        $id = Database::insert('exam_free_quota', [
            'email'      => $key,
            'quota_type' => $type,
            'limit'      => $limit,
            'remaining'  => $limit,
            'used'       => 0,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
        return [
            'id'        => $id,
            'email'     => $key,
            'quota_type'=> $type,
            'limit'     => $limit,
            'remaining' => $limit,
            'used'      => 0,
        ];
    }

    private static function countCompletedAttempts(int $studentId): int
    {
        return (int) Database::scalar(
            'SELECT COUNT(*) FROM exam_mock_attempts
              WHERE student_id = :sid
                AND status IN (:s1, :s2)
                AND payment_id IS NULL
                AND voucher_id IS NULL',
            ['sid' => $studentId, 's1' => 'submitted', 's2' => 'scored']
        );
    }
}
