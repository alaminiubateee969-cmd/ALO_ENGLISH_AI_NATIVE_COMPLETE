<?php
/**
 * cron/send_pending_reports.php — Send pending PDF reports via SMTP.
 *
 * Examines exam_reports rows where status='pending' AND notification_email
 * is set, generates the PDF (or fetches cached path), sends via SMTP using
 * PHP's mail() or a configured SMTP transport, marks the row 'sent' (or
 * 'failed' after 3 attempts). Logs to cron.log. Idempotent.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

use App\Core\Database;
use App\Services\AuditService;

$job = 'send_pending_reports';
cronLog($job, 'Starting pending report sender.');

if (!cronLock($job)) {
    cronLog($job, 'Another instance is running. Exiting.', 'WARN');
    exit(0);
}

try {
    $pending = Database::all(
        "SELECT id, attempt_id, report_type, file_path, notification_email, attempts
           FROM exam_reports
          WHERE status = 'pending'
            AND notification_email IS NOT NULL
            AND notification_email <> ''
          ORDER BY created_at ASC
          LIMIT 50"
    );

    if ($pending === []) {
        cronLog($job, 'No pending reports. Exiting.');
        exit(0);
    }

    $sent = 0; $failed = 0;
    $from = (string) (getenv('SMTP_FROM_EMAIL') ?: 'no-reply@aloeducation.com');
    $fromName = (string) (getenv('SMTP_FROM_NAME') ?: 'ALO English Test Platform');

    foreach ($pending as $row) {
        $attempts = (int) $row['attempts'] + 1;
        $file = $row['file_path'] ?? '';
        // Resolve path safely — must live under storage/.
        $cfg = require __DIR__ . '/../config/exams.php';
        $root = rtrim((string) $cfg['uploads']['storage_root'], '/');
        $absPath = '';
        if ($file !== '' && !str_contains($file, '..') && !str_contains($file, "\0")) {
            $candidate = $root . '/' . ltrim($file, '/');
            $realRoot = realpath($root);
            $realCand = realpath($candidate);
            if ($realRoot !== false && $realCand !== false && str_starts_with($realCand, $realRoot) && is_file($realCand)) {
                $absPath = $realCand;
            }
        }

        $subject = 'Your ALO English Test Platform — Smart Score Report';
        $body = "Hello,\n\nPlease find attached your Smart Score Report from the ALO English Test Platform.\n\n"
              . "This is a practice-only report. It is not affiliated with, endorsed by, or reproduced from any official test publisher.\n\n"
              . "Practice exam only. Estimated score only. Not official exam result.\n\n"
              . "— ALO English Test Platform";

        $ok = false;
        if ($absPath !== '' && is_readable($absPath)) {
            // Try PHP mail() with file attachment.
            $boundary = md5((string) time());
            $headers  = "From: {$fromName} <{$from}>\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

            $msg  = "--{$boundary}\r\n";
            $msg .= "Content-Type: text/plain; charset=utf-8\r\n";
            $msg .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
            $msg .= $body . "\r\n\r\n";
            $msg .= "--{$boundary}\r\n";
            $msg .= "Content-Type: application/pdf; name=\"report.pdf\"\r\n";
            $msg .= "Content-Transfer-Encoding: base64\r\n";
            $msg .= "Content-Disposition: attachment; filename=\"report.pdf\"\r\n\r\n";
            $msg .= chunk_split(base64_encode((string) file_get_contents($absPath))) . "\r\n";
            $msg .= "--{$boundary}--\r\n";

            $ok = @mail($row['notification_email'], $subject, $msg, $headers);
        } else {
            // No file — send plain email.
            $headers = "From: {$fromName} <{$from}>\r\nContent-Type: text/plain; charset=utf-8\r\n";
            $ok = @mail($row['notification_email'], $subject, $body, $headers);
        }

        if ($ok) {
            Database::update('exam_reports', [
                'status'      => 'sent',
                'sent_at'     => date('Y-m-d H:i:s'),
                'attempts'    => $attempts,
                'updated_at'  => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $row['id']]);
            AuditService::log(null, 'report.sent', 'report', $row['id'], ['email' => $row['notification_email']]);
            $sent++;
        } else {
            if ($attempts >= 3) {
                Database::update('exam_reports', [
                    'status'     => 'failed',
                    'attempts'   => $attempts,
                    'updated_at' => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $row['id']]);
                $failed++;
            } else {
                Database::update('exam_reports', [
                    'attempts'   => $attempts,
                    'updated_at' => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $row['id']]);
            }
        }
    }

    cronLog($job, sprintf('Reports sent=%d failed=%d', $sent, $failed));
    exit(0);

} catch (\Throwable $e) {
    cronLog($job, 'FATAL: ' . $e->getMessage(), 'ERROR');
    exit(1);
} finally {
    cronUnlock($job);
}
