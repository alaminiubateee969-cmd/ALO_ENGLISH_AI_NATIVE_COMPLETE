<?php
/**
 * app/Controllers/CRMIntegrationController.php — CRM API endpoints.
 *
 * Server-to-server endpoints exposed under /api/alo-crm/*.
 * All require X-Api-Key header matching ALO_CRM_API_KEY (env only).
 * The key is NEVER echoed, NEVER logged in detail. Every call is audited.
 *
 * Endpoints:
 *   GET  /api/alo-crm/health
 *   POST /api/alo-crm/sync-student
 *   POST /api/alo-crm/check-eligibility
 *   POST /api/alo-crm/push-result
 *   POST /api/alo-crm/push-voucher-usage
 *   POST /api/alo-crm/push-feedback
 *   POST /api/alo-crm/push-message
 *   POST /api/alo-crm/referral-lead
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AuditService;
use App\Services\CRMIntegrationService;

final class CRMIntegrationController
{
    /** Read JSON body safely. Returns empty array on parse failure. */
    private function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!is_string($raw) || $raw === '') {
            return $_POST;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /** GET /api/alo-crm/health */
    public function health(array $params = []): void
    {
        $crm = CRMIntegrationService::health();
        $dbOk = 'ok';
        try { Database::connection(); } catch (\Throwable $e) { $dbOk = 'error'; }
        Response::json([
            'platform'    => 'ALO English Test Platform',
            'status'      => $crm['ok'] === true && $dbOk === 'ok' ? 'ok' : 'degraded',
            'crm'         => $crm,
            'database'    => $dbOk,
            'timestamp'   => date('c'),
            'practice_only' => true,
        ]);
    }

    /** POST /api/alo-crm/sync-student {platform_student_id} */
    public function syncStudent(array $params = []): void
    {
        $body = $this->jsonBody();
        $id = (int) ($body['platform_student_id'] ?? 0);
        if ($id <= 0) {
            Response::json(['error' => 'invalid_student_id'], 422);
        }
        $result = CRMIntegrationService::syncStudent($id);
        Response::json($result, $result['ok'] ? 200 : 502);
    }

    /** POST /api/alo-crm/check-eligibility {alo_student_id, alo_application_id, email} */
    public function checkEligibility(array $params = []): void
    {
        $body = $this->jsonBody();
        $student = [
            'id'                 => 0,
            'alo_student_id'     => $body['alo_student_id'] ?? null,
            'alo_application_id' => $body['alo_application_id'] ?? null,
            'email'              => $body['email'] ?? null,
        ];
        $eligible = CRMIntegrationService::checkEligibility($student);
        AuditService::log(null, 'crm_api.check_eligibility', 'student', null, ['eligible' => $eligible]);
        Response::json(['eligible' => $eligible]);
    }

    /** POST /api/alo-crm/push-result {attempt_id} — CRM pushes a real-exam result back to us. */
    public function pushResult(array $params = []): void
    {
        $body = $this->jsonBody();
        $attemptId = (int) ($body['attempt_id'] ?? 0);
        if ($attemptId <= 0) {
            Response::json(['error' => 'invalid_attempt_id'], 422);
        }
        // CRM is sending us official-exam-result metadata for linking only.
        // We DO NOT mutate our practice score — practice results remain practice-only.
        $exists = Database::exists('SELECT 1 FROM exam_mock_attempts WHERE id = :id', ['id' => $attemptId]);
        if (!$exists) {
            Response::json(['error' => 'attempt_not_found'], 404);
        }
        AuditService::log(null, 'crm_api.result_pushed', 'attempt', $attemptId, ['source' => 'crm']);
        Response::json(['ok' => true, 'attempt_id' => $attemptId]);
    }

    /** POST /api/alo-crm/push-voucher-usage {voucher_usage_id} */
    public function pushVoucherUsage(array $params = []): void
    {
        $body = $this->jsonBody();
        $id = (int) ($body['voucher_usage_id'] ?? 0);
        if ($id <= 0) {
            Response::json(['error' => 'invalid_id'], 422);
        }
        $r = CRMIntegrationService::pushVoucherUsage($id);
        Response::json($r, $r['ok'] ? 200 : 502);
    }

    /** POST /api/alo-crm/push-feedback {feedback_id} */
    public function pushFeedback(array $params = []): void
    {
        $body = $this->jsonBody();
        $id = (int) ($body['feedback_id'] ?? 0);
        if ($id <= 0) {
            Response::json(['error' => 'invalid_id'], 422);
        }
        $r = CRMIntegrationService::pushFeedback($id);
        Response::json($r, $r['ok'] ? 200 : 502);
    }

    /** POST /api/alo-crm/push-message {message_id} */
    public function pushMessage(array $params = []): void
    {
        $body = $this->jsonBody();
        $id = (int) ($body['message_id'] ?? 0);
        if ($id <= 0) {
            Response::json(['error' => 'invalid_id'], 422);
        }
        $r = CRMIntegrationService::pushMessage($id);
        Response::json($r, $r['ok'] ? 200 : 502);
    }

    /** POST /api/alo-crm/referral-lead {ambassador_code, name, email, phone} */
    public function referralLead(array $params = []): void
    {
        $body = $this->jsonBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = strtolower(trim((string)($body['email'] ?? '')));
        $phone = trim((string)($body['phone'] ?? ''));
        $ambCode = trim((string)($body['ambassador_code'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(['error' => 'invalid_input'], 422);
        }
        $ambassadorId = null;
        if ($ambCode !== '') {
            $amb = Database::one('SELECT id FROM exam_students WHERE ambassador_code = :c LIMIT 1', ['c' => $ambCode]);
            $ambassadorId = $amb !== null ? (int) $amb['id'] : null;
        }
        $id = Database::insert('exam_leads', [
            'lead_source'   => 'crm_referral_lead',
            'name'          => mb_substr($name, 0, 255),
            'email'         => mb_substr($email, 0, 255),
            'phone'         => mb_substr($phone, 0, 32),
            'ambassador_id' => $ambassadorId,
            'status'        => 'new',
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
        AuditService::log(null, 'crm_api.referral_lead', 'lead', $id, []);
        Response::json(['ok' => true, 'lead_id' => $id], 201);
    }
}
