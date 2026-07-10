<?php
/**
 * app/Controllers/AiAgentController.php — Admin AI Agent Employees dashboard.
 *
 * Admin-only controller for managing the 20 AI Agent Employees:
 *   - dashboard:        KPIs + agent list + approval queue overview
 *   - agentDetail:      single agent with tasks + logs + performance
 *   - approvals:        full pending-approval queue
 *   - approveTask:      POST — approve a pending task
 *   - rejectTask:       POST — reject a pending task
 *   - logs:             recent agent operational logs (filterable)
 *   - override:         POST — manual override of an agent task
 *
 * All routes require:
 *   - auth
 *   - role:ADMIN,SUPER_ADMIN
 *   - permission:english.ai_agents.manage (to be added to config/permissions.php)
 *
 * Compliance: every page uses the agent's `public_label` for any
 * student-facing context and `internal_label` ("Agent") only for the
 * admin view itself.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Response;
use App\Services\AiAgentEmployeeService;
use App\Services\AuditService;
use App\Services\CSRFService;
use App\Services\RBACService;

final class AiAgentController
{
    /** Permission key checked on every method. */
    public const PERMISSION = 'english.ai_agents.manage';

    private function user(): array
    {
        $u = RBACService::currentUser();
        if ($u === null) {
            Response::redirect('/login', 302);
        }
        // Defensive: route middleware already enforces role+permission, but
        // we double-check here so the controller is safe even if routes change.
        if (!RBACService::hasRole('ADMIN', 'SUPER_ADMIN')) {
            Response::abort(403, 'Forbidden.');
        }
        return $u;
    }

    /** GET /admin/agents — main dashboard. */
    public function dashboard(array $params = []): void
    {
        $u = $this->user();
        $stats = AiAgentEmployeeService::getAgentDashboardStats();
        $agents = AiAgentEmployeeService::getAllAgents();
        $approvalQueue = AiAgentEmployeeService::getApprovalQueue();
        $recentLogs = AiAgentEmployeeService::getLogs(null, null, 30);

        Response::view('admin/agents', [
            'user'           => $u,
            'stats'          => $stats,
            'agents'         => $agents,
            'approval_queue' => $approvalQueue,
            'recent_logs'    => $recentLogs,
            'csrf'           => CSRFService::token(),
            'csrf_field'     => CSRFService::hiddenField(),
        ]);
    }

    /** GET /admin/agents/{agentId} — single agent detail. */
    public function agentDetail(array $params = []): void
    {
        $u = $this->user();
        $agentId = (int) ($params['agentId'] ?? ($_GET['agent_id'] ?? 0));
        $agent = AiAgentEmployeeService::getAgentById($agentId);
        if ($agent === null) {
            Response::abort(404, 'Agent not found.');
        }
        $tasks = Database::all(
            'SELECT * FROM exam_ai_agent_tasks
              WHERE agent_id = :aid
              ORDER BY id DESC LIMIT 100',
            ['aid' => $agentId]
        );
        $logs = AiAgentEmployeeService::getLogs($agentId, null, 100);
        $performance = AiAgentEmployeeService::getAgentPerformance($agentId);
        $approvals = Database::all(
            'SELECT ap.*, u.email AS approver_email
               FROM exam_ai_agent_approvals ap
               LEFT JOIN exam_users u ON u.id = ap.approved_by
              WHERE ap.agent_id = :aid
              ORDER BY ap.id DESC LIMIT 50',
            ['aid' => $agentId]
        );

        Response::view('admin/agent-detail', [
            'user'        => $u,
            'agent'       => $agent,
            'tasks'       => $tasks,
            'logs'        => $logs,
            'performance' => $performance,
            'approvals'   => $approvals,
            'csrf'        => CSRFService::token(),
            'csrf_field'  => CSRFService::hiddenField(),
        ]);
    }

    /** GET /admin/agents/approvals — full approval queue. */
    public function approvals(array $params = []): void
    {
        $u = $this->user();
        $queue = AiAgentEmployeeService::getApprovalQueue();
        // Also include recently-decided approvals for context.
        $recent = Database::all(
            "SELECT ap.*, a.agent_code, a.internal_label, u.email AS approver_email
               FROM exam_ai_agent_approvals ap
               JOIN exam_ai_agents a ON a.id = ap.agent_id
               LEFT JOIN exam_users u ON u.id = ap.approved_by
              WHERE ap.status IN ('approved','rejected')
              ORDER BY ap.approved_at DESC LIMIT 50"
        );

        Response::view('admin/agent-approvals', [
            'user'       => $u,
            'queue'      => $queue,
            'recent'     => $recent,
            'csrf'       => CSRFService::token(),
            'csrf_field' => CSRFService::hiddenField(),
        ]);
    }

    /** POST /admin/agents/approve — approve a pending task. */
    public function approveTask(array $params = []): void
    {
        $u = $this->user();
        $approvalId = (int) ($_POST['approval_id'] ?? 0);
        if ($approvalId <= 0) {
            Response::json(['error' => 'invalid_approval_id'], 422);
        }
        $ok = AiAgentEmployeeService::approveTask($approvalId, (int) $u['id']);
        AuditService::log((int) $u['id'], 'admin.agent_approve', 'agent_approval', $approvalId, [
            'result' => $ok ? 'approved' : 'already_actioned',
        ]);
        if (isset($_POST['ajax']) && $_POST['ajax'] === '1') {
            Response::json(['ok' => $ok, 'approval_id' => $approvalId]);
        }
        Response::redirect('/admin/agents/approvals?action=' . ($ok ? 'approved' : 'noop'), 302);
    }

    /** POST /admin/agents/reject — reject a pending task. */
    public function rejectTask(array $params = []): void
    {
        $u = $this->user();
        $approvalId = (int) ($_POST['approval_id'] ?? 0);
        $reason = trim((string) ($_POST['reason'] ?? ''));
        if ($approvalId <= 0) {
            Response::json(['error' => 'invalid_approval_id'], 422);
        }
        $ok = AiAgentEmployeeService::rejectTask($approvalId, (int) $u['id'], $reason);
        AuditService::log((int) $u['id'], 'admin.agent_reject', 'agent_approval', $approvalId, [
            'result' => $ok ? 'rejected' : 'already_actioned',
            'reason' => mb_substr($reason, 0, 200),
        ]);
        if (isset($_POST['ajax']) && $_POST['ajax'] === '1') {
            Response::json(['ok' => $ok, 'approval_id' => $approvalId]);
        }
        Response::redirect('/admin/agents/approvals?action=' . ($ok ? 'rejected' : 'noop'), 302);
    }

    /** GET /admin/agents/logs — recent agent operational logs (filterable). */
    public function logs(array $params = []): void
    {
        $u = $this->user();
        $agentId = isset($_GET['agent_id']) ? (int) $_GET['agent_id'] : null;
        $attemptId = isset($_GET['attempt_id']) ? (int) $_GET['attempt_id'] : null;
        $limit = isset($_GET['limit']) ? max(10, min(500, (int) $_GET['limit'])) : 200;

        $logs = AiAgentEmployeeService::getLogs($agentId, $attemptId, $limit);
        $agents = AiAgentEmployeeService::getAllAgents();

        Response::view('admin/agent-logs', [
            'user'       => $u,
            'logs'       => $logs,
            'agents'     => $agents,
            'filter' => [
                'agent_id'   => $agentId,
                'attempt_id' => $attemptId,
                'limit'      => $limit,
            ],
        ]);
    }

    /**
     * POST /admin/agents/override — manual override of an agent task.
     *
     * Allows an admin to:
     *   - mark a failed task completed with a manual result
     *   - cancel a pending task
     *   - retry a failed task by re-creating it
     *
     * Override reason is mandatory and is audited.
     */
    public function override(array $params = []): void
    {
        $u = $this->user();
        $taskId = (int) ($_POST['task_id'] ?? 0);
        $action = (string) ($_POST['action'] ?? '');
        $reason = trim((string) ($_POST['reason'] ?? ''));
        $resultJson = trim((string) ($_POST['result_json'] ?? ''));

        if ($taskId <= 0 || $reason === '') {
            Response::json(['error' => 'invalid_input', 'required' => ['task_id','reason']], 422);
        }
        $task = AiAgentEmployeeService::getTask($taskId);
        if ($task === null) {
            Response::json(['error' => 'task_not_found'], 404);
        }
        $agentId = (int) $task['agent_id'];

        switch ($action) {
            case 'complete':
                $result = $resultJson !== '' ? json_decode($resultJson, true) : [];
                if (!is_array($result)) {
                    $result = ['manual_override' => true, 'reason' => $reason];
                } else {
                    $result['manual_override'] = true;
                    $result['override_reason'] = $reason;
                    $result['overridden_by']   = (int) $u['id'];
                }
                AiAgentEmployeeService::completeTask($taskId, $result);
                break;
            case 'fail':
                AiAgentEmployeeService::failTask($taskId, 'Manual override: ' . $reason);
                break;
            case 'cancel':
                Database::update('exam_ai_agent_tasks', [
                    'status'        => AiAgentEmployeeService::TASK_CANCELLED,
                    'error_message' => 'Cancelled by admin: ' . mb_substr($reason, 0, 200),
                    'updated_at'    => date('Y-m-d H:i:s'),
                ], 'id = :id', ['id' => $taskId]);
                AiAgentEmployeeService::logAgent($agentId, 'task_cancelled', $task['attempt_id'] !== null ? (int) $task['attempt_id'] : null, [
                    'task_id' => $taskId,
                    'reason'  => mb_substr($reason, 0, 200),
                    'by'      => (int) $u['id'],
                ]);
                break;
            case 'retry':
                // Re-create the task with the same payload + a fresh task_code.
                $payload = json_decode((string) ($task['payload'] ?? ''), true) ?: [];
                $payload['retry_of'] = $taskId;
                $payload['retry_reason'] = $reason;
                $newTaskId = AiAgentEmployeeService::createTask(
                    $agentId,
                    (string) $task['task_type'],
                    $task['attempt_id'] !== null ? (int) $task['attempt_id'] : null,
                    $payload
                );
                AuditService::log((int) $u['id'], 'admin.agent_override', 'agent_task', $taskId, [
                    'action'        => 'retry',
                    'new_task_id'   => $newTaskId,
                    'reason'        => mb_substr($reason, 0, 200),
                ]);
                if (isset($_POST['ajax']) && $_POST['ajax'] === '1') {
                    Response::json(['ok' => true, 'new_task_id' => $newTaskId]);
                }
                Response::redirect('/admin/agents/' . $agentId . '?override=retry&new=' . $newTaskId, 302);
                break;
            default:
                Response::json(['error' => 'invalid_action'], 422);
        }

        AuditService::log((int) $u['id'], 'admin.agent_override', 'agent_task', $taskId, [
            'action' => $action,
            'reason' => mb_substr($reason, 0, 200),
        ]);

        if (isset($_POST['ajax']) && $_POST['ajax'] === '1') {
            Response::json(['ok' => true, 'task_id' => $taskId, 'action' => $action]);
        }
        Response::redirect('/admin/agents/' . $agentId . '?override=' . $action, 302);
    }
}
