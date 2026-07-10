<?php
/**
 * app/Controllers/ExaminerController.php — Examiner portal pages.
 *
 *   dashboard, writing-queue, speaking-queue, reviews, submitReview, reports.
 *
 * Routes enforce auth + role:EXAMINER,ADMIN,SUPER_ADMIN (routes.php).
 * Sub-pages add permission:english.writing.review / speaking.review /
 * results.manage.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\CSRFService;
use App\Services\RBACService;

final class ExaminerController
{
    private function user(): array
    {
        $u = RBACService::currentUser();
        if ($u === null) {
            Response::redirect('/login', 302);
        }
        return $u;
    }

    public function dashboard(array $params = []): void
    {
        $u = $this->user();
        $kpis = [
            'writing_pending'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_writing_submissions WHERE status='pending_review'"),
            'speaking_pending' => (int) Database::scalar("SELECT COUNT(*) FROM exam_speaking_sessions WHERE status='pending_review'"),
            'my_reviewed_today'=> (int) Database::scalar("SELECT COUNT(*) FROM exam_feedback WHERE reviewer_id=:uid AND DATE(reviewed_at)=CURDATE()", ['uid' => $u['id']]),
        ];
        Response::view('examiner/dashboard', ['user' => $u, 'kpis' => $kpis]);
    }

    public function writingQueue(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            "SELECT ws.id, ws.attempt_id, ws.submitted_text, ws.word_count,
                    a.attempt_code, u.email
               FROM exam_writing_submissions ws
               JOIN exam_mock_attempts a ON a.id = ws.attempt_id
               LEFT JOIN exam_students s ON s.id = a.student_id
               LEFT JOIN exam_users u ON u.id = s.user_id
              WHERE ws.status = 'pending_review'
              ORDER BY ws.id ASC LIMIT 50"
        );
        Response::view('examiner/writing-queue', ['rows' => $rows, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function speakingQueue(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            "SELECT ss.id, ss.attempt_id, ss.audio_path, ss.duration_seconds,
                    a.attempt_code, u.email
               FROM exam_speaking_sessions ss
               JOIN exam_mock_attempts a ON a.id = ss.attempt_id
               LEFT JOIN exam_students s ON s.id = a.student_id
               LEFT JOIN exam_users u ON u.id = s.user_id
              WHERE ss.status = 'pending_review'
              ORDER BY ss.id ASC LIMIT 50"
        );
        Response::view('examiner/speaking-queue', ['rows' => $rows, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function reviews(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT f.id, f.attempt_id, f.feedback_text, f.score_value, f.reviewed_at,
                    a.attempt_code
               FROM exam_feedback f
               LEFT JOIN exam_mock_attempts a ON a.id = f.attempt_id
              WHERE f.reviewer_id = :uid
              ORDER BY f.id DESC LIMIT 100',
            ['uid' => (int) $u['id']]
        );
        Response::view('examiner/reviews', ['rows' => $rows, 'user' => $u]);
    }

    /** POST /examiner/reviews/{id}/submit — submit a review. */
    public function submitReview(array $params = []): void
    {
        $u = $this->user();
        $reviewId = (int) ($params['id'] ?? 0);
        $score = (float) ($_POST['score'] ?? 0);
        $feedback = trim($_POST['feedback'] ?? '');
        $rubricJson = $_POST['rubric'] ?? '{}';

        if ($reviewId <= 0 || $feedback === '') {
            Response::abort(422, 'Score and feedback are required.');
        }
        if ($score < 0 || $score > 9) {
            Response::abort(422, 'Score must be in band range 0-9.');
        }

        // Determine whether this review is for a writing submission or speaking session.
        $writing = Database::one('SELECT * FROM exam_writing_submissions WHERE id = :id', ['id' => $reviewId]);
        $speaking = Database::one('SELECT * FROM exam_speaking_sessions WHERE id = :id', ['id' => $reviewId]);
        $attemptId = null;
        if ($writing !== null) {
            $attemptId = (int) $writing['attempt_id'];
            Database::update('exam_writing_submissions', [
                'status'      => 'reviewed',
                'reviewed_at' => date('Y-m-d H:i:s'),
                'reviewer_id' => (int) $u['id'],
            ], 'id = :id', ['id' => $reviewId]);
        } elseif ($speaking !== null) {
            $attemptId = (int) $speaking['attempt_id'];
            Database::update('exam_speaking_sessions', [
                'status'      => 'reviewed',
                'reviewed_at' => date('Y-m-d H:i:s'),
                'reviewer_id' => (int) $u['id'],
            ], 'id = :id', ['id' => $reviewId]);
        } else {
            Response::abort(404, 'Review target not found.');
        }

        Database::insert('exam_feedback', [
            'attempt_id'    => $attemptId,
            'reviewer_id'   => (int) $u['id'],
            'feedback_text' => mb_substr($feedback, 0, 8000),
            'score_value'   => $score,
            'rubric_json'   => mb_substr((string) $rubricJson, 0, 4000),
            'reviewed_at'   => date('Y-m-d H:i:s'),
            'created_at'    => date('Y-m-d H:i:s'),
        ]);

        AuditService::log((int) $u['id'], 'examiner.review_submitted', 'review', $reviewId, [
            'attempt_id' => $attemptId, 'score' => $score,
        ]);
        Response::redirect('/examiner/reviews?saved=1', 302);
    }

    public function reports(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT r.id, r.attempt_id, r.report_type, r.status, r.created_at,
                    a.attempt_code, u.email
               FROM exam_reports r
               LEFT JOIN exam_mock_attempts a ON a.id = r.attempt_id
               LEFT JOIN exam_students s ON s.id = a.student_id
               LEFT JOIN exam_users u ON u.id = s.user_id
              ORDER BY r.id DESC LIMIT 100'
        );
        Response::view('examiner/reports', ['rows' => $rows, 'user' => $u]);
    }
}
