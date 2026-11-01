<?php
/**
 * app/Services/ScoringService.php — Score calculation + CEFR mapping.
 *
 * Scores answers against the install.sql schema:
 *   - the question's weight is exam_questions.score_value
 *   - its behaviour is exam_question_types.response_format + is_graded_auto
 *   - MCQ keys live in exam_question_options.is_correct (the caller supplies
 *     the correct option id list)
 *   - text/numeric/matching/reorder keys live in
 *     exam_questions.correct_answer_json:
 *       text       {"answer": "...", "acceptable": ["..."]} (or a bare string)
 *       numeric    {"answer": 12.5}
 *       multi-text {"answers": ["a", "b"]}
 *       matching   {"pairs": {"A": "2", "B": "1"}}  (left label -> option label)
 *       reorder    {"order": ["B", "A", "C"]}
 *
 * Anything that is not auto-graded (writing/speaking/audio, or an unknown
 * response format) FAILS CLOSED: it earns nothing here, is flagged
 * 'auto' => false so the caller excludes it from the objective percentage,
 * and is left for examiner review. It never receives placeholder credit.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

final class ScoringService
{
    /**
     * Score a single answer.
     *
     * @param array $question Row with: score_value, response_format,
     *                        is_graded_auto, correct_answer_json, explanation,
     *                        correct_option_ids (int[] from is_correct options)
     * @return array{correct:bool, awarded:float, max:float, auto:bool, explanation:?string}
     */
    public static function scoreAnswer(array $question, mixed $userAnswer): array
    {
        $max = (float) ($question['score_value'] ?? 1.0);
        $format = strtolower((string) ($question['response_format'] ?? ''));
        $gradedAuto = (int) ($question['is_graded_auto'] ?? 0) === 1;
        $explanation = isset($question['explanation']) ? (string) $question['explanation'] : null;
        $key = self::decodeKey($question['correct_answer_json'] ?? null);

        $pending = static fn (string $why): array => [
            'correct' => false, 'awarded' => 0.0, 'max' => $max, 'auto' => false,
            'explanation' => $why,
        ];

        // Subjective work is never auto-scored.
        if (!$gradedAuto || in_array($format, ['writing', 'speaking', 'audio', 'long_text', 'file_upload'], true)) {
            return $pending('Pending examiner review.');
        }

        switch ($format) {
            case 'single_mcq':
            case 'quant_comparison':
            case 'data_sufficiency': {
                $correctIds = self::intList($question['correct_option_ids'] ?? []);
                if ($correctIds === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $correct = $userAnswer !== null && (string) $userAnswer === (string) $correctIds[0];
                return ['correct' => $correct, 'awarded' => $correct ? $max : 0.0, 'max' => $max, 'auto' => true,
                        'explanation' => $explanation];
            }

            case 'multi_mcq': {
                $correctSet = array_map('strval', self::intList($question['correct_option_ids'] ?? []));
                if ($correctSet === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $userSet = array_map('strval', is_array($userAnswer) ? $userAnswer : [$userAnswer]);
                $hits = count(array_intersect($correctSet, $userSet));
                $wrong = count(array_diff($userSet, $correctSet));
                if ($wrong === 0 && $hits === count($correctSet)) {
                    return ['correct' => true, 'awarded' => $max, 'max' => $max, 'auto' => true,
                            'explanation' => $explanation];
                }
                $partial = $wrong === 0 ? $max * ($hits / max(1, count($correctSet))) * 0.5 : 0.0;
                return ['correct' => false, 'awarded' => round($partial, 2), 'max' => $max, 'auto' => true,
                        'explanation' => $explanation];
            }

            case 'dropdown': {
                // Multi-blank dropdown: key carries an ordered answers list.
                $expectedList = self::stringList($key['answers'] ?? null);
                if ($expectedList !== []) {
                    $gotList = array_map(
                        static fn ($v): string => self::norm((string) $v),
                        is_array($userAnswer) ? $userAnswer : [$userAnswer]
                    );
                    $expNorm = array_map(static fn (string $v): string => self::norm($v), $expectedList);
                    $hits = 0;
                    foreach ($expNorm as $i => $exp) {
                        if (($gotList[$i] ?? null) === $exp) {
                            $hits++;
                        }
                    }
                    $awarded = $max * ($hits / max(1, count($expNorm)));
                    return ['correct' => $hits === count($expNorm), 'awarded' => round($awarded, 2), 'max' => $max,
                            'auto' => true, 'explanation' => $explanation];
                }
                // Single dropdown behaves like a single MCQ over option ids.
                $correctIds = self::intList($question['correct_option_ids'] ?? []);
                if ($correctIds === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $correct = $userAnswer !== null && (string) $userAnswer === (string) $correctIds[0];
                return ['correct' => $correct, 'awarded' => $correct ? $max : 0.0, 'max' => $max, 'auto' => true,
                        'explanation' => $explanation];
            }

            case 'text':
            case 'numeric':
            case 'grid_in': {
                $expected = self::expectedTexts($key);
                if ($expected === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $got = is_scalar($userAnswer) ? (string) $userAnswer : '';
                $correct = false;
                foreach ($expected as $exp) {
                    if (is_numeric($exp) && is_numeric(trim($got))) {
                        $correct = abs((float) $exp - (float) trim($got)) < 0.001;
                    } else {
                        $correct = self::norm($got) !== '' && self::norm($got) === self::norm($exp);
                    }
                    if ($correct) {
                        break;
                    }
                }
                return ['correct' => $correct, 'awarded' => $correct ? $max : 0.0, 'max' => $max, 'auto' => true,
                        'explanation' => $explanation];
            }

            case 'matching': {
                $pairs = is_array($key['pairs'] ?? null) ? $key['pairs'] : [];
                if ($pairs === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $userPairs = is_array($userAnswer) ? $userAnswer : [];
                $hits = 0;
                foreach ($pairs as $left => $right) {
                    if (isset($userPairs[$left]) && self::norm((string) $userPairs[$left]) === self::norm((string) $right)) {
                        $hits++;
                    }
                }
                $awarded = $max * ($hits / max(1, count($pairs)));
                return ['correct' => $hits === count($pairs), 'awarded' => round($awarded, 2), 'max' => $max,
                        'auto' => true, 'explanation' => $explanation];
            }

            case 'reorder': {
                $order = self::stringList($key['order'] ?? null);
                if ($order === []) {
                    return $pending('Question has no answer key yet — held for review.');
                }
                $got = array_map('strval', is_array($userAnswer) ? $userAnswer : []);
                $hits = 0;
                foreach ($order as $i => $label) {
                    if (($got[$i] ?? null) === (string) $label) {
                        $hits++;
                    }
                }
                $awarded = $max * ($hits / max(1, count($order)));
                return ['correct' => $hits === count($order), 'awarded' => round($awarded, 2), 'max' => $max,
                        'auto' => true, 'explanation' => $explanation];
            }
        }

        // Unknown response format: fail closed, never invent credit.
        return $pending('Unsupported question format — held for review.');
    }

    /**
     * Aggregate scored answers into totals + a per-dimension breakdown.
     *
     * @param array $scored  Rows with keys: awarded, max, auto, dimension.
     *                       Only 'auto' rows count toward the objective percent.
     * @param string $scaleMode band|scaled|percent|rubric (from the set's
     *                       scoring_rule_json.scale; display strings like
     *                       "Band 0-9" / "200-800" are also understood)
     * @param array $scoringRule decoded scoring_rule_json (min/max for scaled)
     * @return array{raw_max:float, raw_score:float, percent:float, scaled:?float, band:?float, cefr:?string, by_dimension:array}
     */
    public static function aggregate(array $scored, string $scaleMode = 'percent', array $scoringRule = []): array
    {
        $rawMax = 0.0;
        $rawScore = 0.0;
        $byDimension = [];

        foreach ($scored as $row) {
            if (!($row['auto'] ?? false)) {
                continue;
            }
            $max = (float) ($row['max'] ?? 0.0);
            $awarded = (float) ($row['awarded'] ?? 0.0);
            $rawMax += $max;
            $rawScore += $awarded;
            $dimension = (string) ($row['dimension'] ?? 'general');
            if (!isset($byDimension[$dimension])) {
                $byDimension[$dimension] = ['max' => 0.0, 'score' => 0.0];
            }
            $byDimension[$dimension]['max'] += $max;
            $byDimension[$dimension]['score'] += $awarded;
        }

        $percent = $rawMax > 0 ? round(100 * $rawScore / $rawMax, 2) : 0.0;
        $scaled = null;
        $band = null;
        $cefr = self::percentToCefr($percent);

        $mode = strtolower(trim($scaleMode));
        $min = isset($scoringRule['min']) ? (float) $scoringRule['min'] : null;
        $maxScale = isset($scoringRule['max']) ? (float) $scoringRule['max'] : null;
        if (preg_match('/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/', $mode, $m) === 1) {
            $min = $min ?? (float) $m[1];
            $maxScale = $maxScale ?? (float) $m[2];
            if (!str_contains($mode, 'band')) {
                $mode = 'scaled';
            }
        }

        if ($mode === 'band' || str_contains($mode, 'band')) {
            $bandMax = $maxScale ?? 9.0;
            $band = round(min($bandMax, max(0.0, ($percent / 100) * $bandMax)) * 2) / 2;
        } elseif ($mode === 'scaled' && $min !== null && $maxScale !== null && $maxScale > $min) {
            $scaled = round($min + ($maxScale - $min) * ($percent / 100), 2);
        }

        return [
            'raw_max'      => $rawMax,
            'raw_score'    => $rawScore,
            'percent'      => $percent,
            'scaled'       => $scaled,
            'band'         => $band,
            'cefr'         => $cefr,
            'by_dimension' => $byDimension,
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

    private static function decodeKey(mixed $json): array
    {
        if (is_array($json)) {
            return $json;
        }
        if (is_string($json) && trim($json) !== '') {
            $decoded = json_decode($json, true);
            if (is_array($decoded)) {
                return $decoded;
            }
            if (is_string($decoded) || is_numeric($decoded)) {
                return ['answer' => $decoded];
            }
        }
        return [];
    }

    /** @return string[] acceptable expected answers (primary + alternates) */
    private static function expectedTexts(array $key): array
    {
        $out = [];
        if (isset($key['answer']) && (is_string($key['answer']) || is_numeric($key['answer']))) {
            $out[] = (string) $key['answer'];
        }
        foreach (self::stringList($key['acceptable'] ?? null) as $alt) {
            $out[] = $alt;
        }
        foreach (self::stringList($key['answers'] ?? null) as $alt) {
            $out[] = $alt;
        }
        return $out;
    }

    /** @return int[] */
    private static function intList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $v) {
            if (is_int($v) || (is_string($v) && ctype_digit(ltrim($v, '-')))) {
                $out[] = (int) $v;
            }
        }
        return $out;
    }

    /** @return string[] */
    private static function stringList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $v) {
            if (is_scalar($v)) {
                $out[] = (string) $v;
            }
        }
        return $out;
    }

    private static function norm(string $value): string
    {
        $value = preg_replace('/\s+/', ' ', trim(strtolower($value))) ?? '';
        return rtrim($value, '.');
    }
}
