/**
 * src/lib/content/blog.ts
 *
 * The blog: writing rules, a dependency-free renderer, and the gate a post has to
 * pass before it can be published.
 *
 * WHY THERE IS NO MARKDOWN LIBRARY
 * ────────────────────────────────
 * A post body supports three things — paragraphs, `## headings` and `- lists` —
 * and that is the whole format. Parsing it here means no new dependency, no
 * `dangerouslySetInnerHTML` anywhere in the render path, and no HTML injection
 * surface at all: the renderer returns data, and React renders text. A general
 * Markdown parser would accept raw HTML by default, which on a site whose whole
 * posture is "we do not run code we did not write" is the wrong trade.
 *
 * THE PUBLISH GATE
 * ────────────────
 * Two checks already exist in this repository for its own copy: safe claims
 * (`src/lib/agents/skills/copy-guard.ts`) and machine prose
 * (`src/lib/copy/humanizer.ts`). A post must pass the claims check outright — a
 * guarantee or an invented statistic is not a style question — and must pass the
 * style check unless the author acknowledges the flagged wording explicitly. That
 * acknowledgement is recorded, so "we knew and published it anyway" is visible.
 */

import { findUnsafeClaims } from '@/lib/agents/skills/copy-guard';
import { checkStyle } from '@/lib/copy/humanizer';

export type BlogPostInput = {
  slug?: string;
  title: string;
  excerpt: string;
  body: string;
  tags?: string[] | string;
};

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  status: BlogPostStatus | string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId?: string | null;
  styleIndex?: number | null;
};

export type ValidationResult =
  | { ok: true; value: { slug: string; title: string; excerpt: string; body: string; tags: string } }
  | { ok: false; code: string; reason: string };

export const TITLE_MIN = 10;
export const TITLE_MAX = 120;
export const EXCERPT_MIN = 40;
export const EXCERPT_MAX = 300;
export const BODY_MIN = 400;
export const BODY_MAX = 20_000;
export const MAX_TAGS = 5;
export const TAG_MAX = 24;
/** Machine-prose index above which a post needs an explicit acknowledgement. */
export const STYLE_INDEX_CEILING = 2;

/** Slugs that would collide with a real route under /blog. */
const RESERVED_SLUGS = new Set(['new', 'edit', 'admin', 'index', 'rss', 'feed']);

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Tags arrive as an array from the API and as a comma string from the database. */
export function normaliseTags(tags: string[] | string | undefined): string[] {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : tags.split(',');
  return [...new Set(list.map((tag) => slugify(tag)).filter((tag) => tag.length > 0))].slice(0, MAX_TAGS);
}

export function validatePost(input: BlogPostInput): ValidationResult {
  const title = (input.title ?? '').trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { ok: false, code: 'TITLE_LENGTH', reason: `A title must be ${TITLE_MIN}–${TITLE_MAX} characters.` };
  }

  const excerpt = (input.excerpt ?? '').trim();
  if (excerpt.length < EXCERPT_MIN || excerpt.length > EXCERPT_MAX) {
    return { ok: false, code: 'EXCERPT_LENGTH', reason: `An excerpt must be ${EXCERPT_MIN}–${EXCERPT_MAX} characters.` };
  }

  const body = (input.body ?? '').trim();
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return { ok: false, code: 'BODY_LENGTH', reason: `A post body must be ${BODY_MIN}–${BODY_MAX} characters.` };
  }

  const slug = slugify(input.slug && input.slug.trim().length > 0 ? input.slug : title);
  if (slug.length < 3) {
    return { ok: false, code: 'SLUG_TOO_SHORT', reason: 'A slug needs at least three characters.' };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, code: 'SLUG_RESERVED', reason: `"${slug}" would collide with a route; choose another slug.` };
  }

  const tags = normaliseTags(input.tags);
  for (const tag of tags) {
    if (tag.length > TAG_MAX) {
      return { ok: false, code: 'TAG_TOO_LONG', reason: `A tag must be at most ${TAG_MAX} characters.` };
    }
  }

  return { ok: true, value: { slug, title, excerpt, body, tags: tags.join(',') } };
}

/* ───────────────────────────── the renderer ──────────────────────────────── */

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

