/**
 * src/lib/ai/local/endpoint.ts
 *
 * The self-hosted model endpoint.
 *
 * The mission for this platform is that it must not depend on a paid external
 * API. This module is the client for a model server that runs on our own
 * hardware — llama.cpp's server, Ollama, vLLM, or anything else that speaks
 * the OpenAI chat-completions shape. That is what "self-hosted, open-weight"
 * means in practice: a local HTTP server and an OpenAI-compatible contract.
 *
 * WHAT THIS PROVIDES
 * ──────────────────
 *  - a health probe, so the admin monitor can show whether the server is up
 *    and which model it is serving;
 *  - a circuit breaker, so a model server that is down is not hammered by
 *    every agent that happens to wake up;
 *  - a concurrency-limited queue, so a burst of background jobs cannot
 *    overwhelm a two-core box and make every request time out at once;
 *  - a bounded response cache, so the same rubric evaluation is not recomputed
 *    for every student who answers the same task;
 *  - token accounting, so the cost of a run is visible.
 *
 * CONFIGURATION
 * ─────────────
 *   AI_LOCAL_MODEL_ENABLED    "true" to switch this on (default: off)
 *   AI_LOCAL_MODEL_ENDPOINT   e.g. http://127.0.0.1:8080/v1/chat/completions
 *   AI_LOCAL_MODEL_NAME       the model id the server advertises
 *   AI_LOCAL_MODEL_MAX_CONCURRENCY  how many requests may run at once
 *   AI_LOCAL_MODEL_TIMEOUT_MS      per-request timeout
 *   AI_LOCAL_MODEL_CIRCUIT_FAILURES failures before the circuit opens
 *   AI_LOCAL_MODEL_CIRCUIT_COOLDOWN_MS how long the circuit stays open
 *
 * WHEN IT IS NOT CONFIGURED
 * ─────────────────────────
 * `isLocalModelEnabled()` is false, `probeLocalModel()` reports it as
 * unavailable, and the provider chain simply starts at the next provider.
 * Nothing breaks, and nothing is silently pretended.
 */

import { createHash } from "node:crypto";

export type LocalModelStatus = {
  enabled: boolean;
  configured: boolean;
  available: boolean;
  model: string | null;
  endpoint: string | null;
  latencyMs: number | null;
  circuitOpen: boolean;
  lastError: string | null;
  lastCheckedAt: string | null;
  queued: number;
  inFlight: number;
};

type CircuitState = "closed" | "open" | "half-open";

/** The result of one local completion. */
export type LocalCompletion = {
  provider: "local_model";
  model: string;
  data: Record<string, unknown>;
  usage: { inputTokens: number; outputTokens: number };
  cached: boolean;
};

// ─── Configuration ─────────────────────────────────────────────────────────

function envFlag(name: string, fallback = false): boolean {
  const raw = (process.env[name] ?? "").trim().toLowerCase();
  if (raw === "") return fallback;
  return raw === "true" || raw === "1" || raw === "yes";
}

