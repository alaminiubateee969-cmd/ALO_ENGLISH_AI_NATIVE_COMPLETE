/**
 * tests/analytics.test.ts
 *
 * The privacy rules are the feature, so they are what is tested. The two that
 * matter most:
 *
 *   1. **No identifier can reach the database.** Not a path, not a label, not a
 *      query string. Anything that looks like data about a person is refused
 *      outright rather than cleaned, because a cleaned value is a value that
 *      someone will later try to use.
 *   2. **Nothing is stored that cannot be counted.** An event outside the fixed
 *      list is dropped, a label that is not a slug is dropped, and a rejection
 *      carries a reason so a broken caller is diagnosable.
 */

import { describe, expect, test } from 'bun:test';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_MAX_EVENTS_PER_REQUEST,
  ANALYTICS_MAX_LABEL_LENGTH,
  ANALYTICS_MAX_PATH_LENGTH,
  counterKey,
  dayKey,
  findPersonalData,
  normaliseAnalyticsBatch,
  normaliseAnalyticsEvent,
  pathOnly,
} from '../src/lib/analytics/events';

const NOON = new Date('2026-10-14T12:00:00Z');

describe('what is accepted', () => {
  test('a page view becomes a counter with a day, an event and a path', () => {
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/exam-prep' }, NOON);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.counter).toEqual({ day: '2026-10-14', event: 'page_view', path: '/exam-prep', label: null });
  });

  test('a slug label is kept', () => {
    const result = normaliseAnalyticsEvent({ name: 'cta_click', path: '/', label: 'Hero-CTA' }, NOON);
    expect(result.ok && result.counter.label).toBe('hero-cta');
  });

  test('an event with no page is still a counter', () => {
    const result = normaliseAnalyticsEvent({ name: 'search' }, NOON);
    expect(result.ok && result.counter.path).toBeNull();
  });

  test('the query string is removed before anything else happens', () => {
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/contact?topic=visa&utm_source=x' }, NOON);
    expect(result.ok && result.counter.path).toBe('/contact');
  });

  test('a trailing slash is the same page as no trailing slash', () => {
    const withSlash = normaliseAnalyticsEvent({ name: 'page_view', path: '/exam-prep/' }, NOON);
    const without = normaliseAnalyticsEvent({ name: 'page_view', path: '/exam-prep' }, NOON);
    expect(withSlash.ok && withSlash.counter.path).toBe(without.ok && without.counter.path);
  });

  test('the root path survives normalisation', () => {
    expect(pathOnly('/')).toBe('/');
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/' }, NOON);
    expect(result.ok && result.counter.path).toBe('/');
  });

  test('nested and bracketed routes are kept', () => {
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/student/learning-memory/[id]' }, NOON);
    expect(result.ok).toBe(true);
  });

  test('every event in the fixed list is accepted', () => {
    for (const name of ANALYTICS_EVENTS) {
      expect(normaliseAnalyticsEvent({ name, path: '/x' }, NOON).ok).toBe(true);
    }
  });
});

describe('what is refused, and why', () => {
  test('an event that is not in the list is refused by name', () => {
    const result = normaliseAnalyticsEvent({ name: 'steal_everything' }, NOON);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.code).toBe('UNKNOWN_EVENT');
    expect(result.rejection.reason).toContain('steal_everything');
  });

  test('a missing or non-string name is refused', () => {
    expect(normaliseAnalyticsEvent({}, NOON).ok).toBe(false);
    expect(normaliseAnalyticsEvent({ name: 42 }, NOON).ok).toBe(false);
  });

  test('an email address in a path is refused, not stripped', () => {
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/student/student@example.com' }, NOON);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.code).toBe('PERSONAL_DATA');
    expect(result.rejection.reason).toContain('email address');
  });

  test('a phone number in a label is refused', () => {
    const result = normaliseAnalyticsEvent({ name: 'cta_click', path: '/', label: 'call-01712345678' }, NOON);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.code).toBe('PERSONAL_DATA');
  });

  test('a long numeric identifier is refused', () => {
    expect(normaliseAnalyticsEvent({ name: 'page_view', path: '/student/8812345678901' }, NOON).ok).toBe(false);
  });

  test('a token in a path is refused', () => {
    expect(normaliseAnalyticsEvent({ name: 'page_view', path: '/reset-password?token=abc' }, NOON).ok).toBe(false);
  });

  test('free text in a label is refused: labels are slugs', () => {
    const result = normaliseAnalyticsEvent({ name: 'cta_click', path: '/', label: 'clicked the orange button' }, NOON);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.rejection.code).toBe('INVALID_LABEL');
  });

  test('a path that is not a path is refused', () => {
    expect(normaliseAnalyticsEvent({ name: 'page_view', path: 'exam-prep' }, NOON).ok).toBe(false);
    expect(normaliseAnalyticsEvent({ name: 'page_view', path: 123 }, NOON).ok).toBe(false);
  });

  test('over-long values are refused rather than truncated', () => {
    const longPath = `/${'a'.repeat(ANALYTICS_MAX_PATH_LENGTH + 5)}`;
    expect(normaliseAnalyticsEvent({ name: 'page_view', path: longPath }, NOON).ok).toBe(false);

    const longLabel = 'a'.repeat(ANALYTICS_MAX_LABEL_LENGTH + 1);
    expect(normaliseAnalyticsEvent({ name: 'cta_click', path: '/', label: longLabel }, NOON).ok).toBe(false);
  });

  test('findPersonalData names what it found', () => {
    expect(findPersonalData('write to me at a@b.co')).toContain('email');
    expect(findPersonalData('call +880 1712 345678')).toContain('phone');
    expect(findPersonalData('hero-cta')).toBeNull();
    expect(findPersonalData('/exam-prep')).toBeNull();
  });
});

