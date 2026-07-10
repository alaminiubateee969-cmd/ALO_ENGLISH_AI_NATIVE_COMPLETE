<?php
/**
 * app/Controllers/AdminController.php — Admin portal pages.
 *
 * All routes enforce admin auth + role:ADMIN,SUPER_ADMIN,EXAM_MANAGER,
 * TEACHER,SUPPORT_STAFF,VIEWER (via routes.php). Specific sub-pages add
 * permission:* middleware.
 *
 * Methods:
 *   dashboard, students, examTypes, modules, questions, questionBank,
 *   mockTests, attempts, scores, vouchers, quota, leads, crmSync,
 *   marketing, auditLogs, settings(+save), examConduct, weeklyUpdates,
 *   runWeeklyUpdate.
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
use App\Services\VoucherService;

final class AdminController
{
    private function user(): array
    {
        $u = RBACService::currentUser();
        if ($u === null) {
            Response::redirect('/login', 302);
        }
        return $u;
    }

    /** GET /admin/dashboard */
    public function dashboard(array $params = []): void
    {
        $u = $this->user();
        $kpis = [
            'students'        => (int) Database::scalar("SELECT COUNT(*) FROM exam_students"),
            'attempts_today'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_mock_attempts WHERE DATE(started_at)=CURDATE()"),
            'attempts_total'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_mock_attempts"),
            'published_sets'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_practice_sets WHERE is_published=1"),
            'pending_reviews' => (int) Database::scalar("SELECT COUNT(*) FROM exam_question_review_queue WHERE review_state='pending'"),
            'active_vouchers' => (int) Database::scalar("SELECT COUNT(*) FROM exam_vouchers WHERE status='active'"),
            'crm_pending'     => (int) Database::scalar("SELECT COUNT(*) FROM exam_crm_sync_logs WHERE status IN ('pending','retrying')"),
            'weekly_pending'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_weekly_updates WHERE status='completed_pending_review'"),
        ];
        Response::view('admin/dashboard', ['user' => $u, 'kpis' => $kpis,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    /** GET /admin/students */
    public function students(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT s.id, u.user_code, u.email, u.full_name, u.phone, u.status,
                    s.alo_student_id, s.is_partner, s.ambassador_id,
                    (SELECT COUNT(*) FROM exam_mock_attempts a WHERE a.student_id=s.id) AS attempt_count
               FROM exam_students s
               JOIN exam_users u ON u.id = s.user_id
              ORDER BY s.id DESC
              LIMIT 200'
        );
        Response::view('admin/students', ['students' => $rows, 'user' => $u]);
    }

    public function examTypes(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT et.*, c.category_code FROM exam_types et JOIN exam_categories c ON c.id=et.category_id ORDER BY et.id');
        Response::view('admin/exam-types', ['exams' => $rows, 'user' => $u]);
    }

    public function modules(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_modules ORDER BY id');
        Response::view('admin/modules', ['modules' => $rows, 'user' => $u]);
    }

    public function questions(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT q.id, q.question_code, q.question_type, q.difficulty, q.status, q.is_published,
                    et.type_code, q.created_at
               FROM exam_questions q
               LEFT JOIN exam_types et ON et.id = q.exam_type_id
              ORDER BY q.id DESC LIMIT 200'
        );
        Response::view('admin/questions', ['questions' => $rows, 'user' => $u]);
    }

    public function questionBank(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_question_types ORDER BY type_code');
        Response::view('admin/question-bank', ['types' => $rows, 'user' => $u]);
    }

    public function mockTests(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT ps.id, ps.set_code, ps.title, ps.is_published, ps.difficulty,
                    et.type_code, ps.total_questions, ps.total_duration_minutes
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id=ps.exam_type_id
              ORDER BY ps.id DESC LIMIT 200'
        );
        Response::view('admin/mock-tests', ['sets' => $rows, 'user' => $u]);
    }

    public function attempts(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT a.id, a.attempt_code, a.status, a.started_at, a.submitted_at,
                    et.type_code, u.email
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_students s ON s.id = a.student_id
               LEFT JOIN exam_users u ON u.id = s.user_id
              ORDER BY a.id DESC LIMIT 200'
        );
        Response::view('admin/attempts', ['attempts' => $rows, 'user' => $u]);
    }

    public function scores(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT s.id, s.attempt_id, s.percent, s.band_score, s.cefr_level, s.scaled_score,
                    a.attempt_code
               FROM exam_scores s
               LEFT JOIN exam_mock_attempts a ON a.id = s.attempt_id
              ORDER BY s.id DESC LIMIT 200'
        );
        Response::view('admin/scores', ['scores' => $rows, 'user' => $u]);
    }

    public function vouchers(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_vouchers ORDER BY id DESC LIMIT 200');
        Response::view('admin/vouchers', ['vouchers' => $rows, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function quota(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_free_quota ORDER BY id DESC LIMIT 200');
        $aloLimit = (int) Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo'");
        $pubLimit = (int) Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public'");
        Response::view('admin/quota', ['rows' => $rows, 'alo_limit' => $aloLimit, 'public_limit' => $pubLimit, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function leads(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_leads ORDER BY id DESC LIMIT 200');
        Response::view('admin/leads', ['leads' => $rows, 'user' => $u]);
    }

    public function crmSync(array $params = []): void
    {
        $u = $this->user();
        $pending = Database::all("SELECT * FROM exam_crm_sync_logs WHERE status IN ('pending','retrying') ORDER BY id DESC LIMIT 100");
        $failed  = Database::all("SELECT * FROM exam_crm_sync_logs WHERE status='failed' ORDER BY id DESC LIMIT 100");
        Response::view('admin/crm-sync', ['pending' => $pending, 'failed' => $failed, 'user' => $u]);
    }

    public function marketing(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_marketing_sources ORDER BY id DESC');
        Response::view('admin/marketing', ['sources' => $rows, 'user' => $u]);
    }

    public function auditLogs(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all(
            'SELECT a.id, a.actor_user_id, a.action, a.entity_type, a.entity_id,
                    a.ip_address, a.created_at, u.email
               FROM exam_audit_logs a
               LEFT JOIN exam_users u ON u.id = a.actor_user_id
              ORDER BY a.id DESC LIMIT 300'
        );
        Response::view('admin/audit-logs', ['logs' => $rows, 'user' => $u]);
    }

    public function settings(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_settings ORDER BY setting_key');
        Response::view('admin/settings', ['settings' => $rows, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function settingsSave(array $params = []): void
    {
        $u = $this->user();
        $updates = $_POST['settings'] ?? [];
        if (!is_array($updates)) {
            Response::abort(422, 'Invalid input.');
        }
        $count = 0;
        foreach ($updates as $key => $value) {
            $key = (string) $key;
            if (!preg_match('/^[a-z0-9_]+$/i', $key)) {
                continue;
            }
            Database::update('exam_settings', [
                'setting_value' => mb_substr((string) $value, 0, 1000),
                'updated_at'    => date('Y-m-d H:i:s'),
            ], 'setting_key = :k', ['k' => $key]);
            $count++;
        }
        AuditService::log((int) $u['id'], AuditService::ACTION_SETTINGS_UPDATE, 'settings', null, ['count' => $count]);
        Response::redirect('/admin/settings?saved=1', 302);
    }

    public function examConduct(array $params = []): void
    {
        $u = $this->user();
        Response::view('admin/exam-conduct', ['user' => $u]);
    }

    public function weeklyUpdates(array $params = []): void
    {
        $u = $this->user();
        $rows = Database::all('SELECT * FROM exam_weekly_updates ORDER BY id DESC LIMIT 50');
        $cfg = Database::all("SELECT setting_key, setting_value FROM exam_settings WHERE setting_key LIKE 'weekly_update_%'");
        Response::view('admin/weekly-updates', ['rows' => $rows, 'cfg' => $cfg, 'user' => $u,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    /** POST /admin/weekly-updates/run — manually trigger the weekly update pipeline (via cron job). */
    public function runWeeklyUpdate(array $params = []): void
    {
        $u = $this->user();
        // Trigger by running the cron via shell_exec — admin must hold english.questions.manage.
        $scriptPath = realpath(__DIR__ . '/../../cron/weekly_question_update.php');
        $output = @shell_exec('php ' . escapeshellarg($scriptPath) . ' 2>&1');
        AuditService::log((int) $u['id'], AuditService::ACTION_WEEKLY_UPDATE_RUN, 'system', null, ['triggered_by' => 'admin_ui']);
        Response::redirect('/admin/weekly-updates?triggered=1', 302);
    }
}
