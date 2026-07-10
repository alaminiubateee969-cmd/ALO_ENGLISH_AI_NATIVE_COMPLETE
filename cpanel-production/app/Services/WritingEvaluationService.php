<?php
/**
 * app/Services/WritingEvaluationService.php — Rule-based writing evaluation.
 *
 * Evaluates a writing submission via deterministic, rule-based heuristics:
 *   - word count vs target (150 for Task 1 / 250 for Task 2 / 200 default)
 *   - paragraph structure (count, balance)
 *   - lexical diversity (type-token ratio)
 *   - sentence length variance
 *   - keyword / discourse-marker presence
 *   - spelling heuristics (basic repeated-character & whitespace checks)
 *
 * The result is written to `exam_writing_submissions` and a task row is
 * created for AGENT-WRITING-01 (public_label "Automated Practice Feedback").
 *
 * NO-HUMAN PRACTICE EXAM MODE (Task ID: NO-HUMAN):
 *   - The active evaluation provider is read from env (EVALUATION_PROVIDER).
 *   - local_rule_engine (default) is always available with NO external API.
 *   - local_llm_optional / external_ai_optional are used ONLY when an AI
 *     API key is configured; otherwise the service falls back to
 *     local_rule_engine and sets fallback_used=true.
 *   - Every task row logs provider_used, fallback_used, confidence_score,
 *     auto_completed=1, requires_human=0.
 *   - Every result carries the practice-only disclaimer. The student is
 *     NEVER blocked from seeing their report.
 *
 * COMPLIANCE: Never claims to be a "real examiner", "official examiner",
 * "AI teacher", "bot", or to produce an "official score". External AI is
 * OPTIONAL; local_rule_engine always works without any API key.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class WritingEvaluationService
{
    /** Target word count per common writing task type. */
    public const TARGET_WORD_COUNT = [
        'writing_task1'         => 150,
        'writing_task1_general' => 150,
        'writing_task2'         => 250,
        'essay'                 => 250,
        'integrated_writing'    => 200,
        'academic_discussion'   => 120,
        'writing_sample'        => 150,
        'issue_task'            => 250,
        'argument_task'         => 250,
    ];

    public const DEFAULT_TARGET = 200;

    /** Discourse markers that boost the coherence score. */
    private const DISCOURSE_MARKERS = [
        'however', 'moreover', 'furthermore', 'therefore', 'in addition',
        'on the other hand', 'as a result', 'consequently', 'for instance',
        'for example', 'in conclusion', 'to summarise', 'to summarize',
        'firstly', 'secondly', 'finally', 'nevertheless', 'thus',
    ];

    /** High-value academic vocabulary tokens (lightweight lexical signal). */
    private const ACADEMIC_TOKENS = [
        'analyse', 'analysis', 'demonstrate', 'significant', 'approach',
        'concept', 'context', 'evidence', 'factor', 'framework',
        'impact', 'indicate', 'perspective', 'principle', 'process',
        'research', 'result', 'structure', 'theory', 'trend',
    ];

    /** Short practice-only disclaimer (NO-HUMAN mode spec). */
    public const PRACTICE_DISCLAIMER = 'Practice estimate only. Not an official exam result.';

    /**
     * Evaluate a writing submission.
     *
     * @param int $submissionId   exam_writing_submissions.id
     * @param int $attemptId      exam_mock_attempts.id (for agent task context)
     * @return array{
     *   submission_id:int, attempt_id:int, word_count:int, target_word_count:int,
     *   estimated_band:float, estimated_score:float,
     *   task_achievement:float, coherence:float, lexical:float, vocabulary:float,
     *   grammar:float, improvement_plan:array<int,string>, suggested_improvement:string,
     *   is_estimated:bool, confidence_level:string, confidence_score:float,
     *   provider_used:string, fallback_used:bool,
     *   disclaimer:string, disclaimer_full:string
     * }
     */
    public static function evaluate(int $submissionId, int $attemptId): array
    {
        $sub = Database::one(
            'SELECT ws.id, ws.attempt_id, ws.student_id, ws.question_id,
                    ws.response_text, ws.word_count, q.question_type
               FROM exam_writing_submissions ws
               LEFT JOIN exam_questions q ON q.id = ws.question_id
              WHERE ws.id = :id LIMIT 1',
            ['id' => $submissionId]
        );
        if ($sub === null) {
            return self::emptyResult($submissionId);
        }

        // ----- No-Human mode: read provider config from env -----
        [$providerUsed, $fallbackUsed] = self::resolveProvider();

        $text = (string) ($sub['response_text'] ?? '');
        $wordCount = self::countWords($text);
        $taskType = (string) ($sub['question_type'] ?? 'essay');
        $target = self::TARGET_WORD_COUNT[$taskType] ?? self::DEFAULT_TARGET;

        // --- Dimension scores (each 0–9 band-scale, two-decimal precision) ---
        $taskAchievement = self::scoreTaskAchievement($wordCount, $target, $text);
        $coherence       = self::scoreCoherence($text);
        $lexical         = self::scoreLexical($text);
        $grammar         = self::scoreGrammar($text);

        $estimatedBand = self::aggregateBand(
            $taskAchievement, $coherence, $lexical, $grammar
        );

        $improvementPlan = self::buildImprovementPlan(
            $wordCount, $target, $taskAchievement, $coherence, $lexical, $grammar
        );

        // ----- Optional external AI enhancement hook -----
        // If an optional AI provider is configured AND an API key exists,
        // an external enhancement call would happen here. On any failure
        // (no key, timeout, malformed response), we fall back to the
        // rule-based estimate above and set fallback_used=true.
        if (self::isOptionalAiProvider($providerUsed)) {
            if (!self::hasAiApiKey()) {
                $providerUsed = 'local_rule_engine';
                $fallbackUsed = true;
            } else {
                // @codeCoverageIgnoreStart
                // PLACEHOLDER: actual external AI API call goes here.
                //   $enhanced = self::enhanceWithExternalAi($text, [...]);
                // On success: merge enhanced fields, keep provider_used as-is.
                // On any error: fall back as below.
                // Until the external client is wired, we fall back so the
                // platform never depends on an external API.
                $providerUsed = 'local_rule_engine';
                $fallbackUsed = true;
                // @codeCoverageIgnoreEnd
            }
        }

        // ----- No-Human mode: confidence scoring (0.00–1.00) -----
        $confidenceScore = self::computeConfidenceScore(
            $wordCount, $target, $taskAchievement, $coherence, $lexical, $grammar
        );
        $confidenceLevel = self::confidenceLevelFromScore($confidenceScore);

        $suggestedImprovement = $improvementPlan[0] ?? 'Continue practising timed writing prompts.';

        $result = [
            'submission_id'       => $submissionId,
            'attempt_id'          => $attemptId,
            'word_count'          => $wordCount,
            'target_word_count'   => $target,
            'estimated_band'      => $estimatedBand,
            'estimated_score'     => $estimatedBand, // alias for no-human mode
            'task_achievement'    => $taskAchievement,
            'coherence'           => $coherence,
            'lexical'             => $lexical,
            'vocabulary'          => $lexical,        // alias for no-human mode
            'grammar'             => $grammar,
            'improvement_plan'    => $improvementPlan,
            'suggested_improvement' => $suggestedImprovement,
            'is_estimated'        => true,
            'confidence_level'    => $confidenceLevel,
            'confidence_score'    => $confidenceScore,
            'provider_used'       => $providerUsed,
            'fallback_used'       => $fallbackUsed,
            'disclaimer'          => self::PRACTICE_DISCLAIMER,
            'disclaimer_full'     => SmartScoreReportService::getDisclaimer(),
        ];

        // Persist scoring back to the submission row. The base columns below
        // exist on every install; the no-human-mode columns are added by
        // no_human_mode_addon.sql. The no-human UPDATE is wrapped in
        // try/catch so a legacy (pre-addon) install does not fail scoring.
        Database::update('exam_writing_submissions', [
            'task_achievement'   => $taskAchievement,
            'coherence_cohesion' => $coherence,
            'lexical_resource'   => $lexical,
            'grammar_accuracy'   => $grammar,
            'overall_band'       => number_format($estimatedBand, 2, '.', ''),
            'ai_feedback_json'   => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'word_count'         => $wordCount,
            'status'             => 'ai_graded',
            'reviewed_at'        => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $submissionId]);

        try {
            Database::update('exam_writing_submissions', [
                'agent_feedback_json'=> json_encode([
                    'provider_used'     => $providerUsed,
                    'fallback_used'     => $fallbackUsed,
                    'confidence_level'  => $confidenceLevel,
                    'confidence_score'  => $confidenceScore,
                    'estimated_band'    => $estimatedBand,
                    'disclaimer'        => self::PRACTICE_DISCLAIMER,
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'evaluation_provider'=> $providerUsed,
                'task_score'         => number_format($taskAchievement, 1, '.', ''),
                'coherence_score'    => number_format($coherence, 1, '.', ''),
                'vocabulary_score'   => number_format($lexical, 1, '.', ''),
                'grammar_score'      => number_format($grammar, 1, '.', ''),
            ], 'id = :id', ['id' => $submissionId]);
        } catch (\Throwable $e) {
            @error_log('[writing_eval] stamp submission no-human cols failed: ' . $e->getMessage());
        }

        // Create + complete the AGENT-WRITING-01 task (public_label:
        // "Automated Practice Feedback"). Then stamp the no-human-mode
        // provenance columns on the task row.
        $agent = AiAgentEmployeeService::getAgent('AGENT-WRITING-01');
        if ($agent !== null) {
            $taskId = AiAgentEmployeeService::createTask(
                (int) $agent['id'],
                'writing_evaluation',
                $attemptId,
                [
                    'submission_id'    => $submissionId,
                    'word_count'       => $wordCount,
                    'target'           => $target,
                    'provider_used'    => $providerUsed,
                    'fallback_used'    => $fallbackUsed,
                    'confidence_level' => $confidenceLevel,
                    'confidence_score' => $confidenceScore,
                ]
            );
            AiAgentEmployeeService::completeTask($taskId, $result);
            self::stampNoHumanTaskColumns($taskId, $providerUsed, $fallbackUsed, $confidenceScore);
        }

        AuditService::log(null, 'writing.evaluated', 'writing_submission', $submissionId, [
            'attempt_id'      => $attemptId,
            'word_count'      => $wordCount,
            'estimated_band'  => $estimatedBand,
            'method'          => $providerUsed,
            'fallback_used'   => $fallbackUsed,
            'confidence'      => $confidenceLevel,
        ]);

        return $result;
    }

    /** The 4 canonical writing-feedback dimensions (admin/UI labels). */
    public static function getFeedbackDimensions(): array
    {
        return [
            ['key' => 'task_achievement',        'label' => 'Task Achievement',                'max' => 9.0],
            ['key' => 'coherence',               'label' => 'Coherence & Cohesion',            'max' => 9.0],
            ['key' => 'lexical',                 'label' => 'Lexical Resource',                'max' => 9.0],
            ['key' => 'grammar',                 'label' => 'Grammatical Range & Accuracy',    'max' => 9.0],
        ];
    }

    // ---------- No-Human mode helpers ----------

    /**
     * Resolve the active evaluation provider + initial fallback flag from env.
     * Returns [provider, fallbackUsed].
     *
     * @return array{0:string,1:bool}
     */
    private static function resolveProvider(): array
    {
        $mode = strtolower((string) (getenv('EVALUATION_MODE') ?: 'automated'));
        if ($mode !== 'automated') {
            // human_assisted mode would still use rule-based for the baseline.
            return ['local_rule_engine', false];
        }
        $provider = strtolower((string) (getenv('EVALUATION_PROVIDER') ?: 'local_rule_engine'));
        $allowed = ['local_rule_engine', 'local_llm_optional', 'external_ai_optional'];
        if (!in_array($provider, $allowed, true)) {
            $provider = 'local_rule_engine';
        }
        return [$provider, false];
    }

    private static function isOptionalAiProvider(string $provider): bool
    {
        return $provider === 'local_llm_optional' || $provider === 'external_ai_optional';
    }

    /** True if ANY external AI API key is configured in env. */
    private static function hasAiApiKey(): bool
    {
        foreach (['OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'GROQ_API_KEY', 'HUGGINGFACE_API_KEY'] as $k) {
            $v = (string) (getenv($k) ?: '');
            if ($v !== '') {
                return true;
            }
        }
        return false;
    }

    /**
     * Compute a 0.00–1.00 confidence score from rule-based signals:
     * length ratio, paragraph structure, dimension scores.
     */
    private static function computeConfidenceScore(
        int $wordCount, int $target,
        float $ta, float $co, float $le, float $gr
    ): float {
        if ($wordCount === 0) {
            return 0.20;
        }
        $lengthRatio = min(1.0, $wordCount / max(1, $target));
        $dimAvg = ($ta + $co + $le + $gr) / 4.0 / 9.0; // 0..1
        // Weight: 50% dimension quality, 50% length ratio.
        $score = ($dimAvg * 0.5) + ($lengthRatio * 0.5);
        return round(max(0.0, min(1.0, $score)), 2);
    }

    /**
     * Map a 0.00–1.00 confidence score to high/medium/low using the env
     * thresholds (LOW_CONFIDENCE_THRESHOLD, MEDIUM_CONFIDENCE_THRESHOLD).
     */
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

    /**
     * Stamp the no-human-mode provenance columns on an exam_ai_agent_tasks
     * row. Always sets auto_completed=1 and requires_human=0 (no-human mode
     * never blocks the student report).
     */
    private static function stampNoHumanTaskColumns(int $taskId, string $providerUsed, bool $fallbackUsed, float $confidenceScore): void
    {
        try {
            Database::update('exam_ai_agent_tasks', [
                'provider_used'     => $providerUsed,
                'fallback_used'     => $fallbackUsed ? 1 : 0,
                'confidence_score'  => number_format($confidenceScore, 2, '.', ''),
                'auto_completed'    => 1,
                'requires_human'    => 0,
                'updated_at'        => date('Y-m-d H:i:s'),
            ], 'id = :id', ['id' => $taskId]);
        } catch (\Throwable $e) {
            // The columns may not exist on legacy installs (pre-addon). Log
            // and continue — never block the evaluation result.
            @error_log('[writing_eval] stamp no-human cols failed: ' . $e->getMessage());
        }
    }

    // ---------- Heuristics (rule-based) ----------

    private static function countWords(string $text): int
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? '');
        if ($text === '') {
            return 0;
        }
        return count(explode(' ', $text));
    }

    private static function scoreTaskAchievement(int $wordCount, int $target, string $text): float
    {
        if ($wordCount === 0) {
            return 0.0;
        }
        // Length ratio: full marks at >=100% of target, scaling down.
        $ratio = min(1.0, $wordCount / max(1, $target));
        $lengthScore = $ratio * 9.0;
        // Penalise heavily short responses (< 50% target).
        if ($ratio < 0.5) {
            $lengthScore *= 0.5;
        }
        // Bonus for being on-topic: presence of any sentence with > 8 words.
        $sentences = self::splitSentences($text);
        $longSentences = count(array_filter($sentences, fn ($s) => self::countWords($s) >= 8));
        $topicScore = min(1.0, $longSentences / 3.0) * 1.0;
        return round(min(9.0, $lengthScore + $topicScore), 2);
    }

    private static function scoreCoherence(string $text): float
    {
        if (trim($text) === '') {
            return 0.0;
        }
        $lower = ' ' . strtolower($text) . ' ';
        $markerHits = 0;
        foreach (self::DISCOURSE_MARKERS as $m) {
            if (str_contains($lower, ' ' . $m . ' ') || str_contains($lower, ' ' . $m . ',') || str_contains($lower, ' ' . $m . '.')) {
                $markerHits++;
            }
        }
        $paragraphs = self::splitParagraphs($text);
        $paraCount = count($paragraphs);
        $paraScore = min(1.0, $paraCount / 3.0); // 3+ paragraphs ideal
        $markerScore = min(1.0, $markerHits / 4.0); // 4+ discourse markers ideal

        return round(($paraScore * 5.0 + $markerScore * 4.0), 2);
    }

    private static function scoreLexical(string $text): float
    {
        $words = self::tokenize($text);
        if (count($words) < 5) {
            return 0.0;
        }
        // Type-token ratio (lexical diversity) — sample first 100 words to
        // avoid penalising longer essays.
        $sample = array_slice($words, 0, 100);
        $ttr = count(array_unique($sample)) / max(1, count($sample));
        $diversityScore = min(1.0, $ttr / 0.7) * 6.0; // 0.7 TTR is strong

        // Academic vocabulary bonus.
        $lower = array_map('strtolower', $words);
        $academicHits = count(array_intersect($lower, self::ACADEMIC_TOKENS));
        $academicScore = min(3.0, $academicHits * 0.5);

        return round(min(9.0, $diversityScore + $academicScore), 2);
    }

    private static function scoreGrammar(string $text): float
    {
        $sentences = self::splitSentences($text);
        if (count($sentences) === 0) {
            return 0.0;
        }
        // Sentence-length variance (signal of grammatical range).
        $lengths = array_map(fn ($s) => self::countWords($s), $sentences);
        $lengths = array_filter($lengths, fn ($l) => $l > 0);
        if (count($lengths) < 2) {
            return 2.0;
        }
        $mean = array_sum($lengths) / count($lengths);
        $variance = 0.0;
        foreach ($lengths as $l) {
            $variance += ($l - $mean) ** 2;
        }
        $stdDev = sqrt($variance / count($lengths));
        $rangeScore = min(3.0, $stdDev / 5.0); // 5-word stddev is good

        // Penalise run-on sentences (> 40 words).
        $runOns = count(array_filter($lengths, fn ($l) => $l > 40));
        $runOnPenalty = min(2.0, $runOns * 0.5);

        // Very-light spelling heuristic: penalise 3+ same-character repeats
        // (e.g. "aaaaand") and double-space runs.
        $penalty = 0;
        if (preg_match('/(.)\1{4,}/u', $text)) {
            $penalty += 1.0;
        }
        if (preg_match('/ {3,}/', $text)) {
            $penalty += 0.5;
        }

        $base = 4.0 + $rangeScore - $runOnPenalty - $penalty;
        return round(max(0.0, min(9.0, $base)), 2);
    }

    private static function aggregateBand(float $ta, float $co, float $le, float $gr): float
    {
        // Equal-weight average, rounded to nearest 0.5.
        $avg = ($ta + $co + $le + $gr) / 4.0;
        return round($avg * 2.0) / 2.0;
    }

    /**
     * @return string[]
     */
    private static function buildImprovementPlan(
        int $wordCount, int $target,
        float $ta, float $co, float $le, float $gr
    ): array {
        $plan = [];
        if ($wordCount < $target) {
            $plan[] = sprintf(
                'Increase response length: %d words written vs %d target. Aim to develop each main point with an example or explanation.',
                $wordCount, $target
            );
        }
        if ($ta < 6.0) {
            $plan[] = 'Strengthen task response: directly address every part of the prompt and state a clear position.';
        }
        if ($co < 6.0) {
            $plan[] = 'Improve coherence: use 3–4 paragraphs and at least 4 discourse markers (e.g. "however", "furthermore", "in conclusion").';
        }
        if ($le < 6.0) {
            $plan[] = 'Expand lexical range: introduce 5+ topic-specific or academic words and avoid repetition of high-frequency verbs.';
        }
        if ($gr < 6.0) {
            $plan[] = 'Vary sentence structure: combine short and long sentences; check subject–verb agreement and verb tense.';
        }
        if ($plan === []) {
            $plan[] = 'Strong submission across all four dimensions. Continue practising with timed prompts to maintain consistency.';
        }
        $plan[] = 'Remember: this is a practice estimate, not an official exam result.';
        return $plan;
    }

    private static function splitSentences(string $text): array
    {
        $parts = preg_split('/(?<=[.!?])\s+/u', trim($text)) ?: [];
        return array_values(array_filter($parts, fn ($s) => trim($s) !== ''));
    }

    private static function splitParagraphs(string $text): array
    {
        $parts = preg_split('/\n\s*\n/u', trim($text)) ?: [];
        if (count($parts) === 1) {
            // Fall back to single newlines.
            $parts = preg_split('/\n/u', trim($text)) ?: [];
        }
        return array_values(array_filter($parts, fn ($p) => trim($p) !== ''));
    }

    /**
     * Lightweight tokenizer: lowercase words with letters only.
     * @return string[]
     */
    private static function tokenize(string $text): array
    {
        $lower = strtolower($text);
        $tokens = preg_split('/[^a-z\-\']+/u', $lower) ?: [];
        return array_values(array_filter($tokens, fn ($t) => $t !== '' && strlen($t) > 1));
    }

    /**
     * @return array{
     *   submission_id:int, attempt_id:int, word_count:int, target_word_count:int,
     *   estimated_band:float, estimated_score:float,
     *   task_achievement:float, coherence:float, lexical:float, vocabulary:float,
     *   grammar:float, improvement_plan:array<int,string>, suggested_improvement:string,
     *   is_estimated:bool, confidence_level:string, confidence_score:float,
     *   provider_used:string, fallback_used:bool,
     *   disclaimer:string, disclaimer_full:string
     * }
     */
    private static function emptyResult(int $submissionId): array
    {
        return [
            'submission_id'         => $submissionId,
            'attempt_id'            => 0,
            'word_count'            => 0,
            'target_word_count'     => self::DEFAULT_TARGET,
            'estimated_band'        => 0.0,
            'estimated_score'       => 0.0,
            'task_achievement'      => 0.0,
            'coherence'             => 0.0,
            'lexical'               => 0.0,
            'vocabulary'            => 0.0,
            'grammar'               => 0.0,
            'improvement_plan'      => ['Submission not found. Please retry.'],
            'suggested_improvement' => 'Submission not found. Please retry.',
            'is_estimated'          => true,
            'confidence_level'      => 'low',
            'confidence_score'      => 0.20,
            'provider_used'         => 'local_rule_engine',
            'fallback_used'         => false,
            'disclaimer'            => self::PRACTICE_DISCLAIMER,
            'disclaimer_full'       => SmartScoreReportService::getDisclaimer(),
        ];
    }

    // ----------------------------------------------------------------------
    // EXTERNAL AI HOOK (optional, disabled by default)
    // ----------------------------------------------------------------------
    // When EVALUATION_PROVIDER=local_llm_optional|external_ai_optional AND
    // an API key is configured in env (OPENROUTER_API_KEY, GEMINI_API_KEY,
    // GROQ_API_KEY, HUGGINGFACE_API_KEY), an optional enhancement can be
    // plugged in to refine the band estimate via an external LLM call.
    // The signature would be:
    //
    //   private static function enhanceWithExternalAi(string $text, array $ruleBased): array
    //
    // It should:
    //   - send the writing_evaluation_v1 prompt (exam_ai_agent_prompts) + text
    //   - parse the LLM JSON response
    //   - FALL BACK to the rule-based estimate on any error
    //   - NEVER claim to be a real examiner or to produce an official score
    //   - ALWAYS append the practice-only disclaimer
    //
    // Until that hook is implemented, evaluate() detects the optional
    // provider, falls back to local_rule_engine, and sets fallback_used=true.
    // This guarantees the platform works offline and remains compliant with
    // the disclosure wording in config/exams.php.
    // ----------------------------------------------------------------------
}
