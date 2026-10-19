/**
 * src/lib/ai/providers/ai-provider.ts
 *
 * The single place the platform talks to an external model.
 *
 * WHY THIS EXISTS
 * ───────────────
 * `src/lib/agents/GroqClient.ts` and `src/lib/ai/routing/ModelRouter.ts` were
 * written but never imported by anything, so the platform had no working AI
 * path at all: writing feedback came from a local heuristic and speaking was
 * not scored at all. This module is the seam that makes the provider chain
 * real, and it is the only place that performs an outbound model call.
 *
 * `GroqClient.ts` has since been deleted. It duplicated the provider chain,
 * it hard-coded one provider, and its system prompt told the model to produce
 * "practice indicators on a 0-9 band scale" — a band, which this platform
 * does not publish.
 *
 * DESIGN RULES (these are the reason the platform can rely on it)
 * ─────────────────────────────────────────────────────────────
 * 1. NEVER THROWS. Every failure path returns `null` so the caller can fall
 *    back to the local rule engine. An external outage must never take a
 *    student's submission down.
 * 2. NEVER REQUIRES A PROVIDER. With no key configured, `complete()` returns
 *    `null` immediately and the platform behaves exactly as it did before.
 * 3. NEVER SENDS STUDENT WORK BY DEFAULT. The caller passes the text
 *    explicitly; nothing is sent unless a provider is configured AND
 *    `AI_ENABLED` is not "false".
 * 4. NEVER LOGS student text or credentials. Only the provider name, the
 *    model and the HTTP status are logged.
 * 5. ALWAYS BOUNDED. Hard timeout, capped output size, capped input size.
 */

import { routeModel, routeChain, type TaskType, type ProviderId } from "@/lib/ai/routing/ModelRouter";
import { completeLocal, isLocalModelEnabled } from "@/lib/ai/local/endpoint";

export type AiProviderName =
  | "local_model"
  | "groq"
  | "openrouter"
  | "gemini"
  | "huggingface"
  | "local_rule_engine";

export type AiRequest = {
  /** Instructions. The caller must mark student text as untrusted data. */
  system: string;
  /** The user message, including the student work. */
  user: string;
  /** Human-readable description of the JSON shape the model must return. */
  jsonSchema?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AiCompletion = {
  provider: AiProviderName;
  model: string;
  data: Record<string, unknown>;
  /** Token usage, when the provider reports it. */
  usage?: { inputTokens: number; outputTokens: number };
};

const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 120;
const MAX_INPUT_CHARS = 24000;

/** Provider display names used in the persisted evaluation rows. */
const PROVIDER_LABEL: Record<ProviderId, AiProviderName> = {
  local_model: "local_model",
  groq: "groq",
  openrouter: "openrouter",
  gemini: "gemini",
  huggingface: "huggingface",
  local: "local_rule_engine",
};

/**
 * Is an external model allowed to be used at all?
 * `AI_ENABLED=false` disables every provider, even when a key is present.
 */
export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED?.toLowerCase() !== "false";
}

/** Which providers have credentials configured right now. */
export function getConfiguredProviders(): AiProviderName[] {
  const configured: AiProviderName[] = [];
  if (isLocalModelEnabled()) configured.push("local_model");
  if (!isAiEnabled()) return configured;
  if (hasKey("GROQ_API_KEY")) configured.push("groq");
  if (hasKey("OPENROUTER_API_KEY")) configured.push("openrouter");
  if (hasKey("GEMINI_API_KEY")) configured.push("gemini");
  if (hasKey("HUGGINGFACE_API_KEY") || hasKey("HF_TOKEN")) configured.push("huggingface");
  return configured;
}

/** A short status document for the admin surface and the health route. */
export function getAiStatus(): {
  enabled: boolean;
  configuredProviders: AiProviderName[];
  provider: AiProviderName;
  model: string;
} {
  const configured = getConfiguredProviders();
  const routed = routeModel("writing_evaluation");
  return {
    enabled: configured.length > 0,
    configuredProviders: configured,
    provider: PROVIDER_LABEL[routed.provider],
    model: routed.model,
  };
}

/**
 * Run one completion.
 *
 * Returns `null` when no provider is available, when the provider errors, or
 * when the response cannot be parsed. The caller MUST handle `null` by using
 * the local rule engine.
 */
