/**
 * /blog — published articles.
 *
 * A server component reading the database at request time (`force-dynamic`), for
 * one reason: a build-time database read would make every deploy depend on the
 * database being reachable during the build, and a marketing page must never be
 * able to fail a release. Reading the posts per request also means publishing is
 * immediate rather than "after the next deploy".
 *
 * If the database cannot be read at all, the page says so in a sentence instead of
 * throwing: an empty blog is a smaller problem than a down site, and a 500 on a
 * public page is the latter.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { slugify, toSummary, type PostSummary } from "@/lib/content/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Study Abroad and English Test Guides",
  description:
    "Practical guides on English-test preparation, university applications and study-abroad planning, written by ALO Education counsellors.",
  openGraph: {
    title: "Study Abroad and English Test Guides",
    description: "Practical guides on test preparation, applications and study-abroad planning from ALO Education.",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  let posts: PostSummary[] = [];
  let unavailable = false;

  try {
    // Imported here rather than at the top of the file on purpose: if the database
    // client cannot be constructed at all, a static import fails before any try
    // block and the reader gets a 500. Inside the block, they get a sentence.
    const { db } = await import("@/lib/db");
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true, body: true },
    });
    posts = rows.map((row) => toSummary(row));
  } catch {
    unavailable = true;
  }

  const tags = [...new Set(posts.flatMap((post) => post.tags))].filter((tag) => tag.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1F3A] sm:text-4xl">
          Study Abroad and English Test Guides
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Practical guides on test preparation, applications and planning. Every article is written by a counsellor and
          checked against the same rules the rest of the site follows: no guarantees, no invented statistics and no
          claim to be an official test provider.
        </p>
      </header>

      {unavailable && (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The guides are not available at the moment. Nothing is wrong with your connection — please try again shortly.
        </p>
      )}

      {!unavailable && posts.length === 0 && (
        <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No guides have been published yet. The blog is a writing surface for the counselling team; it starts empty on
          purpose rather than opening with placeholder articles.
        </p>
      )}

      {posts.length > 0 && (
        <>
          {tags.length > 0 && (
            <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${slugify(tag)}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  {tag}
                </Link>
              ))}
            </nav>
          )}

          <ul className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {posts.map((post) => (
              <li key={post.slug} className="p-5 sm:p-6">
                <article>
                  <h2 className="text-xl font-bold text-[#0B1F3A]">
                    <Link href={`/blog/${post.slug}`} className="underline-offset-4 hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.excerpt}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-GB", { dateStyle: "long" }) : "Unpublished"}
                    {" · "}
                    {post.readingMinutes} min read
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
