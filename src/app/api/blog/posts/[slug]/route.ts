/**
 * GET   /api/blog/posts/[slug] — one post. Published posts are public; a draft is
 *                                visible only to staff.
 * PATCH /api/blog/posts/[slug] — edit a post, and publish or unpublish it.
 *
 * THE PUBLISH GATE LIVES HERE
 * ───────────────────────────
 * `publish: true` runs `checkPublish` over the title, excerpt and body that would
 * actually be served. Two outcomes can stop it:
 *
 *   * a **claim violation** — a guarantee, an invented statistic, a claim of
 *     official status. This cannot be overridden, by design: the person who wants
 *     the sentence is the last person who should be able to wave it through.
 *   * a **style index above the ceiling** — machine-sounding prose. This can be
 *     overridden with `acknowledgedStyle: true`, and the acknowledgement is
 *     recorded in the audit entry and stored on the post as its style index, so
 *     "we read it and published anyway" is a fact rather than a suspicion.
 *
 * Auth: GET is public for published posts; PATCH requires ADMIN, SUPER_ADMIN or
 * MARKETING_MANAGER.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, notFound, ok, withErrorHandler } from '@/lib/responses';
import { checkPublish, renderBlocks, validatePost } from '@/lib/content/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MARKETING_MANAGER'] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const { slug } = await params;

    const post = await db.blogPost.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        tags: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
    if (!post) return notFound('Post not found.');

    if (post.status !== 'PUBLISHED') {
      const user = await getCurrentUser();
      if (!user || !(STAFF_ROLES as readonly string[]).includes(user.role)) {
        // A draft is not a 404 for its author, but it is for everyone else: an
        // unpublished post must not be discoverable by guessing its slug.
        return notFound('Post not found.');
      }
    }

    return ok({
      post: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        blocks: renderBlocks(post.body),
        tags: post.tags ? post.tags.split(',').filter((tag) => tag.length > 0) : [],
        status: post.status,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        updatedAt: post.updatedAt.toISOString(),
      },
    });
  });
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(30_000).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  publish: z.boolean().optional(),
  acknowledgedStyle: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole(...STAFF_ROLES);
    const { slug } = await params;

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Nothing to update.');

    const existing = await db.blogPost.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, excerpt: true, body: true, tags: true, status: true },
    });
    if (!existing) return notFound('Post not found.');

    const merged = {
      title: parsed.data.title ?? existing.title,
      excerpt: parsed.data.excerpt ?? existing.excerpt,
      body: parsed.data.body ?? existing.body,
      tags: parsed.data.tags ?? existing.tags,
      slug: existing.slug,
    };

    const validation = validatePost(merged);
    if (!validation.ok) return badRequest(validation.reason);

    let gate = null as ReturnType<typeof checkPublish> | null;
    if (parsed.data.publish === true) {
      gate = checkPublish({
        title: validation.value.title,
        excerpt: validation.value.excerpt,
        body: validation.value.body,
        acknowledgedStyle: parsed.data.acknowledgedStyle === true,
      });
      if (!gate.canPublish) {
        // 422 rather than 400: the request is well-formed, the copy is the problem,
        // and the response carries the exact sentences to fix. NextResponse rather
        // than a raw Response so the handler keeps one return type.
        return NextResponse.json(
          {
            success: false,
            code: gate.needsAcknowledgement ? 'STYLE_ACKNOWLEDGEMENT_REQUIRED' : 'CLAIM_VIOLATION',
            message: gate.reason,
            data: { styleIndex: gate.styleIndex, claimViolations: gate.claimViolations, styleFindings: gate.styleFindings },
          },
          { status: 422 },
        );
      }
    }

    const publishing = parsed.data.publish === true && existing.status !== 'PUBLISHED';
    const post = await db.blogPost.update({
      where: { id: existing.id },
      data: {
        title: validation.value.title,
        excerpt: validation.value.excerpt,
        body: validation.value.body,
        tags: validation.value.tags,
        ...(parsed.data.publish === true
          ? {
              status: 'PUBLISHED',
              publishedAt: publishing ? new Date() : undefined,
              styleIndex: gate?.styleIndex ?? null,
            }
          : parsed.data.publish === false
            ? { status: 'DRAFT' }
            : {}),
      },
      select: { id: true, slug: true, title: true, status: true, publishedAt: true, styleIndex: true },
    });

    await audit(publishing ? 'BLOG_POST_PUBLISHED' : 'BLOG_POST_UPDATED', {
      userId: user.id,
      resource: `blogPost:${post.id}`,
      metadata: {
        slug: post.slug,
        status: post.status,
        styleIndex: post.styleIndex ?? null,
        acknowledgedStyle: parsed.data.acknowledgedStyle === true,
      },
      ipAddress: getClientIp(req),
    });

    return ok({ post, gate }, publishing ? 'Post published.' : 'Post updated.');
  });
}
