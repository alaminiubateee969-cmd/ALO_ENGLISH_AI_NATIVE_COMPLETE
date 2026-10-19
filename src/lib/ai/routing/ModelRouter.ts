/**
 * src/lib/ai/routing/ModelRouter.ts
 *
 * Multi-model routing abstraction.
 * Routes AI tasks to the best available provider based on:
 * - task type
 * - cost
 * - latency
 * - quality
 * - availability
 *
 * Supports: Groq (default), OpenRouter, Gemini, HuggingFace, local rule engine
 *
 * The router decides WHICH provider should serve a task. The actual call is
 * made by `src/lib/ai/providers/ai-provider.ts`, which is the only module
 * that performs an outbound request.
 *
 * Availability rules:
 *   - `AI_ENABLED=false` disables every external provider.
 *   - a provider is available only when its credential is present.
 *   - `local` is always available and is the terminal fallback: it means
 *     "use the deterministic rule engine", not "call a model".
 */

export type TaskType =
  | "writing_evaluation"
  | "speaking_evaluation"
  | "interview_simulation"
  | "question_generation"
  | "question_validation"
  | "summarization"
  | "personalization"
  | "memory_extraction"
  | "self_improvement"
  | "reasoning";

export type ProviderId = "groq" | "openrouter" | "gemini" | "huggingface" | "local";

export type ModelConfig = {
  provider: ProviderId;
  model: string;
  task: TaskType;
  priority: number; // lower = preferred
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  fallback: ProviderId;
};

export type RouteResult = {
  provider: ProviderId;
  model: string;
  used: boolean;
  fallback: boolean;
};

/** Per-task tuning. The provider chain itself is shared by every task. */
type TaskSettings = { maxTokens: number; temperature: number; timeoutMs: number };

const TASK_SETTINGS: Record<TaskType, TaskSettings> = {
  writing_evaluation: { maxTokens: 1200, temperature: 0.2, timeoutMs: 30000 },
  speaking_evaluation: { maxTokens: 1200, temperature: 0.2, timeoutMs: 30000 },
  interview_simulation: { maxTokens: 1500, temperature: 0.3, timeoutMs: 30000 },
  question_generation: { maxTokens: 2000, temperature: 0.7, timeoutMs: 45000 },
  question_validation: { maxTokens: 800, temperature: 0.1, timeoutMs: 20000 },
  summarization: { maxTokens: 500, temperature: 0.2, timeoutMs: 15000 },
  personalization: { maxTokens: 600, temperature: 0.3, timeoutMs: 20000 },
  memory_extraction: { maxTokens: 400, temperature: 0.1, timeoutMs: 15000 },
  self_improvement: { maxTokens: 2000, temperature: 0.2, timeoutMs: 60000 },
  reasoning: { maxTokens: 1500, temperature: 0.2, timeoutMs: 30000 },
};

/**
 * The provider chain, in preference order. The first provider with a
 * credential wins; if none has one, the local rule engine is used.
 */
const PROVIDER_CHAIN: ProviderId[] = ["groq", "openrouter", "gemini", "huggingface"];

/** Default model per provider. Every one of them can be overridden by env. */
const DEFAULT_MODELS: Record<ProviderId, string> = {
  groq: "llama-3.3-70b-versatile",
  openrouter: "meta-llama/llama-3.3-70b-instruct",
  gemini: "gemini-2.0-flash",
  huggingface: "meta-llama/Llama-3.3-70B-Instruct",
  local: "rule-engine",
};

const MODEL_ENV_KEY: Record<ProviderId, string> = {
  groq: "AI_MODEL_GROQ",
  openrouter: "AI_MODEL_OPENROUTER",
  gemini: "AI_MODEL_GEMINI",
  huggingface: "AI_MODEL_HUGGINGFACE",
  local: "",
};

/** The model a provider will use, honouring the env overrides. */
export function modelFor(provider: ProviderId): string {
  if (provider === "local") return DEFAULT_MODELS.local;
  const specific = MODEL_ENV_KEY[provider] ? (process.env[MODEL_ENV_KEY[provider]] || "").trim() : "";
  if (specific) return specific;
  const global = (process.env.AI_MODEL || "").trim();
  if (global) return global;
  return DEFAULT_MODELS[provider];
}

// Model registry — each task has a provider chain ending in the local engine.
const MODEL_REGISTRY: Record<TaskType, ModelConfig[]> = (() => {
  const registry = {} as Record<TaskType, ModelConfig[]>;
  for (const [task, settings] of Object.entries(TASK_SETTINGS) as Array<[TaskType, TaskSettings]>) {
    registry[task] = [
      ...PROVIDER_CHAIN.map((provider, index) => ({
        provider,
        model: modelFor(provider),
        task,
        priority: index + 1,
        maxTokens: settings.maxTokens,
        temperature: settings.temperature,
        timeoutMs: settings.timeoutMs,
        fallback: "local" as ProviderId,
      })),
      {
        provider: "local" as ProviderId,
        model: DEFAULT_MODELS.local,
        task,
        priority: PROVIDER_CHAIN.length + 1,
        maxTokens: 0,
        temperature: 0,
        timeoutMs: 0,
        fallback: "local" as ProviderId,
      },
    ];
  }
  return registry;
})();

/**
 * Route a task to the best available provider.
 * Falls back through the chain until one works.
 */
export function routeModel(task: TaskType): RouteResult {
  const configs = MODEL_REGISTRY[task];
  if (!configs || configs.length === 0) {
    return { provider: "local", model: "rule-engine", used: true, fallback: true };
  }

  for (const config of configs) {
    if (isProviderAvailable(config.provider)) {
      return {
        provider: config.provider,
        model: config.model,
        used: true,
        fallback: config.priority > 1,
      };
    }
  }

  // All providers unavailable — use local rule engine
  return { provider: "local", model: "rule-engine", used: true, fallback: true };
}

/**
 * Check if a provider is available (has API key configured).
 */
export function isProviderAvailable(provider: ProviderId): boolean {
  if (provider === "local") return true; // Always available
  if (process.env.AI_ENABLED?.toLowerCase() === "false") return false;
  switch (provider) {
    case "groq":
      return !!(process.env.GROQ_API_KEY || "").trim();
    case "openrouter":
      return !!(process.env.OPENROUTER_API_KEY || "").trim();
    case "gemini":
      return !!(process.env.GEMINI_API_KEY || "").trim();
    case "huggingface":
      return !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "").trim();
    default:
      return false;
  }
}

/**
 * Get the model config for a task + provider.
 */
export function getModelConfig(task: TaskType, provider: ProviderId): ModelConfig | null {
  const configs = MODEL_REGISTRY[task];
  if (!configs) return null;
  return configs.find((c) => c.provider === provider) || null;
}

/**
 * Get all registered tasks.
 */
export function getRegisteredTasks(): TaskType[] {
  return Object.keys(MODEL_REGISTRY) as TaskType[];
}

/**
 * Get provider status for monitoring.
 */
export function getProviderStatus(): Array<{ provider: ProviderId; available: boolean; tasks: TaskType[] }> {
  const providers: ProviderId[] = ["groq", "openrouter", "gemini", "huggingface", "local"];
  return providers.map((provider) => ({
    provider,
    available: isProviderAvailable(provider),
    tasks: (Object.entries(MODEL_REGISTRY) as [TaskType, ModelConfig[]][])
      .filter(([, configs]) => configs.some((c) => c.provider === provider))
      .map(([task]) => task),
  }));
}
