/**
 * src/lib/analytics/events.ts
 *
 * Privacy-first, first-party analytics: aggregate counters, and nothing else.
 *
 * WHAT IS COLLECTED, EXACTLY
 * ──────────────────────────
 * An event name from a fixed list, the path of the page it happened on, and
 * optionally a short slug label ("hero-cta", "footer-consult"). Counted per day.
 * That is the entire schema, and it is enforced here rather than by convention:
 *
 *   * **No identifier of any kind.** No cookie, no session id, no user id, no IP
 *     address, no user-agent string, no referrer. A visitor is not represented in
 *     the database at all — only how many times a path was seen on a day.
 *   * **No free text.** A label must match a slug shape; anything with a space, an
 *     @, a digit run or an unexpected character is refused, which is what stops
 *     "label: student's email address" from being written by a future caller.
 *   * **No query strings.** They routinely carry email addresses, tokens and
 *     search terms; the path is truncated at the query before anything else runs.
 *
 * The consequence to be honest about: this cannot tell you who came back, cannot
 * build a funnel per visitor, and cannot attribute a conversion to a campaign
 * click. That is the trade. A deployment that needs those things adds an external
 * service (see `src/lib/integrations/registry.ts`, Umami) rather than quietly
 * widening this schema.
 *
 * WHY IT IS A PURE MODULE
 * ───────────────────────
 * The privacy rules are the product here, so they are testable without a
 * database or a request: `normaliseAnalyticsEvent` is the only way in, and it
 * either returns a counter-shaped value or a reason.
 */

