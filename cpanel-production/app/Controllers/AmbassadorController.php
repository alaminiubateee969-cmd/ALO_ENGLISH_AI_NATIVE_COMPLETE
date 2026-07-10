<?php
/**
 * app/Controllers/AmbassadorController.php — Ambassador portal pages.
 *
 *   dashboard, referrals, createReferral, storeReferral, students,
 *   vouchers, commission, reports, marketingKit.
 *
 * SAFETY RULES:
 *   - Show only SAFE status — no private student data (no PII of referred
 *     students beyond name + status).
 *   - Commission amounts are visible only to the ambassador themselves,
 *     never to the public.
 *   - No bulk student lists.
 *
 * Routes enforce auth + role:AMBASSADOR,ADMIN,SUPER_ADMIN (routes.php).
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

final class AmbassadorController
{
    private function ambassador(): array
    {
        $user = RBACService::currentUser();
        if ($user === null) {
            Response::redirect('/login', 302);
        }
        $amb = Database::one('SELECT * FROM exam_students WHERE user_id = :uid AND is_ambassador = 1 LIMIT 1', ['uid' => (int) $user['id']]);
        if ($amb === null) {
            Response::abort(403, 'Your account does not have ambassador privileges.');
        }
        return ['user' => $user, 'ambassador' => $amb];
    }

    public function dashboard(array $params = []): void
    {
        $ctx = $this->ambassador();
        $ambId = (int) $ctx['ambassador']['id'];
        $kpis = [
            'referrals_total'   => (int) Database::scalar('SELECT COUNT(*) FROM exam_students WHERE ambassador_id = :aid', ['aid' => $ambId]),
            'referrals_active'  => (int) Database::scalar("SELECT COUNT(*) FROM exam_students s JOIN exam_users u ON u.id=s.user_id WHERE s.ambassador_id=:aid AND u.status='active'", ['aid' => $ambId]),
            'attempts_by_refs'  => (int) Database::scalar('SELECT COUNT(*) FROM exam_mock_attempts a JOIN exam_students s ON s.id=a.student_id WHERE s.ambassador_id=:aid', ['aid' => $ambId]),
            'vouchers_active'   => (int) Database::scalar("SELECT COUNT(*) FROM exam_vouchers WHERE ambassador_id=:aid AND status='active'", ['aid' => $ambId]),
            // Commission shown privately — not to public.
            'commission_earned' => (float) Database::scalar('SELECT COALESCE(SUM(commission_amount),0) FROM exam_ambassador_commission WHERE ambassador_id=:aid', ['aid' => $ambId]),
        ];
        Response::view('ambassador/dashboard', ['ctx' => $ctx, 'kpis' => $kpis]);
    }

    public function referrals(array $params = []): void
    {
        $ctx = $this->ambassador();
        $ambId = (int) $ctx['ambassador']['id'];
        // SAFE only — name + status, no email/phone/PII.
        $rows = Database::all(
            'SELECT s.id, u.full_name, u.status, s.created_at
               FROM exam_students s
               JOIN exam_users u ON u.id = s.user_id
              WHERE s.ambassador_id = :aid
              ORDER BY s.id DESC LIMIT 200',
            ['aid' => $ambId]
        );
        Response::view('ambassador/referrals', ['rows' => $rows, 'ctx' => $ctx]);
    }

    public function createReferral(array $params = []): void
    {
        $ctx = $this->ambassador();
        Response::view('ambassador/create-referral', ['ctx' => $ctx,
            'csrf' => CSRFService::token(), 'csrf_field' => CSRFService::hiddenField()]);
    }

    public function storeReferral(array $params = []): void
    {
        $ctx = $this->ambassador();
        $name = trim($_POST['full_name'] ?? '');
        $email = strtolower(trim($_POST['email'] ?? ''));
        $phone = trim($_POST['phone'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::abort(422, 'A valid name and email are required.');
        }
        $id = Database::insert('exam_leads', [
            'lead_source'    => 'ambassador_referral',
            'ambassador_id'  => (int) $ctx['ambassador']['id'],
            'name'           => mb_substr($name, 0, 255),
            'email'          => mb_substr($email, 0, 255),
            'phone'          => mb_substr($phone, 0, 32),
            'status'         => 'new',
            'created_at'     => date('Y-m-d H:i:s'),
        ]);
        AuditService::log((int) $ctx['user']['id'], 'ambassador.referral_created', 'lead', $id, []);
        Response::redirect('/ambassador/referrals?created=1', 302);
    }

    public function students(array $params = []): void
    {
        $ctx = $this->ambassador();
        // SAFE only — name + status + attempt count, no email/phone.
        $rows = Database::all(
            'SELECT s.id, u.full_name, u.status, s.created_at,
                    (SELECT COUNT(*) FROM exam_mock_attempts a WHERE a.student_id=s.id) AS attempts
               FROM exam_students s
               JOIN exam_users u ON u.id = s.user_id
              WHERE s.ambassador_id = :aid
              ORDER BY s.id DESC',
            ['aid' => (int) $ctx['ambassador']['id']]
        );
        Response::view('ambassador/students', ['rows' => $rows, 'ctx' => $ctx]);
    }

    public function vouchers(array $params = []): void
    {
        $ctx = $this->ambassador();
        $rows = Database::all(
            'SELECT voucher_code, voucher_type, status, used_count, usage_limit, expires_at
               FROM exam_vouchers
              WHERE ambassador_id = :aid
              ORDER BY id DESC',
            ['aid' => (int) $ctx['ambassador']['id']]
        );
        Response::view('ambassador/vouchers', ['rows' => $rows, 'ctx' => $ctx]);
    }

    public function commission(array $params = []): void
    {
        $ctx = $this->ambassador();
        // Commission is PRIVATE to the ambassador — never public.
        $rows = Database::all(
            'SELECT c.id, c.commission_amount, c.status, c.created_at, c.paid_at
               FROM exam_ambassador_commission c
              WHERE c.ambassador_id = :aid
              ORDER BY c.id DESC LIMIT 200',
            ['aid' => (int) $ctx['ambassador']['id']]
        );
        $total = (float) Database::scalar('SELECT COALESCE(SUM(commission_amount),0) FROM exam_ambassador_commission WHERE ambassador_id = :aid', ['aid' => (int) $ctx['ambassador']['id']]);
        $paid  = (float) Database::scalar("SELECT COALESCE(SUM(commission_amount),0) FROM exam_ambassador_commission WHERE ambassador_id = :aid AND status='paid'", ['aid' => (int) $ctx['ambassador']['id']]);
        Response::view('ambassador/commission', ['rows' => $rows, 'total' => $total, 'paid' => $paid, 'ctx' => $ctx]);
    }

    public function reports(array $params = []): void
    {
        $ctx = $this->ambassador();
        $rows = Database::all(
            'SELECT DATE(a.started_at) AS day, COUNT(*) AS attempts
               FROM exam_mock_attempts a
               JOIN exam_students s ON s.id = a.student_id
              WHERE s.ambassador_id = :aid
              GROUP BY DATE(a.started_at)
              ORDER BY day DESC LIMIT 90',
            ['aid' => (int) $ctx['ambassador']['id']]
        );
        Response::view('ambassador/reports', ['rows' => $rows, 'ctx' => $ctx]);
    }

    public function marketingKit(array $params = []): void
    {
        $ctx = $this->ambassador();
        $assets = Database::all("SELECT setting_key, setting_value FROM exam_settings WHERE setting_key LIKE 'ambassador_kit_%'");
        Response::view('ambassador/marketing-kit', ['assets' => $assets, 'ctx' => $ctx]);
    }
}
