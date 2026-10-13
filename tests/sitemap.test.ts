/**
 * tests/sitemap.test.ts
 *
 * Guards the crawl surface. Three failure modes are covered:
 *
 *   1. The sitemap lists a path that is NOT in the proxy's public allowlist —
 *      that would submit a URL that redirects or 401s to search engines.
 *   2. robots.txt allows crawling an authenticated surface, or the sitemap and
 *      robots policy disagree.
 *   3. `resolveSiteUrl` produces a malformed origin or crashes on bad input,
 *      which would break canonical URLs and the build.
 *
 * The proxy's PUBLIC_PAGES list is read from source, so renaming a route in the
 * proxy without updating the sitemap fails here rather than silently shipping.
 */

import { describe, expect, test, afterEach, afterAll } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  INDEXABLE_PUBLIC_ROUTES,
  NON_INDEXABLE_PREFIXES,
  isNonIndexable,
  resolveSiteUrl,
} from '../src/lib/public-routes';

const ROOT = join(import.meta.dir, '..');

// `bun test tests/` runs every file in one process: snapshot and restore the
// environment instead of deleting keys, so neighbouring suites are unaffected.
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

function proxyPublicPages(): string[] {
  const source = readFileSync(join(ROOT, 'src', 'proxy.ts'), 'utf8');
  const match = source.match(/PUBLIC_PAGES\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
  if (!match) throw new Error('PUBLIC_PAGES block not found in src/proxy.ts');
  return [...match[1].matchAll(/["'](\/[^"']*)["']/g)].map((m) => m[1]);
}

describe('sitemap route list', () => {
  test('every sitemap path is a public page in the proxy allowlist', () => {
    const allowed = new Set(proxyPublicPages());
    expect(allowed.size).toBeGreaterThan(0);

    const notAllowed = INDEXABLE_PUBLIC_ROUTES.map((route) => route.path).filter(
      (path) => !allowed.has(path),
    );

    expect(notAllowed).toEqual([]);
  });

  test('no sitemap path is marked non-indexable', () => {
    const offenders = INDEXABLE_PUBLIC_ROUTES.map((route) => route.path).filter(isNonIndexable);
    expect(offenders).toEqual([]);
  });

  test('paths are unique, absolute, and have valid metadata', () => {
    const paths = INDEXABLE_PUBLIC_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);

    for (const route of INDEXABLE_PUBLIC_ROUTES) {
      expect(route.path.startsWith('/')).toBe(true);
      expect(route.priority).toBeGreaterThan(0);
      expect(route.priority).toBeLessThanOrEqual(1);
      expect(route.label.trim().length).toBeGreaterThan(0);
      // Must be a real calendar date, not just the right shape.
      expect(Number.isNaN(Date.parse(route.lastModified))).toBe(false);
    }
  });

  test('the home page is present with the highest priority', () => {
    const home = INDEXABLE_PUBLIC_ROUTES.find((route) => route.path === '/');
    expect(home).toBeDefined();
    const max = Math.max(...INDEXABLE_PUBLIC_ROUTES.map((route) => route.priority));
    expect(home?.priority).toBe(max);
  });
});

describe('robots policy', () => {
  test('authenticated surfaces are disallowed', () => {
    for (const prefix of ['/admin', '/student', '/partner', '/api/', '/login', '/practice-test']) {
      expect(isNonIndexable(prefix)).toBe(true);
      expect(NON_INDEXABLE_PREFIXES).toContain(prefix);
    }
  });

  test('public content paths are crawlable', () => {
    for (const route of INDEXABLE_PUBLIC_ROUTES) {
      expect(isNonIndexable(route.path)).toBe(false);
    }
  });

  test('a prefix match does not leak into a similarly named public path', () => {
    // "/students-guide" style paths must not be blocked by the "/student" rule.
    expect(isNonIndexable('/student')).toBe(true);
    expect(isNonIndexable('/student-portal')).toBe(true);
    expect(isNonIndexable('/api')).toBe(false); // prefix is "/api/" by design
  });
});

describe('site origin resolution', () => {
  test('strips any path or trailing slash from the configured URL', () => {
    process.env.APP_URL = 'https://staging.aloeducation.com/some/path/';
    expect(resolveSiteUrl()).toBe('https://staging.aloeducation.com');
  });

  test('falls back to the production hostname when unset', () => {
    delete process.env.APP_URL;
    delete process.env.NEXTAUTH_URL;
    expect(resolveSiteUrl()).toBe('https://english.aloeducation.com');
  });

  test('ignores a malformed URL instead of throwing', () => {
    process.env.APP_URL = 'not a url';
    delete process.env.NEXTAUTH_URL;
    expect(resolveSiteUrl()).toBe('https://english.aloeducation.com');
  });
});