function envInt(name: string, fallback: number): number {
  const raw = (process.env[name] ?? "").trim();
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function localModelEndpoint(): string | null {
  const value = (process.env.AI_LOCAL_MODEL_ENDPOINT ?? "").trim();
  return value || null;
}

export function localModelName(): string {
  return (process.env.AI_LOCAL_MODEL_NAME ?? "").trim() || "local-model";
}

export function isLocalModelEnabled(): boolean {
  return envFlag("AI_LOCAL_MODEL_ENABLED") && !!localModelEndpoint();
}

// ─── Circuit breaker ───────────────────────────────────────────────────────

/**
 * A small circuit breaker.
 *
 * After `failures` consecutive failures the circuit opens and calls fail
 * fast for `cooldownMs`. After the cooldown one probe call is allowed
 * through; if it succeeds the circuit closes again, and if it fails the
 * cooldown restarts.
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openedAt = 0;
  private lastError: string | null = null;

  constructor(
    private readonly failureThreshold = envInt("AI_LOCAL_MODEL_CIRCUIT_FAILURES", 3),
    private readonly cooldownMs = envInt("AI_LOCAL_MODEL_CIRCUIT_COOLDOWN_MS", 30_000),
  ) {}

  get isOpen(): boolean {
    if (this.state === "open") {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = "half-open";
        return false;
      }
      return true;
    }
    return false;
  }

  get currentState(): CircuitState {
    return this.isOpen ? "open" : this.state;
  }

  get error(): string | null {
    return this.lastError;
  }

  recordSuccess(): void {
    this.state = "closed";
    this.consecutiveFailures = 0;
    this.lastError = null;
  }

  recordFailure(error: string): void {
    this.consecutiveFailures += 1;
    this.lastError = error;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}

// ─── Inference queue ───────────────────────────────────────────────────────

/**
 * A concurrency-limited queue.
 *
 * A self-hosted model on a small box has a fixed number of slots. Without a
 * queue, twenty agents waking at once produce twenty simultaneous requests,
 * all of which queue inside the model server and all of which time out.
 */
export class InferenceQueue {
  private inFlight = 0;
  private waiting: Array<() => void> = [];

  constructor(private readonly maxConcurrent = envInt("AI_LOCAL_MODEL_MAX_CONCURRENCY", 2)) {}

  get pending(): number {
    return this.waiting.length;
  }

  get active(): number {
    return this.inFlight;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.inFlight >= this.maxConcurrent) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    }
    this.inFlight += 1;
    try {
      return await task();
    } finally {
      this.inFlight -= 1;
      const next = this.waiting.shift();
      if (next) next();
    }
  }
}

// ─── Response cache ────────────────────────────────────────────────────────

type CacheEntry = { value: LocalCompletion; expiresAt: number };

/** A bounded TTL cache. Eviction is least-recently-used. */
export class ResponseCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(
    private readonly maxEntries = envInt("AI_LOCAL_MODEL_CACHE_ENTRIES", 200),
    private readonly ttlMs = envInt("AI_LOCAL_MODEL_CACHE_TTL_MS", 15 * 60_000),
  ) {}

  get(key: string): LocalCompletion | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    // Refresh recency.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: LocalCompletion): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (!oldest.done) this.entries.delete(oldest.value);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

// ─── The client ────────────────────────────────────────────────────────────

const breaker = new CircuitBreaker();
const queue = new InferenceQueue();
const cache = new ResponseCache();

let lastStatus: LocalModelStatus = {
  enabled: false,
  configured: false,
  available: false,
  model: null,
  endpoint: null,
  latencyMs: null,
  circuitOpen: false,
  lastError: null,
  lastCheckedAt: null,
  queued: 0,
  inFlight: 0,
};

/** The current status of the local model server. */
export function getLocalModelStatus(): LocalModelStatus {
  return {
    ...lastStatus,
    enabled: isLocalModelEnabled(),
    configured: !!localModelEndpoint(),
    circuitOpen: breaker.currentState === "open",
    lastError: breaker.error,
    queued: queue.pending,
    inFlight: queue.active,
  };
}

/** Reset the cached status. Used by the health route and by tests. */
export function resetLocalModelStatus(): void {
  lastStatus = { ...getLocalModelStatus(), available: false, latencyMs: null };
}

/**
 * Probe the model server.
 *
 * Tries the OpenAI `/models` list first, then a bare `/health`, because
 * different servers expose different things.
 */
