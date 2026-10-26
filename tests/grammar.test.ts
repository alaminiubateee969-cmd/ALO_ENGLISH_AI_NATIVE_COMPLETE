/**
 * tests/grammar.test.ts
 *
 * The grammar check runs against learner writing, so its failure behaviour is
 * the part that matters most: it must never throw, never hang past its timeout,
 * and never send more text (or more identity) than intended.
 *
 * `fetch` is injected, so no network call and no LanguageTool server is needed.
 */

import { describe, expect, test, afterEach, afterAll } from 'bun:test';
import {
  GRAMMAR_MAX_CHARS,
  checkGrammar,
  describeGrammarSummary,
  groupGrammarSuggestions,
} from '../src/lib/writing/grammar';

const GUARDED_KEYS = ['LANGUAGETOOL_URL'] as const;
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

const SAMPLE_MATCHES = {
  matches: [
    {
      message: 'Possible typo: you repeated a word',
      shortMessage: 'Repeated word',
      offset: 4,
      length: 9,
      replacements: [{ value: 'the' }],
      rule: { id: 'ENGLISH_WORD_REPEAT_RULE', category: { id: 'GRAMMAR' }, issueType: 'duplication' },
    },
    {
      message: 'This sentence does not start with an uppercase letter.',
      offset: 0,
      length: 5,
      replacements: [{ value: 'Practice' }],
      rule: { id: 'UPPERCASE_SENTENCE_START', category: { id: 'TYPOGRAPHY' }, issueType: 'typography' },
    },
    {
      message: 'Consider a shorter phrasing.',
      offset: 20,
      length: 12,
      replacements: [],
      rule: { id: 'STYLE_HINT', category: { id: 'STYLE' }, issueType: 'style' },
    },
  ],
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('checkGrammar configuration', () => {
  test('is disabled when LANGUAGETOOL_URL is unset, without calling fetch', async () => {
    delete process.env.LANGUAGETOOL_URL;
    let called = false;
    const result = await checkGrammar('practice text', {
      fetchImpl: (async () => {
        called = true;
        return jsonResponse(SAMPLE_MATCHES);
      }) as unknown as typeof fetch,
    });

    expect(result.status).toBe('disabled');
    expect(result.suggestions).toEqual([]);
    expect(called).toBe(false);
  });

  test('treats a malformed LANGUAGETOOL_URL as disabled rather than crashing', async () => {
    process.env.LANGUAGETOOL_URL = 'not a url';
    const result = await checkGrammar('practice text');
    expect(result.status).toBe('disabled');
  });

  test('returns empty for blank input without a request', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    let called = false;
    const result = await checkGrammar('   \n ', {
      fetchImpl: (async () => {
        called = true;
        return jsonResponse(SAMPLE_MATCHES);
      }) as unknown as typeof fetch,
    });

    expect(result.status).toBe('empty');
    expect(called).toBe(false);
  });

  test('refuses over-long text instead of trimming a learner sentence', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    const result = await checkGrammar('a'.repeat(GRAMMAR_MAX_CHARS + 1));
    expect(result.status).toBe('too_long');
    expect(result.reason).toContain(String(GRAMMAR_MAX_CHARS));
  });
});

