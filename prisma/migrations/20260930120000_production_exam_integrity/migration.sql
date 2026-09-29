-- Persisted exam answers and production question metadata.
-- Additive migration: it does not delete or rewrite production records.
ALTER TABLE "Question" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Question" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Question" ADD COLUMN "skill" TEXT;
ALTER TABLE "Question" ADD COLUMN "explanation" TEXT;
ALTER TABLE "Question" ADD COLUMN "source" TEXT;
ALTER TABLE "Question" ADD COLUMN "stableKey" TEXT;
ALTER TABLE "Question" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00';
UPDATE "Question" SET "updatedAt" = CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Question_stableKey_key" ON "Question"("stableKey");
CREATE INDEX "Question_practiceSetId_status_idx" ON "Question"("practiceSetId", "status");

CREATE TABLE "AttemptAnswer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attemptId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "isCorrect" BOOLEAN,
  "pointsAwarded" REAL,
  "markedForReview" BOOLEAN NOT NULL DEFAULT false,
  "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");
CREATE INDEX "AttemptAnswer_questionId_idx" ON "AttemptAnswer"("questionId");