export async function probeLocalModel(timeoutMs = 3000): Promise<LocalModelStatus> {
  const endpoint = localModelEndpoint();
  const base = {
    ...lastStatus,
    enabled: isLocalModelEnabled(),
    configured: !!endpoint,
    endpoint,
    model: localModelName(),
    circuitOpen: breaker.currentState === "open",
    queued: queue.pending,
    inFlight: queue.active,
  };

  if (!endpoint) {
    lastStatus = { ...base, available: false, lastCheckedAt: new Date().toISOString() };
    return lastStatus;
  }

  const root = endpoint.replace(/\/v1\/chat\/completions\/?$/, "").replace(/\/$/, "");
  const started = Date.now();

  for (const probePath of ["/v1/models", "/models", "/health"]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(`${root}${probePath}`, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) continue;

      let model: string | null = null;
      if (probePath.includes("models")) {
        const body = (await response.json()) as { data?: Array<{ id?: string }> };
        model = body?.data?.[0]?.id ?? null;
      }

      const latencyMs = Date.now() - started;
      breaker.recordSuccess();
      lastStatus = {
        ...base,
        available: true,
        model: model ?? localModelName(),
        latencyMs,
        circuitOpen: false,
        lastError: null,
        lastCheckedAt: new Date().toISOString(),
      };
      return lastStatus;
    } catch {
      // try the next probe path
    }
  }

  const message = "no health endpoint answered";
  breaker.recordFailure(message);
  lastStatus = {
    ...base,
    available: false,
    latencyMs: null,
    lastError: message,
    lastCheckedAt: new Date().toISOString(),
  };
  return lastStatus;
}

/** A stable cache key for a request. */
function cacheKey(parts: {
  model: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}): string {
  return createHash("sha256")
    .update(
      [parts.model, parts.system, parts.user, String(parts.temperature), String(parts.maxTokens)].join(
        " ",
      ),
    )
    .digest("hex");
}

export type LocalRequest = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Skip the cache — used when the caller needs a fresh answer. */
  noCache?: boolean;
};

/**
 * Run one completion against the self-hosted model server.
 *
 * Returns `null` when the local server is not configured, is unavailable, or
 * the circuit is open. The caller then falls through to the next provider in
 * the chain — and, in the end, to the deterministic local rule engine.
 */
export async function completeLocal(request: LocalRequest): Promise<LocalCompletion | null> {
  if (!isLocalModelEnabled()) return null;

  const endpoint = localModelEndpoint();
  if (!endpoint) return null;

  if (breaker.isOpen) return null;

  const model = localModelName();
  const maxTokens = request.maxTokens ?? 1200;
  const temperature = request.temperature ?? 0.2;
  const key = cacheKey({ model, system: request.system, user: request.user, temperature, maxTokens });

  if (!request.noCache) {
    const hit = cache.get(key);
    if (hit) return { ...hit, cached: true };
  }

  const timeoutMs = envInt("AI_LOCAL_MODEL_TIMEOUT_MS", 60_000);

  return queue.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: request.system },
            { role: "user", content: request.user },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = `local model HTTP ${response.status}`;
        breaker.recordFailure(message);
        return null;
      }

      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const content = body?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        breaker.recordFailure("local model returned no content");
        return null;
      }

      const parsed = parseJson(content);
      if (!parsed) {
        breaker.recordFailure("local model returned unparseable JSON");
        return null;
      }

      breaker.recordSuccess();
      const completion: LocalCompletion = {
        provider: "local_model",
        model,
        data: parsed,
        usage: {
          inputTokens: body?.usage?.prompt_tokens ?? 0,
          outputTokens: body?.usage?.completion_tokens ?? 0,
        },
        cached: false,
      };
      if (!request.noCache) cache.set(key, completion);
      return completion;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      breaker.recordFailure(message);
      return null;
    } finally {
      clearTimeout(timer);
    }
  });
}

/** Parse a JSON object out of a model's reply. */
export function parseJson(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  try {
    const direct = JSON.parse(trimmed);
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {
    // fall through
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      const parsed = JSON.parse(trimmed.slice(first, last + 1));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // fall through
    }
  }

  return null;
}

/** Exposed for the admin monitor and for tests. */
export const localModelInternals = { breaker, queue, cache };
