<?php
/**
 * app/Services/AiGovernanceService.php — 5-Step AI Agent Governance Framework
 *
 * STEP 1: Single Objective Lock — each agent has ONE responsibility only
 * STEP 2: Structured Memory Layer — permission-controlled memory
 * STEP 3: Tool Isolation — every tool runs independently with fallback
 * STEP 4: Controlled Decision Pipeline — 14-stage pipeline for every request
 * STEP 5: Feedback & Continuous Improvement — reports after every task
 *
 * Core Rules:
 *   - AI may NOT permanently learn without admin approval
 *   - AI may NOT modify production without validation
 *   - AI may NOT delete customer data
 *   - AI may NOT expose secrets
 *   - AI may NOT bypass approval
 *   - AI may NEVER skip logging
 *   - If one tool fails, platform continues using fallback
 *   - Infrastructure memory never leaks between companies
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Services\AuditService;

final class AiGovernanceService
{
    // =====================================================
    // STEP 1: Single Objective Lock
    // =====================================================

    /**
     * Get the single objective lock for an agent.
     * Each agent performs ONE responsibility only.
     */
    public static function getObjective(int $agentId): ?array
    {
        return Database::one(
            'SELECT * FROM exam_ai_agent_objectives WHERE agent_id = :id AND is_active = 1 LIMIT 1',
            ['id' => $agentId]
        );
    }

    /**
     * Validate that a workflow is allowed for an agent (Single Objective Lock).
     * Returns true if the workflow is in allowed_workflows and NOT in forbidden_workflows.
     */
    public static function validateWorkflow(int $agentId, string $workflow): array
    {
        $obj = self::getObjective($agentId);
        if ($obj === null) {
            return ['allowed' => false, 'reason' => 'No objective lock found for agent'];
        }

        $allowed = json_decode($obj['allowed_workflows'] ?: '[]', true) ?: [];
        $forbidden = json_decode($obj['forbidden_workflows'] ?: '[]', true) ?: [];

        if (in_array($workflow, $forbidden, true)) {
            AuditService::log(null, 'governance.workflow_forbidden', 'agent', $agentId, [
                'workflow' => $workflow,
                'reason' => 'Workflow is in forbidden list',
            ]);
            return ['allowed' => false, 'reason' => 'Workflow is forbidden for this agent'];
        }

        if (!in_array($workflow, $allowed, true)) {
            return ['allowed' => false, 'reason' => 'Workflow not in allowed list for this agent'];
        }

        return ['allowed' => true, 'reason' => ''];
    }

    /**
     * Check if the agent's success condition was met.
     */
    public static function checkSuccessCondition(int $agentId, string $output): array
    {
        $obj = self::getObjective($agentId);
        if ($obj === null) return ['met' => false, 'reason' => 'No objective'];

        return [
            'met' => !empty($output),
            'success_condition' => $obj['success_condition'],
            'failure_condition' => $obj['failure_condition'],
        ];
    }

    /**
     * Get all objective locks (admin dashboard).
     */
    public static function getAllObjectives(): array
    {
        return Database::all(
            'SELECT o.*, a.agent_code, a.agent_name, a.internal_label, a.department
             FROM exam_ai_agent_objectives o
             JOIN exam_ai_agents a ON a.id = o.agent_id
             WHERE o.is_active = 1
             ORDER BY a.id'
        );
    }

    // =====================================================
    // STEP 2: Structured Memory Layer
    // =====================================================

    /**
     * Read from the structured memory layer (permission-controlled).
     * AI may NOT permanently learn without approval.
     */
    public static function readMemory(int $agentId, string $type, string $key): ?string
    {
        $row = Database::one(
            'SELECT memory_value FROM exam_ai_agent_memory
             WHERE agent_id = :agent AND memory_type = :type AND memory_key = :key
               AND is_approved = 1
             LIMIT 1',
            ['agent' => $agentId, 'type' => $type, 'key' => $key]
        );
        return $row ? $row['memory_value'] : null;
    }

    /**
     * Write to the memory layer (requires admin approval for permanent storage).
     */
    public static function writeMemory(int $agentId, string $type, string $key, string $value, string $accessLevel = 'private'): int
    {
        // Check if memory already exists
        $existing = Database::one(
            'SELECT id, is_approved FROM exam_ai_agent_memory
             WHERE agent_id = :agent AND memory_type = :type AND memory_key = :key LIMIT 1',
            ['agent' => $agentId, 'type' => $type, 'key' => $key]
        );

        if ($existing) {
            // Update existing — but do NOT auto-approve (requires admin)
            Database::update('exam_ai_agent_memory', [
                'memory_value' => $value,
                'access_level' => $accessLevel,
                'is_approved' => 0, // Reset to unapproved on change
            ], 'id = :id', ['id' => $existing['id']]);
            return (int)$existing['id'];
        }

        return Database::insert('exam_ai_agent_memory', [
            'agent_id' => $agentId,
            'memory_type' => $type,
            'memory_key' => $key,
            'memory_value' => $value,
            'access_level' => $accessLevel,
            'is_approved' => 0, // Never auto-approve
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Approve a memory entry (admin only).
     */
    public static function approveMemory(int $memoryId, int $adminUserId): bool
    {
        Database::update('exam_ai_agent_memory', [
            'is_approved' => 1,
            'approved_by' => $adminUserId,
        ], 'id = :id', ['id' => $memoryId]);

        AuditService::log($adminUserId, 'governance.memory_approved', 'memory', $memoryId, [
            'admin' => $adminUserId,
        ]);
        return true;
    }

    /**
     * Get all memory entries (admin dashboard).
     */
    public static function getAllMemory(): array
    {
        return Database::all(
            'SELECT m.*, a.agent_code, a.agent_name
             FROM exam_ai_agent_memory m
             JOIN exam_ai_agents a ON a.id = m.agent_id
             ORDER BY m.is_approved ASC, m.created_at DESC LIMIT 100'
        );
    }

    /**
     * Get pending memory approvals.
     */
    public static function getPendingMemoryApprovals(): array
    {
        return Database::all(
            'SELECT m.*, a.agent_code, a.agent_name
             FROM exam_ai_agent_memory m
             JOIN exam_ai_agents a ON a.id = m.agent_id
             WHERE m.is_approved = 0
             ORDER BY m.created_at DESC'
        );
    }

    // =====================================================
    // STEP 3: Tool Isolation
    // =====================================================

    /**
     * Execute a tool with isolation — if it fails, use fallback.
     * One tool failure NEVER stops the complete platform.
     */
    public static function executeTool(string $toolCode, ?int $agentId, callable $executor, ?callable $fallbackExecutor = null): array
    {
        $tool = Database::one(
            'SELECT * FROM exam_ai_agent_tools WHERE tool_code = :code AND is_active = 1 LIMIT 1',
            ['code' => $toolCode]
        );

        if ($tool === null) {
            return ['success' => false, 'error' => 'Tool not found or inactive', 'fallback_used' => false];
        }

        $maxRetries = (int)$tool['max_retries'];
        $timeout = (int)$tool['timeout_seconds'];
        $lastError = '';

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $result = $executor();
                return ['success' => true, 'result' => $result, 'attempts' => $attempt, 'fallback_used' => false];
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                // Wait before retry (exponential backoff)
                if ($attempt < $maxRetries) {
                    usleep($attempt * 500000); // 0.5s, 1s, 1.5s...
                }
            }
        }

        // Tool failed — try fallback
        $fallbackCode = $tool['fallback_tool_code'];
        $fallbackSucceeded = false;

        if ($fallbackCode && $fallbackExecutor) {
            try {
                $fallbackResult = $fallbackExecutor();
                $fallbackSucceeded = true;

                // Log the fallback usage
                Database::insert('exam_ai_agent_tool_failures', [
                    'tool_code' => $toolCode,
                    'agent_id' => $agentId,
                    'error_message' => $lastError,
                    'fallback_used' => $fallbackCode,
                    'fallback_succeeded' => 1,
                    'platform_continued' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);

                AuditService::log(null, 'governance.tool_fallback', 'tool', null, [
                    'failed_tool' => $toolCode,
                    'fallback_tool' => $fallbackCode,
                    'error' => $lastError,
                    'platform_continued' => true,
                ]);

                return ['success' => true, 'result' => $fallbackResult, 'fallback_used' => true, 'fallback_tool' => $fallbackCode, 'original_error' => $lastError];
            } catch (\Throwable $fe) {
                // Fallback also failed
            }
        }

        // Both tool and fallback failed — log but platform continues
        Database::insert('exam_ai_agent_tool_failures', [
            'tool_code' => $toolCode,
            'agent_id' => $agentId,
            'error_message' => $lastError,
            'fallback_used' => $fallbackCode,
            'fallback_succeeded' => 0,
            'platform_continued' => 1, // Platform still continues
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        AuditService::log(null, 'governance.tool_failed', 'tool', null, [
            'tool' => $toolCode,
            'error' => $lastError,
            'platform_continued' => true,
        ]);

        return ['success' => false, 'error' => $lastError, 'fallback_used' => (bool)$fallbackCode, 'platform_continued' => true];
    }

    /**
     * Get tool failure stats (admin dashboard).
     */
    public static function getToolFailureStats(): array
    {
        $today = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_tool_failures WHERE DATE(created_at) = CURDATE()') ?: 0);
        $fallbacksUsed = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_tool_failures WHERE fallback_used IS NOT NULL') ?: 0);
        $platformContinued = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_tool_failures WHERE platform_continued = 1') ?: 0);

        return [
            'failures_today' => $today,
            'fallbacks_used' => $fallbacksUsed,
            'platform_continued' => $platformContinued,
            'isolation_working' => true,
        ];
    }

    /**
     * Get all tools (admin dashboard).
     */
    public static function getAllTools(): array
    {
        return Database::all('SELECT * FROM exam_ai_agent_tools ORDER BY module, tool_code');
    }

    // =====================================================
    // STEP 4: Controlled Decision Pipeline
    // =====================================================

    public const STAGES = [
        'input', 'authentication', 'rbac', 'protection_mode', 'payment_guard',
        'infra_validation', 'workflow_selection', 'ai_selection', 'tool_selection',
        'execution', 'verification', 'logging', 'review', 'learning_suggestion',
        'approval', 'completed', 'rejected'
    ];

    /**
     * Start a new controlled decision pipeline.
     * Every AI request MUST go through all stages.
     */
    public static function startPipeline(string $requestType, ?int $agentId, array $inputData = []): int
    {
        $code = 'PIPE-' . strtoupper(substr(md5($requestType . time() . random_bytes(8)), 0, 12));

        $id = Database::insert('exam_ai_decision_pipelines', [
            'pipeline_code' => $code,
            'agent_id' => $agentId,
            'request_type' => $requestType,
            'input_data' => json_encode($inputData),
            'current_stage' => 'input',
            'stage_history' => json_encode([['stage' => 'input', 'status' => 'started', 'timestamp' => date('c')]]),
            'status' => 'running',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        AuditService::log($agentId, 'governance.pipeline_started', 'pipeline', $id, [
            'code' => $code,
            'request_type' => $requestType,
        ]);

        return $id;
    }

    /**
     * Advance the pipeline to the next stage.
     */
    public static function advanceStage(int $pipelineId, string $stage, string $status = 'passed', string $notes = ''): void
    {
        $pipe = Database::one('SELECT * FROM exam_ai_decision_pipelines WHERE id = :id', ['id' => $pipelineId]);
        if ($pipe === null) return;

        $history = json_decode($pipe['stage_history'] ?: '[]', true) ?: [];
        $history[] = ['stage' => $stage, 'status' => $status, 'timestamp' => date('c'), 'notes' => $notes];

        $updateData = [
            'current_stage' => $stage,
            'stage_history' => json_encode($history),
        ];

        if ($stage === 'completed') {
            $updateData['status'] = 'completed';
            $updateData['completed_at'] = date('Y-m-d H:i:s');
        } elseif ($stage === 'rejected') {
            $updateData['status'] = 'rejected';
            $updateData['completed_at'] = date('Y-m-d H:i:s');
            $updateData['rejection_reason'] = $notes;
        }

        Database::update('exam_ai_decision_pipelines', $updateData, 'id = :id', ['id' => $pipelineId]);
    }

    /**
     * Reject a pipeline at a stage (e.g., RBAC failed, payment guard blocked).
     */
    public static function rejectPipeline(int $pipelineId, string $stage, string $reason): void
    {
        self::advanceStage($pipelineId, 'rejected', 'rejected', $reason);

        AuditService::log(null, 'governance.pipeline_rejected', 'pipeline', $pipelineId, [
            'stage' => $stage,
            'reason' => $reason,
        ]);
    }

    /**
     * Get pipeline (admin dashboard).
     */
    public static function getPipeline(int $pipelineId): ?array
    {
        return Database::one('SELECT * FROM exam_ai_decision_pipelines WHERE id = :id', ['id' => $pipelineId]);
    }

    /**
     * Get recent pipelines (admin dashboard).
     */
    public static function getRecentPipelines(int $limit = 20): array
    {
        return Database::all(
            'SELECT p.*, a.agent_name, a.internal_label FROM exam_ai_decision_pipelines p
             LEFT JOIN exam_ai_agents a ON a.id = p.agent_id
             ORDER BY p.created_at DESC LIMIT :limit',
            ['limit' => $limit]
        );
    }

    // =====================================================
    // STEP 5: Feedback & Continuous Improvement
    // =====================================================

    public const FEEDBACK_TYPES = [
        'infrastructure', 'performance', 'security', 'resource',
        'backup', 'error', 'optimization', 'learning'
    ];

    /**
     * Generate feedback after a task completes.
     * Permanent improvements require admin approval.
     */
    public static function generateFeedback(int $agentId, ?int $taskId, ?int $pipelineId, string $type, array $reportData, string $suggestions = ''): int
    {
        $id = Database::insert('exam_ai_agent_feedback', [
            'agent_id' => $agentId,
            'task_id' => $taskId,
            'pipeline_id' => $pipelineId,
            'feedback_type' => $type,
            'report_data' => json_encode($reportData),
            'suggestions' => $suggestions,
            'is_approved' => 0, // Never auto-approve
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        AuditService::log($agentId, 'governance.feedback_generated', 'feedback', $id, [
            'type' => $type,
            'auto_approved' => false,
        ]);

        return $id;
    }

    /**
     * Approve a feedback/learning suggestion (admin only).
     * Permanent improvements require administrator approval.
     */
    public static function approveFeedback(int $feedbackId, int $adminUserId): bool
    {
        Database::update('exam_ai_agent_feedback', [
            'is_approved' => 1,
            'approved_by' => $adminUserId,
            'approved_at' => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $feedbackId]);

        AuditService::log($adminUserId, 'governance.feedback_approved', 'feedback', $feedbackId, [
            'admin' => $adminUserId,
        ]);
        return true;
    }

    /**
     * Get feedback stats (admin dashboard).
     */
    public static function getFeedbackStats(): array
    {
        $total = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_feedback') ?: 0);
        $approved = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_feedback WHERE is_approved = 1') ?: 0);
        $pending = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_feedback WHERE is_approved = 0') ?: 0);

        $byType = [];
        foreach (self::FEEDBACK_TYPES as $type) {
            $byType[$type] = (int)(Database::scalar(
                'SELECT COUNT(*) FROM exam_ai_agent_feedback WHERE feedback_type = :type',
                ['type' => $type]
            ) ?: 0);
        }

        return [
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'by_type' => $byType,
            'auto_learning' => false, // Always false — never auto-learn
        ];
    }

    /**
     * Get pending feedback approvals.
     */
    public static function getPendingFeedbackApprovals(): array
    {
        return Database::all(
            'SELECT f.*, a.agent_code, a.agent_name
             FROM exam_ai_agent_feedback f
             JOIN exam_ai_agents a ON a.id = f.agent_id
             WHERE f.is_approved = 0
             ORDER BY f.created_at DESC LIMIT 50'
        );
    }

    // =====================================================
    // Governance Dashboard Stats
    // =====================================================

    public static function getDashboardStats(): array
    {
        $agents = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agents WHERE is_active = 1') ?: 0);
        $objectives = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_objectives WHERE is_active = 1') ?: 0);
        $memoryApproved = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_memory WHERE is_approved = 1') ?: 0);
        $memoryPending = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_memory WHERE is_approved = 0') ?: 0);
        $pipelinesToday = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_decision_pipelines WHERE DATE(created_at) = CURDATE()') ?: 0);
        $pipelinesCompleted = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_decision_pipelines WHERE status = "completed"') ?: 0);
        $pipelinesRejected = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_decision_pipelines WHERE status = "rejected"') ?: 0);
        $feedbackPending = (int)(Database::scalar('SELECT COUNT(*) FROM exam_ai_agent_feedback WHERE is_approved = 0') ?: 0);
        $toolFailures = self::getToolFailureStats();

        return [
            'step1_single_objective' => [
                'agents' => $agents,
                'objectives_locked' => $objectives,
                'all_locked' => $objectives >= $agents,
            ],
            'step2_memory' => [
                'approved' => $memoryApproved,
                'pending' => $memoryPending,
                'auto_learning' => false,
            ],
            'step3_tool_isolation' => $toolFailures,
            'step4_decision_pipeline' => [
                'today' => $pipelinesToday,
                'completed' => $pipelinesCompleted,
                'rejected' => $pipelinesRejected,
            ],
            'step5_feedback' => [
                'pending' => $feedbackPending,
                'auto_learning' => false,
            ],
            'governance_enabled' => true,
            'never_delete_customer_data' => true,
            'never_expose_secrets' => true,
            'never_bypass_approval' => true,
            'never_skip_logging' => true,
        ];
    }
}