/**
 * Turn a body into blocks. Unknown syntax is treated as a paragraph rather than
 * dropped: silently losing a writer's line is worse than rendering it plainly.
 */
export function renderBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const chunks = body.replace(/\r\n/g, '\n').split(/\n{2,}/);

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) continue;

    if (lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'list', items: lines.map((line) => line.slice(2).trim()) });
      continue;
    }

    if (lines.length === 1 && /^#{2,3}\s+/.test(lines[0])) {
      blocks.push({ type: 'heading', text: lines[0].replace(/^#{2,3}\s+/, '').trim() });
      continue;
    }

    blocks.push({ type: 'paragraph', text: lines.join(' ') });
  }

  return blocks;
}

export function readingMinutes(body: string): number {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 220));
}

/* ──────────────────────────── the publish gate ───────────────────────────── */

export type PublishCheck = {
  canPublish: boolean;
  /** Claims that must be fixed: not a style question, so no acknowledgement helps. */
  claimViolations: Array<{ ruleId: string; match: string; reason: string }>;
  styleIndex: number;
  styleFindings: Array<{ ruleId: string; match: string; problem: string }>;
  /** True when the only thing standing in the way is acknowledged style. */
  needsAcknowledgement: boolean;
  reason: string;
};

/**
 * Can this post be published?
 *
 * `acknowledgedStyle` allows a writer to publish copy that trips the style filter
 * after reading the findings. It never allows a claim violation through: a
 * guarantee or an invented statistic is not a matter of taste, and the whole
 * point of the claims checker is that it cannot be overridden by the person who
 * benefits from the sentence.
 */
export function checkPublish(input: { title: string; excerpt: string; body: string; acknowledgedStyle?: boolean }): PublishCheck {
  const text = `${input.title}\n\n${input.excerpt}\n\n${input.body}`;

  const claimViolations = findUnsafeClaims(text).map((violation) => ({
    ruleId: violation.ruleId,
    match: violation.match,
    reason: violation.reason,
  }));

  const report = checkStyle(text);
  const styleFindings = report.findings.map((finding) => ({
    ruleId: finding.ruleId,
    match: finding.match,
    problem: finding.problem,
  }));

  const styleOverCeiling = report.tellIndex > STYLE_INDEX_CEILING;

  if (claimViolations.length > 0) {
    return {
      canPublish: false,
      claimViolations,
      styleIndex: report.tellIndex,
      styleFindings,
      needsAcknowledgement: false,
      reason: `${claimViolations.length} claim(s) must be fixed before publishing: this is not a style question.`,
    };
  }

  if (styleOverCeiling && !input.acknowledgedStyle) {
    return {
      canPublish: false,
      claimViolations,
      styleIndex: report.tellIndex,
      styleFindings,
      needsAcknowledgement: true,
      reason: `The style index is ${report.tellIndex}, above the ceiling of ${STYLE_INDEX_CEILING}. Rewrite the flagged passages, or publish with acknowledgedStyle to record that they were read.`,
    };
  }

  return {
    canPublish: true,
    claimViolations,
    styleIndex: report.tellIndex,
    styleFindings,
    needsAcknowledgement: false,
    reason:
      styleOverCeiling && input.acknowledgedStyle
        ? `Published with acknowledged machine-prose flags (style index ${report.tellIndex}).`
        : `No claims problems and a style index of ${report.tellIndex}.`,
  };
}

/* ───────────────────────────────── reading ───────────────────────────────── */

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  publishedAt: string | null;
  readingMinutes: number;
};

export type PostDetail = PostSummary & { blocks: Block[] };

export function toSummary(post: Pick<BlogPostRecord, 'slug' | 'title' | 'excerpt' | 'tags' | 'body' | 'publishedAt'>): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags ? post.tags.split(',').filter((tag) => tag.length > 0) : [],
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingMinutes: readingMinutes(post.body),
  };
}

export function toDetail(post: BlogPostRecord): PostDetail {
  return { ...toSummary(post), blocks: renderBlocks(post.body) };
}

/** Where a post can be read, for a copy-to-clipboard button. */
export function postPath(slug: string): string {
  return `/blog/${slug}`;
}
