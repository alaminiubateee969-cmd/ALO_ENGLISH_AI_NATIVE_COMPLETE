-- Exam attempt engine: frozen question sets, persisted answers, server-side deadline.
--
-- Adds:
--   Attempt.expiresAt / durationMin / attemptNumber
--   AttemptQuestion  (immutable question set + order for one attempt)
--   AttemptAnswer    (server-side autosave store)

-- AlterTable: Attempt
ALTER TABLE "Attempt" ADD COLUMN "expiresAt" DATETIME;
ALTER TABLE "Attempt" ADD COLUMN "durationMin" INTEGER;
ALTER TABLE "Attempt" ADD COLUMN "attemptNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateTable: AttemptQuestion
CREATE TABLE "AttemptQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttemptQuestion_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttemptQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: AttemptAnswer
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX "AttemptQuestion_attemptId_questionId_key" ON "AttemptQuestion"("attemptId", "questionId");
CREATE INDEX "AttemptQuestion_attemptId_idx" ON "AttemptQuestion"("attemptId");
CREATE INDEX "AttemptQuestion_questionId_idx" ON "AttemptQuestion"("questionId");

CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");
CREATE INDEX "AttemptAnswer_attemptId_idx" ON "AttemptAnswer"("attemptId");

CREATE INDEX "Attempt_userId_practiceSetId_idx" ON "Attempt"("userId", "practiceSetId");
CREATE INDEX "Attempt_expiresAt_idx" ON "Attempt"("expiresAt");
