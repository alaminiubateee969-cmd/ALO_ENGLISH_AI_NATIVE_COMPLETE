<?php
/**
 * app/Services/InterviewSimulationService.php — Practice interview coach.
 *
 * Simulates interview practice sessions across 5 interview types:
 *   - uk_credibility  (UK visa credibility interview)
 *   - cas             (UK CAS / Confirmation of Acceptance for Studies)
 *   - visa            (generic visa interview)
 *   - scholarship     (scholarship panel)
 *   - admission       (university admission interview)
 *
 * Each session is recorded as a task for AGENT-INTERVIEW-01 (public_label
 * "Practice Interview Coach"). The service:
 *   - startInterview: returns first question + prep timer (60s)
 *   - getNextQuestion: returns a context-aware follow-up based on keywords
 *     detected in the student's last response
 *   - scoreInterview: returns a confidence score (0–100), a risk level
 *     (low / medium / high), and structured feedback
 *
 * NO-HUMAN PRACTICE EXAM MODE (Task ID: NO-HUMAN):
 *   - scoreInterview() returns the no-human-mode keys:
 *     credibility_risk_level, financial_explanation_quality,
 *     course_knowledge_quality, career_plan_consistency,
 *     follow_up_question_suggestions, improvement_tips,
 *     confidence_level, provider_used, disclaimer.
 *   - Every task row is stamped with provider_used, fallback_used,
 *     confidence_score, auto_completed=1, requires_human=0.
 *
 * All wording is practice-focused. The disclaimer appears on every output.
 * External LLM AI is OPTIONAL and DISABLED by default per env.
 *
 * COMPLIANCE: Never claims to be a "real examiner", "official examiner",
 * "AI teacher", "bot", "real interviewer", or to produce an "official
 * assessment". External AI is OPTIONAL; local_rule_engine always works
 * without any API key.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

final class InterviewSimulationService
{
    public const TYPE_UK_CREDIBILITY = 'uk_credibility';
    public const TYPE_CAS            = 'cas';
    public const TYPE_VISA           = 'visa';
    public const TYPE_SCHOLARSHIP    = 'scholarship';
    public const TYPE_ADMISSION      = 'admission';

    public const ALL_TYPES = [
        self::TYPE_UK_CREDIBILITY,
        self::TYPE_CAS,
        self::TYPE_VISA,
        self::TYPE_SCHOLARSHIP,
        self::TYPE_ADMISSION,
    ];

    /** Prep timer (seconds) given before the first question. */
    public const PREP_TIMER_SECONDS = 60;

    /** Max questions per session before scoring is forced. */
    public const MAX_QUESTIONS = 8;

    /** Short practice-only disclaimer (NO-HUMAN mode spec). */
    public const PRACTICE_DISCLAIMER = 'Practice only. Not an official interview assessment.';

    /**
     * Start a new practice interview session.
     *
     * @param int    $studentId
     * @param string $interviewType  one of ALL_TYPES
     * @return array{
     *   session_token:string, interview_type:string, question_number:int,
     *   current_question:string, prep_timer_seconds:int,
     *   total_questions_planned:int, disclaimer:string
     * }
     */
    public static function startInterview(int $studentId, string $interviewType): array
    {
        if (!in_array($interviewType, self::ALL_TYPES, true)) {
            $interviewType = self::TYPE_UK_CREDIBILITY;
        }

        $agent = AiAgentEmployeeService::getAgent('AGENT-INTERVIEW-01');
        $agentId = $agent === null ? null : (int) $agent['id'];

        $sessionToken = self::generateSessionToken($interviewType);
        $firstQuestion = self::firstQuestionFor($interviewType);

        // Persist an agent task (pending). Each follow-up appends to the
        // payload via completeTask / re-open pattern; for simplicity we
        // store the full transcript inside the result payload at score time.
        $taskId = 0;
        if ($agentId !== null) {
            $taskId = AiAgentEmployeeService::createTask(
                $agentId,
                'interview_simulation',
                null,
                [
                    'session_token'  => $sessionToken,
                    'student_id'     => $studentId,
                    'interview_type' => $interviewType,
                    'started_at'     => date('Y-m-d H:i:s'),
                ]
            );
        }

        // Persist the session locally so follow-up scoring has state.
        Database::insert('exam_ai_agent_settings', [
            'agent_code'    => 'AGENT-INTERVIEW-01',
            'setting_key'   => 'session:' . $sessionToken,
            'setting_value' => json_encode([
                'student_id'      => $studentId,
                'interview_type'  => $interviewType,
                'task_id'         => $taskId,
                'questions'       => [$firstQuestion],
                'responses'       => [],
                'started_at'      => date('Y-m-d H:i:s'),
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'is_secret'  => 0,
            'updated_by' => null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        AuditService::log(null, 'interview.started', 'student', $studentId, [
            'interview_type' => $interviewType,
            'session_token'  => $sessionToken,
        ]);

        return [
            'session_token'             => $sessionToken,
            'interview_type'            => $interviewType,
            'question_number'           => 1,
            'current_question'          => $firstQuestion,
            'prep_timer_seconds'        => self::PREP_TIMER_SECONDS,
            'total_questions_planned'   => self::MAX_QUESTIONS,
            'disclaimer'                => SmartScoreReportService::getDisclaimer(),
        ];
    }

    /**
     * Given the student's last response, return the next question (or the
     * scoring signal if MAX_QUESTIONS reached).
     *
     * @param string $sessionToken
     * @param string $lastResponse
     * @return array{
     *   session_token:string, question_number:int, current_question:string,
     *   is_final:bool, follow_up_type:string, disclaimer:string
     * }
     */
    public static function getNextQuestion(string $sessionToken, string $lastResponse): array
    {
        $state = self::loadSession($sessionToken);
        if ($state === null) {
            return [
                'session_token'   => $sessionToken,
                'question_number' => 0,
                'current_question'=> 'Session not found. Please start a new interview.',
                'is_final'        => true,
                'follow_up_type'  => 'none',
                'disclaimer'      => SmartScoreReportService::getDisclaimer(),
            ];
        }

        $responses = $state['responses'];
        $responses[] = $lastResponse;
        $state['responses'] = $responses;

        $questionNumber = count($state['questions']) + 1;
        if ($questionNumber > self::MAX_QUESTIONS) {
            self::saveSession($sessionToken, $state);
            return [
                'session_token'   => $sessionToken,
                'question_number' => self::MAX_QUESTIONS,
                'current_question'=> 'That concludes the practice interview. Call scoreInterview to receive your feedback.',
                'is_final'        => true,
                'follow_up_type'  => 'conclusion',
                'disclaimer'      => SmartScoreReportService::getDisclaimer(),
            ];
        }

        $followUp = self::pickFollowUp($state['interview_type'], $lastResponse, $state['questions']);
        $state['questions'][] = $followUp['question'];
        self::saveSession($sessionToken, $state);

        return [
            'session_token'   => $sessionToken,
            'question_number' => $questionNumber,
            'current_question'=> $followUp['question'],
            'is_final'        => false,
            'follow_up_type'  => $followUp['type'],
            'disclaimer'      => SmartScoreReportService::getDisclaimer(),
        ];
    }

    /**
     * Score the interview session.
     *
     * Returns the legacy fields plus the no-human-mode keys:
     *   - credibility_risk_level (low / medium / high)
     *   - financial_explanation_quality (0–100)
     *   - course_knowledge_quality (0–100)
     *   - career_plan_consistency (0–100)
     *   - follow_up_question_suggestions (string[])
     *   - improvement_tips (string[])
     *   - confidence_level (high / medium / low)
     *   - provider_used (string)
     *   - disclaimer ("Practice only. Not an official interview assessment.")
     *
     * @return array{
     *   session_token:string, interview_type:string, questions_asked:int,
     *   confidence:int, risk_level:string, credibility_risk_level:string,
     *   financial_explanation_quality:int, course_knowledge_quality:int,
     *   career_plan_consistency:int,
     *   follow_up_question_suggestions:array<int,string>,
     *   feedback:array<int,string>, improvement_tips:array<int,string>,
     *   strengths:array<int,string>, weaknesses:array<int,string>,
     *   is_estimated:bool, confidence_level:string, confidence_score:float,
     *   provider_used:string, fallback_used:bool,
     *   disclaimer:string, disclaimer_full:string
     * }
     */
    public static function scoreInterview(string $sessionToken): array
    {
        $state = self::loadSession($sessionToken);
        if ($state === null) {
            return [
                'session_token'  => $sessionToken,
                'interview_type' => 'unknown',
                'questions_asked'=> 0,
                'confidence'     => 0,
                'risk_level'     => 'high',
                'credibility_risk_level' => 'high',
                'financial_explanation_quality' => 0,
                'course_knowledge_quality'      => 0,
                'career_plan_consistency'       => 0,
                'follow_up_question_suggestions' => [],
                'feedback'       => ['Session not found. Please start a new interview.'],
                'improvement_tips' => ['Session not found. Please start a new interview.'],
                'strengths'      => [],
                'weaknesses'     => ['No responses recorded.'],
                'is_estimated'   => true,
                'confidence_level' => 'low',
                'confidence_score' => 0.20,
                'provider_used'  => 'local_rule_engine',
                'fallback_used'  => false,
                'disclaimer'     => self::PRACTICE_DISCLAIMER,
                'disclaimer_full'=> SmartScoreReportService::getDisclaimer(),
            ];
        }

        // ----- No-Human mode: provider resolution -----
        [$providerUsed, $fallbackUsed] = self::resolveProvider();

        $responses = $state['responses'];
        $questionsAsked = count($state['questions']);
        $confidence = self::scoreConfidence($responses);
        $riskLevel = self::riskLevelFromConfidence($confidence);

        // ----- No-Human mode: domain dimension scores (0–100) -----
        $financialQuality = self::scoreFinancialExplanation($responses);
        $courseQuality    = self::scoreCourseKnowledge($responses);
        $careerConsistency= self::scoreCareerPlanConsistency($responses);

        [$strengths, $weaknesses] = self::strengthsWeaknesses($responses, $state['interview_type']);
        $feedback = self::buildFeedback($state['interview_type'], $confidence, $weaknesses);
        $improvementTips = self::buildImprovementTips($weaknesses);
        $followUpSuggestions = self::buildFollowUpSuggestions($state['interview_type'], $weaknesses);

        // ----- Optional external AI enhancement hook -----
        if (self::isOptionalAiProvider($providerUsed)) {
            if (!self::hasAiApiKey()) {
                $providerUsed = 'local_rule_engine';
                $fallbackUsed = true;
            } else {
                // @codeCoverageIgnoreStart
                // PLACEHOLDER: actual external AI API call goes here to
                // refine follow-up suggestions and domain scores. Until
                // the external client is wired, fall back so the platform
                // never depends on an external API.
                $providerUsed = 'local_rule_engine';
                $fallbackUsed = true;
                // @codeCoverageIgnoreEnd
            }
        }

        // ----- No-Human mode: confidence scoring (0.00–1.00) -----
        $confidenceScore = self::computeConfidenceScore(
            $confidence, $financialQuality, $courseQuality, $careerConsistency, $questionsAsked
        );
        $confidenceLevel = self::confidenceLevelFromScore($confidenceScore);

        $result = [
            'session_token'  => $sessionToken,
            'interview_type' => $state['interview_type'],
            'questions_asked'=> $questionsAsked,
            'confidence'     => $confidence,
            'risk_level'     => $riskLevel,
            'credibility_risk_level' => $riskLevel, // alias for no-human mode
            'financial_explanation_quality' => $financialQuality,
            'course_knowledge_quality'      => $courseQuality,
            'career_plan_consistency'       => $careerConsistency,
            'follow_up_question_suggestions' => $followUpSuggestions,
            'feedback'       => $feedback,
            'improvement_tips' => $improvementTips,
            'strengths'      => $strengths,
            'weaknesses'     => $weaknesses,
            'is_estimated'   => true,
            'confidence_level' => $confidenceLevel,
            'confidence_score' => $confidenceScore,
            'provider_used'  => $providerUsed,
            'fallback_used'  => $fallbackUsed,
            'disclaimer'     => self::PRACTICE_DISCLAIMER,
            'disclaimer_full'=> SmartScoreReportService::getDisclaimer(),
        ];

        // Complete the AGENT-INTERVIEW-01 task and stamp the no-human-mode
        // provenance columns on the task row.
        if (!empty($state['task_id'])) {
            AiAgentEmployeeService::completeTask((int) $state['task_id'], $result);
            self::stampNoHumanTaskColumns(
                (int) $state['task_id'], $providerUsed, $fallbackUsed, $confidenceScore
            );
        }
        self::deleteSession($sessionToken);

        AuditService::log(null, 'interview.scored', 'student', (int) $state['student_id'], [
            'interview_type'  => $state['interview_type'],
            'confidence'      => $confidence,
            'risk_level'      => $riskLevel,
            'questions_asked' => $questionsAsked,
            'method'          => $providerUsed,
            'fallback_used'   => $fallbackUsed,
            'confidence_level'=> $confidenceLevel,
        ]);

        return $result;
    }

    // ---------- No-Human mode helpers ----------

    /**
     * Resolve the active evaluation provider + initial fallback flag from env.
     * @return array{0:string,1:bool}
     */
    private static function resolveProvider(): array
    {
        $mode = strtolower((string) (getenv('EVALUATION_MODE') ?: 'automated'));
        if ($mode !== 'automated') {
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
     * Score the financial-explanation quality (0–100) based on keyword
     * coverage of sponsor / funds / fees / evidence / bank statements.
     *
     * @param string[] $responses
     */
    private static function scoreFinancialExplanation(array $responses): int
    {
        if ($responses === []) {
            return 0;
        }
        $lower = ' ' . strtolower(implode(' ', $responses)) . ' ';
        $keywords = [
            'sponsor', 'funds', 'funded', 'finance', 'fees', 'tuition',
            'bank statement', 'bank account', 'savings', 'loan', 'scholarship',
            'evidence', 'documents', 'proof', 'income', 'parent', 'family',
        ];
        $hits = 0;
        foreach ($keywords as $k) {
            if (str_contains($lower, ' ' . $k . ' ') || str_contains($lower, ' ' . $k . ',') || str_contains($lower, ' ' . $k . '.')) {
                $hits++;
            }
        }
        return (int) max(0, min(100, 30 + $hits * 10));
    }

    /**
     * Score course-knowledge quality (0–100) based on keyword coverage of
     * module / subject / topic / course / programme / research interest.
     *
     * @param string[] $responses
     */
    private static function scoreCourseKnowledge(array $responses): int
    {
        if ($responses === []) {
            return 0;
        }
        $lower = ' ' . strtolower(implode(' ', $responses)) . ' ';
        $keywords = [
            'module', 'subject', 'topic', 'course', 'programme', 'program',
            'curriculum', 'syllabus', 'research', 'specialise', 'specialize',
            'module', 'faculty', 'professor', 'dissertation', 'thesis',
            'career', 'industry', 'market', 'ranking', 'reputation',
        ];
        $hits = 0;
        foreach ($keywords as $k) {
            if (str_contains($lower, ' ' . $k . ' ') || str_contains($lower, ' ' . $k . ',') || str_contains($lower, ' ' . $k . '.')) {
                $hits++;
            }
        }
        return (int) max(0, min(100, 25 + $hits * 9));
    }

    /**
     * Score career-plan consistency (0–100) based on return-home / future
     * / career goal keyword coverage.
     *
     * @param string[] $responses
     */
    private static function scoreCareerPlanConsistency(array $responses): int
    {
        if ($responses === []) {
            return 0;
        }
        $lower = ' ' . strtolower(implode(' ', $responses)) . ' ';
        $keywords = [
            'return home', 'home country', 'go back', 'come back',
            'future', 'plan', 'goal', 'career', 'work as', 'become',
            'aim to', 'intend to', 'long-term', 'five year', '5 year',
            'apply', 'job', 'position', 'company',
        ];
        $hits = 0;
        foreach ($keywords as $k) {
            if (str_contains($lower, ' ' . $k . ' ') || str_contains($lower, ' ' . $k . ',') || str_contains($lower, ' ' . $k . '.')) {
                $hits++;
            }
        }
        return (int) max(0, min(100, 25 + $hits * 9));
    }

    /**
     * @param string[] $weaknesses
     * @return string[]
     */
    private static function buildImprovementTips(array $weaknesses): array
    {
        $tips = [];
        foreach ($weaknesses as $w) {
            $tips[] = 'Improvement tip: ' . $w;
        }
        if ($tips === []) {
            $tips[] = 'Continue timed mock interviews to refine pacing and clarity.';
        }
        $tips[] = 'Remember: this is a practice estimate, not an official interview assessment.';
        return $tips;
    }

    /**
     * @param string[] $weaknesses
     * @return string[]
     */
    private static function buildFollowUpSuggestions(string $interviewType, array $weaknesses): array
    {
        $suggestions = [];
        foreach ($weaknesses as $w) {
            $suggestions[] = 'Follow-up to rehearse: ' . $w;
        }
        $bank = self::followUpBank($interviewType);
        foreach ($bank as $q) {
            if (count($suggestions) >= 5) {
                break;
            }
            $suggestions[] = $q;
        }
        return array_slice($suggestions, 0, 5);
    }

    /**
     * Compute a 0.00–1.00 confidence score from the rule-based signals.
     *
     * @param int $confidence       0–100 overall confidence
     * @param int $financialQuality 0–100
     * @param int $courseQuality    0–100
     * @param int $careerConsistency 0–100
     * @param int $questionsAsked   number of questions completed
     */
    private static function computeConfidenceScore(
        int $confidence, int $financialQuality, int $courseQuality,
        int $careerConsistency, int $questionsAsked
    ): float {
        if ($questionsAsked === 0) {
            return 0.20;
        }
        $domainAvg = ($financialQuality + $courseQuality + $careerConsistency) / 3.0 / 100.0;
        $confScore = $confidence / 100.0;
        $coverage  = min(1.0, $questionsAsked / self::MAX_QUESTIONS);
        // Weight: 40% overall confidence, 40% domain quality, 20% coverage.
        $score = ($confScore * 0.4) + ($domainAvg * 0.4) + ($coverage * 0.2);
        return round(max(0.0, min(1.0, $score)), 2);
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
            @error_log('[interview_eval] stamp no-human cols failed: ' . $e->getMessage());
        }
    }

    // ---------- Question banks (rule-based, original content) ----------

    /**
     * First question per interview type. Original content — not copied from
     * any official source. Always phrased as practice.
     */
    private static function firstQuestionFor(string $type): string
    {
        return match ($type) {
            self::TYPE_UK_CREDIBILITY => 'Thank you for joining this practice session. To begin, could you briefly introduce yourself and explain why you have chosen to study in the United Kingdom?',
            self::TYPE_CAS            => 'Welcome to your CAS practice interview. Why have you selected this particular course and this university for your studies?',
            self::TYPE_VISA           => 'Hello, and welcome to your visa interview practice. Could you please state your full name and confirm the purpose of your travel?',
            self::TYPE_SCHOLARSHIP    => 'Thank you for applying for this scholarship. Could you tell us what makes you a strong candidate and how this scholarship would support your goals?',
            self::TYPE_ADMISSION      => 'Welcome to your admission interview practice. Please introduce yourself and tell us what motivated you to apply to our programme.',
            default                   => 'Welcome to your practice interview. Please introduce yourself and tell us about your study goals.',
        };
    }

    /**
     * Pick a follow-up question based on the student's last response
     * keywords. Returns [question, follow_up_type].
     *
     * @param string[] $previousQuestions
     * @return array{question:string,type:string}
     */
    private static function pickFollowUp(string $interviewType, string $lastResponse, array $previousQuestions): array
    {
        $lower = strtolower($lastResponse);

        // Keyword-driven follow-ups (generic across interview types).
        if (preg_match('/\b(family|parent|brother|sister|mother|father)\b/', $lower)) {
            return [
                'question' => 'Could you tell me how your family supports your decision to study abroad?',
                'type'     => 'family',
            ];
        }
        if (preg_match('/\b(finance|funded|sponsor|money|fees|cost|tuition)\b/', $lower)) {
            return [
                'question' => 'Could you provide more detail on how your studies will be funded, and what evidence you would prepare to demonstrate this?',
                'type'     => 'finance',
            ];
        }
        if (preg_match('/\b(work|job|career|employ)\b/', $lower)) {
            return [
                'question' => 'How does this course connect with your long-term career plans after you return home?',
                'type'     => 'career',
            ];
        }
        if (preg_match('/\b(accommodation|housing|stay|live)\b/', $lower)) {
            return [
                'question' => 'Where do you plan to live during your studies, and have you made any arrangements yet?',
                'type'     => 'accommodation',
            ];
        }
        if (preg_match('/\b(english|ielts|toefl|language)\b/', $lower)) {
            return [
                'question' => 'Could you describe the steps you have taken to ensure your English is ready for academic study?',
                'type'     => 'language',
            ];
        }
        if (preg_match('/\b(country|uk|canada|australia|usa|abroad)\b/', $lower)) {
            return [
                'question' => 'What made you choose this country specifically, rather than studying at home or elsewhere?',
                'type'     => 'country',
            ];
        }
        if (preg_match('/\b(course|programme|subject|degree|major)\b/', $lower)) {
            return [
                'question' => 'What specific modules or topics within this course interest you the most, and why?',
                'type'     => 'course_detail',
            ];
        }
        if (preg_match('/\b(university|college|school|institution)\b/', $lower)) {
            return [
                'question' => 'Why did you choose this university over other institutions offering a similar course?',
                'type'     => 'university_choice',
            ];
        }
        if (preg_match('/\b(return|home|future|plan)\b/', $lower)) {
            return [
                'question' => 'Could you outline what you intend to do in the first 12 months after completing your studies?',
                'type'     => 'post_study',
            ];
        }

        // Default rotators per interview type (so questions never repeat verbatim).
        $bank = self::followUpBank($interviewType);
        foreach ($bank as $q) {
            if (!in_array($q, $previousQuestions, true)) {
                return ['question' => $q, 'type' => 'general'];
            }
        }
        // All exhausted — loop safely.
        return ['question' => $bank[0] ?? 'Could you elaborate on that?', 'type' => 'general'];
    }

    /**
     * @return string[]
     */
    private static function followUpBank(string $type): array
    {
        return match ($type) {
            self::TYPE_UK_CREDIBILITY => [
                'Why have you chosen to study in the United Kingdom rather than another English-speaking country?',
                'How does this course fit with your long-term career plans in your home country?',
                'Can you explain how your studies will be funded?',
                'What do you know about the city or town where your university is located?',
                'How will this qualification help you when you return home?',
            ],
            self::TYPE_CAS => [
                'What attracted you to this specific course rather than similar programmes?',
                'How did you research this university before applying?',
                'Could you describe a module from the course that you are particularly looking forward to?',
                'What are your plans after completing this course?',
                'How does this course build on your previous studies?',
            ],
            self::TYPE_VISA => [
                'What is the purpose of your visit and how long do you intend to stay?',
                'Could you describe the documents you have brought to support your application?',
                'Do you have family or friends in the destination country?',
                'What ties do you have to your home country that will ensure your return?',
                'How will you support yourself financially during your stay?',
            ],
            self::TYPE_SCHOLARSHIP => [
                'Could you describe an academic achievement you are particularly proud of?',
                'How would this scholarship change your ability to pursue your studies?',
                'Tell us about a challenge you have overcome and what you learned from it.',
                'How do you plan to contribute to the community if you receive this scholarship?',
                'Where do you see yourself in five years, and how does this scholarship help?',
            ],
            self::TYPE_ADMISSION => [
                'Why are you interested in this programme at our institution?',
                'Could you describe a project or piece of work that demonstrates your readiness for this programme?',
                'What would you contribute to the cohort inside and outside the classroom?',
                'How do you handle working in teams with people from different backgrounds?',
                'What is a subject area you would like to explore more deeply during this programme?',
            ],
            default => [
                'Could you elaborate on that?',
                'Why do you say so?',
                'Could you give an example?',
            ],
        };
    }

    // ---------- Scoring ----------

    /**
     * Confidence score 0–100 based on response length, lexical diversity,
     * and absence of hesitant fillers.
     *
     * @param string[] $responses
     */
    private static function scoreConfidence(array $responses): int
    {
        if ($responses === []) {
            return 0;
        }
        $totalWords = 0;
        $fillerHits = 0;
        $uniqueWords = [];
        foreach ($responses as $r) {
            $words = preg_split('/\s+/u', trim($r)) ?: [];
            $words = array_filter($words, fn ($w) => $w !== '');
            $totalWords += count($words);
            foreach ($words as $w) {
                $uniqueWords[strtolower($w)] = true;
            }
            $lower = ' ' . strtolower($r) . ' ';
            foreach (['um', 'uh', 'er', 'like', 'you know', 'i mean', 'maybe'] as $filler) {
                $fillerHits += substr_count($lower, ' ' . $filler . ' ');
            }
        }
        // Length score: ~100 words per response is strong.
        $avgWords = $totalWords / max(1, count($responses));
        $lengthScore = min(40, (int) ($avgWords * 0.4));
        // Diversity bonus.
        $diversityScore = min(30, (int) (count($uniqueWords) / 5));
        // Filler penalty.
        $fillerPenalty = min(20, $fillerHits * 2);
        return (int) max(0, min(100, 30 + $lengthScore + $diversityScore - $fillerPenalty));
    }

    private static function riskLevelFromConfidence(int $confidence): string
    {
        if ($confidence >= 75) {
            return 'low';
        }
        if ($confidence >= 50) {
            return 'medium';
        }
        return 'high';
    }

    /**
     * @return array{0:array<int,string>,1:array<int,string>} [strengths, weaknesses]
     */
    private static function strengthsWeaknesses(array $responses, string $interviewType): array
    {
        $strengths = [];
        $weaknesses = [];

        $avgLen = 0;
        foreach ($responses as $r) {
            $avgLen += count(preg_split('/\s+/u', trim($r)) ?: []);
        }
        $avgLen = $responses === [] ? 0 : (int) ($avgLen / count($responses));

        if ($avgLen >= 80) {
            $strengths[] = 'Developed answers with adequate supporting detail.';
        } elseif ($avgLen < 30) {
            $weaknesses[] = 'Responses are too brief; aim for 60–100 words per answer with one concrete example.';
        }

        $lower = implode(' ', array_map('strtolower', $responses));
        if (str_contains($lower, 'i think') || str_contains($lower, 'i believe')) {
            $strengths[] = 'Clear opinion phrasing ("I think", "I believe") signals confidence.';
        }
        if (preg_match_all('/\b(um|uh|er)\b/', $lower) >= 5) {
            $weaknesses[] = 'Frequent filler words ("um", "uh") reduce perceived fluency — pause silently instead.';
        }
        if (str_contains($lower, 'i don\'t know') || str_contains($lower, 'i do not know')) {
            $weaknesses[] = 'Avoid "I don\'t know" — reframe as "I would need to research that further".';
        }

        // Type-specific signals.
        if ($interviewType === self::TYPE_UK_CREDIBILITY || $interviewType === self::TYPE_VISA) {
            if (!str_contains($lower, 'return') && !str_contains($lower, 'home') && !str_contains($lower, 'home country')) {
                $weaknesses[] = 'No mention of intent to return home — explicitly state your post-study return plans.';
            }
        }
        if ($interviewType === self::TYPE_SCHOLARSHIP) {
            if (!str_contains($lower, 'goal') && !str_contains($lower, 'future') && !str_contains($lower, 'plan')) {
                $weaknesses[] = 'Connect your answers explicitly to your long-term goals and the scholarship\'s purpose.';
            }
        }

        if ($strengths === []) {
            $strengths[] = 'Completed the full practice session — repetition will build confidence.';
        }
        if ($weaknesses === []) {
            $weaknesses[] = 'No major red flags detected; continue refining specific examples and transitions.';
        }
        return [$strengths, $weaknesses];
    }

    /**
     * @param string[] $weaknesses
     * @return string[]
     */
    private static function buildFeedback(string $interviewType, int $confidence, array $weaknesses): array
    {
        $label = match ($interviewType) {
            self::TYPE_UK_CREDIBILITY => 'UK credibility interview',
            self::TYPE_CAS            => 'CAS interview',
            self::TYPE_VISA           => 'visa interview',
            self::TYPE_SCHOLARSHIP    => 'scholarship interview',
            self::TYPE_ADMISSION      => 'admission interview',
            default                   => 'practice interview',
        };

        $feedback = [];
        $feedback[] = sprintf(
            'You completed a %s practice session with an estimated confidence score of %d/100.',
            $label, $confidence
        );
        foreach ($weaknesses as $w) {
            $feedback[] = 'Focus area: ' . $w;
        }
        $feedback[] = 'Practise aloud in front of a mirror or with a friend to refine pacing and clarity.';
        $feedback[] = 'Remember: this is a practice estimate, not an official assessment.';
        return $feedback;
    }

    // ---------- Session persistence ----------

    private static function generateSessionToken(string $type): string
    {
        $suffix = strtoupper(substr(sodium_bin2hex(random_bytes(6)), 0, 12));
        return 'IV-' . strtoupper($type) . '-' . date('Ymd') . '-' . $suffix;
    }

    private static function loadSession(string $token): ?array
    {
        $row = Database::one(
            'SELECT setting_value FROM exam_ai_agent_settings
              WHERE agent_code = :ac AND setting_key = :sk LIMIT 1',
            ['ac' => 'AGENT-INTERVIEW-01', 'sk' => 'session:' . $token]
        );
        if ($row === null) {
            return null;
        }
        $data = json_decode((string) $row['setting_value'], true);
        if (!is_array($data)) {
            return null;
        }
        return $data;
    }

    private static function saveSession(string $token, array $state): void
    {
        Database::update('exam_ai_agent_settings', [
            'setting_value' => json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'updated_at'    => date('Y-m-d H:i:s'),
        ], 'agent_code = :ac AND setting_key = :sk', [
            'ac' => 'AGENT-INTERVIEW-01',
            'sk' => 'session:' . $token,
        ]);
    }

    private static function deleteSession(string $token): void
    {
        Database::delete(
            'exam_ai_agent_settings',
            'agent_code = :ac AND setting_key = :sk',
            ['ac' => 'AGENT-INTERVIEW-01', 'sk' => 'session:' . $token]
        );
    }

    // ----------------------------------------------------------------------
    // EXTERNAL AI HOOK (optional, disabled by default)
    // ----------------------------------------------------------------------
    // When EVALUATION_PROVIDER=local_llm_optional|external_ai_optional AND
    // an API key is configured in env, an optional enhancement can be
    // plugged in to generate more natural follow-up questions and a richer
    // confidence estimate via an external LLM call. The signature would be:
    //
    //   private static function enhanceFollowUpWithExternalAi(string $type, string $lastResponse, array $history): ?array
    //
    // It should fall back to the rule-based pickFollowUp() above on any
    // error or timeout, never claim to be a real examiner, and always
    // append the practice-only disclaimer. Until that hook is implemented,
    // scoreInterview() detects the optional provider, falls back to
    // local_rule_engine, and sets fallback_used=true.
    // ----------------------------------------------------------------------
}
