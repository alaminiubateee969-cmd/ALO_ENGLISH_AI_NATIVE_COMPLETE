/**
 * GET  /api/blog/posts — published posts, newest first. No auth: this is the
 *                        public blog, and a draft is never returned here.
 * POST /api/blog/posts — create a draft.
 *
 * A post is created as a DRAFT and can only become visible through the publish
 * path in `[slug]`, which runs the claims check and the machine-prose check. That
 * ordering is the point: there is no "create and publish in one request" endpoint
 * that would let a draft skip the gate by accident.
 *
 * Auth: POST requires ADMIN, SUPER_ADMIN or MARKETING_MANAGER.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { audit, getClientIp } from '@/lib/audit';
import { badRequest, conflict, created, ok, withErrorHandler } from '@/lib/responses';
import { validatePost } from '@/lib/content/blog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 50;

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? 20);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.trunc(limitParam), 1), MAX_PAGE_SIZE) : 20;

    const posts = await db.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true, body: true },
    });

    return ok({
      posts: posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        tags: post.tags ? post.tags.split(',').filter((tag) => tag.length > 0) : [],
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        // Characters rather than minutes here: the list route should not ship the
        // whole body just to compute a reading time in the browser.
        readingMinutes: Math.max(1, Math.round(post.body.split(/\s+/).length / 220)),
      })),
      limit,
      note: 'Only published posts are returned. Drafts are readable by their author through the admin API.',
    });
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  body: z.string().min(1).max(30_000),
  slug: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorHandler(async () => {
    const user = await requireRole('ADMIN', 'SUPER_ADMIN', 'MARKETING_MANAGER');

    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'A title, an excerpt and a body are required.');
    }

    const validation = validatePost(parsed.data);
    if (!validation.ok) return badRequest(validation.reason);

    const existing = await db.blogPost.findUnique({ where: { slug: validation.value.slug }, select: { id: true } });
    if (existing) return conflict(`A post already uses the slug "${validation.value.slug}".`);

    const post = await db.blogPost.create({
      data: {
        slug: validation.value.slug,
        title: validation.value.title,
        excerpt: validation.value.excerpt,
        body: validation.value.body,
        tags: validation.value.tags,
        status: 'DRAFT',
        authorId: user.id,
      },
      select: { id: true, slug: true, title: true, status: true },
    });

    await audit('BLOG_POST_CREATED', {
      userId: user.id,
      resource: `blogPost:${post.id}`,
      metadata: { slug: post.slug },
      ipAddress: getClientIp(req),
    });

    return created({ post }, 'Draft created. Publishing runs the claims and style checks.');
  });
}