describe('checkGrammar request shape', () => {
  test('posts text and language, and returns mapped suggestions', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local/';
    let captured: { url: string; init?: RequestInit } | null = null;

    const result = await checkGrammar('Practice the the test.', {
      language: 'en-GB',
      fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
        captured = { url: String(url), init };
        return jsonResponse(SAMPLE_MATCHES);
      }) as unknown as typeof fetch,
    });

    expect(result.status).toBe('ok');
    expect(result.language).toBe('en-GB');
    expect(result.suggestions).toHaveLength(3);

    // Trailing slash on the configured URL must not produce "//v2/check".
    expect(captured!.url).toBe('http://grammar.local/v2/check');
    expect(String(captured!.init?.body)).toContain('language=en-GB');
    expect(String(captured!.init?.body)).toContain('text=Practice');
    expect(captured!.init?.method).toBe('POST');

    const [first] = result.suggestions;
    expect(first.ruleId).toBe('ENGLISH_WORD_REPEAT_RULE');
    expect(first.replacements).toEqual(['the']);
    expect(first.issueType).toBe('duplication');
    expect(first.offset).toBe(4);
  });

  test('falls back to en-US for an unusable language tag', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    let body = '';
    await checkGrammar('text', {
      language: 'not a language',
      fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
        body = String(init?.body);
        return jsonResponse({ matches: [] });
      }) as unknown as typeof fetch,
    });
    expect(body).toContain('language=en-US');
  });

  test('tolerates a response with no matches array', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    const result = await checkGrammar('text', {
      fetchImpl: (async () => jsonResponse({})) as unknown as typeof fetch,
    });
    expect(result.status).toBe('ok');
    expect(result.suggestions).toEqual([]);
  });
});

describe('checkGrammar failure handling', () => {
  test('reports a non-200 response as unavailable, with the status code', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    const result = await checkGrammar('text', {
      fetchImpl: (async () => jsonResponse({}, 503)) as unknown as typeof fetch,
    });
    expect(result.status).toBe('unavailable');
    expect(result.reason).toContain('503');
  });

  test('reports a network failure as unavailable instead of throwing', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    const result = await checkGrammar('text', {
      fetchImpl: (async () => {
        throw new Error('connect ECONNREFUSED');
      }) as unknown as typeof fetch,
    });
    expect(result.status).toBe('unavailable');
    expect(result.reason).toContain('ECONNREFUSED');
  });

  test('reports a timeout as unavailable instead of hanging', async () => {
    process.env.LANGUAGETOOL_URL = 'http://grammar.local';
    const result = await checkGrammar('text', {
      timeoutMs: 20,
      fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal;
        await new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('The operation was aborted')));
        });
        return jsonResponse({});
      }) as unknown as typeof fetch,
    });
    expect(result.status).toBe('unavailable');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('grammar presentation helpers', () => {
  const okResult = {
    status: 'ok' as const,
    suggestions: [
      { message: 'a', offset: 0, length: 1, replacements: [], ruleId: 'R1', category: 'GRAMMAR', issueType: 'grammar' },
      { message: 'b', offset: 2, length: 1, replacements: [], ruleId: 'R2', category: 'GRAMMAR', issueType: 'grammar' },
      { message: 'c', offset: 4, length: 1, replacements: [], ruleId: 'R3', category: 'STYLE', issueType: 'style' },
    ],
  };

  test('summarises counts by category', () => {
    expect(describeGrammarSummary(okResult)).toBe('2 grammar or spelling and 1 style or wording suggestions found.');
  });

  test('says so when the text is clean', () => {
    expect(describeGrammarSummary({ status: 'ok', suggestions: [] })).toContain('No grammar or spelling issues');
  });

  test('stays silent when the feature is off', () => {
    expect(describeGrammarSummary({ status: 'disabled', suggestions: [] })).toBeNull();
    expect(describeGrammarSummary({ status: 'empty', suggestions: [] })).toBeNull();
  });

  test('explains an outage without alarming the learner', () => {
    const message = describeGrammarSummary({ status: 'unavailable', suggestions: [] });
    expect(message).toContain('unavailable');
    expect(message).toContain('unaffected');
  });

  test('groups in a stable order', () => {
    const groups = groupGrammarSuggestions(okResult.suggestions);
    expect(groups.map((group) => group.issueType)).toEqual(['grammar', 'style']);
    expect(groups[0].items).toHaveLength(2);
  });

  test('routes unknown issue types into the other group', () => {
    const groups = groupGrammarSuggestions([
      { message: 'x', offset: 0, length: 1, replacements: [], ruleId: 'R', category: 'C', issueType: 'mystery' },
    ]);
    expect(groups).toEqual([
      { issueType: 'other', items: [expect.objectContaining({ issueType: 'mystery' })] },
    ]);
  });
});
