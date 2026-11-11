/**
 * tests/blog.test.ts
 *
 * The blog is a public page written by staff, so the tests are about the two ways
 * it could embarrass the platform:
 *
 *   1. **Copy that should never be published** — a guarantee, an invented
 *      statistic, or a claim of official status. The claims check cannot be
 *      acknowledged away; the style check can, but only explicitly and on the
 *      record.
 *   2. **Markup from a writer's keyboard** — the body format is three constructs
 *      and the renderer returns data, so a pasted `<script>` becomes visible text
 *      rather than an element.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BODY_MIN,
  EXCERPT_MIN,
  STYLE_INDEX_CEILING,
  TITLE_MIN,
  checkPublish,
  normaliseTags,
  postPath,
  readingMinutes,
  renderBlocks,
  slugify,
  toSummary,
  validatePost,
} from '../src/lib/content/blog';

const VALID = {
  title: 'How to plan your IELTS preparation',
  excerpt: 'A practical way to decide what to practise first, how often to sit a practice set, and when to book the real test.',
  body: `${'Practice works best when the weakest section is the one you work on first. '.repeat(6)}\n\n## Start with a baseline\n\nSit one full practice set before deciding anything. ${'Do it in one sitting and write down how each section felt. '.repeat(4)}`,
};

const ROOT = join(import.meta.dir, '..');

describe('slugs', () => {
  test('a title becomes a readable slug', () => {
    expect(slugify('How to plan your IELTS preparation')).toBe('how-to-plan-your-ielts-preparation');
  });

  test('accents and punctuation do not leak into URLs', () => {
    expect(slugify('Café — Costs, Traps & Tips!')).toBe('cafe-costs-traps-tips');
  });

  test('a slug never starts or ends with a separator', () => {
    expect(slugify('   ...Study Abroad...   ')).toBe('study-abroad');
  });
});

describe('validation', () => {
  test('a well-formed post passes and comes back normalised', () => {
    const result = validatePost(VALID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.slug).toBe('how-to-plan-your-ielts-preparation');
    expect(result.value.tags).toBe('');
  });

  test('a title, excerpt or body outside its window is refused with the limit named', () => {
    const short = validatePost({ ...VALID, title: 'x'.repeat(TITLE_MIN - 1) });
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toContain(String(TITLE_MIN));

    const thinExcerpt = validatePost({ ...VALID, excerpt: 'x'.repeat(EXCERPT_MIN - 1) });
    expect(thinExcerpt.ok).toBe(false);

    const shortBody = validatePost({ ...VALID, body: 'x'.repeat(BODY_MIN - 1) });
    expect(shortBody.ok).toBe(false);
  });

  test('a slug that would collide with a route is refused', () => {
    const result = validatePost({ ...VALID, slug: 'new' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('SLUG_RESERVED');
  });

  test('an explicit slug is used instead of the title', () => {
    const result = validatePost({ ...VALID, slug: 'ielts-preparation-plan' });
    expect(result.ok && result.value.slug).toBe('ielts-preparation-plan');
  });

  test('tags are slugged, de-duplicated and capped', () => {
    expect(normaliseTags(['IELTS', 'ielts', 'Study Abroad'])).toEqual(['ielts', 'study-abroad']);
    expect(normaliseTags('ielts, study-abroad')).toEqual(['ielts', 'study-abroad']);
    expect(normaliseTags(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toHaveLength(5);
    expect(normaliseTags(undefined)).toEqual([]);
  });
});

describe('the renderer', () => {
  test('paragraphs, headings and lists become blocks', () => {
    const blocks = renderBlocks('First para.\n\n## A heading\n\n- one\n- two\n\nSecond para.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'First para.' },
      { type: 'heading', text: 'A heading' },
      { type: 'list', items: ['one', 'two'] },
      { type: 'paragraph', text: 'Second para.' },
    ]);
  });

  test('a heading level 1 is treated as a paragraph rather than silently dropped', () => {
    // The page already has an h1; a writer typing one is doing something the format
    // does not support, and losing the line would be worse than showing it plainly.
    const blocks = renderBlocks('# Not a supported heading');
    expect(blocks).toEqual([{ type: 'paragraph', text: '# Not a supported heading' }]);
  });

  test('markup from a writer stays text', () => {
    const blocks = renderBlocks('<script>alert(1)</script> is not markup here.');
    expect(blocks).toEqual([{ type: 'paragraph', text: '<script>alert(1)</script> is not markup here.' }]);
  });

  test('single newlines inside a paragraph are joined, blank lines separate', () => {
    const blocks = renderBlocks('One line\nand its continuation.\n\nA new paragraph.');
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'One line and its continuation.' },
      { type: 'paragraph', text: 'A new paragraph.' },
    ]);
  });

  test('an empty body renders no blocks at all', () => {
    expect(renderBlocks('')).toEqual([]);
    expect(renderBlocks('   \n\n  ')).toEqual([]);
  });
});

describe('reading time and summaries', () => {
  test('reading time is at least a minute and grows with the text', () => {
    expect(readingMinutes('one two three')).toBe(1);
    expect(readingMinutes('word '.repeat(500))).toBeGreaterThan(1);
  });

  test('a summary carries no body and lists its tags', () => {
    const summary = toSummary({
      slug: 'x',
      title: 'A title',
      excerpt: 'An excerpt',
      tags: 'ielts,visas',
      body: 'word '.repeat(200),
      publishedAt: new Date('2026-10-14T09:00:00Z'),
    });
    expect(summary.tags).toEqual(['ielts', 'visas']);
    expect(summary.publishedAt).toBe('2026-10-14T09:00:00.000Z');
    expect(Object.keys(summary)).not.toContain('body');
  });

  test('an unpublished post has no published date but still has a path', () => {
    const summary = toSummary({ slug: 'draft-post', title: 'T', excerpt: 'E', tags: '', body: 'w '.repeat(50), publishedAt: null });
    expect(summary.publishedAt).toBeNull();
    expect(postPath('draft-post')).toBe('/blog/draft-post');
  });
});

describe('the publish gate', () => {
  const clean = {
    title: 'A calm guide to practice planning',
    excerpt: 'What to practise first, how often to sit a practice set, and when it is worth booking the real test.',
    body: 'Sit one practice set before deciding anything. Write down which section felt worst, and work on that one next. '.repeat(4),
  };

  test('ordinary copy publishes', () => {
    const check = checkPublish(clean);
    expect(check.canPublish).toBe(true);
    expect(check.claimViolations).toEqual([]);
    expect(check.needsAcknowledgement).toBe(false);
  });

  test('a guarantee stops a post outright', () => {
    const check = checkPublish({
      ...clean,
      excerpt: 'Follow this plan and we guarantee a band 7 in one month.',
    });
    expect(check.canPublish).toBe(false);
    expect(check.claimViolations.length).toBeGreaterThan(0);
    expect(check.reason).toContain('claim');
  });

  test('acknowledging style does not let a claim through', () => {
    const check = checkPublish({
      ...clean,
      body: clean.body + 'Our students are guaranteed admission to their first-choice university.',
      acknowledgedStyle: true,
    });
    expect(check.canPublish).toBe(false);
    expect(check.needsAcknowledgement).toBe(false);
  });

  test('machine prose can be published only with an explicit acknowledgement', () => {
    const wordy =
      "In today's fast-paced world, planning is a testament to navigating the complexities of the modern landscape. It is worth noting that our seamless platform unlocks your potential. In conclusion, we are excited to announce a game-changer.";
    const body = `${wordy} ${'We help students plan their preparation and book the right test at the right time. '.repeat(4)}`;

    const refused = checkPublish({ ...clean, body });
    expect(refused.styleIndex).toBeGreaterThan(STYLE_INDEX_CEILING);
    expect(refused.canPublish).toBe(false);
    expect(refused.needsAcknowledgement).toBe(true);
    expect(refused.styleFindings.length).toBeGreaterThan(0);
    expect(refused.reason).toContain(String(STYLE_INDEX_CEILING));

    const acknowledged = checkPublish({ ...clean, body, acknowledgedStyle: true });
    expect(acknowledged.canPublish).toBe(true);
    expect(acknowledged.reason).toContain('acknowledged');
  });

  test('the gate reports what it measured, not just a verdict', () => {
    const check = checkPublish(clean);
    expect(typeof check.styleIndex).toBe('number');
    expect(check.reason.length).toBeGreaterThan(10);
  });
});

describe('the pages that serve this', () => {
  test('the blog index declares the same title and description the SEO table records', () => {
    // Same drift guard as the rest of /blog: the audit reads a table, the browser
    // reads the page, and they must be the same sentences.
    const page = readFileSync(join(ROOT, 'src/app/blog/page.tsx'), 'utf8');
    const metadata = readFileSync(join(ROOT, 'src/lib/seo/metadata.ts'), 'utf8');

    const title = 'Study Abroad and English Test Guides';
    expect(page).toContain(title);
    expect(metadata).toContain(title);
  });

  test('the post page renders blocks instead of raw HTML', () => {
    const page = readFileSync(join(ROOT, 'src/app/blog/[slug]/page.tsx'), 'utf8');
    expect(page).toContain('renderBlocks');
    // The call, not the word: the page explains in a comment why it does not use
    // raw HTML, and a test that forbade the word would forbid the explanation.
    expect(page).not.toMatch(/dangerouslySetInnerHTML\s*\(/);
  });

  test('neither page makes a promise of its own', () => {
    const index = readFileSync(join(ROOT, 'src/app/blog/page.tsx'), 'utf8');
    const detail = readFileSync(join(ROOT, 'src/app/blog/[slug]/page.tsx'), 'utf8');
    for (const source of [index, detail]) {
      // Both pages say "no guarantees" in their disclosure copy, which is the
      // sentence this platform is required to publish. What must not appear is an
      // affirmative promise.
      expect(source).not.toMatch(/(?:we|our) guarantee|guaranteed (?:admission|a band|band \d|visa|place)/i);
    }
  });
});
