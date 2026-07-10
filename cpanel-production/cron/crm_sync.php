<?php
/**
 * cron/crm_sync.php — Hourly CRM sync processor.
 *
 * Processes exam_crm_sync_logs rows with status IN ('pending','retrying').
 * Retries up to ALO_CRM_SYNC_MAX_RETRIES (default 3) with exponential backoff
 * based on `attempts` count. Marks rows as 'success' or 'failed'.
 *
 * Idempotent: only processes rows older than 60 seconds (so in-flight rows
 * from active HTTP requests aren't double-processed). Releases advisory lock
 * on exit. Never crashes if CRM is unavailable — logs and exits cleanly.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

use App\Core\Database;
use App\Services\CRMIntegrationService;

$job = 'crm_sync';
cronLog($job, 'Starting hourly CRM sync processor.');

if (!cronLock($job)) {
    cronLog($job, 'Another instance is running. Exiting.', 'WARN');
    exit(0);
}

try {
    $maxRetries = (int) (getenv('ALO_CRM_SYNC_MAX_RETRIES') ?: 3);

    // Fetch pending/retrying rows older than 60s.
    $rows = Database::all(
        "SELECT id, entity_type, entity_id, endpoint, request_body, attempts
           FROM exam_crm_sync_logs
          WHERE status IN ('pending','retrying')
            AND created_at < (NOW() - INTERVAL 60 SECOND)
          ORDER BY created_at ASC
          LIMIT 200"
    );

    if ($rows === []) {
        cronLog($job, 'No pending CRM sync entries. Exiting.');
        exit(0);
    }

    $processed = 0;
    $succeeded = 0;
    $failed = 0;

    foreach ($rows as $row) {
        $processed++;
        $attempts = (int) $row['attempts'] + 1;

        // Mark attempt count + retrying.
        Database::update('exam_crm_sync_logs', [
            'attempts' => $attempts,
            'status'   => 'retrying',
            'processed_at' => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $row['id']]);

        // Re-call the CRM endpoint.
        $payload = json_decode((string) $row['request_body'], true) ?? [];
        $result = CRMIntegrationService::retry($row['endpoint'], $payload, $row['entity_type'], $row['entity_id']);

        if ($result['ok'] === true) {
            Database::update('exam_crm_sync_logs', [
                'status'        => 'success',
                'processed_at'  => date('Y-m-d H:i:s'),
                'response_body' => json_encode($result['data'] ?? [], JSON_UNESCAPED_UNICODE),
            ], 'id = :id', ['id' => $row['id']]);
            $succeeded++;
        } else {
            // Fail permanently if max retries exceeded.
            if ($attempts >= $maxRetries) {
                Database::update('exam_crm_sync_logs', [
                    'status'        => 'failed',
                    'processed_at'  => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $row['id']]);
                $failed++;
            } else {
                // Stays 'retrying' for next run.
            }
        }
    }

    cronLog($job, sprintf(
        'Sync complete. processed=%d succeeded=%d failed=%d',
        $processed, $succeeded, $failed
    ));
    exit(0);

} catch (\Throwable $e) {
    cronLog($job, 'FATAL: ' . $e->getMessage(), 'ERROR');
    exit(1);
} finally {
    cronUnlock($job);
}
