-- Blog posts.
--
-- Content marketing, written by people, published only after a human passes the
-- two checks this platform runs over its own copy: the safe-claims rule set
-- (src/lib/agents/skills/copy-guard.ts) and the machine-prose style filter
-- (src/lib/copy/humanizer.ts), whose score is stored on the row so a later reader
-- can see what the reviewer saw.
--
-- Why the tags are a comma-separated string rather than a BlogTag table: this
-- table holds tens of rows, the tags are never queried independently, and a join
-- table would add a migration and a query for a filter that reads a list of
-- slugs. If posts ever need tag pages, that is the moment to normalise it.
--
-- `styleIndex` is nullable because a draft has not been measured yet, and null
-- means "not measured", not "measured zero".

CREATE TABLE "BlogPost" (
  "id"          TEXT     NOT NULL PRIMARY KEY,
  "slug"        TEXT     NOT NULL,
  "title"       TEXT     NOT NULL,
  "excerpt"     TEXT     NOT NULL,
  "body"        TEXT     NOT NULL,
  "tags"        TEXT     NOT NULL DEFAULT '',
  "status"      TEXT     NOT NULL DEFAULT 'DRAFT',
  "publishedAt" DATETIME,
  "authorId"    TEXT,
  "styleIndex"  REAL,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL
);

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost" ("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost" ("status", "publishedAt");
