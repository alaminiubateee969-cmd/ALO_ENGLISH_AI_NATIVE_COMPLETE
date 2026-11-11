/**
 * tests/copy-style.test.ts
 *
 * The style filter is only useful if it is run against real copy, so these tests
 * check three things above all:
 *
 *   1. It finds the tells in prose that is full of them.
 *   2. It does not fire on the repository's own published copy, including the
 *      disclosure sentences this platform is required to publish. A filter that
 *      flags "we are not an official test centre" is a filter that gets turned
 *      off.
 *   3. It reports, never rewrites, and never claims to measure authorship.
 */

import { describe, expect, test } from 'bun:test';
import {
  STYLE_RULES,
  checkStyle,
  describeStyleReport,
  findStyleIssues,
  passesStyleCheck,
} from '../src/lib/copy/humanizer';

const GENERATED_PROSE = `
In today's fast-paced world, choosing where to study is a testament to navigating the
complexities of the modern landscape. Our seamless, robust and cutting-edge platform
unlocks your potential. It is worth noting that, in order to apply, you may possibly
need documents. Not only do we provide guidance, but also we empower you to delve into
a wide range of opportunities. In conclusion, we are excited to announce a game-changer.
`;

describe('finding machine prose', () => {
  test('finds all four categories in a paragraph written to contain them', () => {
    const findings = findStyleIssues(GENERATED_PROSE);
    const categories = new Set(findings.map((finding) => finding.category));
    expect(categories).toEqual(new Set(['AI_TELL', 'FILLER', 'HEDGE', 'PATTERN']));
  });

  test('reports the exact matched text and where it was', () => {
    const findings = findStyleIssues('We are excited to announce the new intake.');
    const stock = findings.find((finding) => finding.ruleId === 'stock-excited');
    expect(stock).toBeDefined();
    expect(stock?.match.toLowerCase()).toContain('excited to announce');
    expect(stock?.index).toBeGreaterThanOrEqual(0);
    expect(stock?.suggestion).toBeTruthy();
  });

  test('finds every occurrence, not just the first', () => {
    const findings = findStyleIssues('It is worth noting that one. It is worth noting that two.');
    expect(findings.filter((finding) => finding.ruleId === 'filler-it-is-worth-noting')).toHaveLength(2);
  });

  test('findings come back in document order', () => {
    const findings = findStyleIssues('It is worth noting that we delve into the realm of things.');
    const indexes = findings.map((finding) => finding.index);
    expect([...indexes].sort((left, right) => left - right)).toEqual(indexes);
  });

  test('the same text gives identical findings twice (no regex state carried over)', () => {
    const first = findStyleIssues(GENERATED_PROSE);
    const second = findStyleIssues(GENERATED_PROSE);
    expect(second).toEqual(first);
  });

  test('empty and whitespace-only input produces nothing', () => {
    expect(findStyleIssues('')).toEqual([]);
    expect(findStyleIssues('   \n  ')).toEqual([]);
    expect(checkStyle('').tellIndex).toBe(0);
    expect(describeStyleReport(checkStyle(''))).toBeNull();
  });
});

describe('it does not fire on honest copy', () => {
  // Every sentence below is either published in this repository or is the kind of
  // sentence the platform is required to publish. Flagging these would train
  // writers to ignore the checker.
  const houseCopy = [
    'Practice scores are estimates and are not official exam results.',
    'ALO English is not an official IELTS, PTE or TOEFL test centre.',
    'The office is open Sunday to Thursday, 9:00 to 18:00 Dhaka time.',
    'Bring your passport, transcripts and a passport-size photograph.',
    'Question counts describe the local practice catalog only; they do not prove full test coverage.',
    'This is an automated message from ALO English. A counsellor will read your question during office hours.',
    'We do not predict visa outcomes, and no one at ALO can guarantee an admission decision.',
  ];

  for (const sentence of houseCopy) {
    test(`clean: "${sentence.slice(0, 46)}…"`, () => {
      expect(findStyleIssues(sentence)).toEqual([]);
    });
  }

  test('the whole check is clean, not just the phrase list', () => {
    const report = checkStyle(houseCopy.join(' '));
    expect(report.findings).toEqual([]);
    expect(passesStyleCheck(houseCopy.join(' '))).toBe(true);
    expect(describeStyleReport(report)).toContain('No machine-prose patterns');
  });
});

describe('the index', () => {
  test('is per hundred words, and generated prose scores far above the ceiling', () => {
    const report = checkStyle(GENERATED_PROSE);
    expect(report.words).toBeGreaterThan(50);
    expect(report.tellIndex).toBeGreaterThan(5);
    expect(passesStyleCheck(GENERATED_PROSE)).toBe(false);
  });

  test('reports the longest sentence with its opening words', () => {
    const report = checkStyle('Short one. This sentence is quite a lot longer than the other one in this text.');
    expect(report.longestSentence?.opening.startsWith('This sentence')).toBe(true);
    expect(report.longestSentence?.words).toBeGreaterThan(10);
  });

  test('the ceiling is a parameter, so a stricter gate is possible', () => {
    const report = checkStyle('It is worth noting that practice helps.');
    expect(report.tellIndex).toBeGreaterThan(0);
    expect(passesStyleCheck('It is worth noting that practice helps.', 0)).toBe(false);
    expect(passesStyleCheck('It is worth noting that practice helps.', 100)).toBe(true);
  });

  test('categories are counted, and the sentence describes them', () => {
    const report = checkStyle(GENERATED_PROSE);
    const total = Object.values(report.byCategory).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(report.findings.length);
    expect(describeStyleReport(report)).toContain('style flag');
  });
});

describe('the rule set itself', () => {
  test('every rule has an id, a problem and a category', () => {
    const ids = STYLE_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of STYLE_RULES) {
      expect(rule.problem.length).toBeGreaterThan(10);
      expect(['AI_TELL', 'FILLER', 'HEDGE', 'PATTERN']).toContain(rule.category);
    }
  });

  test('no rule says anything about who wrote the text', () => {
    // The checker reports prose patterns. It must not claim to detect AI
    // authorship, which is not something a regular expression can establish.
    const text = STYLE_RULES.map((rule) => `${rule.problem} ${rule.suggestion ?? ''}`).join(' ').toLowerCase();
    for (const claim of ['written by ai', 'ai-generated content', 'detects ai', 'proves']) {
      expect(text).not.toContain(claim);
    }
  });
});
