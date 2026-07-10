<?php
/**
 * app/Services/ScoringService.php — Score calculation + CEFR mapping.
 *
 * Objective scoring for MCQ / fill-blanks / numeric / matching.
 * Rubric placeholder for writing / speaking (delegated to ExaminerController).
 * Band/scaled/percent/rubric/CEFR estimation per exam_type score_scale.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class ScoringService
{
    /**
     * Score a single answer against its question's correct answer.
     * Returns 0 or 1 (or partial credit for multi-select / matching).
     *
     * @return array{correct:bool, awarded:float, max:float, explanation:?string}
     */
    public static function scoreAnswer(array $question, mixed $userAnswer): array
    {
        $max = (float) ($question['max_points'] ?? 1.0);
        $type = (string) ($question['question_type'] ?? '');

        // Single MCQ
        if (in_array($type, ['single_mcq', 'true_false_notgiven', 'yes_no_notgiven', 'read_and_select'], true)) {
            $correctId = (string) ($question['correct_option_id'] ?? '');
            $correct = $userAnswer !== null && (string) $userAnswer === $correctId;
            return ['correct' => $correct, 'awarded' => $correct ? $max : 0.0, 'max' => $max,
                    'explanation' => $question['explanation'] ?? null];
        }

        // Multi MCQ — partial credit if all selected correct and no wrong ones.
        if (in_array($type, ['multi_mcq'], true)) {
            $correctSet = array_map('strval', (array)($question['correct_option_ids'] ?? []));
            $userSet    = array_map('strval', (array) $userAnswer);
            $intersection = array_intersect($correctSet, $userSet);
            $wrong = array_diff($userSet, $correctSet);
            if (count($wrong) === 0 && count($intersection) === count($correctSet)) {
                return ['correct' => true, 'awarded' => $max, 'max' => $max,
                        'explanation' => $question['explanation'] ?? null];
            }
            $partial = $max * (count($intersection) / max(1, count($correctSet))) * 0.5;
            return ['correct' => false, 'awarded' => round($partial, 2), 'max' => $max,
                    'explanation' => $question['explanation'] ?? null];
        }

        // Fill blanks / short answer / numeric — string-normalized compare.
        if (in_array($type, ['fill_blanks', 'short_answer', 'sentence_completion',
            'summary_completion', 'numeric_answer', 'grid_in', 'write_from_dictation'], true)) {
            $expected = trim(strtolower((string) ($question['correct_answer'] ?? '')));
            $got = trim(strtolower((string) $userAnswer));
            // Numeric tolerance
            if (is_numeric($expected) && is_numeric($got)) {
                $correct = abs((float)$expected - (float)$got) < 0.001;
            } else {
                $correct = $expected !== '' && $got === $expected;
            }
            return ['correct' => $correct, 'awarded' => $correct ? $max : 0.0, 'max' => $max,
                    'explanation' => $question['explanation'] ?? null];
        }

        // Writing / Speaking — rubric placeholder, no auto-score.
        if (in_array($type, ['essay','writing_task1','writing_task1_general','writing_task2',
            'integrated_writing','academic_discussion','writing_sample','issue_task','argument_task',
            'read_aloud','repeat_sentence','describe_image','retell_lecture','summarize_spoken_text',
            'summarize_written_text','speaking_part1','speaking_part2','speaking_part3',
            'independent_speaking','speaking_sample','credibility_interview'], true)) {
            return ['correct' => false, 'awarded' => 0.0, 'max' => $max,
                    'explanation' => 'Pending examiner review.'];
        }

        // Default: any answer present earns full credit (placeholder for non-standard types).
        return ['correct' => $userAnswer !== null && $userAnswer !== '',
                'awarded' => ($userAnswer !== null && $userAnswer !== '') ? $max : 0.0,
                'max' => $max, 'explanation' => $question['explanation'] ?? null];
    }

    /**
     * Aggregate raw answers into a section/skill breakdown + scaled score.
     *
     * @param array $answers     rows from exam_answers joined with exam_questions
     * @param string $scoreScale band|scaled|percent|rubric
     * @param array $scoringRule optional per-exam rules
     * @return array{raw_max:float, raw_score:float, percent:float, scaled:?float, band:?float, cefr:?string, by_skill:array}
     */
    public static function aggregate(array $answers, string $scoreScale = 'percent', array $scoringRule = []): array
    {
        $rawMax = 0.0;
        $rawScore = 0.0;
        $bySkill = [];

        foreach ($answers as $a) {
            $max = (float) ($a['max_points'] ?? 1.0);
            $awarded = (float) ($a['points_awarded'] ?? 0.0);
            $rawMax += $max;
            $rawScore += $awarded;
            $skill = $a['skill_tag'] ?? 'general';
            if (!isset($bySkill[$skill])) {
                $bySkill[$skill] = ['max' => 0.0, 'score' => 0.0];
            }
            $bySkill[$skill]['max'] += $max;
            $bySkill[$skill]['score'] += $awarded;
        }

        $percent = $rawMax > 0 ? round(100 * $rawScore / $rawMax, 2) : 0.0;
        $scaled = null; $band = null; $cefr = null;

        if ($scoreScale === 'scaled') {
            $min = (int) ($scoringRule['min'] ?? 200);
            $max = (int) ($scoringRule['max'] ?? 800);
            $scaled = (int) round($min + ($max - $min) * ($percent / 100));
        } elseif ($scoreScale === 'band') {
            $band = round(min(9.0, max(0.0, ($percent / 100) * 9.0)) * 2) / 2;
            $cefr = self::percentToCefr($percent);
        } elseif ($scoreScale === 'rubric') {
            // Rubric exams (writing/speaking-heavy) defer to examiner.
            $cefr = self::percentToCefr($percent);
        } else {
            $cefr = self::percentToCefr($percent);
        }

        return [
            'raw_max'   => $rawMax,
            'raw_score' => $rawScore,
            'percent'   => $percent,
            'scaled'    => $scaled,
            'band'      => $band,
            'cefr'      => $cefr,
            'by_skill'  => $bySkill,
        ];
    }

    private static function percentToCefr(float $percent): ?string
    {
        return match (true) {
            $percent >= 90 => 'C2',
            $percent >= 75 => 'C1',
            $percent >= 60 => 'B2',
            $percent >= 40 => 'B1',
            $percent >= 20 => 'A2',
            default        => 'A1',
        };
    }
}
