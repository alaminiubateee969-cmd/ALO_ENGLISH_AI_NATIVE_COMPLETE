<?php
/**
 * app/Services/AiAgentEmployeeService.php — AI Agent Employee registry + task queue.
 *
 * Central read/write API for the 20 AI Agent Employees registered in
 * `exam_ai_agents`. All agent task creation goes through createTask() which:
 *   - inserts a row into `exam_ai_agent_tasks`
 *   - writes an operational log to `exam_ai_agent_logs`
 *   - writes an immutable audit entry via AuditService::log()
 *
 * Compliance: the public_label column of the agent row is the ONLY wording
 * exposed to students ("ALO Evaluation System", "Digital Practice Session",
 * "ALO Practice Examiner", "Practice Interview Coach", "Automated Practice
 * Feedback", "Smart Score Report", "ALO Estimated Score Engine"). The
 * "Agent" terminology (internal_label) is admin-only.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class AiAgentEmployeeService
{
    public const TASK_PENDING    = 'pending';
    public const TASK_RUNNING    = 'running';
    public const TASK_COMPLETED  = 'completed';
    public const TASK_FAILED     = 'failed';
    public const TASK_CANCELLED  = 'cancelled';

    public const APPROVAL_PENDING  = 'pending';
    public const APPROVAL_APPROVED = 'approved';
    public const APPROVAL_REJECTED = 'rejected';

    // ---------- Agent lookup ----------

    /** Fetch a single agent by its code (e.g. 'AGENT-WRITING-01'). */
    public static function getAgent(string $code): ?array
    {
        return Database::one(
            'SELECT id, agent_code, agent_name, department, responsibility,
                    exam_scope, is_active, public_label, internal_label,
                    can_auto_execute, requires_admin_approval, created_at
               FROM exam_ai_agents
              WHERE agent_code = :code
              LIMIT 1',
            ['code' => $code]
        );
    }

    /** Fetch a single agent by its primary key. */
    public static function getAgentById(int $agentId): ?array
    {
        return Database::one(
            'SELECT id, agent_code, agent_name, department, responsibility,
                    exam_scope, is_active, public_label, internal_label,
                    can_auto_execute, requires_admin_approval, created_at
               FROM exam_ai_agents
              WHERE id = :id
              LIMIT 1',
            ['id' => $agentId]
        );
    }

    /** All active agents, ordered by department then code. */
    public static function getActiveAgents(): array
    {
        return Database::all(
            'SELECT id, agent_code, agent_name, department, responsibility,
                    exam_scope, public_label, internal_label,
                    can_auto_execute, requires_admin_approval
               FROM exam_ai_agents
              WHERE is_active = 1
              ORDER BY department ASC, agent_code ASC'
        );
    }

    /** All agents (active + inactive), ordered by department then code. */
    public static function getAllAgents(): array
    {
        return Database::all(
            'SELECT id, agent_code, agent_name, department, responsibility,
                    exam_scope, is_active, public_label, internal_label,
                    can_auto_execute, requires_admin_approval, created_at
               FROM exam_ai_agents
              ORDER BY department ASC, agent_code ASC'
        );
    }

    // ---------- Attempt <-> Agent assignment ----------

    /**
     * Assign multiple agents to an attempt by inserting one task row per agent.
     * Each task starts in 'pending' state with a generated task_code.
     *
     * @param int    $attemptId
     * @param string[] $agentCodes  e.g. ['AGENT-INTAKE-01','AGENT-SETUP-01']
     */
    public static function assignAgentsToAttempt(int $attemptId, array $agentCodes): void
    {
        if ($agentCodes === []) {
            return;
        }
        $now = date('Y-m-d H:i:s');
        foreach (array_unique($agentCodes) as $code) {
            $agent = self::getAgent((string) $code);
            if ($agent === null) {
                continue; // unknown agent code — skip silently, do not break the flow
            }
            self::createTask(
                (int) $agent['id'],
                'agent_assignment',
                $attemptId,
                [
                    'agent_code'      => $agent['agent_code'],
                    'public_label'    => $agent['public_label'],
                    'assigned_at'     => $now,
                ]
            );
        }
    }

    // ---------- Task lifecycle ----------

    /**
     * Create a new task for an agent. Always logs to:
     *   - exam_ai_agent_tasks
     *   - exam_ai_agent_logs
     *   - exam_audit_logs (via AuditService)
     *
     * @param int         $agentId
     * @param string      $taskType   free-form label e.g. 'writing_evaluation'
     * @param int|null    $attemptId  optional attempt context
     * @param array       $payload    structured JSON payload
     * @return int                   the new task id
     */
    public static function createTask(int $agentId, string $taskType, ?int $attemptId, array $payload): int
    {
        $agent = self::getAgentById($agentId);
        if ($agent === null) {
            throw new RuntimeException("Agent not found: {$agentId}");
        }

        $now = date('Y-m-d H:i:s');
        $taskCode = self::generateTaskCode((string) $agent['agent_code']);

        $taskId = Database::insert('exam_ai_agent_tasks', [
            'task_code'   => $taskCode,
            'agent_id'    => $agentId,
            'attempt_id'  => $attemptId,
            'task_type'   => $taskType,
            'payload'     => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'status'      => self::TASK_PENDING,
            'started_at'  => null,
            'completed_at'=> null,
            'error_message' => null,
            'result'      => null,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        self::logAgent($agentId, 'task_created', $attemptId, [
            'task_id'    => $taskId,
            'task_code'  => $taskCode,
            'task_type'  => $taskType,
        ]);

        AuditService::log(
            null,
            'ai_agent.task_created',
            'agent_task',
            $taskId,
            [
                'agent_id'    => $agentId,
                'agent_code'  => $agent['agent_code'],
                'attempt_id'  => $attemptId,
                'task_type'   => $taskType,
                'task_code'   => $taskCode,
            ]
        );

        return $taskId;
    }

    /** Mark a task running (sets started_at). */
    public static function startTask(int $taskId): void
    {
        Database::update('exam_ai_agent_tasks', [
            'status'     => self::TASK_RUNNING,
            'started_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $taskId]);
    }

    /**
     * Mark a task completed and persist the structured result.
     *
     * @param int   $taskId
     * @param array $result
     */
    public static function completeTask(int $taskId, array $result): void
    {
        $task = self::getTask($taskId);
        if ($task === null) {
            throw new RuntimeException("Task not found: {$taskId}");
        }
        $now = date('Y-m-d H:i:s');
        Database::update('exam_ai_agent_tasks', [
            'status'       => self::TASK_COMPLETED,
            'result'       => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'completed_at' => $now,
            'updated_at'   => $now,
            'error_message'=> null,
        ], 'id = :id', ['id' => $taskId]);

        self::logAgent((int) $task['agent_id'], 'task_completed', $task['attempt_id'] !== null ? (int) $task['attempt_id'] : null, [
            'task_id' => $taskId,
            'task_type' => $task['task_type'],
        ]);

        AuditService::log(
            null,
            'ai_agent.task_completed',
            'agent_task',
            $taskId,
            ['agent_id' => (int) $task['agent_id'], 'attempt_id' => $task['attempt_id']]
        );
    }

    /**
     * Mark a task failed with an error message. Also writes to
     * exam_ai_agent_failures for tracking/resolution.
     */
    public static function failTask(int $taskId, string $error): void
    {
        $task = self::getTask($taskId);
        if ($task === null) {
            throw new RuntimeException("Task not found: {$taskId}");
        }
        $now = date('Y-m-d H:i:s');
        Database::update('exam_ai_agent_tasks', [
            'status'        => self::TASK_FAILED,
            'error_message' => mb_substr($error, 0, 65535),
            'completed_at'  => $now,
            'updated_at'    => $now,
        ], 'id = :id', ['id' => $taskId]);

        Database::insert('exam_ai_agent_failures', [
            'agent_id'      => (int) $task['agent_id'],
            'task_id'       => $taskId,
            'error_type'    => 'task_failure',
            'error_message' => mb_substr($error, 0, 65535),
            'stack_trace'   => null,
            'resolved'      => 0,
            'created_at'    => $now,
        ]);

        self::logAgent((int) $task['agent_id'], 'task_failed', $task['attempt_id'] !== null ? (int) $task['attempt_id'] : null, [
            'task_id' => $taskId,
            'error'   => mb_substr($error, 0, 500),
        ]);

        AuditService::log(
            null,
            'ai_agent.task_failed',
            'agent_task',
            $taskId,
            ['agent_id' => (int) $task['agent_id'], 'error' => mb_substr($error, 0, 500)]
        );
    }

    /** Fetch a task row by id. */
    public static function getTask(int $taskId): ?array
    {
        return Database::one(
            'SELECT * FROM exam_ai_agent_tasks WHERE id = :id LIMIT 1',
            ['id' => $taskId]
        );
    }

    /** All tasks for a given attempt. */
    public static function getAttemptTasks(int $attemptId): array
    {
        return Database::all(
            'SELECT t.*, a.agent_code, a.public_label, a.internal_label
               FROM exam_ai_agent_tasks t
               JOIN exam_ai_agents a ON a.id = t.agent_id
              WHERE t.attempt_id = :aid
              ORDER BY t.id ASC',
            ['aid' => $attemptId]
        );
    }

    // ---------- Operational logs ----------

    /**
     * Write an operational log entry to exam_ai_agent_logs.
     * Does NOT throw — agent logging must never break request flow.
     */
    public static function logAgent(int $agentId, string $action, ?int $attemptId, array $details): void
    {
        try {
            Database::insert('exam_ai_agent_logs', [
                'agent_id'    => $agentId,
                'attempt_id'  => $attemptId,
                'action'      => $action,
                'entity_type' => 'agent',
                'entity_id'   => $agentId,
                'details'     => json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'created_at'  => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            @error_log('[ai_agent_log] failed: ' . $e->getMessage());
        }
    }

    /** Recent operational logs (optionally filtered by agent or attempt). */
    public static function getLogs(?int $agentId = null, ?int $attemptId = null, int $limit = 200): array
    {
        $sql = 'SELECT l.id, l.agent_id, l.attempt_id, l.action, l.entity_type, l.entity_id,
                       l.details, l.created_at, a.agent_code, a.internal_label
                  FROM exam_ai_agent_logs l
                  JOIN exam_ai_agents a ON a.id = l.agent_id';
        $where = [];
        $params = [];
        if ($agentId !== null) {
            $where[] = 'l.agent_id = :aid';
            $params['aid'] = $agentId;
        }
        if ($attemptId !== null) {
            $where[] = 'l.attempt_id = :att';
            $params['att'] = $attemptId;
        }
        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY l.id DESC LIMIT ' . max(1, min(1000, $limit));
        return Database::all($sql, $params);
    }

    // ---------- Dashboard / stats ----------

    /**
     * KPIs for the admin AI Agent Employees dashboard.
     *
     * @return array{
     *   active_agents:int, tasks_today:int, failed_tasks:int,
     *   scoring_tasks:int, speaking_tasks:int, writing_tasks:int,
     *   report_tasks:int, weekly_update_tasks:int,
     *   pending_approvals:int, compliance_warnings:int
     * }
     */
    public static function getAgentDashboardStats(): array
    {
        $activeAgents   = (int) Database::scalar('SELECT COUNT(*) FROM exam_ai_agents WHERE is_active = 1');
        $tasksToday     = (int) Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_tasks WHERE DATE(created_at) = CURDATE()');
        $failedTasks    = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks WHERE status = 'failed'");
        $scoringTasks   = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks t JOIN exam_ai_agents a ON a.id=t.agent_id WHERE a.agent_code = 'AGENT-SCORING-01'");
        $speakingTasks  = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks t JOIN exam_ai_agents a ON a.id=t.agent_id WHERE a.agent_code = 'AGENT-SPEAKING-01'");
        $writingTasks   = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks t JOIN exam_ai_agents a ON a.id=t.agent_id WHERE a.agent_code = 'AGENT-WRITING-01'");
        $reportTasks    = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks t JOIN exam_ai_agents a ON a.id=t.agent_id WHERE a.agent_code = 'AGENT-REPORT-01'");
        $weeklyTasks    = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_tasks t JOIN exam_ai_agents a ON a.id=t.agent_id WHERE a.agent_code = 'AGENT-WEEKLY-01'");
        $pendingApps    = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_approvals WHERE status = 'pending'");
        $complianceWarn = (int) Database::scalar("SELECT COUNT(*) FROM exam_ai_agent_failures WHERE resolved = 0");

        return [
            'active_agents'        => $activeAgents,
            'tasks_today'          => $tasksToday,
            'failed_tasks'         => $failedTasks,
            'scoring_tasks'        => $scoringTasks,
            'speaking_tasks'       => $speakingTasks,
            'writing_tasks'        => $writingTasks,
            'report_tasks'         => $reportTasks,
            'weekly_update_tasks'  => $weeklyTasks,
            'pending_approvals'    => $pendingApps,
            'compliance_warnings'  => $complianceWarn,
        ];
    }

    // ---------- Approvals ----------

    /** Pending approval queue (joined with agent + requester). */
    public static function getApprovalQueue(): array
    {
        return Database::all(
            "SELECT ap.id, ap.agent_id, ap.task_id, ap.requested_by, ap.approval_type,
                    ap.payload, ap.status, ap.created_at,
                    a.agent_code, a.internal_label, a.public_label,
                    u.email AS requester_email
               FROM exam_ai_agent_approvals ap
               JOIN exam_ai_agents a ON a.id = ap.agent_id
               LEFT JOIN exam_users u ON u.id = ap.requested_by
              WHERE ap.status = 'pending'
              ORDER BY ap.created_at DESC
              LIMIT 200"
        );
    }

    /**
     * Approve a pending task approval. Records approver + timestamp, and
     * writes audit + agent logs. Returns false if approval already actioned.
     */
    public static function approveTask(int $approvalId, int $userId): bool
    {
        return Database::transactional(function () use ($approvalId, $userId): bool {
            $row = Database::one(
                'SELECT * FROM exam_ai_agent_approvals WHERE id = :id FOR UPDATE',
                ['id' => $approvalId]
            );
            if ($row === null || $row['status'] !== self::APPROVAL_PENDING) {
                return false;
            }
            $now = date('Y-m-d H:i:s');
            Database::update('exam_ai_agent_approvals', [
                'status'      => self::APPROVAL_APPROVED,
                'approved_by' => $userId,
                'approved_at' => $now,
            ], 'id = :id', ['id' => $approvalId]);

            self::logAgent((int) $row['agent_id'], 'task_approved', null, [
                'approval_id' => $approvalId,
                'task_id'     => $row['task_id'],
                'approver'    => $userId,
            ]);
            AuditService::log($userId, 'ai_agent.task_approved', 'agent_approval', $approvalId, [
                'agent_id' => (int) $row['agent_id'],
                'task_id'  => $row['task_id'],
            ]);
            return true;
        });
    }

    /** Reject a pending task approval. */
    public static function rejectTask(int $approvalId, int $userId, string $reason = ''): bool
    {
        return Database::transactional(function () use ($approvalId, $userId, $reason): bool {
            $row = Database::one(
                'SELECT * FROM exam_ai_agent_approvals WHERE id = :id FOR UPDATE',
                ['id' => $approvalId]
            );
            if ($row === null || $row['status'] !== self::APPROVAL_PENDING) {
                return false;
            }
            $now = date('Y-m-d H:i:s');
            Database::update('exam_ai_agent_approvals', [
                'status'      => self::APPROVAL_REJECTED,
                'approved_by' => $userId,
                'approved_at' => $now,
            ], 'id = :id', ['id' => $approvalId]);

            if ($row['task_id'] !== null) {
                Database::update('exam_ai_agent_tasks', [
                    'status'        => self::TASK_CANCELLED,
                    'error_message' => 'Rejected by reviewer: ' . mb_substr($reason, 0, 200),
                    'updated_at'    => $now,
                ], 'id = :id', ['id' => (int) $row['task_id']]);
            }

            self::logAgent((int) $row['agent_id'], 'task_rejected', null, [
                'approval_id' => $approvalId,
                'task_id'     => $row['task_id'],
                'reviewer'    => $userId,
                'reason'      => mb_substr($reason, 0, 200),
            ]);
            AuditService::log($userId, 'ai_agent.task_rejected', 'agent_approval', $approvalId, [
                'agent_id' => (int) $row['agent_id'],
                'task_id'  => $row['task_id'],
                'reason'   => mb_substr($reason, 0, 200),
            ]);
            return true;
        });
    }

    /**
     * Create an approval request for a sensitive task (used by services that
     * need admin sign-off before publishing content / distributing reports).
     */
    public static function requestApproval(int $agentId, ?int $taskId, int $requestedBy, string $approvalType, array $payload): int
    {
        $id = Database::insert('exam_ai_agent_approvals', [
            'agent_id'      => $agentId,
            'task_id'       => $taskId,
            'requested_by'  => $requestedBy,
            'approval_type' => $approvalType,
            'payload'       => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'status'        => self::APPROVAL_PENDING,
            'approved_by'   => null,
            'approved_at'   => null,
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
        AuditService::log($requestedBy, 'ai_agent.approval_requested', 'agent_approval', $id, [
            'agent_id'      => $agentId,
            'task_id'       => $taskId,
            'approval_type' => $approvalType,
        ]);
        return $id;
    }

    // ---------- Performance ----------

    /**
     * Performance summary for a single agent: lifetime task counts, success
     * rate, and the 7-day daily rollup (uses exam_ai_agent_performance when
     * seeded, falls back to live aggregation otherwise).
     */
    public static function getAgentPerformance(int $agentId): array
    {
        $agent = self::getAgentById($agentId);
        if ($agent === null) {
            return ['agent' => null, 'totals' => null, 'daily' => []];
        }

        $totals = Database::one(
            'SELECT
                COUNT(*) AS tasks_total,
                SUM(CASE WHEN status = :c THEN 1 ELSE 0 END) AS tasks_completed,
                SUM(CASE WHEN status = :f THEN 1 ELSE 0 END) AS tasks_failed,
                AVG(TIMESTAMPDIFF(SECOND, created_at, COALESCE(completed_at, NOW()))) AS avg_duration_seconds
               FROM exam_ai_agent_tasks
              WHERE agent_id = :aid',
            [
                'aid' => $agentId,
                'c'   => self::TASK_COMPLETED,
                'f'   => self::TASK_FAILED,
            ]
        );

        $daily = Database::all(
            'SELECT date, tasks_total, tasks_completed, tasks_failed,
                    avg_duration_seconds, success_rate
               FROM exam_ai_agent_performance
              WHERE agent_id = :aid
              ORDER BY date DESC
              LIMIT 30',
            ['aid' => $agentId]
        );

        return [
            'agent'   => $agent,
            'totals'  => $totals,
            'daily'   => $daily,
        ];
    }

    // ---------- Helpers ----------

    /**
     * Generate a unique, human-readable task code, e.g.
     *   TASK-WRITING-20250120-A1B2C3D4
     */
    private static function generateTaskCode(string $agentCode): string
    {
        $suffix = strtoupper(substr(sodium_bin2hex(random_bytes(4)), 0, 8));
        $short = str_starts_with($agentCode, 'AGENT-')
            ? substr($agentCode, 6)   // strip 'AGENT-' prefix
            : $agentCode;
        return 'TASK-' . $short . '-' . date('Ymd') . '-' . $suffix;
    }
}
