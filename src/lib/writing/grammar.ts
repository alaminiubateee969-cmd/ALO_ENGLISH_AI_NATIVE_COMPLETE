/**
 * src/lib/writing/grammar.ts
 *
 * Optional grammar/style feedback for writing practice, backed by a
 * self-hosted LanguageTool server.
 *
 * WHY A SIDECAR AND NOT AN IMPORT
 * ───────────────────────────────
 * LanguageTool is LGPL-2.1. Calling it over HTTP as a separate, unmodified
 * service keeps the licence boundary clean: no LGPL code is linked into this
 * application, and the service can be upgraded or replaced independently. If
 * LANGUAGETOOL_URL is unset the feature is simply off — nothing else changes.
 * @see docs/REFERENCE_LINK_AUDIT_2026-10-14.md (Section A)
 *
 * CONTRACT
 * ────────
 * `checkGrammar` never throws and never blocks a learner for longer than its
 * timeout. Writing practice must still work when the grammar service is down,
 * slow, or misconfigured, so every failure is returned as a status — the caller
 * shows the practice feedback it already has and omits the grammar panel.
 *
 * PRIVACY
 * ───────
 * Whatever is sent leaves this application. Only the candidate text is sent — no
 * attempt id, no user id, no name, no IP forwarding header — and the payload is
 * capped by GRAMMAR_MAX_CHARS. Operators who cannot send learner text to that
 * host must leave this unconfigured.
 */

export type GrammarCheckStatus = 'ok' | 'disabled' | 'unavailable' | 'too_long' | 'empty';

export type GrammarSuggestion = {
  /** Full message from the engine. */
  message: string;
  /** Short label, when the engine supplies one. */
  shortMessage?: string;
  /** Character offset in the submitted text. */
  offset: number;
  /** Length of the offending span. */
  length: number;
  /** Suggested replacements, best first. May be empty (e.g. a style warning). */
  replacements: string[];
  /** Stable rule identifier, e.g. "UPPERCASE_SENTENCE_START". */
  ruleId: string;
  /** Engine category, e.g. "GRAMMAR" | "TYPOGRAPHY" | "STYLE". */
  category: string;
  /** "grammar" | "misspelling" | "style" | "typography" | "duplication" | "other". */
  issueType: string;
};

export type GrammarCheckResult = {
  status: GrammarCheckStatus;
  suggestions: GrammarSuggestion[];
  /** Language the engine was asked to check, when a request was made. */
  language?: string;
  /** Machine-readable reason when status is not 'ok'. */
  reason?: string;
  /** Milliseconds the request took, for logging. */
  durationMs?: number;
};

/** Maximum characters sent to the engine. Longer input is refused, not truncated. */
export const GRAMMAR_MAX_CHARS = 5000;

/** How long to wait for the engine before giving up. */
export const GRAMMAR_TIMEOUT_MS = 6000;

const DEFAULT_LANGUAGE = 'en-US';

type LanguageToolMatch = {
  message?: string;
  shortMessage?: string;
  offset?: number;
  length?: number;
  replacements?: Array<{ value?: string }>;
  rule?: { id?: string; category?: { id?: string }; issueType?: string };
};

type LanguageToolResponse = {
  matches?: LanguageToolMatch[];
};

