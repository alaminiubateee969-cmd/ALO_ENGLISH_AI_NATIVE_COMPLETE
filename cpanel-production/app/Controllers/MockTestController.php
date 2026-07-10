<?php
/**
 * app/Controllers/MockTestController.php — Mock test engine HTTP endpoints.
 *
 *   POST /mock-test/start           — start a new attempt.
 *   POST /mock-test/save-answer     — autosave a single answer.
 *   POST /mock-test/submit          — submit + score.
 *   GET  /mock-test/result/{id}     — fetch score summary.
 *   GET  /mock-test/report/{id}     — download PDF report (signed URL).
 *
 * All POST routes require CSRF (enforced via middleware). All routes
 * require student auth + permission:english.own_tests.take (via routes.php).
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\RBACService;
use App\Services\TestEngineService;
use App\Services\UploadService;
use App\Services\VoucherService;

final class MockTestController
{
    /** POST /mock-test/start */
    public function startAttempt(array $params = []): void
    {
        $user = RBACService::currentUser();
        $practiceSetId = (int) ($_POST['practice_set_id'] ?? 0);
        $voucherCode = trim($_POST['voucher_code'] ?? '');

        if ($practiceSetId <= 0) {
            Response::json(['error' => 'invalid_practice_set'], 422);
        }

        $student = Database::one('SELECT id FROM exam_students WHERE user_id = :uid LIMIT 1', ['uid' => (int) $user['id']]);
        if ($student === null) {
            Response::json(['error' => 'no_student_profile'], 403);
        }

        $voucherId = null;
        if ($voucherCode !== '') {
            $v = VoucherService::validate($voucherCode, (int) $student['id']);
            if (!$v['valid']) {
                Response::json(['error' => 'voucher_invalid', 'reason' => $v['reason'] ?? null], 422);
            }
            $voucherId = (int) $v['voucher']['id'];
        }

        try {
            $result = TestEngineService::startAttempt((int) $student['id'], $practiceSetId, $voucherId);
        } catch (\Throwable $e) {
            Response::json(['error' => 'start_failed', 'reason' => $e->getMessage()], 403);
        }
        Response::json($result, 201);
    }

    /** POST /mock-test/save-answer */
    public function saveAnswer(array $params = []): void
    {
        $user = RBACService::currentUser();
        $attemptId = (int) ($_POST['attempt_id'] ?? 0);
        $questionId = (int) ($_POST['question_id'] ?? 0);
        $answer = $_POST['answer'] ?? null;
        $timeSpent = isset($_POST['time_spent']) ? (float) $_POST['time_spent'] : null;

        if ($attemptId <= 0 || $questionId <= 0 || $answer === null) {
            Response::json(['error' => 'invalid_input'], 422);
        }

        // Verify ownership
        $attempt = Database::one('SELECT student_id FROM exam_mock_attempts WHERE id = :id LIMIT 1', ['id' => $attemptId]);
        if ($attempt === null) {
            Response::json(['error' => 'attempt_not_found'], 404);
        }
        $student = Database::one('SELECT id FROM exam_students WHERE user_id = :uid LIMIT 1', ['uid' => (int) $user['id']]);
        if ($student === null || (int) $student['id'] !== (int) $attempt['student_id']) {
            AuditService::log((int) $user['id'], 'attempt.access_denied', 'attempt', $attemptId);
            Response::json(['error' => 'forbidden'], 403);
        }

        try {
            TestEngineService::saveAnswer($attemptId, $questionId, $answer, $timeSpent);
        } catch (\Throwable $e) {
            Response::json(['error' => 'save_failed', 'reason' => $e->getMessage()], 400);
        }
        Response::json(['ok' => true]);
    }

    /** POST /mock-test/submit */
    public function submitAttempt(array $params = []): void
    {
        $user = RBACService::currentUser();
        $attemptId = (int) ($_POST['attempt_id'] ?? 0);
        if ($attemptId <= 0) {
            Response::json(['error' => 'invalid_input'], 422);
        }
        $attempt = Database::one('SELECT student_id FROM exam_mock_attempts WHERE id = :id LIMIT 1', ['id' => $attemptId]);
        if ($attempt === null) {
            Response::json(['error' => 'attempt_not_found'], 404);
        }
        $student = Database::one('SELECT id FROM exam_students WHERE user_id = :uid LIMIT 1', ['uid' => (int) $user['id']]);
        if ($student === null || (int) $student['id'] !== (int) $attempt['student_id']) {
            Response::json(['error' => 'forbidden'], 403);
        }

        try {
            $result = TestEngineService::submitAttempt($attemptId, (int) $user['id']);
        } catch (\Throwable $e) {
            Response::json(['error' => 'submit_failed', 'reason' => $e->getMessage()], 400);
        }
        Response::json($result);
    }

    /** GET /mock-test/result/{attemptId} */
    public function getResult(array $params = []): void
    {
        $user = RBACService::currentUser();
        $attemptId = (int) ($params['attemptId'] ?? 0);
        $row = Database::one(
            'SELECT a.*, et.type_code, s.percent, s.band_score, s.cefr_level, s.scaled_score, s.raw_score, s.raw_max
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_scores s ON s.attempt_id = a.id AND s.is_final = 1
              WHERE a.id = :id LIMIT 1',
            ['id' => $attemptId]
        );
        if ($row === null) {
            Response::json(['error' => 'not_found'], 404);
        }
        // Ownership
        $student = Database::one('SELECT id FROM exam_students WHERE user_id = :uid LIMIT 1', ['uid' => (int) $user['id']]);
        if ($student === null || (int) $student['id'] !== (int) $row['student_id']) {
            Response::json(['error' => 'forbidden'], 403);
        }
        $breakdown = Database::all('SELECT * FROM exam_score_breakdown WHERE score_id IN (SELECT id FROM exam_scores WHERE attempt_id = :aid)', ['aid' => $attemptId]);
        Response::json([
            'attempt_id' => $attemptId,
            'exam_type'  => $row['type_code'],
            'status'     => $row['status'],
            'percent'    => (float) ($row['percent'] ?? 0),
            'band'       => $row['band_score'] !== null ? (float) $row['band_score'] : null,
            'scaled'     => $row['scaled_score'] !== null ? (int) $row['scaled_score'] : null,
            'cefr'       => $row['cefr_level'],
            'breakdown'  => $breakdown,
            'disclaimer' => 'Practice exam only. Estimated score only. Not official exam result.',
        ]);
    }

    /** GET /mock-test/report/{attemptId} — downloads the PDF report. */
    public function downloadReport(array $params = []): void
    {
        $user = RBACService::currentUser();
        $attemptId = (int) ($params['attemptId'] ?? 0);
        $report = Database::one(
            'SELECT * FROM exam_reports WHERE attempt_id = :aid ORDER BY id DESC LIMIT 1',
            ['aid' => $attemptId]
        );
        if ($report === null) {
            Response::abort(404, 'Report not generated yet.');
        }
        $attempt = Database::one('SELECT student_id FROM exam_mock_attempts WHERE id = :id', ['id' => $attemptId]);
        $student = Database::one('SELECT id FROM exam_students WHERE user_id = :uid', ['uid' => (int) $user['id']]);
        if ($student === null || (int) $student['id'] !== (int) $attempt['student_id']) {
            AuditService::log((int) $user['id'], AuditService::ACTION_FILE_DOWNLOAD, 'report', $report['id'], ['denied' => true]);
            Response::abort(403, 'Forbidden.');
        }
        AuditService::log((int) $user['id'], AuditService::ACTION_FILE_DOWNLOAD, 'report', $report['id'], []);
        try {
            $absPath = UploadService::resolvePath((string) $report['file_path']);
        } catch (\Throwable $e) {
            Response::abort(404, 'Report file missing.');
        }
        Response::download($absPath, 'alo-score-report-' . $attemptId . '.pdf', 'application/pdf');
    }
}
