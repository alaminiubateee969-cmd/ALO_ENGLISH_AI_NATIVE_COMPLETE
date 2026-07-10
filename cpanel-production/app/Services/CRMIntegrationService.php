<?php
/**
 * app/Services/CRMIntegrationService.php — ALO CRM server-to-server client.
 *
 * All CRM calls use the ALO_CRM_API_KEY from env only. The key is NEVER
 * logged, NEVER returned in responses, NEVER echoed in error messages.
 * Every call is logged to exam_crm_sync_logs. Failures are queued with
 * status='pending' and retried by cron/crm_sync.php.
 *
 * Endpoints (POST unless noted):
 *   syncStudent        POST /students/sync
 *   checkEligibility   POST /students/eligibility
 *   pushResult         POST /attempts/result
 *   pushVoucherUsage   POST /vouchers/usage
 *   pushFeedback       POST /feedback
 *   pushMessage        POST /messages
 *   health             GET  /health
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class CRMIntegrationService
{
    public const STATUS_PENDING  = 'pending';
    public const STATUS_SUCCESS  = 'success';
    public const STATUS_FAILED   = 'failed';
    public const STATUS_RETRYING = 'retrying';

    /**
     * Synchronize a student record to the CRM. Idempotent.
     */
    public static function syncStudent(int $studentId): array
    {
        $student = Database::one(
            'SELECT s.id, s.alo_student_id, s.alo_application_id, u.email, u.phone, u.full_name
               FROM exam_students s JOIN exam_users u ON u.id = s.user_id
              WHERE s.id = :sid LIMIT 1',
            ['sid' => $studentId]
        );
        if ($student === null) {
            return ['ok' => false, 'error' => 'student_not_found'];
        }
        $payload = [
            'platform_student_id' => $student['id'],
            'alo_student_id'      => $student['alo_student_id'],
            'alo_application_id'  => $student['alo_application_id'],
            'email'               => $student['email'],
            'phone'               => $student['phone'],
            'full_name'           => $student['full_name'],
        ];
        return self::call('/students/sync', $payload, 'student', $studentId);
    }

    /**
     * Check ALO student eligibility (used by QuotaService to decide ALO vs public quota).
     */
    public static function checkEligibility(array $student): bool
    {
        // If CRM sync is disabled, fall back to local flag.
        if (!self::isEnabled()) {
            return !empty($student['alo_student_id']);
        }
        $payload = [
            'alo_student_id'     => $student['alo_student_id'] ?? null,
            'alo_application_id' => $student['alo_application_id'] ?? null,
            'email'              => $student['email'] ?? null,
        ];
        $r = self::call('/students/eligibility', $payload, 'student', (int) $student['id']);
        return $r['ok'] === true && ($r['eligible'] ?? false) === true;
    }

    /**
     * Push an attempt result to CRM.
     */
    public static function pushResult(int $attemptId): array
    {
        $row = Database::one(
            'SELECT a.id, a.attempt_code, a.student_id, a.percent_score, a.status,
                    s.alo_student_id, et.type_code
               FROM exam_mock_attempts a
               LEFT JOIN exam_students s ON s.id = a.student_id
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
              WHERE a.id = :id',
            ['id' => $attemptId]
        );
        if ($row === null) {
            return ['ok' => false, 'error' => 'attempt_not_found'];
        }
        $payload = [
            'platform_attempt_id' => $row['id'],
            'attempt_code'        => $row['attempt_code'],
            'alo_student_id'      => $row['alo_student_id'],
            'exam_type'           => $row['type_code'],
            'percent_score'       => (float) $row['percent_score'],
        ];
        return self::call('/attempts/result', $payload, 'attempt', $attemptId);
    }

    public static function pushVoucherUsage(int $voucherUsageId): array
    {
        $row = Database::one('SELECT * FROM exam_voucher_usage WHERE id = :id', ['id' => $voucherUsageId]);
        if ($row === null) {
            return ['ok' => false, 'error' => 'usage_not_found'];
        }
        return self::call('/vouchers/usage', $row, 'voucher_usage', $voucherUsageId);
    }

    public static function pushFeedback(int $feedbackId): array
    {
        $row = Database::one('SELECT * FROM exam_feedback WHERE id = :id', ['id' => $feedbackId]);
        if ($row === null) {
            return ['ok' => false, 'error' => 'feedback_not_found'];
        }
        return self::call('/feedback', $row, 'feedback', $feedbackId);
    }

    public static function pushMessage(int $messageId): array
    {
        $row = Database::one('SELECT * FROM exam_consultation_bookings WHERE id = :id', ['id' => $messageId]);
        if ($row === null) {
            return ['ok' => false, 'error' => 'message_not_found'];
        }
        return self::call('/messages', $row, 'message', $messageId);
    }

    public static function health(): array
    {
        if (!self::isEnabled()) {
            return ['ok' => false, 'error' => 'crm_disabled'];
        }
        return self::call('/health', [], 'system', null, 'GET');
    }

    /**
     * Public retry entrypoint used by cron/crm_sync.php — re-invokes a
     * previously logged sync attempt using its recorded endpoint + payload.
     *
     * @internal Cron-only.
     */
    public static function retry(string $endpoint, array $payload, string $entityType, ?int $entityId): array
    {
        return self::call($endpoint, $payload, $entityType, $entityId);
    }

    // ---------- Internals ----------

    private static function isEnabled(): bool
    {
        return getenv('ALO_CRM_SYNC_ENABLED') !== 'false'
            && getenv('ALO_CRM_BASE_URL') !== false
            && getenv('ALO_CRM_BASE_URL') !== ''
            && getenv('ALO_CRM_API_KEY') !== false
            && getenv('ALO_CRM_API_KEY') !== '';
    }

    private static function baseUrl(): string
    {
        return rtrim((string) getenv('ALO_CRM_BASE_URL'), '/');
    }

    /**
     * @param 'GET'|'POST' $method
     */
    private static function call(string $endpoint, array $payload, string $entityType, ?int $entityId, string $method = 'POST'): array
    {
        $logId = self::logStart($entityType, $entityId, $endpoint, $payload);

        if (!self::isEnabled()) {
            self::logFinish($logId, self::STATUS_FAILED, ['error' => 'crm_disabled']);
            return ['ok' => false, 'error' => 'crm_disabled'];
        }

        $url = self::baseUrl() . $endpoint;
        $apiKey = (string) getenv('ALO_CRM_API_KEY'); // NEVER logged

        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => (int) (getenv('ALO_CRM_SYNC_TIMEOUT_SECONDS') ?: 20),
                CURLOPT_CUSTOMREQUEST  => $method,
                CURLOPT_HTTPHEADER     => [
                    'Content-Type: application/json',
                    'Accept: application/json',
                    'X-Api-Key: ' . $apiKey,
                ],
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
            ]);
            if ($method === 'POST') {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
            }

            $body = curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);

            if ($body === false || $err !== '' && $err !== '0') {
                self::logFinish($logId, self::STATUS_RETRYING, ['error' => 'transport_error', 'detail' => substr($err, 0, 200)]);
                return ['ok' => false, 'error' => 'transport_error'];
            }

            $decoded = json_decode((string) $body, true);
            if ($status >= 200 && $status < 300) {
                self::logFinish($logId, self::STATUS_SUCCESS, ['http_status' => $status, 'body' => $decoded]);
                AuditService::log(null, AuditService::ACTION_CRM_PUSH, $entityType, $entityId, [
                    'endpoint' => $endpoint, 'http_status' => $status,
                ]);
                return ['ok' => true, 'data' => $decoded];
            }
            self::logFinish($logId, self::STATUS_RETRYING, ['http_status' => $status, 'body' => $decoded]);
            return ['ok' => false, 'error' => 'http_' . $status];
        } catch (\Throwable $e) {
            self::logFinish($logId, self::STATUS_FAILED, ['error' => 'exception', 'msg' => substr($e->getMessage(), 0, 200)]);
            return ['ok' => false, 'error' => 'exception'];
        }
    }

    private static function logStart(string $entityType, ?int $entityId, string $endpoint, array $payload): int
    {
        return Database::insert('exam_crm_sync_logs', [
            'entity_type'   => $entityType,
            'entity_id'     => $entityId,
            'endpoint'      => $endpoint,
            'request_body'  => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'status'        => self::STATUS_PENDING,
            'attempts'      => 0,
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
    }

    private static function logFinish(int $logId, string $status, array $response): void
    {
        try {
            Database::update('exam_crm_sync_logs', [
                'status'        => $status,
                'response_body' => json_encode($response, JSON_UNESCAPED_UNICODE),
                'attempts'      => 1, // incremented by retry cron
                'processed_at'  => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $logId]);
            AuditService::log(null, AuditService::ACTION_CRM_SYNC, 'crm_log', $logId, ['status' => $status]);
        } catch (\Throwable $e) {
            @error_log('[crm logFinish] failed: ' . $e->getMessage());
        }
    }
}
