<?php
/**
 * app/Services/AiClient.php — Optional external AI client (Groq).
 *
 * A thin, dependency-free HTTP client that talks to Groq's OpenAI-compatible
 * Chat Completions API (https://api.groq.com/openai/v1/chat/completions).
 *
 * Design goals:
 *   - OPTIONAL. If GROQ_API_KEY is empty, every method returns null and the
 *     caller falls back to the local rule engine. The platform NEVER depends
 *     on an external API.
 *   - SAFE. Hard 30s timeout, never throws to the caller (returns null on
 *     any error), never logs the API key or student PII.
 *   - COMPLIANT. The system prompt enforces practice-only wording: the model
 *     is told it is evaluating an original practice attempt and must NEVER
 *     claim to be an official examiner or produce an official score.
 *   - DETERMINISTIC. temperature=0.2 and JSON response format for parseable
 *     structured output.
 *
 * Why Groq?
 *   - Free tier with generous limits (suitable for a practice platform).
 *   - Llama 3.3 70B is fast (<2s typical) and strong at rubric scoring.
 *   - OpenAI-compatible API → trivial to swap to another provider later.
 *
 * PHP 8.2+. No Composer dependencies (uses cURL + stream fallback).
 */

declare(strict_types=1);

namespace App\Services;

final class AiClient
{
    /** Groq Chat Completions endpoint (OpenAI-compatible). */
    private const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

    /**
     * Default model. Override via AI_MODEL env if Groq releases a newer one.
     * llama-3.3-70b-versatile is the recommended general-purpose model.
     */
    private const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

    /** Hard request timeout (seconds). Matches AI_REQUEST_TIMEOUT_SECONDS. */
    private const DEFAULT_TIMEOUT = 30;

    /** Practice-only system prompt shared by all evaluation calls. */
    private const SYSTEM_PROMPT = <<<'PROMPT'
You are the ALO Evaluation System, an automated practice-feedback engine for
the ALO English Test Platform. You evaluate ORIGINAL practice submissions
written by students preparing for English proficiency exams.

STRICT COMPLIANCE RULES (never violate):
1. You are NOT an official examiner. You are an automated evaluation service.
2. You must NEVER claim to produce an "official score", "real exam score",
   or "certified band". Always frame output as a PRACTICE ESTIMATE.
3. You must NEVER imply affiliation with IELTS, PTE, TOEFL, Duolingo, OET,
   College Board, ETS, or any official test publisher.
4. All scores are practice indicators on a 0–9 band scale (or 0–100 where
   specified), generated to help the student improve.
5. Be concise, specific, and actionable. No fluff.
6. Always respond in the exact JSON schema requested. No markdown fences.
PROMPT;

    /**
     * Send a structured evaluation request to Groq and return the parsed
     * JSON response, or null on any failure.
     *
     * @param string $userPrompt  The full user prompt (task + student text).
     * @param string $jsonSchema  A description of the expected JSON shape
     *                            (passed in the prompt; Groq JSON mode enforces
     *                            valid JSON, the schema guides the shape).
     * @return array<string,mixed>|null  Parsed JSON, or null on failure.
     */
    public static function evaluate(string $userPrompt, string $jsonSchema = ''): ?array
    {
        $apiKey = self::getApiKey();
        if ($apiKey === '') {
            return null; // not configured — caller falls back to rule engine
        }

        $model = (string) (getenv('AI_MODEL') ?: self::DEFAULT_MODEL);
        $timeout = (int) (getenv('AI_REQUEST_TIMEOUT_SECONDS') ?: self::DEFAULT_TIMEOUT);
        if ($timeout < 5 || $timeout > 120) {
            $timeout = self::DEFAULT_TIMEOUT;
        }

        $messages = [
            ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
            ['role' => 'user',   'content' => $userPrompt],
        ];

        $body = [
            'model'          => $model,
            'messages'       => $messages,
            'temperature'    => 0.2,
            'max_tokens'     => 1200,
            'response_format'=> ['type' => 'json_object'],
        ];
        if ($jsonSchema !== '') {
            // Append the schema hint to the last user message.
            $body['messages'][1]['content'] .= "\n\nRESPONSE SCHEMA (JSON):\n" . $jsonSchema;
        }

        $payload = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($payload === false) {
            return null;
        }

        $raw = self::httpPost(self::GROQ_ENDPOINT, $payload, $apiKey, $timeout);
        if ($raw === null) {
            return null;
        }

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return null;
        }

        // Extract the assistant message content.
        $content = $data['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || $content === '') {
            return null;
        }

        $parsed = json_decode($content, true);
        if (!is_array($parsed)) {
            return null;
        }

        return $parsed;
    }

    /**
     * Returns true if Groq is configured (key present + AI_ENABLED not false).
     * Services call this before attempting an external call.
     */
    public static function isConfigured(): bool
    {
        if (strtolower((string) (getenv('AI_ENABLED') ?: '')) === 'false') {
            return false;
        }
        return self::getApiKey() !== '';
    }

    /**
     * Returns the active API key (Groq preferred), or empty string if none.
     * Priority: GROQ_API_KEY > OPENROUTER_API_KEY > GEMINI_API_KEY > HUGGINGFACE_API_KEY.
     * Only Groq is fully wired in this build; the others are recognised so
     * the "has any key" check in the evaluation services stays accurate.
     */
    public static function getApiKey(): string
    {
        foreach (['GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY'] as $k) {
            $v = trim((string) (getenv($k) ?: ''));
            if ($v !== '') {
                return $v;
            }
        }
        return '';
    }

    /**
     * Returns the provider name for logging (never the key).
     */
    public static function getProviderName(): string
    {
        if (self::getApiKey() === '') {
            return 'none';
        }
        foreach (['GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY'] as $k) {
            if (trim((string) (getenv($k) ?: '')) !== '') {
                return strtolower(str_replace('_API_KEY', '', $k));
            }
        }
        return 'none';
    }

    // ------------------------------------------------------------------
    // HTTP transport (cURL preferred, stream fallback)
    // ------------------------------------------------------------------

    private static function httpPost(string $url, string $jsonBody, string $apiKey, int $timeout): ?string
    {
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'Accept: application/json',
        ];

        // cURL path (preferred — available on virtually all cPanel hosts).
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch === false) {
                return null;
            }
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $jsonBody,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_MAXREDIRS      => 0,
            ]);
            $resp = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err  = curl_error($ch);
            curl_close($ch);
            if ($resp === false || $code >= 400) {
                self::logError('groq http ' . $code . ' ' . $err);
                return null;
            }
            return is_string($resp) ? $resp : null;
        }

        // stream fallback (file_get_contents + stream_context_create).
        $ctx = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => implode("\r\n", $headers),
                'content'       => $jsonBody,
                'timeout'       => $timeout,
                'ignore_errors' => false,
            ],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp === false) {
            self::logError('groq stream failed');
            return null;
        }
        return $resp;
    }

    /**
     * Log a non-sensitive error message. Never logs the API key or request body.
     */
    private static function logError(string $message): void
    {
        @error_log('[ai_client] ' . $message);
    }
}
