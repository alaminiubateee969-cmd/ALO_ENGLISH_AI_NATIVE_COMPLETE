<?php
/**
 * app/Services/ExamConductorService.php — Orchestrates a full exam attempt.
 *
 * Coordinates the AI Agent Employee workforce across the two phases of an
 * exam attempt:
 *
 *   START  (pre-attempt):   intake → eligibility → setup → proctor
 *   SUBMIT (post-attempt):  scoring → feedback → report → crm
 *
 * Wraps TestEngineService (which owns the attempt row + scoring rows) and
 * QuotaService (which owns the free-quota enforcement). All public-facing
 * labels use the agents' `public_label` column — never "AI" / "bot" / "agent"
 * in student-visible output.
 *
 * NO-HUMAN PRACTICE EXAM MODE (Task ID: NO-HUMAN):
 *   - startExam() stamps `no_human_mode=1`, `evaluation_mode`, and
 *     `evaluation_provider` on the exam_mock_attempts row, and assigns all
 *     start-phase agents automatically (no human approval required for the
 *     basic flow).
 *   - submitExam() runs scoring → feedback → report automatically, stamps
 *     `agent_confidence_score`, `human_review_required` (0 unless confidence
 *     is low), `human_review_optional=1` (always available, never blocking),
 *     and `final_report_status='auto_generated'`.
 *   - The student is NEVER blocked from seeing their Smart Score Report.
 *     ALO Academic Team Review remains OPTIONAL on request.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class ExamConductorService
{
    /** Agents that participate in the START phase. */
    public const START_AGENTS = [
        'AGENT-INTAKE-01',
        'AGENT-ELIGIBILITY-01',
        'AGENT-SETUP-01',
        'AGENT-PROCTOR-01',
    ];

    /** Agents that participate in the SUBMIT phase. */
    public const SUBMIT_AGENTS = [
        'AGENT-SCORING-01',
        'AGENT-FEEDBACK-01',
        'AGENT-REPORT-01',
        'AGENT-CRM-01',
    ];

    /** Allowed evaluation providers (mirrors .env.example). */
    public const ALLOWED_PROVIDERS = [
        'local_rule_engine',
        'local_llm_optional',
        'external_ai_optional',
    ];

    /**
     * Begin a new exam attempt.
     *
     * Flow:
     *   1. Verify the student profile exists.
     *   2. Run the intake + eligibility agents (write their task rows + logs).
     *      The eligibility agent delegates to QuotaService to enforce the
     *      free-quota rule (3 ALO / 1 public / 2 partner / 2 ambassador).
     *   3. Run the setup agent (validates the practice set + sections).
     *   4. Call TestEngineService::startAttempt() to actually create the
     *      exam_mock_attempts row.
     *   5. Stamp no-human-mode columns on the attempt row
     *      (no_human_mode=1, evaluation_mode, evaluation_provider).
     *   6. Assign the proctor agent and log proctor start.
     *
     * In no-human mode, all START-phase agents are assigned automatically —
     * no human approval is required for the basic intake → proctor flow.
     *
     * @return array{
     *   attempt_id:int, attempt_code:string, exam_type:string,
     *   no_human_mode:bool, evaluation_mode:string, evaluation_provider:string,
     *   assigned_agents:array<int,array{code:string,label:string}>
     * }
     * @throws RuntimeException on quota/permission/setup failure.
     */
    public static function startExam(int $studentId, int $practiceSetId, string $examType = ''): array
    {
        // 1. Student must exist.
        $student = Database::one(
            'SELECT s.id, s.user_id, s.alo_student_id, s.is_partner, s.ambassador_id,
                    u.email, u.full_name
               FROM exam_students s
            JOIN exam_users u ON u.id = s.user_id
              WHERE s.id = :sid LIMIT 1',
            ['sid' => $studentId]
        );
        if ($student === null) {
            throw new RuntimeException('Student record not found.');
        }
        $userId = (int) $student['user_id'];

        // 2. Intake agent — registers student intent (lightweight task row).
        $intakeAgent = AiAgentEmployeeService::getAgent('AGENT-INTAKE-01');
        if ($intakeAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $intakeAgent['id'],
                'student_intake',
                null,
                [
                    'student_id'     => $studentId,
                    'alo_student_id' => $student['alo_student_id'] ?? null,
                    'is_partner'     => (int) ($student['is_partner'] ?? 0),
                    'ambassador_id'  => $student['ambassador_id'] ?? null,
                ]
            );
        }

        // 3. Eligibility agent — enforces free quota (delegates to QuotaService).
        $quota = QuotaService::checkFreeQuota($studentId);
        $eligibilityAgent = AiAgentEmployeeService::getAgent('AGENT-ELIGIBILITY-01');
        if ($eligibilityAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $eligibilityAgent['id'],
                'eligibility_check',
                null,
                [
                    'student_id'     => $studentId,
                    'quota_type'     => $quota['quota_type'] ?? 'public',
                    'remaining'      => $quota['remaining'] ?? 0,
                    'alo_verified'   => $quota['alo_verified'] ?? false,
                    'allowed'        => $quota['allowed'] ?? false,
                ]
            );
        }
        if (!$quota['allowed']) {
            // Voucher / paid attempts bypass quota inside TestEngineService;
            // for free attempts, block hard here.
            throw new RuntimeException($quota['reason'] ?? 'Free quota exhausted.');
        }

        // 4. Setup agent — validates the practice set exists + is published.
        $set = Database::one(
            'SELECT ps.id, ps.title, ps.exam_type_id, ps.total_questions,
                    ps.total_duration_minutes, et.type_code
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id = ps.exam_type_id
              WHERE ps.id = :id AND ps.is_published = 1
              LIMIT 1',
            ['id' => $practiceSetId]
        );
        if ($set === null) {
            throw new RuntimeException('Practice set not available.');
        }
        $setupAgent = AiAgentEmployeeService::getAgent('AGENT-SETUP-01');
        if ($setupAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $setupAgent['id'],
                'exam_setup',
                null,
                [
                    'student_id'        => $studentId,
                    'practice_set_id'   => $practiceSetId,
                    'exam_type'         => $set['type_code'],
                    'total_questions'   => (int) $set['total_questions'],
                    'duration_minutes'  => (int) $set['total_duration_minutes'],
                ]
            );
        }

        // 5. Create the attempt via TestEngineService (which enforces quota
        //    a SECOND time, in case the quota row changed between check + start).
        $attempt = TestEngineService::startAttempt($studentId, $practiceSetId);
        $attemptId = (int) $attempt['attempt_id'];

        // 6. Stamp no-human-mode columns on the attempt row.
        //    In no-human mode, evaluation_mode + evaluation_provider are read
        //    from env and persisted on the attempt for downstream audit.
        [$evalMode, $evalProvider] = self::resolveNoHumanConfig();
        self::stampAttemptNoHumanStart($attemptId, $evalMode, $evalProvider);

        // 7. Proctor agent — start monitoring the attempt.
        $proctorAgent = AiAgentEmployeeService::getAgent('AGENT-PROCTOR-01');
        if ($proctorAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $proctorAgent['id'],
                'proctor_monitoring',
                $attemptId,
                [
                    'monitoring' => ['tab_switch', 'pause', 'resume', 'refresh', 'window_blur'],
                    'started_at' => date('Y-m-d H:i:s'),
                ]
            );
            DigitalProctorService::logEvent($attemptId, 'proctor_start', [
                'student_id' => $studentId,
                'agent_code' => $proctorAgent['agent_code'],
            ]);
        }

        AuditService::log($userId, 'exam_conductor.start', 'attempt', $attemptId, [
            'student_id'        => $studentId,
            'practice_set_id'   => $practiceSetId,
            'exam_type'         => $set['type_code'],
            'assigned_agents'   => self::START_AGENTS,
            'no_human_mode'     => true,
            'evaluation_mode'   => $evalMode,
            'evaluation_provider' => $evalProvider,
        ]);

        return [
            'attempt_id'      => $attemptId,
            'attempt_code'    => $attempt['attempt_code'],
            'exam_type'       => (string) $set['type_code'],
            'no_human_mode'   => true,
            'evaluation_mode' => $evalMode,
            'evaluation_provider' => $evalProvider,
            'assigned_agents' => self::publicLabelsFor(self::START_AGENTS),
        ];
    }

    /**
     * Submit an attempt and trigger the post-attempt agent pipeline.
     *
     * Flow (no-human mode — fully automatic, never blocks the student):
     *   1. Submit + score via TestEngineService (objective answers scored,
     *      writing/speaking evaluations queued via the rule engine, quota
     *      consumed).
     *   2. Scoring agent — finalises estimated score + scale mapping.
     *   3. Feedback agent — generates strengths / weaknesses / study plan.
     *   4. Report agent — generates Smart Score Report payload (PDF async).
     *   5. CRM agent — pushes the result to CRM (queued for retry on failure).
     *   6. Stamp the attempt with agent_confidence_score,
     *      human_review_required=0 (unless confidence is low),
     *      human_review_optional=1 (always), final_report_status='auto_generated'.
     *
     * The student is ALWAYS able to view their report. ALO Academic Team
     * Review remains OPTIONAL on request — never a blocking step.
     *
     * @return array{
     *   attempt_id:int, percent:float, score_id:int,
     *   agent_confidence_score:float, human_review_required:bool,
     *   human_review_optional:bool, final_report_status:string,
     *   assigned_agents:array<int,array{code:string,label:string}>
     * }
     */
    public static function submitExam(int $attemptId): array
    {
        $attempt = Database::one(
            'SELECT a.id, a.student_id, a.attempt_code, et.type_code, et.score_scale
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
              WHERE a.id = :id LIMIT 1',
            ['id' => $attemptId]
        );
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found.');
        }
        $studentId = (int) $attempt['student_id'];
        $student = Database::one('SELECT user_id FROM exam_students WHERE id = :sid', ['sid' => $studentId]);
        $userId = $student === null ? null : (int) $student['user_id'];

        // 1. Core submit (scores objective answers, consumes quota).
        $result = TestEngineService::submitAttempt($attemptId, $userId ?? 0);

        // 2. Scoring agent.
        $scoringAgent = AiAgentEmployeeService::getAgent('AGENT-SCORING-01');
        $scoreRow = null;
        if ($scoringAgent !== null) {
            $scoreRow = Database::one(
                'SELECT id, percent, band_score, scaled_score, cefr_level
                   FROM exam_scores WHERE attempt_id = :aid ORDER BY id DESC LIMIT 1',
                ['aid' => $attemptId]
            );
            $mapped = SmartScoreReportService::mapScoreByExam(
                (string) $attempt['type_code'],
                (float) ($scoreRow['percent'] ?? 0.0)
            );
            $taskPayload = [
                'attempt_id'   => $attemptId,
                'exam_type'    => $attempt['type_code'],
                'percent'      => (float) ($scoreRow['percent'] ?? 0),
                'mapped'       => $mapped,
                'is_estimated' => true,
                'disclaimer'   => SmartScoreReportService::getDisclaimer(),
            ];
            $taskId = AiAgentEmployeeService::createTask(
                (int) $scoringAgent['id'],
                'scoring_calculation',
                $attemptId,
                $taskPayload
            );
            AiAgentEmployeeService::completeTask($taskId, $taskPayload);
        }

        // 3. Feedback agent.
        $feedbackAgent = AiAgentEmployeeService::getAgent('AGENT-FEEDBACK-01');
        if ($feedbackAgent !== null) {
            AiAgentEmployeeService::createTask(
                (int) $feedbackAgent['id'],
                'feedback_generation',
                $attemptId,
                [
                    'attempt_id' => $attemptId,
                    'student_id' => $studentId,
                    'focus'      => ['writing', 'speaking', 'reading', 'listening'],
                ]
            );
        }

        // 4. Report agent — always generate (no-human mode never blocks).
        $reportAgent = AiAgentEmployeeService::getAgent('AGENT-REPORT-01');
        if ($reportAgent !== null) {
            $report = SmartScoreReportService::generate($attemptId);
            AiAgentEmployeeService::createTask(
                (int) $reportAgent['id'],
                'report_generation',
                $attemptId,
                [
                    'report'              => $report,
                    'sync_to_crm'         => true,
                    'include_disclaimer'  => true,
                    'no_human_mode'       => true,
                ]
            );
        }

        // 5. CRM agent — push result (best-effort, never blocks submit).
        $crmAgent = AiAgentEmployeeService::getAgent('AGENT-CRM-01');
        if ($crmAgent !== null) {
            try {
                CRMIntegrationService::pushResult($attemptId);
            } catch (\Throwable $e) {
                // CRM failures are logged separately by CRMIntegrationService.
            }
            AiAgentEmployeeService::createTask(
                (int) $crmAgent['id'],
                'crm_sync',
                $attemptId,
                [
                    'entity_type' => 'attempt',
                    'entity_id'   => $attemptId,
                    'endpoint'    => '/api/v1/attempts',
                ]
            );
        }

        // 6. Compute agent_confidence_score from rule-based task rows
        //    (writing + speaking + scoring confidence). Falls back to a
        //    percent-derived score if no agent rows exist.
        $agentConfidence = self::computeAttemptConfidence(
            $attemptId,
            (float) ($scoreRow['percent'] ?? 0.0)
        );

        // 7. Determine review flags based on confidence:
        //    - human_review_required: 0 unless confidence is low
        //      (NEVER blocks the student — it's a recommendation flag only).
        //    - human_review_optional: 1 always (ALO Academic Team Review
        //      available on request).
        //    - final_report_status: 'auto_generated' (the report is
        //      released to the student immediately).
        $reviewLevel  = self::confidenceLevelFromScore($agentConfidence);
        $reviewRequired = $reviewLevel === 'low' ? 1 : 0;

        self::stampAttemptNoHumanSubmit(
            $attemptId,
            $agentConfidence,
            $reviewRequired,
            1, // optional, always
            'auto_generated'
        );

        // 8. Persist the review recommendation on exam_scores (new column).
        $reviewRecommendation = match ($reviewLevel) {
            'high'   => 'none',
            'medium' => 'optional',
            default  => 'recommended',
        };
        if ($scoreRow !== null) {
            self::stampScoreNoHuman((int) $scoreRow['id'], $reviewRecommendation, $agentConfidence);
        }

        AuditService::log($userId, 'exam_conductor.submit', 'attempt', $attemptId, [
            'student_id'             => $studentId,
            'percent'                => $result['percent'] ?? null,
            'assigned_agents'        => self::SUBMIT_AGENTS,
            'agent_confidence_score' => $agentConfidence,
            'human_review_required'  => (bool) $reviewRequired,
            'human_review_optional'  => true,
            'final_report_status'    => 'auto_generated',
            'review_recommendation'  => $reviewRecommendation,
        ]);

        return [
            'attempt_id'             => $attemptId,
            'percent'                => (float) ($result['percent'] ?? 0.0),
            'score_id'               => (int) ($result['score_id'] ?? 0),
            'agent_confidence_score' => $agentConfidence,
            'human_review_required'  => (bool) $reviewRequired,
            'human_review_optional'  => true,
            'final_report_status'    => 'auto_generated',
            'review_recommendation'  => $reviewRecommendation,
            'assigned_agents'        => self::publicLabelsFor(self::SUBMIT_AGENTS),
        ];
    }

    /** All agent rows assigned to an attempt (via task rows). */
    public static function getAttemptAgents(int $attemptId): array
    {
        $rows = Database::all(
            'SELECT DISTINCT a.id, a.agent_code, a.public_label, a.internal_label,
                    a.department, a.responsibility
               FROM exam_ai_agents a
               JOIN exam_ai_agent_tasks t ON t.agent_id = a.id
              WHERE t.attempt_id = :aid
              ORDER BY a.id ASC',
            ['aid' => $attemptId]
        );
        return $rows;
    }

    /** Resume an in-progress attempt — re-verifies proctor + integrity. */
    public static function resumeExam(int $attemptId): array
    {
        $attempt = TestEngineService::resumeAttempt($attemptId);
        DigitalProctorService::logEvent($attemptId, 'resume', [
            'student_id' => (int) $attempt['student_id'],
        ]);
        return [
            'attempt_id'      => $attemptId,
            'attempt_code'    => $attempt['attempt_code'],
            'expires_at'      => $attempt['expires_at'],
            'assigned_agents' => self::publicLabelsFor(self::START_AGENTS),
        ];
    }

    // ---------- No-Human mode helpers ----------

    /**
     * Resolve evaluation_mode + evaluation_provider from env (with sane
     * defaults). Returns [mode, provider].
     *
     * @return array{0:string,1:string}
     */
    private static function resolveNoHumanConfig(): array
    {
        $mode = strtolower((string) (getenv('EVALUATION_MODE') ?: 'automated'));
        if (!in_array($mode, ['automated', 'human_assisted'], true)) {
            $mode = 'automated';
        }
        $provider = strtolower((string) (getenv('EVALUATION_PROVIDER') ?: 'local_rule_engine'));
        if (!in_array($provider, self::ALLOWED_PROVIDERS, true)) {
            $provider = 'local_rule_engine';
        }
        return [$mode, $provider];
    }

    /**
     * Stamp the no-human-mode START columns on an attempt row. The columns
     * are added by no_human_mode_addon.sql. Wrapped in try/catch so a
     * legacy (pre-addon) install does not break the start flow.
     */
    private static function stampAttemptNoHumanStart(int $attemptId, string $evalMode, string $evalProvider): void
    {
        try {
            Database::update('exam_mock_attempts', [
                'no_human_mode'       => 1,
                'evaluation_mode'     => $evalMode,
                'evaluation_provider' => $evalProvider,
                'human_review_required' => 0,
                'human_review_optional' => 1,
                'final_report_status'   => 'pending',
                'updated_at'          => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $attemptId]);
        } catch (\Throwable $e) {
            @error_log('[conductor.start] stamp no-human cols failed: ' . $e->getMessage());
        }
    }

    /**
     * Stamp the no-human-mode SUBMIT columns on an attempt row.
     */
    private static function stampAttemptNoHumanSubmit(
        int $attemptId,
        float $agentConfidence,
        int $reviewRequired,
        int $reviewOptional,
        string $finalReportStatus
    ): void {
        try {
            Database::update('exam_mock_attempts', [
                'agent_confidence_score' => number_format($agentConfidence, 2, '.', ''),
                'human_review_required'  => $reviewRequired,
                'human_review_optional'  => $reviewOptional,
                'final_report_status'    => $finalReportStatus,
                'updated_at'             => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $attemptId]);
        } catch (\Throwable $e) {
            @error_log('[conductor.submit] stamp no-human cols failed: ' . $e->getMessage());
        }
    }

    /**
     * Stamp the no-human-mode columns on the exam_scores row.
     */
    private static function stampScoreNoHuman(int $scoreId, string $reviewRecommendation, float $agentConfidence): void
    {
        try {
            Database::update('exam_scores', [
                'scoring_provider'      => (string) (getenv('EVALUATION_PROVIDER') ?: 'local_rule_engine'),
                'scoring_confidence'    => number_format($agentConfidence, 2, '.', ''),
                'review_recommendation' => $reviewRecommendation,
                'updated_at'            => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $scoreId]);
        } catch (\Throwable $e) {
            @error_log('[conductor.submit] stamp score no-human cols failed: ' . $e->getMessage());
        }
    }

    /**
     * Compute the attempt-level agent confidence score (0.00–1.00) from
     * the confidence_score values stamped on the attempt's agent task rows
     * (writing, speaking, interview). Falls back to a percent-derived
     * score when no task rows exist (e.g. multiple-choice only attempts).
     */
    private static function computeAttemptConfidence(int $attemptId, float $percent): float
    {
        $row = null;
        try {
            $row = Database::one(
                'SELECT AVG(NULLIF(confidence_score, 0)) AS avg_conf, COUNT(*) AS n
                   FROM exam_ai_agent_tasks
                  WHERE attempt_id = :aid
                    AND confidence_score IS NOT NULL',
                ['aid' => $attemptId]
            );
        } catch (\Throwable $e) {
            @error_log('[conductor.submit] confidence lookup failed: ' . $e->getMessage());
        }
        $avg = $row === null ? null : $row['avg_conf'];
        if ($avg !== null && $avg !== '' && (float) $avg > 0) {
            return round(max(0.0, min(1.0, (float) $avg)), 2);
        }
        // Fallback: derive from percent / 100.
        $pctScore = max(0.0, min(100.0, $percent)) / 100.0;
        return round($pctScore, 2);
    }

    private static function confidenceLevelFromScore(float $score): string
    {
        $low = (float) (getenv('LOW_CONFIDENCE_THRESHOLD') ?: '0.60');
        $med = (float) (getenv('MEDIUM_CONFIDENCE_THRESHOLD') ?: '0.80');
        if ($score >= $med) {
            return 'high';
        }
        if ($score >= $low) {
            return 'medium';
        }
        return 'low';
    }

    // ---------- Helpers ----------

    /**
     * Return [code, label] pairs for a set of agent codes, using the
     * `public_label` column (never internal_label). The public_label is the
     * only string that ever reaches student-facing UI.
     *
     * @param string[] $codes
     * @return array<int,array{code:string,label:string}>
     */
    private static function publicLabelsFor(array $codes): array
    {
        $out = [];
        foreach ($codes as $code) {
            $agent = AiAgentEmployeeService::getAgent($code);
            if ($agent === null) {
                continue;
            }
            $out[] = [
                'code'  => (string) $agent['agent_code'],
                'label' => (string) $agent['public_label'],
            ];
        }
        return $out;
    }
}
