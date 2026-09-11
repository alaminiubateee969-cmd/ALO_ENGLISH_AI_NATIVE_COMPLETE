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

// Model registry — each task has a preferred model + fallback chain
const MODEL_REGISTRY: Record<TaskType, ModelConfig[]> = {
  writing_evaluation: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "writing_evaluation", priority: 1, maxTokens: 1200, temperature: 0.2, timeoutMs: 30000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "writing_evaluation", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  speaking_evaluation: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "speaking_evaluation", priority: 1, maxTokens: 1200, temperature: 0.2, timeoutMs: 30000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "speaking_evaluation", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  interview_simulation: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "interview_simulation", priority: 1, maxTokens: 1500, temperature: 0.3, timeoutMs: 30000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "interview_simulation", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  question_generation: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "question_generation", priority: 1, maxTokens: 2000, temperature: 0.7, timeoutMs: 45000, fallback: "local" },
    { provider: "local", model: "template-engine", task: "question_generation", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  question_validation: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "question_validation", priority: 1, maxTokens: 800, temperature: 0.1, timeoutMs: 20000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "question_validation", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  summarization: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "summarization", priority: 1, maxTokens: 500, temperature: 0.2, timeoutMs: 15000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "summarization", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  personalization: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "personalization", priority: 1, maxTokens: 600, temperature: 0.3, timeoutMs: 20000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "personalization", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  memory_extraction: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "memory_extraction", priority: 1, maxTokens: 400, temperature: 0.1, timeoutMs: 15000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "memory_extraction", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  self_improvement: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "self_improvement", priority: 1, maxTokens: 2000, temperature: 0.2, timeoutMs: 60000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "self_improvement", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
  reasoning: [
    { provider: "groq", model: "llama-3.3-70b-versatile", task: "reasoning", priority: 1, maxTokens: 1500, temperature: 0.2, timeoutMs: 30000, fallback: "local" },
    { provider: "local", model: "rule-engine", task: "reasoning", priority: 2, maxTokens: 0, temperature: 0, timeoutMs: 0, fallback: "local" },
  ],
};

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
function isProviderAvailable(provider: ProviderId): boolean {
  switch (provider) {
    case "groq":
      return !!process.env.GROQ_API_KEY && process.env.AI_ENABLED !== "false";
    case "openrouter":
      return !!process.env.OPENROUTER_API_KEY;
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "huggingface":
      return !!process.env.HUGGINGFACE_API_KEY;
    case "local":
      return true; // Always available
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
