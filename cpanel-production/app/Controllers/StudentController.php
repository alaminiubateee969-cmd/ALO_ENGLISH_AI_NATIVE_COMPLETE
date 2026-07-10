<?php
/**
 * app/Controllers/StudentController.php — Student portal pages.
 *
 * All routes enforce student auth + the english.own_tests.take permission
 * (configured in app/routes.php). Each method renders a view and reads
 * data via prepared statements.
 *
 * Routes:
 *   GET  /student/dashboard
 *   GET  /student/tests
 *   GET  /student/start-test/{setId}
 *   GET  /student/attempt/{attemptId}
 *   GET  /student/results
 *   GET  /student/results/{attemptId}
 *   GET  /student/vouchers
 *   GET  /student/practice-feedback/{attemptId}
 *   GET  /student/study-plan
 *   GET  /student/messages
 *   POST /student/messages
 *   GET  /student/book-assessment
 *   POST /student/book-assessment
 *   GET  /student/settings
 *   POST /student/settings
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\CSRFService;
use App\Services\QuotaService;
use App\Services\RBACService;
use App\Services\TestEngineService;
use App\Services\VoucherService;

final class StudentController
{
    private function studentRecord(): array
    {
        $user = RBACService::currentUser();
        if ($user === null) {
            Response::redirect('/login', 302);
        }
        $student = Database::one('SELECT * FROM exam_students WHERE user_id = :uid LIMIT 1', ['uid' => (int) $user['id']]);
        if ($student === null) {
            Response::abort(403, 'No student profile linked to this account.');
        }
        return ['user' => $user, 'student' => $student];
    }

    /** GET /student/dashboard */
    public function dashboard(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $studentId = (int) $ctx['student']['id'];

        $quota = QuotaService::checkFreeQuota($studentId, $ctx['user']['email'], $ctx['user']['phone']);
        $attempts = Database::all(
            'SELECT a.id, a.attempt_code, a.status, a.started_at, a.submitted_at, et.type_code,
                    s.percent
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_scores s ON s.attempt_id = a.id AND s.is_final = 1
              WHERE a.student_id = :sid
              ORDER BY a.id DESC
              LIMIT 10',
            ['sid' => $studentId]
        );
        $vouchers = Database::all(
            'SELECT voucher_code, voucher_type, status, expires_at, used_count, usage_limit
               FROM exam_vouchers
              WHERE owner_user_id = :uid
              ORDER BY id DESC LIMIT 5',
            ['uid' => (int) $ctx['user']['id']]
        );

        Response::view('student/dashboard', [
            'user'      => $ctx['user'],
            'student'   => $ctx['student'],
            'quota'     => $quota,
            'attempts'  => $attempts,
            'vouchers'  => $vouchers,
            'csrf'      => CSRFService::token(),
            'csrf_field'=> CSRFService::hiddenField(),
        ]);
    }

    /** GET /student/tests — list of published practice sets the student can take. */
    public function tests(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $sets = Database::all(
            'SELECT ps.set_code, ps.title, ps.description, ps.difficulty, ps.total_questions,
                    ps.total_duration_minutes, et.type_code, et.type_name, et.style_label
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id = ps.exam_type_id
              WHERE ps.is_published = 1
              ORDER BY et.type_name, ps.difficulty, ps.id'
        );
        Response::view('student/tests', ['sets' => $sets, 'user' => $ctx['user']]);
    }

    /** GET /student/start-test/{setId} — pre-flight check + render start page. */
    public function startTest(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $setId = (int) ($params['setId'] ?? 0);
        $set = Database::one(
            'SELECT * FROM exam_practice_sets WHERE id = :id AND is_published = 1 LIMIT 1',
            ['id' => $setId]
        );
        if ($set === null) {
            Response::abort(404, 'Practice set not available.');
        }
        $quota = QuotaService::checkFreeQuota((int) $ctx['student']['id'], $ctx['user']['email']);
        Response::view('student/start-test', [
            'user'   => $ctx['user'],
            'set'    => $set,
            'quota'  => $quota,
            'csrf'   => CSRFService::token(),
            'csrf_field' => CSRFService::hiddenField(),
        ]);
    }

    /** GET /student/attempt/{attemptId} — render the attempt taking page. */
    public function attempt(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $attemptId = (int) ($params['attemptId'] ?? 0);
        try {
            $attempt = TestEngineService::resumeAttempt($attemptId);
        } catch (\Throwable $e) {
            Response::abort(403, $e->getMessage());
        }
        if ((int) $attempt['student_id'] !== (int) $ctx['student']['id']) {
            AuditService::log((int) $ctx['user']['id'], 'attempt.access_denied', 'attempt', $attemptId);
            Response::abort(403, 'This attempt belongs to a different student.');
        }
        $questions = Database::all(
            'SELECT q.id, q.question_code, q.question_type, q.prompt_text, q.difficulty, q.max_points,
                    o.id AS option_id, o.option_label, o.option_text
               FROM exam_practice_set_questions psq
               JOIN exam_questions q ON q.id = psq.question_id
               LEFT JOIN exam_question_options o ON o.question_id = q.id
              WHERE psq.practice_set_id = :psid
              ORDER BY psq.id, o.id',
            ['psid' => $attempt['practice_set_id']]
        );

        Response::view('student/attempt', [
            'user'      => $ctx['user'],
            'attempt'   => $attempt,
            'questions' => $questions,
            'csrf'      => CSRFService::token(),
            'csrf_field'=> CSRFService::hiddenField(),
        ]);
    }

    /** GET /student/results */
    public function results(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $rows = Database::all(
            'SELECT a.id, a.attempt_code, a.status, a.started_at, a.submitted_at,
                    et.type_code, et.type_name, s.percent, s.cefr_level, s.band_score
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_scores s ON s.attempt_id = a.id AND s.is_final = 1
              WHERE a.student_id = :sid
              ORDER BY a.id DESC',
            ['sid' => $ctx['student']['id']]
        );
        Response::view('student/results', ['results' => $rows, 'user' => $ctx['user']]);
    }

    /** GET /student/results/{attemptId} */
    public function resultDetail(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $attemptId = (int) ($params['attemptId'] ?? 0);
        $row = Database::one(
            'SELECT a.*, et.type_code, et.type_name, s.percent, s.band_score, s.cefr_level,
                    s.scaled_score, s.raw_score, s.raw_max
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_scores s ON s.attempt_id = a.id AND s.is_final = 1
              WHERE a.id = :id AND a.student_id = :sid LIMIT 1',
            ['id' => $attemptId, 'sid' => $ctx['student']['id']]
        );
        if ($row === null) {
            Response::abort(404, 'Result not found.');
        }
        $breakdown = Database::all('SELECT * FROM exam_score_breakdown WHERE score_id IN (SELECT id FROM exam_scores WHERE attempt_id = :aid)', ['aid' => $attemptId]);
        Response::view('student/result-detail', [
            'result'    => $row,
            'breakdown' => $breakdown,
            'user'      => $ctx['user'],
        ]);
    }

    /** GET /student/vouchers */
    public function vouchers(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $rows = Database::all(
            'SELECT voucher_code, voucher_type, status, expires_at, used_count, usage_limit
               FROM exam_vouchers
              WHERE owner_user_id = :uid
              ORDER BY id DESC',
            ['uid' => (int) $ctx['user']['id']]
        );
        Response::view('student/vouchers', ['vouchers' => $rows, 'user' => $ctx['user']]);
    }

    /** GET /student/practice-feedback/{attemptId} */
    public function practiceFeedback(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $attemptId = (int) ($params['attemptId'] ?? 0);
        $feedback = Database::one(
            'SELECT * FROM exam_feedback WHERE attempt_id = :aid LIMIT 1',
            ['aid' => $attemptId]
        );
        Response::view('student/practice-feedback', ['feedback' => $feedback, 'attempt_id' => $attemptId, 'user' => $ctx['user']]);
    }

    /** GET /student/study-plan */
    public function studyPlan(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $breakdown = Database::all(
            'SELECT b.skill_tag, AVG(b.percent) AS avg_pct
               FROM exam_score_breakdown b
               JOIN exam_scores s ON s.id = b.score_id
               JOIN exam_mock_attempts a ON a.id = s.attempt_id
              WHERE a.student_id = :sid
              GROUP BY b.skill_tag
              ORDER BY avg_pct ASC',
            ['sid' => $ctx['student']['id']]
        );
        Response::view('student/study-plan', ['weaknesses' => $breakdown, 'user' => $ctx['user']]);
    }

    /** GET /student/messages */
    public function messages(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $rows = Database::all(
            'SELECT id, subject, body, created_at, is_read
               FROM exam_consultation_bookings
              WHERE user_id = :uid
              ORDER BY created_at DESC LIMIT 30',
            ['uid' => (int) $ctx['user']['id']]
        );
        Response::view('student/messages', ['messages' => $rows, 'user' => $ctx['user'],
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    /** POST /student/messages */
    public function sendMessage(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $subject = trim($_POST['subject'] ?? '');
        $body = trim($_POST['body'] ?? '');
        if ($subject === '' || $body === '') {
            Response::abort(422, 'Subject and body are required.');
        }
        Database::insert('exam_consultation_bookings', [
            'user_id'    => (int) $ctx['user']['id'],
            'subject'    => mb_substr($subject, 0, 255),
            'body'       => mb_substr($body, 0, 4000),
            'status'     => 'new',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        AuditService::log((int) $ctx['user']['id'], 'student.message_sent', 'message', null, []);
        Response::redirect('/student/messages?sent=1', 302);
    }

    /** GET /student/book-assessment */
    public function bookAssessment(array $params = []): void
    {
        $ctx = $this->studentRecord();
        Response::view('student/book-assessment', ['user' => $ctx['user'],
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    /** POST /student/book-assessment */
    public function bookAssessmentSubmit(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $slot = trim($_POST['requested_slot'] ?? '');
        $notes = trim($_POST['notes'] ?? '');
        if ($slot === '') {
            Response::abort(422, 'A time slot is required.');
        }
        $id = Database::insert('exam_consultation_bookings', [
            'user_id'           => (int) $ctx['user']['id'],
            'subject'           => 'Counseling session request',
            'requested_slot_at' => $slot,
            'body'              => mb_substr($notes, 0, 4000),
            'status'            => 'pending',
            'created_at'        => date('Y-m-d H:i:s'),
        ]);
        AuditService::log((int) $ctx['user']['id'], 'student.booked_assessment', 'booking', $id, []);
        Response::redirect('/student/book-assessment?sent=1', 302);
    }

    /** GET /student/settings */
    public function settings(array $params = []): void
    {
        $ctx = $this->studentRecord();
        Response::view('student/settings', ['user' => $ctx['user'],
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    /** POST /student/settings — change password / update profile. */
    public function settingsSave(array $params = []): void
    {
        $ctx = $this->studentRecord();
        $userId = (int) $ctx['user']['id'];

        $fullName = trim($_POST['full_name'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $current = (string) ($_POST['current_password'] ?? '');
        $new = (string) ($_POST['new_password'] ?? '');

        $updates = [];
        if ($fullName !== '') {
            $updates['full_name'] = mb_substr($fullName, 0, 255);
        }
        if ($phone !== '') {
            $updates['phone'] = mb_substr($phone, 0, 32);
        }

        if ($new !== '') {
            if (strlen($new) < 12) {
                Response::abort(422, 'New password must be at least 12 characters.');
            }
            // Verify current password
            $row = Database::one('SELECT password_hash FROM exam_users WHERE id = :id', ['id' => $userId]);
            if ($row === null || !password_verify($current, (string) $row['password_hash'])) {
                Response::abort(403, 'Current password is incorrect.');
            }
            $updates['password_hash'] = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
            $updates['password_changed_at'] = date('Y-m-d H:i:s');
            AuditService::log($userId, AuditService::ACTION_PASSWORD_CHANGE, 'user', $userId, []);
        }

        if ($updates !== []) {
            $updates['updated_at'] = date('Y-m-d H:i:s');
            Database::update('exam_users', $updates, 'id = :id', ['id' => $userId]);
        }
        AuditService::log($userId, AuditService::ACTION_USER_UPDATE, 'user', $userId, []);
        Response::redirect('/student/settings?saved=1', 302);
    }
}
