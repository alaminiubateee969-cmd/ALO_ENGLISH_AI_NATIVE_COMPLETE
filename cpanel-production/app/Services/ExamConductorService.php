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
     *   5. Assign the proctor agent and log proctor start.
     *
     * @return array{
     *   attempt_id:int, attempt_code:string, exam_type:string,
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

        // 6. Proctor agent — start monitoring the attempt.
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
            'student_id'      => $studentId,
            'practice_set_id' => $practiceSetId,
            'exam_type'       => $set['type_code'],
            'assigned_agents' => self::START_AGENTS,
        ]);

        return [
            'attempt_id'   => $attemptId,
            'attempt_code' => $attempt['attempt_code'],
            'exam_type'    => (string) $set['type_code'],
            'assigned_agents' => self::publicLabelsFor(self::START_AGENTS),
        ];
    }

    /**
     * Submit an attempt and trigger the post-attempt agent pipeline.
     *
     * Flow:
     *   1. Submit + score via TestEngineService (objective answers scored,
     *      writing/speaking marked pending examiner, quota consumed).
     *   2. Scoring agent — finalises estimated score + scale mapping.
     *   3. Feedback agent — generates strengths / weaknesses / study plan.
     *   4. Report agent — generates Smart Score Report payload (PDF async).
     *   5. CRM agent — pushes the result to CRM (queued for retry on failure).
     *
     * @return array{
     *   attempt_id:int, percent:float, score_id:int,
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
        if ($scoringAgent !== null) {
            $score = Database::one(
                'SELECT percent, band_score, scaled_score, cefr_level
                   FROM exam_scores WHERE attempt_id = :aid ORDER BY id DESC LIMIT 1',
                ['aid' => $attemptId]
            );
            $mapped = SmartScoreReportService::mapScoreByExam(
                (string) $attempt['type_code'],
                (float) ($score['percent'] ?? 0.0)
            );
            $taskPayload = [
                'attempt_id'  => $attemptId,
                'exam_type'   => $attempt['type_code'],
                'percent'     => (float) ($score['percent'] ?? 0),
                'mapped'      => $mapped,
                'is_estimated' => true,
                'disclaimer'  => SmartScoreReportService::getDisclaimer(),
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

        // 4. Report agent.
        $reportAgent = AiAgentEmployeeService::getAgent('AGENT-REPORT-01');
        if ($reportAgent !== null) {
            $report = SmartScoreReportService::generate($attemptId);
            AiAgentEmployeeService::createTask(
                (int) $reportAgent['id'],
                'report_generation',
                $attemptId,
                [
                    'report'        => $report,
                    'sync_to_crm'   => true,
                    'include_disclaimer' => true,
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

        AuditService::log($userId, 'exam_conductor.submit', 'attempt', $attemptId, [
            'student_id'      => $studentId,
            'percent'         => $result['percent'] ?? null,
            'assigned_agents' => self::SUBMIT_AGENTS,
        ]);

        return [
            'attempt_id'      => $attemptId,
            'percent'         => (float) ($result['percent'] ?? 0.0),
            'score_id'        => (int) ($result['score_id'] ?? 0),
            'assigned_agents' => self::publicLabelsFor(self::SUBMIT_AGENTS),
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
