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
 * All wording is practice-focused. The disclaimer appears on every output.
 * External LLM AI is OPTIONAL and DISABLED by default per .env.
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
     * Score the interview session: confidence (0–100), risk_level
     * (low / medium / high), and structured feedback.
     *
     * @return array{
     *   session_token:string, interview_type:string, questions_asked:int,
     *   confidence:int, risk_level:string, feedback:array<int,string>,
     *   strengths:array<int,string>, weaknesses:array<int,string>,
     *   disclaimer:string
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
                'feedback'       => ['Session not found. Please start a new interview.'],
                'strengths'      => [],
                'weaknesses'     => ['No responses recorded.'],
                'disclaimer'     => SmartScoreReportService::getDisclaimer(),
            ];
        }

        $responses = $state['responses'];
        $questionsAsked = count($state['questions']);
        $confidence = self::scoreConfidence($responses);
        $riskLevel = self::riskLevelFromConfidence($confidence);

        [$strengths, $weaknesses] = self::strengthsWeaknesses($responses, $state['interview_type']);
        $feedback = self::buildFeedback($state['interview_type'], $confidence, $weaknesses);

        $result = [
            'session_token'  => $sessionToken,
            'interview_type' => $state['interview_type'],
            'questions_asked'=> $questionsAsked,
            'confidence'     => $confidence,
            'risk_level'     => $riskLevel,
            'feedback'       => $feedback,
            'strengths'      => $strengths,
            'weaknesses'     => $weaknesses,
            'is_estimated'   => true,
            'disclaimer'     => SmartScoreReportService::getDisclaimer(),
        ];

        // Complete the AGENT-INTERVIEW-01 task and persist the score.
        if (!empty($state['task_id'])) {
            AiAgentEmployeeService::completeTask((int) $state['task_id'], $result);
        }
        self::deleteSession($sessionToken);

        AuditService::log(null, 'interview.scored', 'student', (int) $state['student_id'], [
            'interview_type' => $state['interview_type'],
            'confidence'     => $confidence,
            'risk_level'     => $riskLevel,
            'questions_asked'=> $questionsAsked,
        ]);

        return $result;
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
    // When AI_ENABLED=true AND an API key is configured in config/exams.php,
    // an optional enhancement can be plugged in to generate more natural
    // follow-up questions and a richer confidence estimate via an external
    // LLM call. The signature would be:
    //
    //   private static function enhanceFollowUpWithExternalAi(string $type, string $lastResponse, array $history): ?array
    //
    // It should fall back to the rule-based pickFollowUp() above on any
    // error or timeout, never claim to be a real examiner, and always
    // append the practice-only disclaimer.
    // ----------------------------------------------------------------------
}
