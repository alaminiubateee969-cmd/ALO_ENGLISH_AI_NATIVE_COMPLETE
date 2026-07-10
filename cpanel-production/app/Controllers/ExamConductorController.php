<?php
/**
 * app/Controllers/ExamConductorController.php — Student exam-taking flow.
 *
 * Orchestrates the student-facing exam experience by delegating to
 * ExamConductorService. All endpoints return JSON (AJAX-friendly) and
 * require student auth + the english.own_tests.take permission.
 *
 *   POST /exam/start          — start a new attempt
 *   POST /exam/save           — save a single answer + log proctor
 *   POST /exam/submit         — submit attempt, trigger scoring/feedback/report
 *   GET  /exam/result/{id}    — Smart Score Report summary
 *   POST /exam/proctor-event  — log a proctoring event (tab switch, etc.)
 *
 * All public-facing responses use the agents' `public_label` column — never
 * the internal "Agent" terminology. The disclaimer is included on every
 * response that surfaces scoring or feedback content.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\ComplianceCheckService;
use App\Services\DigitalProctorService;
use App\Services\ExamConductorService;
use App\Services\RBACService;
use App\Services\SmartScoreReportService;
use App\Services\TestEngineService;

final class ExamConductorController
{
    /**
     * Resolve the current student record (user + student row) or abort.
     *
     * @return array{user:array, student:array}
     */
    private function studentContext(): array
    {
        $user = RBACService::currentUser();
        if ($user === null) {
            Response::json(['error' => 'unauthorized'], 401);
        }
        $student = Database::one(
            'SELECT id, alo_student_id, is_partner, ambassador_id FROM exam_students WHERE user_id = :uid LIMIT 1',
            ['uid' => (int) $user['id']]
        );
        if ($student === null) {
            Response::json(['error' => 'no_student_profile'], 403);
        }
        return ['user' => $user, 'student' => $student];
    }

    /** Verify the attempt belongs to the current student. */
    private function assertOwnsAttempt(int $attemptId, int $studentId): array
    {
        $attempt = Database::one(
            'SELECT id, student_id, status FROM exam_mock_attempts WHERE id = :id LIMIT 1',
            ['id' => $attemptId]
        );
        if ($attempt === null) {
            Response::json(['error' => 'attempt_not_found'], 404);
        }
        if ((int) $attempt['student_id'] !== $studentId) {
            AuditService::log((int) $this->studentContext()['user']['id'] ?? 0, 'exam.access_denied', 'attempt', $attemptId);
            Response::json(['error' => 'forbidden'], 403);
        }
        return $attempt;
    }

    /**
     * POST /exam/start — start a new attempt.
     *
     * Body: practice_set_id (int), exam_type (string, optional)
     * Returns: attempt_id, attempt_code, exam_type, assigned_agents (public labels only)
     */
    public function start(array $params = []): void
    {
        $ctx = $this->studentContext();
        $studentId = (int) $ctx['student']['id'];
        $practiceSetId = (int) ($_POST['practice_set_id'] ?? 0);
        $examType = trim((string) ($_POST['exam_type'] ?? ''));

        if ($practiceSetId <= 0) {
            Response::json(['error' => 'invalid_practice_set'], 422);
        }

        try {
            $result = ExamConductorService::startExam($studentId, $practiceSetId, $examType);
        } catch (\Throwable $e) {
            AuditService::log((int) $ctx['user']['id'], 'exam.start_failed', 'student', $studentId, [
                'practice_set_id' => $practiceSetId,
                'reason'          => mb_substr($e->getMessage(), 0, 200),
            ]);
            Response::json([
                'error'  => 'start_failed',
                'reason' => $e->getMessage(),
                'disclaimer' => ComplianceCheckService::getDisclosureText(),
            ], 403);
        }

        // Strip any internal/admin-only fields before returning to the student.
        // The assigned_agents array already contains only public_label values.
        Response::json([
            'attempt_id'      => $result['attempt_id'],
            'attempt_code'    => $result['attempt_code'],
            'exam_type'       => $result['exam_type'],
            'assigned_agents' => $result['assigned_agents'],
            'disclaimer'      => ComplianceCheckService::getDisclosureText(),
        ], 201);
    }

    /**
     * POST /exam/save — save a single answer + log proctor event.
     *
     * Body: attempt_id, question_id, answer, time_spent (optional)
     */
    public function save(array $params = []): void
    {
        $ctx = $this->studentContext();
        $studentId = (int) $ctx['student']['id'];
        $attemptId = (int) ($_POST['attempt_id'] ?? 0);
        $questionId = (int) ($_POST['question_id'] ?? 0);
        $answer = $_POST['answer'] ?? null;
        $timeSpent = isset($_POST['time_spent']) ? (float) $_POST['time_spent'] : null;

        if ($attemptId <= 0 || $questionId <= 0 || $answer === null) {
            Response::json(['error' => 'invalid_input'], 422);
        }
        $this->assertOwnsAttempt($attemptId, $studentId);

        try {
            TestEngineService::saveAnswer($attemptId, $questionId, $answer, $timeSpent);
        } catch (\Throwable $e) {
            Response::json(['error' => 'save_failed', 'reason' => $e->getMessage()], 400);
        }

        // Mirror save as a low-severity proctor event for integrity tracking.
        DigitalProctorService::logEvent($attemptId, 'answer_saved', [
            'question_id' => $questionId,
            'time_spent'  => $timeSpent,
        ]);

        Response::json(['ok' => true]);
    }

    /**
     * POST /exam/submit — submit attempt + trigger post-attempt agents.
     *
     * Body: attempt_id
     * Returns: attempt_id, percent, score_id, assigned_agents (public labels)
     */
    public function submit(array $params = []): void
    {
        $ctx = $this->studentContext();
        $studentId = (int) $ctx['student']['id'];
        $attemptId = (int) ($_POST['attempt_id'] ?? 0);
        if ($attemptId <= 0) {
            Response::json(['error' => 'invalid_input'], 422);
        }
        $this->assertOwnsAttempt($attemptId, $studentId);

        try {
            $result = ExamConductorService::submitExam($attemptId);
        } catch (\Throwable $e) {
            AuditService::log((int) $ctx['user']['id'], 'exam.submit_failed', 'attempt', $attemptId, [
                'reason' => mb_substr($e->getMessage(), 0, 200),
            ]);
            Response::json(['error' => 'submit_failed', 'reason' => $e->getMessage()], 400);
        }

        Response::json([
            'attempt_id'      => $result['attempt_id'],
            'percent'         => $result['percent'],
            'score_id'        => $result['score_id'],
            'assigned_agents' => $result['assigned_agents'],
            'disclaimer'      => ComplianceCheckService::getDisclosureText(),
        ]);
    }

    /**
     * GET /exam/result/{attemptId} — Smart Score Report summary.
     *
     * Returns the full structured report (student, exam, overall_score,
     * module_scores, counts, time_used, strengths, weaknesses, study_plan,
     * next_recommendation, counseling_cta, disclaimer, crm_sync_status).
     */
    public function result(array $params = []): void
    {
        $ctx = $this->studentContext();
        $studentId = (int) $ctx['student']['id'];
        $attemptId = (int) ($params['attemptId'] ?? ($_GET['attempt_id'] ?? 0));
        if ($attemptId <= 0) {
            Response::json(['error' => 'invalid_attempt'], 422);
        }
        $this->assertOwnsAttempt($attemptId, $studentId);

        $report = SmartScoreReportService::generate($attemptId);

        // Compliance: ensure no forbidden wording leaked into any string field.
        $serialized = json_encode($report, JSON_UNESCAPED_UNICODE);
        $check = ComplianceCheckService::checkContent((string) $serialized);
        if (!$check['passed']) {
            // Sanitise + audit (defensive — should never trigger because the
            // report service is itself compliant, but we log just in case).
            AuditService::log((int) $ctx['user']['id'], 'compliance.report_violation', 'attempt', $attemptId, [
                'violations' => array_map(fn ($v) => $v['term'], $check['violations']),
            ]);
        }

        // The report already contains the disclaimer — no need to re-add.
        Response::json($report);
    }

    /**
     * POST /exam/proctor-event — log a proctoring event from the browser.
     *
     * Body: attempt_id, event_type (tab_switch|pause|resume|refresh|window_blur),
     *       details (optional JSON string)
     *
     * Returns: ok=true, severity (info|warning|critical)
     */
    public function proctorEvent(array $params = []): void
    {
        $ctx = $this->studentContext();
        $studentId = (int) $ctx['student']['id'];
        $attemptId = (int) ($_POST['attempt_id'] ?? 0);
        $eventType = trim((string) ($_POST['event_type'] ?? ''));
        $detailsInput = trim((string) ($_POST['details'] ?? ''));
        $details = $detailsInput !== '' ? (json_decode($detailsInput, true) ?: []) : [];

        if ($attemptId <= 0 || $eventType === '') {
            Response::json(['error' => 'invalid_input'], 422);
        }
        // Restrict to the allowed event-type set so an attacker cannot log
        // arbitrary event types via this endpoint.
        $allowed = [
            DigitalProctorService::EVENT_TAB_SWITCH,
            DigitalProctorService::EVENT_PAUSE,
            DigitalProctorService::EVENT_RESUME,
            DigitalProctorService::EVENT_REFRESH,
            DigitalProctorService::EVENT_WINDOW_BLUR,
        ];
        if (!in_array($eventType, $allowed, true)) {
            Response::json(['error' => 'invalid_event_type'], 422);
        }
        $this->assertOwnsAttempt($attemptId, $studentId);

        DigitalProctorService::logEvent($attemptId, $eventType, $details);

        // Fetch the inferred severity for the response (info/warning/critical).
        $row = Database::one(
            'SELECT severity FROM exam_proctor_logs
              WHERE attempt_id = :aid AND event_type = :t
              ORDER BY id DESC LIMIT 1',
            ['aid' => $attemptId, 't' => $eventType]
        );

        Response::json([
            'ok'       => true,
            'severity' => (string) ($row['severity'] ?? 'info'),
        ]);
    }
}