function baseUrl(): string | null {
  const configured = process.env.LANGUAGETOOL_URL?.trim();
  if (!configured) return null;
  // A configured-but-malformed URL is a misconfiguration, not a crash.
  try {
    const url = new URL(configured);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, '')}`;
  } catch {
    return null;
  }
}

function normalizeLanguage(language: string | undefined): string {
  const value = (language ?? DEFAULT_LANGUAGE).trim();
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(value) ? value : DEFAULT_LANGUAGE;
}

function mapMatch(match: LanguageToolMatch): GrammarSuggestion {
  return {
    message: typeof match.message === 'string' ? match.message : 'Possible issue',
    shortMessage: typeof match.shortMessage === 'string' ? match.shortMessage : undefined,
    offset: Number.isInteger(match.offset) && (match.offset ?? -1) >= 0 ? (match.offset as number) : 0,
    length: Number.isInteger(match.length) && (match.length ?? -1) >= 0 ? (match.length as number) : 0,
    replacements: Array.isArray(match.replacements)
      ? match.replacements
          .map((replacement) => replacement?.value)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [],
    ruleId: match.rule?.id ?? 'UNKNOWN_RULE',
    category: match.rule?.category?.id ?? 'UNKNOWN',
    issueType: match.rule?.issueType ?? 'other',
  };
}

/**
 * Check a piece of writing. Returns a status instead of throwing.
 *
 * @param text Candidate writing. Empty or whitespace-only input returns 'empty'
 *             without making a request.
 * @param options.language BCP-47-ish tag such as "en-US" or "en-GB".
 */
export async function checkGrammar(
  text: string,
  options: { language?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<GrammarCheckResult> {
  if (!text || text.trim().length === 0) {
    return { status: 'empty', suggestions: [] };
  }

  // Count characters, not bytes: a Bangla or emoji-heavy response should be
  // measured the way the engine will measure it.
  if (text.length > GRAMMAR_MAX_CHARS) {
    return {
      status: 'too_long',
      suggestions: [],
      reason: `Text exceeds ${GRAMMAR_MAX_CHARS} characters; submit a section at a time.`,
    };
  }

  const base = baseUrl();
  if (!base) {
    return {
      status: 'disabled',
      suggestions: [],
      reason: 'LANGUAGETOOL_URL is not configured; grammar feedback is off.',
    };
  }

  const language = normalizeLanguage(options.language);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? GRAMMAR_TIMEOUT_MS;
  const startedAt = Date.now();

  const body = new URLSearchParams({ text, language, enabledOnly: 'false' });

  try {
    const response = await fetchImpl(`${base}/v2/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: body.toString(),
      signal: AbortSignal.timeout(timeoutMs),
      // Never forward learner identity or cookies to the grammar service.
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        status: 'unavailable',
        suggestions: [],
        language,
        durationMs: Date.now() - startedAt,
        reason: `Grammar service returned HTTP ${response.status}.`,
      };
    }

    const payload = (await response.json()) as LanguageToolResponse;
    const suggestions = Array.isArray(payload.matches) ? payload.matches.map(mapMatch) : [];

    return {
      status: 'ok',
      suggestions,
      language,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      suggestions: [],
      language,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : 'Grammar service could not be reached.',
    };
  }
}

/**
 * One-line summary for a UI notice. Returns null when there is nothing useful to
 * say (feature off, or no suggestions), so a caller can render conditionally.
 */
export function describeGrammarSummary(result: GrammarCheckResult): string | null {
  if (result.status === 'ok') {
    if (result.suggestions.length === 0) return 'No grammar or spelling issues detected in this text.';
    const grammar = result.suggestions.filter((s) => s.issueType === 'grammar' || s.issueType === 'misspelling');
    const style = result.suggestions.length - grammar.length;
    const parts = [
      grammar.length ? `${grammar.length} grammar or spelling` : null,
      style ? `${style} style or wording` : null,
    ].filter(Boolean);
    return `${parts.join(' and ')} suggestion${result.suggestions.length === 1 ? '' : 's'} found.`;
  }

  if (result.status === 'disabled') return null;
  if (result.status === 'empty') return null;
  if (result.status === 'too_long') return result.reason ?? 'Text is too long to check at once.';
  return 'Grammar feedback is unavailable right now; the rest of your feedback is unaffected.';
}

/**
 * Group suggestions by issue type for display. Keeps the caller from
 * re-implementing the grouping and ordering rules.
 */
export function groupGrammarSuggestions(
  suggestions: GrammarSuggestion[],
): Array<{ issueType: string; items: GrammarSuggestion[] }> {
  const order = ['grammar', 'misspelling', 'typography', 'duplication', 'style', 'other'];
  const groups = new Map<string, GrammarSuggestion[]>();

  for (const suggestion of suggestions) {
    const key = order.includes(suggestion.issueType) ? suggestion.issueType : 'other';
    const existing = groups.get(key);
    if (existing) existing.push(suggestion);
    else groups.set(key, [suggestion]);
  }

  return order
    .filter((issueType) => groups.has(issueType))
    .map((issueType) => ({ issueType, items: groups.get(issueType)! }));
}
