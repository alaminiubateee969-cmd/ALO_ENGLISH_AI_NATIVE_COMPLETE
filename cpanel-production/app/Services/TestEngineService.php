<?php
/**
 * app/Services/TestEngineService.php — Mock attempt lifecycle.
 *
 *   startAttempt(studentId, practiceSetId)  — checks quota, creates
 *       exam_mock_attempts + exam_attempt_sections, loads questions.
 *   saveAnswer(attemptId, questionId, answer) — upsert into exam_answers.
 *   submitAttempt(attemptId) — scores, generates exam_scores + breakdown,
 *       consumes quota, sends to CRM, marks attempt 'submitted'.
 *   resumeAttempt(attemptId) — re-opens if not expired.
 *   autoSubmitIfExpired() — cron-friendly sweep.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use RuntimeException;

final class TestEngineService
{
    public const ATTEMPT_STATUS_IN_PROGRESS = 'in_progress';
    public const ATTEMPT_STATUS_SUBMITTED   = 'submitted';
    public const ATTEMPT_STATUS_SCORED      = 'scored';
    public const ATTEMPT_STATUS_EXPIRED     = 'expired';
    public const ATTEMPT_STATUS_ABANDONED   = 'abandoned';

    /**
     * Begin a new mock attempt.
     *
     * @return array{attempt_id:int, attempt_code:string, sections:array}
     * @throws RuntimeException on quota/permission failure.
     */
    public static function startAttempt(int $studentId, int $practiceSetId, ?int $voucherId = null, ?int $paymentId = null): array
    {
        // 1. Load practice set + exam_type
        $set = Database::one(
            'SELECT ps.*, et.type_code, et.duration_minutes, et.score_scale, et.category_id
               FROM exam_practice_sets ps
               JOIN exam_types et ON et.id = ps.exam_type_id
              WHERE ps.id = :id AND ps.is_published = 1
              LIMIT 1',
            ['id' => $practiceSetId]
        );
        if ($set === null) {
            throw new RuntimeException('Practice set not available.');
        }

        // 2. Quota check (unless voucher or payment covers this attempt)
        if ($voucherId === null && $paymentId === null) {
            $quota = QuotaService::checkFreeQuota($studentId);
            if (!$quota['allowed']) {
                throw new RuntimeException($quota['reason'] ?? 'Quota exhausted.');
            }
        }

        $student = Database::one('SELECT user_id FROM exam_students WHERE id = :sid LIMIT 1', ['sid' => $studentId]);
        if ($student === null) {
            throw new RuntimeException('Student not found.');
        }

        $userId = (int) $student['user_id'];

        // 3. Create attempt inside a transaction.
        return Database::transactional(function () use ($studentId, $userId, $set, $voucherId, $paymentId): array {
            $code = self::generateAttemptCode((string) $set['type_code']);
            $totalDuration = (int) $set['total_duration_minutes'];
            $now = date('Y-m-d H:i:s');

            $attemptId = Database::insert('exam_mock_attempts', [
                'attempt_code'      => $code,
                'student_id'        => $studentId,
                'exam_type_id'      => $set['exam_type_id'],
                'practice_set_id'   => $set['id'],
                'voucher_id'        => $voucherId,
                'payment_id'        => $paymentId,
                'status'            => self::ATTEMPT_STATUS_IN_PROGRESS,
                'started_at'        => $now,
                'expires_at'        => date('Y-m-d H:i:s', time() + $totalDuration * 60),
                'total_questions'   => (int) $set['total_questions'],
                'total_duration_minutes' => $totalDuration,
                'ip_address'        => $_SERVER['REMOTE_ADDR'] ?? '',
                'user_agent'        => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
                'created_at'        => $now,
            ]);

            // 4. Create per-section rows.
            $sections = Database::all(
                'SELECT pss.*, s.section_code, s.section_name, s.duration_minutes
                   FROM exam_practice_set_sections pss
                   JOIN exam_sections s ON s.id = pss.section_id
                  WHERE pss.practice_set_id = :psid
                  ORDER BY pss.order_index',
                ['psid' => $set['id']]
            );
            foreach ($sections as $idx => $s) {
                Database::insert('exam_attempt_sections', [
                    'attempt_id'    => $attemptId,
                    'section_id'    => $s['section_id'],
                    'order_index'   => $idx,
                    'duration_seconds' => ((int) $s['duration_minutes']) * 60,
                    'status'        => 'in_progress',
                    'created_at'    => $now,
                ]);
            }

            AuditService::log($userId, AuditService::ACTION_ATTEMPT_START, 'attempt', $attemptId, [
                'practice_set_id' => $set['id'],
                'exam_type'       => $set['type_code'],
                'voucher_id'      => $voucherId,
                'payment_id'      => $paymentId,
            ]);

            return [
                'attempt_id'   => $attemptId,
                'attempt_code' => $code,
                'sections'     => $sections,
            ];
        });
    }

    /**
     * Upsert an answer during the attempt.
     */
    public static function saveAnswer(int $attemptId, int $questionId, mixed $answer, ?float $timeSpent = null): void
    {
        $attempt = self::loadAttempt($attemptId);
        if ($attempt === null || $attempt['status'] !== self::ATTEMPT_STATUS_IN_PROGRESS) {
            throw new RuntimeException('Attempt not active.');
        }
        if (strtotime((string) $attempt['expires_at']) < time()) {
            throw new RuntimeException('Attempt expired.');
        }

        $json = is_scalar($answer) ? (string) $answer : json_encode($answer, JSON_UNESCAPED_UNICODE);
        $now = date('Y-m-d H:i:s');

        $existing = Database::one(
            'SELECT id FROM exam_answers WHERE attempt_id = :a AND question_id = :q LIMIT 1',
            ['a' => $attemptId, 'q' => $questionId]
        );
        if ($existing !== null) {
            Database::update('exam_answers', [
                'answer_json' => $json,
                'time_spent_seconds' => $timeSpent,
                'updated_at' => $now,
                'is_flagged' => 0,
            ], 'id = :id', ['id' => $existing['id']]);
        } else {
            Database::insert('exam_answers', [
                'attempt_id'  => $attemptId,
                'question_id' => $questionId,
                'answer_json' => $json,
                'time_spent_seconds' => $timeSpent,
                'created_at'  => $now,
                'updated_at'  => $now,
                'is_flagged'  => 0,
            ]);
        }

        AuditService::log((int) $attempt['student_id'], AuditService::ACTION_ATTEMPT_SAVE, 'attempt', $attemptId, [
            'question_id' => $questionId,
        ]);
    }

    /**
     * Submit + score an attempt. Consumes quota (or voucher) inside a txn.
     */
    public static function submitAttempt(int $attemptId, int $actorUserId): array
    {
        return Database::transactional(function () use ($attemptId, $actorUserId): array {
            $attempt = self::loadAttemptForUpdate($attemptId);
            if ($attempt === null) {
                throw new RuntimeException('Attempt not found.');
            }
            if ($attempt['status'] === self::ATTEMPT_STATUS_SUBMITTED
                || $attempt['status'] === self::ATTEMPT_STATUS_SCORED) {
                throw new RuntimeException('Attempt already submitted.');
            }

            // Load answers + correct keys for objective scoring.
            $answers = Database::all(
                'SELECT a.id, a.question_id, a.answer_json, q.question_type, q.correct_answer,
                        q.correct_option_id, q.max_points, q.explanation, q.skill_tag
                   FROM exam_answers a
                   JOIN exam_questions q ON q.id = a.question_id
                  WHERE a.attempt_id = :aid',
                ['aid' => $attemptId]
            );

            $rawMax = 0.0; $rawScore = 0.0;
            $pendingExaminer = false;
            foreach ($answers as $a) {
                $userAnswer = json_decode((string) $a['answer_json'], true) ?? $a['answer_json'];
                $result = ScoringService::scoreAnswer($a, $userAnswer);
                $rawMax += $result['max'];
                $rawScore += $result['awarded'];
                Database::update('exam_answers', [
                    'points_awarded' => $result['awarded'],
                    'is_correct'     => $result['correct'] ? 1 : 0,
                ], 'id = :id', ['id' => $a['id']]);
                if (str_contains((string) $a['explanation'] ?? '', 'Pending examiner')) {
                    $pendingExaminer = true;
                }
            }

            $percent = $rawMax > 0 ? round(100 * $rawScore / $rawMax, 2) : 0.0;
            $scoreScale = (string) ($attempt['score_scale'] ?? 'percent');
            $agg = ScoringService::aggregate($answers, $scoreScale, []);

            // Consume quota / voucher
            if (!empty($attempt['voucher_id'])) {
                VoucherService::consume((string) $attempt['voucher_code'], $attemptId, $actorUserId);
            } else {
                QuotaService::consumeFreeQuota((int) $attempt['student_id'], $attemptId);
            }

            // Mark attempt submitted
            $now = date('Y-m-d H:i:s');
            Database::update('exam_mock_attempts', [
                'status'        => $pendingExaminer ? self::ATTEMPT_STATUS_SUBMITTED : self::ATTEMPT_STATUS_SCORED,
                'submitted_at'  => $now,
                'time_spent_seconds' => max(0, time() - strtotime((string) $attempt['started_at'])),
            ], 'id = :id', ['id' => $attemptId]);

            // Insert score row + breakdown
            $scoreId = Database::insert('exam_scores', [
                'attempt_id'    => $attemptId,
                'raw_score'     => $rawScore,
                'raw_max'       => $rawMax,
                'percent'       => $percent,
                'scaled_score'  => $agg['scaled'],
                'band_score'    => $agg['band'],
                'cefr_level'    => $agg['cefr'],
                'is_final'      => $pendingExaminer ? 0 : 1,
                'created_at'    => $now,
            ]);

            foreach ($agg['by_skill'] as $skill => $row) {
                Database::insert('exam_score_breakdown', [
                    'score_id'   => $scoreId,
                    'skill_tag'  => (string) $skill,
                    'raw_score'  => $row['score'],
                    'raw_max'    => $row['max'],
                    'percent'    => $row['max'] > 0 ? round(100 * $row['score'] / $row['max'], 2) : 0,
                ]);
            }

            AuditService::log($actorUserId, AuditService::ACTION_ATTEMPT_SUBMIT, 'attempt', $attemptId, [
                'percent'    => $percent,
                'cefr'       => $agg['cefr'],
                'pending_examiner' => $pendingExaminer,
            ]);

            // Queue CRM push
            CRMIntegrationService::pushResult($attemptId);

            return ['attempt_id' => $attemptId, 'score_id' => $scoreId, 'percent' => $percent];
        });
    }

    public static function resumeAttempt(int $attemptId): array
    {
        $attempt = self::loadAttempt($attemptId);
        if ($attempt === null) {
            throw new RuntimeException('Attempt not found.');
        }
        if ($attempt['status'] !== self::ATTEMPT_STATUS_IN_PROGRESS) {
            throw new RuntimeException('Attempt not resumable.');
        }
        if (strtotime((string) $attempt['expires_at']) < time()) {
            throw new RuntimeException('Attempt expired.');
        }
        return $attempt;
    }

    /**
     * Cron-friendly: auto-submit any attempt past its expires_at.
     */
    public static function autoSubmitIfExpired(): int
    {
        $expired = Database::all(
            'SELECT id, student_id FROM exam_mock_attempts
              WHERE status = :s
                AND expires_at < NOW()
              LIMIT 100',
            ['s' => self::ATTEMPT_STATUS_IN_PROGRESS]
        );
        $count = 0;
        foreach ($expired as $a) {
            try {
                self::submitAttempt((int) $a['id'], (int) $a['student_id']);
                AuditService::log((int) $a['student_id'], AuditService::ACTION_ATTEMPT_AUTOSUBMIT, 'attempt', $a['id']);
                $count++;
            } catch (\Throwable $e) {
                @error_log('[auto-submit] failed for attempt ' . $a['id'] . ': ' . $e->getMessage());
            }
        }
        return $count;
    }

    // ---------- helpers ----------

    private static function loadAttempt(int $attemptId): ?array
    {
        return Database::one('SELECT * FROM exam_mock_attempts WHERE id = :id LIMIT 1', ['id' => $attemptId]);
    }

    private static function loadAttemptForUpdate(int $attemptId): ?array
    {
        return Database::one(
            'SELECT a.*, et.score_scale, v.voucher_code
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
               LEFT JOIN exam_vouchers v ON v.id = a.voucher_id
              WHERE a.id = :id
              FOR UPDATE',
            ['id' => $attemptId]
        );
    }

    private static function generateAttemptCode(string $examCode): string
    {
        return strtoupper($examCode) . '-' . date('Ymd') . '-' . strtoupper(substr(sodium_bin2hex(random_bytes(4)), 0, 8));
    }
}
