/**
 * /blog/[slug] — one article.
 *
 * The body is rendered from the structured blocks `renderBlocks` produces, so the
 * page never uses `dangerouslySetInnerHTML` and a post cannot inject markup even
 * if a writer pastes something that looks like HTML. What the reader sees is
 * text, by construction.
 *
 * Not found and not published are the same answer to a stranger: a draft's slug
 * must not be discoverable by guessing.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderBlocks, readingMinutes } from "@/lib/content/blog";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  try {
    // Same reasoning as the index page: a dynamic import puts the failure inside
    // the try block, where it becomes "not found" instead of a 500.
    const { db } = await import("@/lib/db");
    return await db.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { slug: true, title: true, excerpt: true, body: true, tags: true, publishedAt: true, updatedAt: true },
    });
  } catch {
    // A database that cannot be read is a 404 here rather than a 500: search
    // engines and readers get a clear answer, and the failure stays in the logs.
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Guide not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt.toISOString() } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const blocks = renderBlocks(post.body);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/blog" className="underline-offset-4 hover:underline">
          Guides
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">{post.excerpt}</p>
        <p className="mt-4 text-xs text-slate-500">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { dateStyle: "long" }) : ""}
          {" · "}
          {readingMinutes(post.body)} min read
        </p>
      </header>

      <article className="mt-8 space-y-4">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2 key={index} className="pt-4 text-xl font-bold text-[#0B1F3A]">
                {block.text}
              </h2>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={index} className="list-disc space-y-2 pl-6 text-base leading-7 text-slate-700">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index} className="text-base leading-7 text-slate-700">
              {block.text}
            </p>
          );
        })}
      </article>

      <aside className="mt-10 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-sm leading-6 text-slate-700">
        <p className="font-semibold text-[#0B1F3A]">What this guide is not</p>
        <p className="mt-1">
          Advice written by a counselling team, not a government or test-provider publication. Check requirements and
          deadlines with the official source before acting on anything here, and treat practice scores as a study aid
          rather than a result.
        </p>
      </aside>
    </div>
  );
}