describe('batching', () => {
  test('the same counter twice in one batch becomes one counter with a count of two', () => {
    const { counters } = normaliseAnalyticsBatch(
      [
        { name: 'page_view', path: '/exam-prep' },
        { name: 'page_view', path: '/exam-prep' },
        { name: 'page_view', path: '/resources' },
      ],
      NOON,
    );
    expect(counters).toHaveLength(2);
    const examPrep = counters.find((counter) => counter.path === '/exam-prep');
    expect(examPrep?.count).toBe(2);
  });

  test('rejections carry the index of the offending event', () => {
    const { counters, rejections } = normaliseAnalyticsBatch(
      [{ name: 'page_view', path: '/ok' }, { name: 'nope' }, { name: 'page_view', path: '/also-ok' }],
      NOON,
    );
    expect(counters).toHaveLength(2);
    expect(rejections).toHaveLength(1);
    expect(rejections[0]?.index).toBe(1);
    expect(rejections[0]?.code).toBe('UNKNOWN_EVENT');
  });

  test('a batch larger than the cap is cut, not rejected wholesale', () => {
    const many = Array.from({ length: ANALYTICS_MAX_EVENTS_PER_REQUEST + 10 }, (_, index) => ({
      name: 'page_view',
      path: `/page-${index}`,
    }));
    const { counters } = normaliseAnalyticsBatch(many, NOON);
    expect(counters).toHaveLength(ANALYTICS_MAX_EVENTS_PER_REQUEST);
  });

  test('a non-array payload yields nothing rather than throwing', () => {
    expect(normaliseAnalyticsBatch(null, NOON).counters).toEqual([]);
    expect(normaliseAnalyticsBatch('events', NOON).counters).toEqual([]);
    expect(normaliseAnalyticsBatch([null, undefined, 7], NOON).counters).toEqual([]);
    expect(normaliseAnalyticsBatch([null, undefined, 7], NOON).rejections).toHaveLength(3);
  });
});

describe('the counter key', () => {
  test('is stable and distinguishes absent values from empty ones', () => {
    expect(counterKey({ day: '2026-10-14', event: 'page_view', path: '/x', label: null })).toBe('2026-10-14|page_view|/x|');
    expect(counterKey({ day: '2026-10-14', event: 'page_view', path: null, label: null })).not.toBe(
      counterKey({ day: '2026-10-14', event: 'page_view', path: '/x', label: null }),
    );
  });

  test('the day key is the UTC day', () => {
    expect(dayKey(new Date('2026-10-14T23:59:59Z'))).toBe('2026-10-14');
    expect(dayKey(new Date('2026-10-15T00:00:01Z'))).toBe('2026-10-15');
  });
});

describe('the module states its own limits', () => {
  test('the event list is short and named', () => {
    expect(ANALYTICS_EVENTS.length).toBeLessThanOrEqual(12);
    for (const name of ANALYTICS_EVENTS) expect(name).toMatch(/^[a-z_]+$/);
  });

  test('nothing in the stored shape can identify a person', () => {
    // The shape of a counter is the contract: day, event, path, label. A test
    // rather than a comment, so adding a userId field fails here.
    const result = normaliseAnalyticsEvent({ name: 'page_view', path: '/x', label: 'hero' }, NOON);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.counter).sort()).toEqual(['day', 'event', 'label', 'path']);
  });
});