/** The only event names that can be counted. Adding one is a deliberate act. */
export const ANALYTICS_EVENTS = [
  'page_view',
  'cta_click',
  'outbound_click',
  'practice_start',
  'consultation_start',
  'register_start',
  'search',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type RawAnalyticsEvent = {
  name?: unknown;
  path?: unknown;
  label?: unknown;
};

export type AnalyticsCounter = {
  /** Local day, YYYY-MM-DD. The coarsest useful unit and the only time we keep. */
  day: string;
  event: AnalyticsEventName;
  /** Path with the query string removed, or null when the event has no page. */
  path: string | null;
  /** Slug-shaped label, or null. */
  label: string | null;
};

export type AnalyticsRejection = {
  code: 'UNKNOWN_EVENT' | 'INVALID_PATH' | 'PERSONAL_DATA' | 'INVALID_LABEL';
  reason: string;
};

export type NormaliseResult =
  | { ok: true; counter: AnalyticsCounter }
  | { ok: false; rejection: AnalyticsRejection };

export const ANALYTICS_MAX_EVENTS_PER_REQUEST = 20;
/** How long counters are kept. Beyond a year they describe nothing useful. */
export const ANALYTICS_RETENTION_DAYS = 400;
export const ANALYTICS_MAX_PATH_LENGTH = 120;
export const ANALYTICS_MAX_LABEL_LENGTH = 40;

/**
 * Patterns that indicate a string is carrying data about a person rather than a
 * page. Used to refuse paths and labels, never to sanitise them: a path that
 * looks like an email address is dropped, because the only way it got there is a
 * caller putting one in a URL.
 */
const PERSONAL_DATA_PATTERNS: Array<{ pattern: RegExp; what: string }> = [
  { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, what: 'an email address' },
  { pattern: /(?:\+?\d[\s-]?){7,}/, what: 'a phone number' },
  { pattern: /\b\d{10,}\b/, what: 'a long numeric identifier' },
  { pattern: /\b(?:bearer|token|secret|password|api[_-]?key)\b/i, what: 'a credential' },
  { pattern: /\b[0-9a-f]{24,}\b/i, what: 'a hashed identifier' },
];

export function findPersonalData(value: string): string | null {
  for (const { pattern, what } of PERSONAL_DATA_PATTERNS) {
    if (pattern.test(value)) return what;
  }
  return null;
}

/** Local day key. UTC arithmetic on a trimmed ISO string: no locale surprises. */
export function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Everything before the query string or fragment, trimmed of a trailing slash. */
export function pathOnly(rawPath: string): string {
  const withoutQuery = rawPath.split(/[?#]/, 1)[0] ?? '';
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed.length === 0 ? '/' : trimmed;
}

function normalisePath(rawPath: unknown): { ok: true; path: string | null } | { ok: false; rejection: AnalyticsRejection } {
  if (rawPath === undefined || rawPath === null || rawPath === '') return { ok: true, path: null };
  if (typeof rawPath !== 'string') {
    return { ok: false, rejection: { code: 'INVALID_PATH', reason: 'A path must be a string.' } };
  }

  const personal = findPersonalData(rawPath);
  if (personal) {
    return { ok: false, rejection: { code: 'PERSONAL_DATA', reason: `The path contained ${personal}. Paths are never stored with personal data.` } };
  }

  const path = pathOnly(rawPath);
  if (!path.startsWith('/')) {
    return { ok: false, rejection: { code: 'INVALID_PATH', reason: 'A path must start with "/".' } };
  }
  if (path.length > ANALYTICS_MAX_PATH_LENGTH) {
    return { ok: false, rejection: { code: 'INVALID_PATH', reason: `A path must be at most ${ANALYTICS_MAX_PATH_LENGTH} characters.` } };
  }
  if (!/^\/[A-Za-z0-9\-._~/[\]]*$/.test(path)) {
    return { ok: false, rejection: { code: 'INVALID_PATH', reason: 'The path contains characters that are not part of a route.' } };
  }

  return { ok: true, path };
}

function normaliseLabel(rawLabel: unknown): { ok: true; label: string | null } | { ok: false; rejection: AnalyticsRejection } {
  if (rawLabel === undefined || rawLabel === null || rawLabel === '') return { ok: true, label: null };
  if (typeof rawLabel !== 'string') {
    return { ok: false, rejection: { code: 'INVALID_LABEL', reason: 'A label must be a string.' } };
  }

  const personal = findPersonalData(rawLabel);
  if (personal) {
    return { ok: false, rejection: { code: 'PERSONAL_DATA', reason: `The label contained ${personal}.` } };
  }

  const label = rawLabel.trim().toLowerCase();
  if (label.length > ANALYTICS_MAX_LABEL_LENGTH) {
    return { ok: false, rejection: { code: 'INVALID_LABEL', reason: `A label must be at most ${ANALYTICS_MAX_LABEL_LENGTH} characters.` } };
  }
  // Slug only: this is the rule that makes "free text" impossible.
  if (!/^[a-z0-9][a-z0-9\-._:]*$/.test(label)) {
    return { ok: false, rejection: { code: 'INVALID_LABEL', reason: 'A label must be a slug: lowercase letters, digits, dash, dot or colon.' } };
  }

  return { ok: true, label };
}

/** The single entry point. Anything that cannot become a counter is refused. */
export function normaliseAnalyticsEvent(raw: RawAnalyticsEvent, now: Date = new Date()): NormaliseResult {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) {
    return {
      ok: false,
      rejection: {
        code: 'UNKNOWN_EVENT',
        reason: `Unknown event "${name.slice(0, 40)}". Allowed events: ${ANALYTICS_EVENTS.join(', ')}.`,
      },
    };
  }

  const path = normalisePath(raw.path);
  if (!path.ok) return path;

  const label = normaliseLabel(raw.label);
  if (!label.ok) return label;

  return {
    ok: true,
    counter: {
      day: dayKey(now),
      event: name as AnalyticsEventName,
      path: path.path,
      label: label.label,
    },
  };
}

export type NormaliseBatchResult = {
  /** Counters to add, already combined: the same counter twice is +2, not two rows. */
  counters: Array<AnalyticsCounter & { count: number }>;
  rejections: Array<AnalyticsRejection & { index: number }>;
};

/**
 * Normalise a batch (the shape a browser beacon sends) and combine duplicates.
 * A duplicate count is the whole aggregation: the database stores one row per
 * day/event/path/label and increments it.
 */
export function normaliseAnalyticsBatch(
  raw: unknown,
  now: Date = new Date(),
  limit: number = ANALYTICS_MAX_EVENTS_PER_REQUEST,
): NormaliseBatchResult {
  const list = Array.isArray(raw) ? raw.slice(0, limit) : [];
  const combined = new Map<string, AnalyticsCounter & { count: number }>();
  const rejections: Array<AnalyticsRejection & { index: number }> = [];

  list.forEach((entry, index) => {
    const result = normaliseAnalyticsEvent((entry ?? {}) as RawAnalyticsEvent, now);
    if (!result.ok) {
      rejections.push({ ...result.rejection, index });
      return;
    }
    const key = `${result.counter.day}|${result.counter.event}|${result.counter.path ?? ''}|${result.counter.label ?? ''}`;
    const existing = combined.get(key);
    if (existing) existing.count += 1;
    else combined.set(key, { ...result.counter, count: 1 });
  });

  return { counters: [...combined.values()], rejections };
}

/** Key used by the `(day, event, path, label)` unique index. */
export function counterKey(counter: Pick<AnalyticsCounter, 'day' | 'event' | 'path' | 'label'>): string {
  return `${counter.day}|${counter.event}|${counter.path ?? ''}|${counter.label ?? ''}`;
}
