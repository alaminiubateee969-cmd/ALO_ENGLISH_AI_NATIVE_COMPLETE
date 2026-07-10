<?php
/**
 * cron/retry_failed_sync.php — Retry failed CRM sync entries.
 *
 * Examines exam_crm_sync_logs rows with status='failed' that are older
 * than 1 hour, resets them to 'retrying', and re-runs the sync via
 * CRMIntegrationService::retry(). Caps at 50 rows per run. Idempotent.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

use App\Core\Database;
use App\Services\CRMIntegrationService;
use App\Services\AuditService;

$job = 'retry_failed_sync';
cronLog($job, 'Starting retry sweep for failed CRM sync entries.');

if (!cronLock($job)) {
    cronLog($job, 'Another instance is running. Exiting.', 'WARN');
    exit(0);
}

try {
    $maxRetries = (int) (getenv('ALO_CRM_SYNC_MAX_RETRIES') ?: 3);

    $rows = Database::all(
        "SELECT id, entity_type, entity_id, endpoint, request_body, attempts
           FROM exam_crm_sync_logs
          WHERE status = 'failed'
            AND created_at < (NOW() - INTERVAL 1 HOUR)
            AND attempts < :max
          ORDER BY created_at ASC
          LIMIT 50",
        ['max' => $maxRetries + 2]
    );

    if ($rows === []) {
        cronLog($job, 'No failed sync entries to retry. Exiting.');
        exit(0);
    }

    $retried = 0; $succeeded = 0; $refailed = 0;

    foreach ($rows as $row) {
        $retried++;
        $payload = json_decode((string) $row['request_body'], true) ?? [];
        $result = CRMIntegrationService::retry($row['endpoint'], $payload, $row['entity_type'], $row['entity_id']);

        $attempts = (int) $row['attempts'] + 1;
        if ($result['ok'] === true) {
            Database::update('exam_crm_sync_logs', [
                'status'        => 'success',
                'attempts'      => $attempts,
                'processed_at'  => date('Y-m-d H:i:s'),
                'response_body' => json_encode($result['data'] ?? [], JSON_UNESCAPED_UNICODE),
            ], 'id = :id', ['id' => $row['id']]);
            $succeeded++;
        } else {
            $status = ($attempts >= $maxRetries + 2) ? 'failed' : 'retrying';
            Database::update('exam_crm_sync_logs', [
                'status'        => $status,
                'attempts'      => $attempts,
                'processed_at'  => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $row['id']]);
            $refailed++;
        }
    }

    AuditService::log(null, 'cron.retry_failed_sync', 'system', null, [
        'retried'   => $retried,
        'succeeded' => $succeeded,
        'refailed'  => $refailed,
    ]);

    cronLog($job, sprintf('Retry sweep done. retried=%d succeeded=%d refailed=%d', $retried, $succeeded, $refailed));
    exit(0);

} catch (\Throwable $e) {
    cronLog($job, 'FATAL: ' . $e->getMessage(), 'ERROR');
    exit(1);
} finally {
    cronUnlock($job);
}
