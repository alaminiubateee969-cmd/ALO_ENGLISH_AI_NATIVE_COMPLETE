<?php
/**
 * app/Services/SpeakingEvaluationService.php — Rule-based speaking evaluation.
 *
 * Evaluates a speaking practice session via deterministic, rule-based
 * heuristics over the transcript:
 *   - fluency: words per minute + silence/filler ratio
 *   - pronunciation: heuristic from phonotactic complexity (lightweight)
 *   - grammar: sentence-length variance + auxiliary-verb presence
 *   - lexical: type-token ratio + academic tokens
 *   - coherence: discourse markers
 *   - confidence: response length + question-prompt echo avoidance
 *
 * Each dimension is on a 0–100 scale (per the public spec), with a final
 * band estimate (0–9) for IELTS-style mapping.
 *
 * The result is written to `exam_speaking_sessions` and a task row is
 * created for AGENT-SPEAKING-01 (public_label "ALO Practice Examiner").
 *
 * IMPORTANT: external LLM AI is OPTIONAL and DISABLED by default per .env
 * (AI_ENABLED=false). An optional enhancement hook (see bottom of file)
 * can be plugged in later. Until then, the rule-based estimate is the
 * only source of truth.
 *
 * Every result carries the practice-only disclaimer.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class SpeakingEvaluationService
{
    /** Filler words that reduce the fluency score. */
    private const FILLERS = [
        'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
        'sort of', 'kind of', 'basically', 'actually',
    ];

    /** Discourse markers that boost the coherence score. */
    private const DISCOURSE_MARKERS = [
        'first', 'second', 'finally', 'however', 'because', 'so',
        'for example', 'for instance', 'in my opinion', 'i think',
        'on the other hand', 'as a result', 'in addition',
    ];

    /** Academic / topic-rich vocabulary. */
    private const ACADEMIC_TOKENS = [
        'opportunity', 'challenge', 'develop', 'experience', 'important',
        'significant', 'perspective', 'consider', 'achieve', 'benefit',
        'culture', 'society', 'education', 'environment', 'technology',
        'communication', 'career', 'future', 'research', 'analyse',
    ];

    /** Typical IELTS-style speaking target duration (seconds). */
    private const TARGET_DURATION_SECONDS = 120;

    /**
     * Evaluate a speaking session.
     *
     * @param int $sessionId   exam_speaking_sessions.id
     * @param int $attemptId   exam_mock_attempts.id (agent task context)
     * @return array{
     *   session_id:int, duration_seconds:int, word_count:int,
     *   fluency:int, pronunciation:int, grammar:int, lexical:int,
     *   coherence:int, confidence:int, estimated_band:float,
     *   tips:array<int,string>, disclaimer:string
     * }
     */
    public static function evaluate(int $sessionId, int $attemptId): array
    {
        $session = Database::one(
            'SELECT ss.id, ss.attempt_id, ss.student_id, ss.transcript_text,
                    ss.duration_seconds, ss.audio_path
               FROM exam_speaking_sessions ss
              WHERE ss.id = :id LIMIT 1',
            ['id' => $sessionId]
        );
        if ($session === null) {
            return self::emptyResult($sessionId);
        }

        $transcript = (string) ($session['transcript_text'] ?? '');
        $duration = (int) ($session['duration_seconds'] ?? 0);

        $words = self::tokenize($transcript);
        $wordCount = count($words);

        $fluency       = self::scoreFluency($wordCount, $duration, $transcript);
        $pronunciation = self::scorePronunciation($words, $transcript);
        $grammar       = self::scoreGrammar($transcript);
        $lexical       = self::scoreLexical($words);
        $coherence     = self::scoreCoherence($transcript);
        $confidence    = self::scoreConfidence($wordCount, $duration, $transcript);

        $estimatedBand = self::bandFromPercentages(
            $fluency, $pronunciation, $grammar, $lexical, $coherence, $confidence
        );

        $tips = self::buildTips(
            $fluency, $pronunciation, $grammar, $lexical, $coherence, $confidence
        );

        $result = [
            'session_id'      => $sessionId,
            'attempt_id'      => $attemptId,
            'duration_seconds'=> $duration,
            'word_count'      => $wordCount,
            'fluency'         => $fluency,
            'pronunciation'   => $pronunciation,
            'grammar'         => $grammar,
            'lexical'         => $lexical,
            'coherence'       => $coherence,
            'confidence'      => $confidence,
            'estimated_band'  => $estimatedBand,
            'tips'            => $tips,
            'is_estimated'    => true,
            'disclaimer'      => SmartScoreReportService::getDisclaimer(),
        ];

        Database::update('exam_speaking_sessions', [
            'fluency_score'      => $fluency,
            'pronunciation_score'=> $pronunciation,
            'grammar_score'      => $grammar,
            'vocabulary_score'   => $lexical,
            'coherence_score'    => $coherence,
            'overall_band'       => number_format($estimatedBand, 2, '.', ''),
            'ai_feedback_json'   => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'status'             => 'ai_graded',
            'updated_at'         => date('Y-m-d H:i:s'),
        ], 'id = :id', ['id' => $sessionId]);

        $agent = AiAgentEmployeeService::getAgent('AGENT-SPEAKING-01');
        if ($agent !== null) {
            $taskId = AiAgentEmployeeService::createTask(
                (int) $agent['id'],
                'speaking_evaluation',
                $attemptId,
                [
                    'session_id'       => $sessionId,
                    'duration_seconds' => $duration,
                    'word_count'       => $wordCount,
                ]
            );
            AiAgentEmployeeService::completeTask($taskId, $result);
        }

        AuditService::log(null, 'speaking.evaluated', 'speaking_session', $sessionId, [
            'attempt_id'     => $attemptId,
            'duration'       => $duration,
            'word_count'     => $wordCount,
            'estimated_band' => $estimatedBand,
            'method'         => 'rule_based',
        ]);

        return $result;
    }

    /** The 6 canonical speaking-feedback dimensions (admin/UI labels). */
    public static function getFeedbackDimensions(): array
    {
        return [
            ['key' => 'fluency',       'label' => 'Fluency & Coherence',  'max' => 100],
            ['key' => 'pronunciation', 'label' => 'Pronunciation',        'max' => 100],
            ['key' => 'grammar',       'label' => 'Grammatical Range',    'max' => 100],
            ['key' => 'lexical',       'label' => 'Lexical Resource',     'max' => 100],
            ['key' => 'coherence',     'label' => 'Coherence',            'max' => 100],
            ['key' => 'confidence',    'label' => 'Confidence',           'max' => 100],
        ];
    }

    // ---------- Heuristics (0–100 scale per dimension) ----------

    private static function scoreFluency(int $wordCount, int $duration, string $text): int
    {
        if ($duration <= 0) {
            return 0;
        }
        $wpm = $wordCount / ($duration / 60.0);
        // Ideal conversational WPM is 110–150.
        $wpmScore = 0;
        if ($wpm >= 110 && $wpm <= 160) {
            $wpmScore = 90;
        } elseif ($wpm >= 80 && $wpm < 110) {
            $wpmScore = 75;
        } elseif ($wpm >= 60 && $wpm < 80) {
            $wpmScore = 60;
        } elseif ($wpm > 160 && $wpm <= 200) {
            $wpmScore = 70;
        } elseif ($wpm > 200) {
            $wpmScore = 50;
        } else {
            $wpmScore = (int) min(60, $wpm);
        }

        // Filler penalty.
        $lower = ' ' . strtolower($text) . ' ';
        $fillerHits = 0;
        foreach (self::FILLERS as $f) {
            $fillerHits += substr_count($lower, ' ' . $f . ' ');
            $fillerHits += substr_count($lower, ' ' . $f . ',');
        }
        $fillerPenalty = min(30, $fillerHits * 5);

        return (int) max(0, min(100, $wpmScore - $fillerPenalty));
    }

    private static function scorePronunciation(array $words, string $text): int
    {
        // Heuristic: longer average word length suggests more challenging
        // articulation; variety in word length signals range.
        if (count($words) < 5) {
            return 0;
        }
        $lengths = array_map('strlen', $words);
        $avg = array_sum($lengths) / count($lengths);
        $base = min(80, $avg * 12); // ~6.7 avg word length → 80

        // Bonus for varied syllable complexity (long words present).
        $longWords = count(array_filter($lengths, fn ($l) => $l >= 8));
        $complexityBonus = min(15, $longWords * 3);

        // Penalty for repeated stutter-like patterns (e.g. "I I I").
        $lower = strtolower($text);
        $stutter = preg_match_all('/\b(\w+)\s+\1\s+\1\b/', $lower) ?: 0;
        $stutterPenalty = min(20, $stutter * 5);

        return (int) max(0, min(100, $base + $complexityBonus - $stutterPenalty));
    }

    private static function scoreGrammar(string $text): int
    {
        $sentences = self::splitSentences($text);
        if (count($sentences) === 0) {
            return 0;
        }
        // Sentence-length variance → grammar range signal.
        $lengths = array_map(fn ($s) => count(explode(' ', $s)), $sentences);
        $lengths = array_filter($lengths, fn ($l) => $l > 0);
        if (count($lengths) < 2) {
            return 40;
        }
        $mean = array_sum($lengths) / count($lengths);
        $variance = 0.0;
        foreach ($lengths as $l) {
            $variance += ($l - $mean) ** 2;
        }
        $stdDev = sqrt($variance / count($lengths));
        $rangeScore = min(40, $stdDev * 6.0);

        // Auxiliary / modal verbs presence (signal of grammatical range).
        $lower = ' ' . strtolower($text) . ' ';
        $modals = ['can', 'could', 'should', 'would', 'may', 'might', 'must', 'have', 'has', 'had', 'is', 'are', 'was', 'were'];
        $modalHits = 0;
        foreach ($modals as $m) {
            $modalHits += substr_count($lower, ' ' . $m . ' ');
        }
        $modalScore = min(30, $modalHits * 3);

        // Penalty for very short choppy responses.
        $choppyPenalty = 0;
        if ($mean < 6) {
            $choppyPenalty = 15;
        }

        return (int) max(0, min(100, 30 + $rangeScore + $modalScore - $choppyPenalty));
    }

    private static function scoreLexical(array $words): int
    {
        if (count($words) < 5) {
            return 0;
        }
        $sample = array_slice($words, 0, 100);
        $ttr = count(array_unique($sample)) / max(1, count($sample));
        $diversityScore = min(70, (int) ($ttr * 100));

        $lower = array_map('strtolower', $words);
        $academicHits = count(array_intersect($lower, self::ACADEMIC_TOKENS));
        $academicScore = min(30, $academicHits * 5);

        return (int) max(0, min(100, $diversityScore + $academicScore));
    }

    private static function scoreCoherence(string $text): int
    {
        $lower = ' ' . strtolower($text) . ' ';
        $markerHits = 0;
        foreach (self::DISCOURSE_MARKERS as $m) {
            $markerHits += substr_count($lower, ' ' . $m . ' ');
            $markerHits += substr_count($lower, ' ' . $m . ',');
        }
        $markerScore = min(70, $markerHits * 14);

        // Multi-sentence presence bonus.
        $sentCount = count(self::splitSentences($text));
        $sentenceScore = min(30, $sentCount * 5);

        return (int) max(0, min(100, $markerScore + $sentenceScore));
    }

    private static function scoreConfidence(int $wordCount, int $duration, string $text): int
    {
        if ($duration <= 0) {
            return 0;
        }
        // Confidence ≈ willingness to elaborate: target 100+ words in 90s.
        $targetWords = max(60, ($duration / 90.0) * 100);
        $lengthScore = min(60, (int) (60 * ($wordCount / $targetWords)));

        // Penalty for echo-style responses (re-using the exact prompt).
        // Detected as 3+ consecutive words starting with "I" + verb.
        $lower = strtolower($text);
        $echoPenalty = 0;
        if (preg_match_all('/\bi (think|believe|feel|guess)\b/', $lower) >= 4) {
            $echoPenalty = 10;
        }

        return (int) max(0, min(100, $lengthScore + 40 - $echoPenalty));
    }

    private static function bandFromPercentages(
        int $fluency, int $pronunciation, int $grammar,
        int $lexical, int $coherence, int $confidence
    ): float {
        $avg = ($fluency + $pronunciation + $grammar + $lexical + $coherence + $confidence) / 6.0;
        $band = ($avg / 100.0) * 9.0;
        return round($band * 2.0) / 2.0;
    }

    /**
     * @return string[]
     */
    private static function buildTips(
        int $fluency, int $pronunciation, int $grammar,
        int $lexical, int $coherence, int $confidence
    ): array {
        $tips = [];
        if ($fluency < 70) {
            $tips[] = 'Practice speaking in 60–90 second bursts without long pauses. Aim for ~120 words per minute.';
        }
        if ($pronunciation < 70) {
            $tips[] = 'Record yourself reading aloud and contrast with a model audio. Focus on word stress and ending consonants.';
        }
        if ($grammar < 70) {
            $tips[] = 'Use a mix of simple, compound, and complex sentences. Add a modal or conditional in each response.';
        }
        if ($lexical < 70) {
            $tips[] = 'Introduce 3+ topic-specific words per answer. Avoid repeating "good", "bad", "thing".';
        }
        if ($coherence < 70) {
            $tips[] = 'Open with "In my opinion…", add "For example…", and close with "Overall…".';
        }
        if ($confidence < 70) {
            $tips[] = 'Build confidence by extending each answer with one extra detail or example before stopping.';
        }
        if ($tips === []) {
            $tips[] = 'Strong response across all six dimensions. Maintain pace and vary your vocabulary to push higher.';
        }
        $tips[] = 'Remember: this is a practice estimate, not an official exam result.';
        return $tips;
    }

    // ---------- Helpers ----------

    private static function splitSentences(string $text): array
    {
        $parts = preg_split('/(?<=[.!?])\s+/u', trim($text)) ?: [];
        return array_values(array_filter($parts, fn ($s) => trim($s) !== ''));
    }

    /**
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
     *   session_id:int, duration_seconds:int, word_count:int,
     *   fluency:int, pronunciation:int, grammar:int, lexical:int,
     *   coherence:int, confidence:int, estimated_band:float,
     *   tips:array<int,string>, disclaimer:string
     * }
     */
    private static function emptyResult(int $sessionId): array
    {
        return [
            'session_id'      => $sessionId,
            'attempt_id'      => 0,
            'duration_seconds'=> 0,
            'word_count'      => 0,
            'fluency'         => 0,
            'pronunciation'   => 0,
            'grammar'         => 0,
            'lexical'         => 0,
            'coherence'       => 0,
            'confidence'      => 0,
            'estimated_band'  => 0.0,
            'tips'            => ['Session not found. Please retry.'],
            'is_estimated'    => true,
            'disclaimer'      => SmartScoreReportService::getDisclaimer(),
        ];
    }

    // ----------------------------------------------------------------------
    // EXTERNAL AI HOOK (optional, disabled by default)
    // ----------------------------------------------------------------------
    // When AI_ENABLED=true AND an API key is configured in config/exams.php
    // (config key: 'ai.providers.openrouter|gemini|groq|huggingface'),
    // an optional enhancement can be plugged in to refine the speaking
    // estimate via an external LLM call over the audio transcript. The
    // signature would be:
    //
    //   private static function enhanceWithExternalAi(string $transcript, array $ruleBased): array
    //
    // It should:
    //   - send the speaking_evaluation_v1 prompt + transcript text
    //   - parse the LLM JSON response
    //   - FALL BACK to the rule-based estimate on any error or timeout
    //   - NEVER claim to be a real examiner or to produce an official score
    //   - ALWAYS append the practice-only disclaimer
    //
    // Until that hook is implemented and AI_ENABLED=true, the rule-based
    // estimate returned above is the only source of truth.
    // ----------------------------------------------------------------------
}
