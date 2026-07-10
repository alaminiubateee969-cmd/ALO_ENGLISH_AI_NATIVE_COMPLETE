<?php
/**
 * app/Services/SmartScoreReportService.php — Smart Score Report generator.
 *
 * Builds the structured Smart Score Report for a completed attempt:
 *   - student, exam, date
 *   - overall estimated score (mapped per exam scale)
 *   - per-module scores (listening / reading / writing / speaking, etc.)
 *   - correct / incorrect / unanswered counts
 *   - time used
 *   - strengths & weaknesses (rule-based, from skill breakdown)
 *   - study plan (next steps)
 *   - next recommendation (counseling CTA when weak)
 *   - counseling CTA
 *   - disclaimer (always present)
 *   - crm_sync_status (pending / synced / failed)
 *
 * mapScoreByExam handles all 32 exam types: IELTS band 0–9, PTE 10–90,
 * TOEFL 0–120, Duolingo 10–160, SAT range, GRE V/Q, GMAT, OET grade,
 * Placement A1–C2, plus the remaining English proficiency, study-abroad,
 * university-internal, visa, and ALO-internal exams.
 *
 * Public-facing label: "Smart Score Report" — never "AI report".
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class SmartScoreReportService
{
    /** The canonical practice-only disclosure text. */
    public const DISCLOSURE_TEXT = 'Some practice tests, scoring, feedback, and interview simulations '
        . 'may be supported by automated digital evaluation tools. '
        . 'This is a practice platform only, not an official exam result.';

    /** The canonical practice-only disclaimer appended to every report. */
    public const DISCLAIMER_TEXT = 'Practice exam only. Estimated score only. '
        . 'Not an official exam result. No guarantee that questions will appear in real exam.';

    /**
     * Generate the Smart Score Report for an attempt.
     *
     * @return array{
     *   attempt_id:int, student:array, exam:array, generated_at:string,
     *   overall_score:array, module_scores:array,
     *   counts:array{correct:int,incorrect:int,unanswered:int},
     *   time_used_seconds:int, strengths:array<int,string>,
     *   weaknesses:array<int,string>, study_plan:array<int,string>,
     *   next_recommendation:string, counseling_cta:bool,
     *   disclaimer:string, crm_sync_status:string
     * }
     */
    public static function generate(int $attemptId): array
    {
        $attempt = Database::one(
            'SELECT a.id, a.attempt_code, a.student_id, a.exam_type_id, a.practice_set_id,
                    a.status, a.started_at, a.submitted_at, a.time_spent_seconds,
                    a.total_questions, et.type_code, et.type_name, et.score_scale
               FROM exam_mock_attempts a
               LEFT JOIN exam_types et ON et.id = a.exam_type_id
              WHERE a.id = :id LIMIT 1',
            ['id' => $attemptId]
        );
        if ($attempt === null) {
            return self::emptyReport($attemptId);
        }

        $student = Database::one(
            'SELECT s.id, s.alo_student_id, u.full_name, u.email
               FROM exam_students s
               JOIN exam_users u ON u.id = s.user_id
              WHERE s.id = :sid LIMIT 1',
            ['sid' => (int) $attempt['student_id']]
        ) ?? [];

        $score = Database::one(
            'SELECT id, raw_score, raw_max, percent, scaled_score, band_score, cefr_level
               FROM exam_scores
              WHERE attempt_id = :aid
              ORDER BY id DESC LIMIT 1',
            ['aid' => $attemptId]
        );

        $breakdownRows = $score === null
            ? []
            : Database::all(
                'SELECT skill_tag, raw_score, raw_max, percent
                   FROM exam_score_breakdown
                  WHERE score_id = :sid',
                ['sid' => (int) $score['id']]
              );

        $answerCounts = self::countAnswers($attemptId);
        $percent = (float) ($score['percent'] ?? 0.0);
        $examType = (string) $attempt['type_code'];
        $mapped = self::mapScoreByExam($examType, $percent);

        $moduleScores = self::buildModuleScores($breakdownRows, $examType, $percent);
        [$strengths, $weaknesses] = self::strengthsWeaknesses($breakdownRows);
        $studyPlan = self::buildStudyPlan($weaknesses, $examType);
        $counselingCta = self::needsCounseling($percent, $weaknesses);
        $nextRec = self::nextRecommendation($percent, $counselingCta, $examType);
        $crmStatus = self::crmSyncStatus($attemptId);

        $report = [
            'attempt_id'         => $attemptId,
            'attempt_code'       => (string) $attempt['attempt_code'],
            'student' => [
                'id'             => (int) ($student['id'] ?? 0),
                'name'           => (string) ($student['full_name'] ?? ''),
                'alo_student_id' => (string) ($student['alo_student_id'] ?? ''),
            ],
            'exam' => [
                'type_code'   => $examType,
                'type_name'   => (string) ($attempt['type_name'] ?? $examType),
                'score_scale' => (string) ($attempt['score_scale'] ?? 'percent'),
            ],
            'generated_at'       => date('Y-m-d H:i:s'),
            'overall_score' => [
                'percent'  => $percent,
                'score'    => $mapped['score'],
                'label'    => $mapped['label'],
                'cefr'     => $score['cefr_level'] ?? null,
                'is_estimated' => true,
            ],
            'module_scores'      => $moduleScores,
            'counts'             => $answerCounts,
            'time_used_seconds'  => (int) ($attempt['time_spent_seconds'] ?? 0),
            'strengths'          => $strengths,
            'weaknesses'         => $weaknesses,
            'study_plan'         => $studyPlan,
            'next_recommendation'=> $nextRec,
            'counseling_cta'     => $counselingCta,
            'disclaimer'         => self::getDisclaimer(),
            'crm_sync_status'    => $crmStatus,
        ];

        // Persist the report summary into exam_reports (no PDF generation here —
        // PDF is generated asynchronously by the report agent / cron).
        try {
            Database::insert('exam_reports', [
                'report_code'  => 'SSR-' . date('Ymd') . '-' . strtoupper(substr(sodium_bin2hex(random_bytes(4)), 0, 8)),
                'attempt_id'   => $attemptId,
                'student_id'   => (int) $attempt['student_id'],
                'report_type'  => 'score',
                'pdf_path'     => null,
                'summary_json' => json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'generated_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            @error_log('[smart_report] insert failed: ' . $e->getMessage());
        }

        AuditService::log(null, 'report.generated', 'attempt', $attemptId, [
            'exam_type'  => $examType,
            'percent'    => $percent,
            'score'      => $mapped['score'],
            'label'      => $mapped['label'],
        ]);

        return $report;
    }

    /**
     * Map a percentage score to the canonical scale for an exam type.
     *
     * @return array{score:string,label:string}
     */
    public static function mapScoreByExam(string $examType, float $pct): array
    {
        $pct = max(0.0, min(100.0, $pct));

        // ---------- English Proficiency (11) ----------
        if ($examType === 'IELTS' || $examType === 'IELTS_GENERAL') {
            $band = self::bandFromPercent($pct);
            return ['score' => number_format($band, 1, '.', ''), 'label' => 'IELTS Band'];
        }
        if ($examType === 'PTE') {
            // PTE Academic: 10–90 scale.
            $scaled = (int) round(10 + ($pct / 100.0) * 80);
            return ['score' => (string) $scaled, 'label' => 'PTE Academic Score (10–90)'];
        }
        if ($examType === 'TOEFL') {
            // TOEFL iBT: 0–120.
            $scaled = (int) round(($pct / 100.0) * 120);
            return ['score' => (string) $scaled, 'label' => 'TOEFL iBT Score (0–120)'];
        }
        if ($examType === 'DUOLINGO') {
            // Duolingo English Test: 10–160.
            $scaled = (int) round(10 + ($pct / 100.0) * 150);
            return ['score' => (string) $scaled, 'label' => 'Duolingo English Test Score (10–160)'];
        }
        if ($examType === 'OET') {
            // OET: grades A (highest) → E.
            $grade = self::oetGrade($pct);
            return ['score' => $grade, 'label' => 'OET Grade (A–E)'];
        }
        if ($examType === 'LANGUAGECERT') {
            $band = self::bandFromPercent($pct);
            return ['score' => number_format($band, 1, '.', ''), 'label' => 'LanguageCert Score (Band 0–9)'];
        }
        if ($examType === 'LINGUASKILL') {
            $cefr = self::cefrFromPercent($pct);
            $band = self::bandFromPercent($pct);
            return ['score' => $cefr . ' (Band ' . number_format($band, 1, '.', '') . ')',
                    'label' => 'Linguaskill Score (CEFR + Band)'];
        }
        if ($examType === 'OIETC') {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'OIETC / ELLT Score (CEFR)'];
        }
        if ($examType === 'TOEIC') {
            // TOEIC L&R: 5–495 per section → 10–990 total.
            $scaled = (int) round(10 + ($pct / 100.0) * 980);
            return ['score' => (string) $scaled, 'label' => 'TOEIC L&R Score (10–990)'];
        }
        if ($examType === 'CAMBRIDGE') {
            // Cambridge English Scale: 82–230.
            $scaled = (int) round(82 + ($pct / 100.0) * 148);
            return ['score' => (string) $scaled, 'label' => 'Cambridge English Scale (82–230)'];
        }

        // ---------- Study Abroad Entrance (6) ----------
        if ($examType === 'SAT') {
            // Digital SAT total: 400–1600.
            $scaled = (int) round(400 + ($pct / 100.0) * 1200);
            return ['score' => (string) $scaled, 'label' => 'Digital SAT Total Score (400–1600)'];
        }
        if ($examType === 'GRE') {
            // GRE: Verbal 130–170, Quantitative 130–170.
            $v = (int) round(130 + ($pct / 100.0) * 40);
            $q = (int) round(130 + ($pct / 100.0) * 40);
            return ['score' => 'V' . $v . '/Q' . $q, 'label' => 'GRE Verbal & Quantitative (130–170 each)'];
        }
        if ($examType === 'GMAT') {
            // GMAT Focus: 205–805.
            $scaled = (int) round(205 + ($pct / 100.0) * 600);
            return ['score' => (string) $scaled, 'label' => 'GMAT Focus Total Score (205–805)'];
        }
        if ($examType === 'LSAT') {
            // LSAT: 120–180.
            $scaled = (int) round(120 + ($pct / 100.0) * 60);
            return ['score' => (string) $scaled, 'label' => 'LSAT Score (120–180)'];
        }
        if ($examType === 'MCAT') {
            // MCAT total: 472–528.
            $scaled = (int) round(472 + ($pct / 100.0) * 56);
            return ['score' => (string) $scaled, 'label' => 'MCAT Total Score (472–528)'];
        }
        if ($examType === 'ACT') {
            // ACT composite: 1–36.
            $scaled = (int) max(1, round(($pct / 100.0) * 36));
            return ['score' => (string) $scaled, 'label' => 'ACT Composite Score (1–36)'];
        }

        // ---------- University Internal Placement (5) ----------
        if (in_array($examType, ['UNI_EPT_A','UNI_EPT_B','UNI_EPT_C','UNI_EPT_D','UNI_EPT_E'], true)) {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'University English Placement Test (CEFR A1–C2)'];
        }

        // ---------- Visa / Interview (5) ----------
        if (in_array($examType, ['VISA_US','VISA_UK','VISA_CA','VISA_AU','VISA_SCHENGEN'], true)) {
            // Visa interviews are pass/fail style with a confidence band.
            $band = self::confidenceLabel($pct);
            return ['score' => $band, 'label' => 'Visa Interview Confidence'];
        }

        // ---------- ALO Internal (5) ----------
        if ($examType === 'ALO_DIAGNOSTIC') {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'ALO Diagnostic — CEFR Level'];
        }
        if ($examType === 'ALO_PLACEMENT') {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'ALO Placement — CEFR Level (A1–C2)'];
        }
        if ($examType === 'ALO_PROGRESS') {
            return ['score' => number_format($pct, 1, '.', '') . '%',
                    'label' => 'ALO Progress — Percentage'];
        }
        if ($examType === 'ALO_ENDTERM') {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'ALO End-of-Term — CEFR Level'];
        }
        if ($examType === 'ALO_EXIT') {
            $cefr = self::cefrFromPercent($pct);
            return ['score' => $cefr, 'label' => 'ALO Exit — CEFR Level (A1–C2)'];
        }

        // ---------- Default ----------
        return ['score' => number_format($pct, 1, '.', '') . '%',
                'label' => 'Practice Score (Percentage)'];
    }

    /** The disclosure text shown to students on the platform. */
    public static function getDisclosureText(): string
    {
        return self::DISCLOSURE_TEXT;
    }

    /** Full disclaimer (disclosure + practice-only line) shown on every report. */
    public static function getDisclaimer(): string
    {
        return self::DISCLOSURE_TEXT . ' ' . self::DISCLAIMER_TEXT;
    }

    // ---------- Helpers ----------

    /**
     * @return array{correct:int,incorrect:int,unanswered:int}
     */
    private static function countAnswers(int $attemptId): array
    {
        $row = Database::one(
            'SELECT
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
                SUM(CASE WHEN is_correct = 0 AND answer_json IS NOT NULL AND answer_json <> \'\' THEN 1 ELSE 0 END) AS incorrect,
                SUM(CASE WHEN answer_json IS NULL OR answer_json = \'\' THEN 1 ELSE 0 END) AS unanswered
               FROM exam_answers
              WHERE attempt_id = :aid',
            ['aid' => $attemptId]
        );
        return [
            'correct'    => (int) ($row['correct'] ?? 0),
            'incorrect'  => (int) ($row['incorrect'] ?? 0),
            'unanswered' => (int) ($row['unanswered'] ?? 0),
        ];
    }

    /**
     * @return array<string,array{percent:float,score:array}>
     */
    private static function buildModuleScores(array $breakdownRows, string $examType, float $overallPct): array
    {
        $modules = [];
        foreach ($breakdownRows as $b) {
            $skill = (string) $b['skill_tag'];
            $pct = (float) $b['percent'];
            $modules[$skill] = [
                'percent' => $pct,
                'raw'     => (float) $b['raw_score'],
                'max'     => (float) $b['raw_max'],
                'score'   => self::mapScoreByExam($examType, $pct),
            ];
        }
        // Always include the 4 canonical English skills even if empty.
        foreach (['listening','reading','writing','speaking'] as $s) {
            if (!isset($modules[$s])) {
                $modules[$s] = [
                    'percent' => 0.0,
                    'raw'     => 0.0,
                    'max'     => 0.0,
                    'score'   => self::mapScoreByExam($examType, 0.0),
                    'note'    => 'Not assessed in this practice set.',
                ];
            }
        }
        return $modules;
    }

    /**
     * @param array<int,array{skill_tag:string,percent:float}> $breakdown
     * @return array{0:array<int,string>,1:array<int,string>}
     */
    private static function strengthsWeaknesses(array $breakdown): array
    {
        $strengths = [];
        $weaknesses = [];
        foreach ($breakdown as $b) {
            $skill = (string) $b['skill_tag'];
            $pct = (float) $b['percent'];
            if ($pct >= 75) {
                $strengths[] = ucfirst($skill) . ' is a clear strength (' . number_format($pct, 1) . '%).';
            } elseif ($pct < 50) {
                $weaknesses[] = ucfirst($skill) . ' needs focused work (' . number_format($pct, 1) . '%).';
            }
        }
        if ($strengths === []) {
            $strengths[] = 'Completed the full practice attempt — a solid baseline to build on.';
        }
        if ($weaknesses === []) {
            $weaknesses[] = 'No critical skill gaps detected; refine precision and timing to push higher.';
        }
        return [$strengths, $weaknesses];
    }

    /**
     * @param string[] $weaknesses
     * @return string[]
     */
    private static function buildStudyPlan(array $weaknesses, string $examType): array
    {
        $plan = [];
        $plan[] = 'Week 1: Re-attempt the questions answered incorrectly and review each explanation carefully.';
        foreach ($weaknesses as $w) {
            $plan[] = 'Targeted practice: ' . $w;
        }
        $plan[] = 'Week 2: Take one timed mini-mock focused on your weakest skill.';
        $plan[] = 'Week 3: Practise speaking or writing on a fresh topic daily for 20 minutes.';
        $plan[] = 'Week 4: Re-take a full mock and compare your Smart Score Report to this one.';
        $plan[] = 'Remember: every score on this platform is a practice estimate, not an official exam result.';
        return $plan;
    }

    private static function needsCounseling(float $percent, array $weaknesses): bool
    {
        return $percent < 50.0 || count($weaknesses) >= 2;
    }

    private static function nextRecommendation(float $percent, bool $counselingCta, string $examType): string
    {
        if ($counselingCta) {
            return 'Book a free counseling session with an ALO advisor to build a personalised study plan and reach your target score faster.';
        }
        if ($percent >= 85) {
            return 'Strong performance. Attempt a harder practice set or simulate full test-day conditions to verify consistency.';
        }
        if ($percent >= 65) {
            return 'Solid foundation. Focus your next practice session on your weakest module to push into the next band.';
        }
        return 'Continue with structured daily practice and revisit the fundamentals of your weakest skill.';
    }

    private static function crmSyncStatus(int $attemptId): string
    {
        $row = Database::one(
            "SELECT status FROM exam_crm_sync_logs
              WHERE entity_type = 'attempt' AND entity_id = :id
              ORDER BY id DESC LIMIT 1",
            ['id' => $attemptId]
        );
        if ($row === null) {
            return 'pending';
        }
        $status = (string) $row['status'];
        if ($status === 'synced' || $status === 'success') {
            return 'synced';
        }
        if ($status === 'failed') {
            return 'failed';
        }
        return $status; // pending / retrying
    }

    private static function bandFromPercent(float $pct): float
    {
        $band = ($pct / 100.0) * 9.0;
        return round($band * 2.0) / 2.0;
    }

    private static function cefrFromPercent(float $pct): string
    {
        return match (true) {
            $pct >= 90 => 'C2',
            $pct >= 75 => 'C1',
            $pct >= 60 => 'B2',
            $pct >= 40 => 'B1',
            $pct >= 20 => 'A2',
            default    => 'A1',
        };
    }

    private static function oetGrade(float $pct): string
    {
        return match (true) {
            $pct >= 90 => 'A',
            $pct >= 75 => 'B',
            $pct >= 60 => 'C+',
            $pct >= 45 => 'C',
            $pct >= 30 => 'D',
            default    => 'E',
        };
    }

    private static function confidenceLabel(float $pct): string
    {
        return match (true) {
            $pct >= 80 => 'High confidence',
            $pct >= 60 => 'Moderate confidence',
            $pct >= 40 => 'Developing confidence',
            default    => 'Needs significant preparation',
        };
    }

    /**
     * @return array{
     *   attempt_id:int, student:array, exam:array, generated_at:string,
     *   overall_score:array, module_scores:array,
     *   counts:array, time_used_seconds:int, strengths:array,
     *   weaknesses:array, study_plan:array, next_recommendation:string,
     *   counseling_cta:bool, disclaimer:string, crm_sync_status:string
     * }
     */
    private static function emptyReport(int $attemptId): array
    {
        return [
            'attempt_id'          => $attemptId,
            'attempt_code'        => '',
            'student'             => [],
            'exam'                => [],
            'generated_at'        => date('Y-m-d H:i:s'),
            'overall_score'       => ['percent' => 0.0, 'score' => '0', 'label' => 'Practice Score', 'is_estimated' => true],
            'module_scores'       => [],
            'counts'              => ['correct' => 0, 'incorrect' => 0, 'unanswered' => 0],
            'time_used_seconds'   => 0,
            'strengths'           => ['No data available.'],
            'weaknesses'          => ['Attempt not found — please retry.'],
            'study_plan'          => ['Re-take the practice attempt to generate a fresh Smart Score Report.'],
            'next_recommendation' => 'Re-attempt the practice set.',
            'counseling_cta'      => false,
            'disclaimer'          => self::getDisclaimer(),
            'crm_sync_status'     => 'pending',
        ];
    }
}
