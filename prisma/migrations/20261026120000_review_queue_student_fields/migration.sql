-- Review-queue fields the PR #15 routes read and write, plus the outbox send
-- timestamp its store sets on a successful send.
--
-- Why ALTER TABLE and not a table rebuild: these are purely additive columns.
-- SQLite supports adding them in place, every existing row keeps its value
-- (NULL / false / NULL), and no foreign key or index dependency is touched.
-- The repository's own migration standard (see 20261014160000) reserves table
-- rebuilds for tables with no production data; Student and MessageOutbox are
-- core tables that hold real records.
--
--   Student.deletedAt    — soft-delete marker; NULL means the record is live.
--   Student.needsReview  — the record waits in the employee review queue.
--   MessageOutbox.sentAt — when the provider accepted the send.
--
-- Indexes: the review queue filters students by needsReview and conversations
-- already have a needsReview index; without this index every queue view scans
-- the student table.

ALTER TABLE "Student" ADD COLUMN "deletedAt" DATETIME;
ALTER TABLE "Student" ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;

-- The queue reads "flagged and not deleted" — a partial index would be
-- narrower, but a plain index keeps the migration reproducible on any SQLite
-- build and the table is small at consultancy scale.
CREATE INDEX "Student_needsReview_idx" ON "Student"("needsReview");

ALTER TABLE "MessageOutbox" ADD COLUMN "sentAt" DATETIME;
