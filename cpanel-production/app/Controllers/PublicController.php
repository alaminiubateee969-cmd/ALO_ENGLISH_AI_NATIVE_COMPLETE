<?php
/**
 * app/Controllers/PublicController.php — Public-facing pages + APIs.
 *
 * Handles: index, login, register, tests, mock-tests, pricing, ambassador,
 * contact (+submit), privacy, terms, exam-disclaimer, how-exams-work,
 * computer-based-exams, individual exam landing pages (/ielts etc.),
 * /api/health, /api/lead, /api/quota.
 *
 * All HTML output escapes via Response::view (e() helper).
 * All form submissions require CSRF.
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

final class PublicController
{
    /** Home page. */
    public function index(array $params = []): void
    {
        $exams = Database::all(
            'SELECT et.type_code, et.type_name, et.style_label, c.category_code
               FROM exam_types et
               JOIN exam_categories c ON c.id = et.category_id
              WHERE et.is_active = 1
              ORDER BY c.id, et.type_name
              LIMIT 32'
        );
        Response::view('public/index', [
            'exams'         => $exams,
            'csrf'          => CSRFService::token(),
            'csrf_field'    => CSRFService::hiddenField(),
        ]);
    }

    /** Login form (rendered; submission goes to AuthController::login). */
    public function login(array $params = []): void
    {
        Response::view('public/login', [
            'csrf'       => CSRFService::token(),
            'csrf_field' => CSRFService::hiddenField(),
        ]);
    }

    /** Registration form (submission to AuthController::register). */
    public function register(array $params = []): void
    {
        Response::view('public/register', [
            'csrf'       => CSRFService::token(),
            'csrf_field' => CSRFService::hiddenField(),
        ]);
    }

    /** All published mock tests (public catalog). */
    public function tests(array $params = []): void
    {
        $rows = Database::all(
            'SELECT ps.set_code, ps.title, ps.description, ps.total_questions,
                    ps.total_duration_minutes, ps.difficulty, et.type_code, et.type_name,
                    et.style_label
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id = ps.exam_type_id
              WHERE ps.is_published = 1
              ORDER BY et.type_name, ps.difficulty'
        );
        Response::view('public/tests', ['sets' => $rows]);
    }

    /** Mock test catalog (alias of tests, branded differently). */
    public function mockTests(array $params = []): void
    {
        $this->tests($params);
    }

    /** Pricing page. */
    public function pricing(array $params = []): void
    {
        $price = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='paid_attempt_price_usd'");
        Response::view('public/pricing', [
            'paid_price_usd' => (float) ($price ?: 9.00),
        ]);
    }

    /** Ambassador program landing. */
    public function ambassador(array $params = []): void
    {
        Response::view('public/ambassador', []);
    }

    /** Contact form (GET). */
    public function contact(array $params = []): void
    {
        Response::view('public/contact', [
            'csrf'       => CSRFService::token(),
            'csrf_field' => CSRFService::hiddenField(),
        ]);
    }

    /** Contact form submission (POST). */
    public function contactSubmit(array $params = []): void
    {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $message = trim($_POST['message'] ?? '');

        if ($name === '' || $email === '' || $message === '') {
            Response::abort(422, 'Please fill in all required fields.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::abort(422, 'Invalid email address.');
        }

        Database::insert('exam_leads', [
            'lead_source' => 'contact_form',
            'name'        => mb_substr($name, 0, 255),
            'email'       => mb_substr($email, 0, 255),
            'phone'       => mb_substr($phone, 0, 32),
            'message'     => mb_substr($message, 0, 4000),
            'status'      => 'new',
            'created_at'  => date('Y-m-d H:i:s'),
        ]);
        AuditService::log(null, 'lead.created', 'lead', null, ['source' => 'contact_form', 'email' => $email]);

        Response::redirect('/contact?sent=1', 302);
    }

    public function privacy(array $params = []): void
    {
        Response::view('public/privacy', []);
    }

    public function terms(array $params = []): void
    {
        Response::view('public/terms', []);
    }

    public function examDisclaimer(array $params = []): void
    {
        $cfg = require __DIR__ . '/../../config/exams.php';
        Response::view('public/exam-disclaimer', ['disclaimer' => $cfg['practice_disclaimer']]);
    }

    public function howExamsWork(array $params = []): void
    {
        Response::view('public/how-exams-work', []);
    }

    public function computerBasedExams(array $params = []): void
    {
        Response::view('public/computer-based-exams', []);
    }

    /** Per-exam landing page. Reads the type_code from the URL. */
    public function examPage(array $params = []): void
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $code = strtoupper(ltrim($path, '/'));
        $code = preg_replace('/[^A-Z0-9_-]/', '', $code) ?? '';

        $exam = Database::one(
            'SELECT et.*, c.category_name
               FROM exam_types et
               JOIN exam_categories c ON c.id = et.category_id
              WHERE et.type_code = :code AND et.is_active = 1
              LIMIT 1',
            ['code' => $code]
        );
        if ($exam === null) {
            Response::abort(404, 'Exam not found.');
        }
        $sets = Database::all(
            'SELECT * FROM exam_practice_sets WHERE exam_type_id = :id AND is_published = 1
              ORDER BY difficulty, id LIMIT 10',
            ['id' => $exam['id']]
        );

        $cfg = require __DIR__ . '/../../config/exams.php';
        Response::view('public/exam-page', [
            'exam'        => $exam,
            'sets'        => $sets,
            'disclaimer'  => $cfg['practice_disclaimer'],
        ]);
    }

    // ---------- Public API ----------

    /** /api/health — public, returns 200 JSON with platform status. */
    public function health(array $params = []): void
    {
        $db = 'ok';
        try {
            Database::connection();
        } catch (\Throwable $e) {
            $db = 'error';
        }
        Response::json([
            'status'        => $db === 'ok' ? 'ok' : 'degraded',
            'platform'      => 'ALO English Test Platform',
            'version'       => Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='platform_version'") ?: '1.0.0',
            'php_version'   => PHP_VERSION,
            'database'      => $db,
            'timestamp'     => date('c'),
            'env'           => getenv('APP_ENV') ?: 'production',
            'practice_only' => true,
        ]);
    }

    /** /api/lead — public lead submission (e.g. ambassador landing). */
    public function submitLead(array $params = []): void
    {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $source = trim($_POST['source'] ?? 'public_api');
        $ambassadorCode = trim($_POST['ambassador_code'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(['error' => 'invalid_email'], 422);
        }
        $ambassadorId = null;
        if ($ambassadorCode !== '') {
            $amb = Database::one('SELECT s.id FROM exam_students s WHERE s.ambassador_code = :c LIMIT 1', ['c' => $ambassadorCode]);
            $ambassadorId = $amb !== null ? (int) $amb['id'] : null;
        }
        $id = Database::insert('exam_leads', [
            'lead_source' => mb_substr($source, 0, 64),
            'name'        => mb_substr($name, 0, 255),
            'email'       => mb_substr($email, 0, 255),
            'phone'       => mb_substr($phone, 0, 32),
            'ambassador_id' => $ambassadorId,
            'status'      => 'new',
            'created_at'  => date('Y-m-d H:i:s'),
        ]);
        AuditService::log(null, 'lead.created', 'lead', $id, ['source' => $source]);
        Response::json(['ok' => true, 'lead_id' => $id], 201);
    }

    /** /api/quota — public, returns the platform's free-quota policy. */
    public function quotaStatus(array $params = []): void
    {
        $alo = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_alo'");
        $pub = Database::scalar("SELECT setting_value FROM exam_settings WHERE setting_key='free_quota_public'");
        Response::json([
            'free_quota_alo_student'    => (int) ($alo ?: 3),
            'free_quota_public_student' => (int) ($pub ?: 1),
            'shared_across_exams'       => true,
            'backend_enforced'          => true,
            'description'               => 'Free quota is shared across all 32 CBT exams and enforced server-side. Quota cannot be bypassed by client-side changes.',
        ]);
    }
}