export async function complete(task: TaskType, request: AiRequest): Promise<AiCompletion | null> {
  const user = request.user.length > MAX_INPUT_CHARS
    ? request.user.slice(0, MAX_INPUT_CHARS)
    : request.user;

  // The chain, in order: the self-hosted model server first, then the
  // external providers, then (implicitly) the deterministic rule engine,
  // which the caller uses when this returns null.
  //
  // A provider that fails does not end the request. The next one is tried,
  // so a model server that is down does not take the platform's AI features
  // down with it.
  for (const routed of routeChain(task)) {
    if (routed.provider === "local") continue;

    if (routed.provider === "local_model") {
      if (!isLocalModelEnabled()) continue;
      const local = await completeLocal({
        system: request.system,
        user: user + (request.jsonSchema ? `\n\nRESPONSE SCHEMA (JSON):\n${request.jsonSchema}` : ""),
        maxTokens: request.maxTokens,
        temperature: request.temperature,
      });
      if (local) {
        return {
          provider: "local_model",
          model: local.model,
          data: local.data,
          usage: local.usage,
        };
      }
      continue;
    }

    // External providers are disabled wholesale by AI_ENABLED=false.
    if (!isAiEnabled()) continue;

    const provider = PROVIDER_LABEL[routed.provider];
    const key = apiKeyFor(provider);
    if (!key) continue;

    const timeoutSeconds = resolveTimeout();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

    try {
      const raw =
        provider === "gemini"
          ? await callGemini(routed.model, key, request, user, controller.signal)
          : await callOpenAiCompatible(provider, routed.model, key, request, user, controller.signal);

      if (raw === null) continue;

      const parsed = parseJsonObject(raw);
      if (!parsed) continue;

      return { provider, model: routed.model, data: parsed };
    } catch (error) {
      // Never log the student text or the key.
      console.error(
        `[ai] ${provider} request failed:`,
        error instanceof Error ? error.message : "unknown error",
      );
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

// ─── Provider implementations ─────────────────────────────────────────────

/** Groq, OpenRouter and the HuggingFace router all speak the OpenAI shape. */
async function callOpenAiCompatible(
  provider: AiProviderName,
  model: string,
  key: string,
  request: AiRequest,
  user: string,
  signal: AbortSignal,
): Promise<string | null> {
  const endpoint = openAiCompatibleEndpoint(provider);
  if (!endpoint) return null;

  const body: Record<string, unknown> = {
    model: provider === "huggingface" ? resolveHuggingFaceModel(model) : model,
    messages: [
      { role: "system", content: request.system },
      { role: "user", content: user + (request.jsonSchema ? `\n\nRESPONSE SCHEMA (JSON):\n${request.jsonSchema}` : "") },
    ],
    temperature: request.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
  };
  if (provider !== "huggingface") {
    // HuggingFace's router does not guarantee JSON mode.
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(provider === "openrouter" ? { "HTTP-Referer": process.env.APP_URL || "https://english.aloeducation.com" } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    console.error(`[ai] ${provider} HTTP ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

/** Google Gemini uses a different request and response shape. */
async function callGemini(
  model: string,
  key: string,
  request: AiRequest,
  user: string,
  signal: AbortSignal,
): Promise<string | null> {
  const modelId = model.startsWith("models/") ? model.replace("models/", "") : model;
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(key)}`;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [
      {
        role: "user",
        parts: [{ text: user + (request.jsonSchema ? `\n\nRESPONSE SCHEMA (JSON):\n${request.jsonSchema}` : "") }],
      },
    ],
    generationConfig: {
      temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    console.error(`[ai] gemini HTTP ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  };
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("");
  return text || null;
}

function openAiCompatibleEndpoint(provider: AiProviderName): string | null {
  // An operator can point the OpenAI-compatible providers at a self-hosted
  // gateway or an internal proxy. This is opt-in and is off by default, so
  // student work never leaves the configured provider unless it is set.
  const override = (process.env.AI_OPENAI_COMPATIBLE_ENDPOINT || "").trim();
  if (override) return override;

  switch (provider) {
    case "groq":
      return "https://api.groq.com/openai/v1/chat/completions";
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    case "huggingface":
      return "https://router.huggingface.co/v1/chat/completions";
    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function hasKey(name: string): boolean {
  return (process.env[name] || "").trim().length > 0;
}

function apiKeyFor(provider: AiProviderName): string {
  switch (provider) {
    case "groq":
      return (process.env.GROQ_API_KEY || "").trim();
    case "openrouter":
      return (process.env.OPENROUTER_API_KEY || "").trim();
    case "gemini":
      return (process.env.GEMINI_API_KEY || "").trim();
    case "huggingface":
      return (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "").trim();
    default:
      return "";
  }
}

function resolveTimeout(): number {
  const parsed = Number.parseInt(process.env.AI_REQUEST_TIMEOUT_SECONDS || "", 10);
  if (!Number.isFinite(parsed) || parsed < 5) return DEFAULT_TIMEOUT_SECONDS;
  return Math.min(parsed, MAX_TIMEOUT_SECONDS);
}

function resolveHuggingFaceModel(model: string): string {
  // The HuggingFace router expects a "provider/model" identifier.
  return model.includes("/") ? model : "meta-llama/Llama-3.3-70B-Instruct";
}

/**
 * Extract a JSON object from a model response.
 *
 * Models sometimes wrap JSON in a markdown fence or add a sentence before it.
 * This tolerates both; anything that is not a JSON object returns `null` so
 * the caller falls back to the local rule engine.
 */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates: string[] = [trimmed];

  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}
