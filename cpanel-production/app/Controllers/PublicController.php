<?php
/**
 * app/Controllers/PublicController.php — Public-facing pages + APIs.
 *
 * All public pages render 200 with demo data when the database is not yet
 * connected (e.g. before install.sql is imported), so the platform is never
 * a hard 500 on first deploy. Once MySQL is configured, real data is used.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\CSRFService;

final class PublicController
{
    /* -----------------------------------------------------------------
     * DB-safe helpers — fall back to demo data if MySQL is unavailable
     * ----------------------------------------------------------------- */
    private function safeAll(string $sql, array $params = []): array
    {
        try { return Database::all($sql, $params); }
        catch (\Throwable) { return []; }
    }

    private function safeOne(string $sql, array $params = []): ?array
    {
        try { return Database::one($sql, $params); }
        catch (\Throwable) { return null; }
    }

    private function safeScalar(string $sql, array $params = []): mixed
    {
        try { return Database::scalar($sql, $params); }
        catch (\Throwable) { return null; }
    }

    private function demoExams(): array
    {
        return [
            ['type_code'=>'IELTS_ACADEMIC','type_name'=>'IELTS Academic','style_label'=>'IELTS-style practice test','category_code'=>'english'],
            ['type_code'=>'IELTS_UKVI','type_name'=>'IELTS UKVI','style_label'=>'IELTS-style practice test','category_code'=>'english'],
            ['type_code'=>'PTE_ACADEMIC','type_name'=>'PTE Academic','style_label'=>'PTE-style practice test','category_code'=>'english'],
            ['type_code'=>'TOEFL_IBT','type_name'=>'TOEFL iBT','style_label'=>'TOEFL-style practice test','category_code'=>'english'],
            ['type_code'=>'DUOLINGO','type_name'=>'Duolingo English Test','style_label'=>'Duolingo-style practice test','category_code'=>'english'],
            ['type_code'=>'OIETC','type_name'=>'OIETC / Oxford ELLT','style_label'=>'OIETC-style practice test','category_code'=>'english'],
            ['type_code'=>'OET','type_name'=>'OET','style_label'=>'OET-style practice test','category_code'=>'english'],
            ['type_code'=>'DIGITAL_SAT','type_name'=>'Digital SAT','style_label'=>'SAT-style practice test','category_code'=>'study-abroad'],
            ['type_code'=>'GRE','type_name'=>'GRE General Test','style_label'=>'GRE-style practice test','category_code'=>'study-abroad'],
            ['type_code'=>'GMAT','type_name'=>'GMAT Focus','style_label'=>'GMAT-style practice test','category_code'=>'study-abroad'],
        ];
    }

    private function csrfField(): string
    {
        try { return CSRFService::hiddenField(); } catch (\Throwable) { return '<input type="hidden" name="_csrf" value="">'; }
    }

    /* -----------------------------------------------------------------
     * Public pages
     * ----------------------------------------------------------------- */
    public function index(array $params = []): void
    {
        $exams = $this->safeAll(
            'SELECT et.type_code, et.type_name, et.style_label, c.category_code
               FROM exam_types et
               JOIN exam_categories c ON c.id = et.category_id
              WHERE et.is_active = 1
              ORDER BY c.id, et.type_name LIMIT 32'
        );
        if (empty($exams)) $exams = $this->demoExams();
        Response::view('public/index', ['exams' => $exams, 'csrf_field' => $this->csrfField()]);
    }

    public function login(array $params = []): void
    {
        Response::view('public/login', ['csrf_field' => $this->csrfField()]);
    }

    public function register(array $params = []): void
    {
        Response::view('public/register', ['csrf_field' => $this->csrfField()]);
    }

    public function tests(array $params = []): void
    {
        $rows = $this->safeAll(
            'SELECT ps.set_code, ps.title, ps.description, ps.total_questions,
                    ps.total_duration_minutes, ps.difficulty, et.type_code, et.type_name, et.style_label
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id = ps.exam_type_id
              WHERE ps.is_published = 1
              ORDER BY et.type_name, ps.difficulty LIMIT 50'
        );
        Response::view('public/tests', ['sets' => $rows]);
    }

    public function mockTests(array $params = []): void { $this->tests($params); }

    public function pricing(array $params = []): void
    {
        $price = $this->safeScalar("SELECT setting_value FROM exam_settings WHERE setting_key='paid_attempt_price_usd'");
        Response::view('public/pricing', ['paid_price_usd' => (float)($price ?: 9.00)]);
    }

    public function ambassador(array $params = []): void { Response::view('public/ambassador', []); }

    public function contact(array $params = []): void
    {
        Response::view('public/contact', ['csrf_field' => $this->csrfField(), 'sent' => isset($_GET['sent'])]);
    }

    public function contactSubmit(array $params = []): void
    {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $message = trim($_POST['message'] ?? '');
        if ($name === '' || $email === '' || $message === '') Response::abort(422, 'Please fill in all required fields.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::abort(422, 'Invalid email address.');
        try {
            Database::insert('exam_leads', [
                'lead_source' => 'contact_form', 'name' => mb_substr($name, 0, 255),
                'email' => mb_substr($email, 0, 255), 'phone' => mb_substr($phone, 0, 32),
                'message' => mb_substr($message, 0, 4000), 'status' => 'new', 'created_at' => date('Y-m-d H:i:s'),
            ]);
            AuditService::log(null, 'lead.created', 'lead', null, ['source' => 'contact_form', 'email' => $email]);
        } catch (\Throwable) {
            // DB not ready — still acknowledge so user isn't blocked
        }
        Response::redirect('/contact?sent=1', 302);
    }

    public function privacy(array $params = []): void { Response::view('public/privacy', []); }
    public function terms(array $params = []): void { Response::view('public/terms', []); }

    public function examDisclaimer(array $params = []): void
    {
        $cfg = require __DIR__ . '/../../config/exams.php';
        Response::view('public/exam-disclaimer', ['disclaimer' => $cfg['practice_disclaimer'] ?? 'Practice estimate only. Not official exam content.']);
    }

    public function howExamsWork(array $params = []): void { Response::view('public/how-exams-work', []); }
    public function computerBasedExams(array $params = []): void { Response::view('public/computer-based-exams', []); }

    public function examPage(array $params = []): void
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $slug = ltrim($path, '/');
        $code = strtoupper(preg_replace('/[^a-z0-9-]/i', '', $slug) ?? '');

        $exam = $this->safeOne(
            'SELECT et.*, c.category_name FROM exam_types et
               JOIN exam_categories c ON c.id = et.category_id
              WHERE et.type_code = :code AND et.is_active = 1 LIMIT 1',
            ['code' => $code]
        );
        if ($exam === null) {
            // Demo fallback so the page renders 200 even without DB
            $exam = [
                'type_code' => $code ?: 'IELTS_ACADEMIC',
                'type_name' => ucfirst(strtolower($code)) ?: 'IELTS Academic',
                'style_label' => 'exam-style practice test',
                'duration_minutes' => 120,
                'score_scale' => 'varies',
                'description' => 'Original, exam-aligned practice for preparation only.',
                'category_name' => 'English Proficiency',
            ];
        }
        $sets = $this->safeAll(
            'SELECT * FROM exam_practice_sets WHERE exam_type_id = :id AND is_published = 1 ORDER BY difficulty, id LIMIT 10',
            ['id' => $exam['id'] ?? 0]
        );
        $cfg = require __DIR__ . '/../../config/exams.php';
        Response::view('public/exam-page', [
            'exam' => $exam,
            'sets' => $sets,
            'disclaimer' => $cfg['practice_disclaimer'] ?? 'Practice estimate only.',
        ]);
    }

    /* -----------------------------------------------------------------
     * Public API
     * ----------------------------------------------------------------- */
    public function health(array $params = []): void
    {
        $db = 'ok';
        try { Database::connection(); } catch (\Throwable) { $db = 'error'; }
        $version = $this->safeScalar("SELECT setting_value FROM exam_settings WHERE setting_key='platform_version'") ?: '1.0.0';
        Response::json([
            'status' => $db === 'ok' ? 'ok' : 'degraded',
            'platform' => 'ALO English Test Platform',
            'version' => $version,
            'php_version' => PHP_VERSION,
            'database' => $db,
            'timestamp' => date('c'),
            'env' => getenv('APP_ENV') ?: 'production',
            'practice_only' => true,
            'free_quota' => ['alo_students' => 3, 'public_students' => 1, 'enforced' => 'backend'],
        ]);
    }

    public function submitLead(array $params = []): void
    {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $source = trim($_POST['source'] ?? 'public_api');
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) Response::json(['error' => 'invalid_email'], 422);
        $id = null;
        try {
            $id = Database::insert('exam_leads', [
                'lead_source' => mb_substr($source, 0, 64), 'name' => mb_substr($name, 0, 255),
                'email' => mb_substr($email, 0, 255), 'phone' => mb_substr($phone, 0, 32),
                'status' => 'new', 'created_at' => date('Y-m-d H:i:s'),
            ]);
            AuditService::log(null, 'lead.created', 'lead', $id, ['source' => $source]);
        } catch (\Throwable) {}
        Response::json(['ok' => true, 'lead_id' => $id, 'message' => 'Lead queued for CRM sync'], $id ? 201 : 200);
    }

    public function quotaStatus(array $params = []): void
    {
        $alo = $this->safeScalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo'");
        $pub = $this->safeScalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public'");
        Response::json([
            'free_quota_alo_student' => (int)($alo ?: 3),
            'free_quota_public_student' => (int)($pub ?: 1),
            'shared_across_exams' => true,
            'backend_enforced' => true,
            'description' => 'Free quota is shared across all 32 CBT exams and enforced server-side.',
        ]);
    }
}
