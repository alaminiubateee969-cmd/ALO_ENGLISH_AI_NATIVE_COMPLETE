/**
 * src/lib/agents/GroqClient.ts
 *
 * Optional external AI client for Groq (Llama 3.3 70B).
 * OpenAI-compatible Chat Completions API.
 *
 * OPTIONAL: If GROQ_API_KEY is empty, every method returns null and the
 * caller falls back to the local rule engine. The platform NEVER depends
 * on an external API.
 *
 * SAFE: Hard 30s timeout, never throws (returns null on any error),
 * never logs the API key or student PII.
 *
 * COMPLIANT: The system prompt enforces practice-only wording.
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT = 30;

const SYSTEM_PROMPT = `You are the ALO Evaluation System, an automated practice-feedback engine for the ALO English Test Platform. You evaluate ORIGINAL practice submissions written by students preparing for English proficiency exams.

STRICT COMPLIANCE RULES (never violate):
1. You are NOT an official examiner. You are an automated evaluation service.
2. You must NEVER claim to produce an "official score", "real exam score", or "certified band". Always frame output as a PRACTICE ESTIMATE.
3. You must NEVER imply affiliation with IELTS, PTE, TOEFL, Duolingo, OET, College Board, ETS, or any official test publisher.
4. All scores are practice indicators on a 0-9 band scale (or 0-100 where specified), generated to help the student improve.
5. Be concise, specific, and actionable. No fluff.
6. Always respond in the exact JSON schema requested. No markdown fences.`;

export type GroqResponse = Record<string, unknown> | null;

export const GroqClient = {
  async evaluate(userPrompt: string, jsonSchema = ''): Promise<GroqResponse> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const model = process.env.AI_MODEL || DEFAULT_MODEL;
    let timeout = parseInt(process.env.AI_REQUEST_TIMEOUT_SECONDS || String(DEFAULT_TIMEOUT), 10);
    if (isNaN(timeout) || timeout < 5 || timeout > 120) timeout = DEFAULT_TIMEOUT;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt + (jsonSchema ? '\n\nRESPONSE SCHEMA (JSON):\n' + jsonSchema : '') },
    ];

    const body = {
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    };

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout * 1000);

      const resp = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!resp.ok) {
        console.error(`[groq] HTTP ${resp.status}`);
        return null;
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') return null;

      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') return null;

      return parsed as Record<string, unknown>;
    } catch (err) {
      console.error('[groq] request failed:', err instanceof Error ? err.message : 'unknown');
      return null;
    }
  },

  isConfigured(): boolean {
    if (process.env.AI_ENABLED?.toLowerCase() === 'false') return false;
    return getApiKey() !== '';
  },

  getProviderName(): string {
    if (getApiKey() === '') return 'none';
    for (const key of ['GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY']) {
      if ((process.env[key] || '').trim()) {
        return key.replace('_API_KEY', '').toLowerCase();
      }
    }
    return 'none';
  },
};

function getApiKey(): string {
  for (const key of ['GROQ_API_KEY', 'OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'HUGGINGFACE_API_KEY']) {
    const v = (process.env[key] || '').trim();
    if (v) return v;
  }
  return '';
}
