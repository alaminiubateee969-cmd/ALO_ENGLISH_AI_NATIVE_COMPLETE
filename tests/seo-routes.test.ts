/**
 * tests/seo-routes.test.ts
 *
 * Calls the sitemap and robots route handlers directly.
 *
 * Why not rely on the build: page-data collection is where a malformed sitemap
 * entry surfaces, and on a host whose database is unavailable that phase can
 * fail for an unrelated reason before these routes are ever evaluated. Invoking
 * the handlers here gives them independent coverage.
 */

import { describe, expect, test, afterEach, afterAll } from 'bun:test';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { INDEXABLE_PUBLIC_ROUTES } from '../src/lib/public-routes';

const GUARDED_KEYS = ['APP_URL', 'NEXTAUTH_URL'] as const;
const saved = new Map(GUARDED_KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of GUARDED_KEYS) {
    const original = saved.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
}

afterEach(restoreEnv);
afterAll(restoreEnv);

describe('sitemap route', () => {
  test('emits one absolute entry per indexable route', () => {
    delete process.env.APP_URL;
    delete process.env.NEXTAUTH_URL;

    const entries = sitemap();
    expect(entries).toHaveLength(INDEXABLE_PUBLIC_ROUTES.length);

    for (const entry of entries) {
      expect(entry.url.startsWith('https://english.aloeducation.com')).toBe(true);
      expect(entry.changeFrequency).toBeDefined();
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(Number.isNaN((entry.lastModified as Date).getTime())).toBe(false);
    }
  });

  test('renders the home page as the bare origin, with no trailing slash', () => {
    delete process.env.APP_URL;
    const entries = sitemap();
    expect(entries[0].url).toBe('https://english.aloeducation.com');
  });

  test('never includes a private or API path', () => {
    process.env.APP_URL = 'https://staging.example.com';
    const urls = sitemap().map((entry) => entry.url);

    for (const url of urls) {
      const path = new URL(url).pathname;
      expect(path.startsWith('/api')).toBe(false);
      expect(path.startsWith('/admin')).toBe(false);
      expect(path.startsWith('/student')).toBe(false);
      expect(path).not.toBe('/login');
    }
  });

  test('honours APP_URL so a staging deploy does not advertise production URLs', () => {
    process.env.APP_URL = 'https://staging.example.com/';
    expect(sitemap()[0].url).toBe('https://staging.example.com');
  });
});

describe('robots route', () => {
  test('allows crawling but disallows authenticated and machine surfaces', () => {
    delete process.env.APP_URL;
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rule.userAgent).toBe('*');
    expect(rule.allow).toBe('/');

    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
    for (const path of ['/admin', '/api', '/student', '/practice-test', '/login']) {
      expect(disallow).toContain(path);
    }
  });

  test('advertises the sitemap on the same origin as the canonical metadata', () => {
    process.env.APP_URL = 'https://staging.example.com';
    const result = robots();
    expect(result.sitemap).toBe('https://staging.example.com/sitemap.xml');
    expect(result.host).toBe('https://staging.example.com');
  });
});
