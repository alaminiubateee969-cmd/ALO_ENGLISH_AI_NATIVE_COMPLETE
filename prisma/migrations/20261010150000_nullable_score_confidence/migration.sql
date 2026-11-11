-- Confidence has never been calibrated against human ratings. Store absence as
-- NULL instead of materializing an uncalibrated zero for future score rows.
-- Preserve all existing score values; historical rows are not rewritten.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overall" REAL NOT NULL,
    "listening" REAL,
    "reading" REAL,
    "writing" REAL,
    "speaking" REAL,
    "confidence" REAL,
    "providerUsed" TEXT NOT NULL DEFAULT 'local_rule_engine',
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Score_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Score" (
    "id", "attemptId", "userId", "overall", "listening", "reading",
    "writing", "speaking", "confidence", "providerUsed", "fallbackUsed", "createdAt"
)
SELECT
    "id", "attemptId", "userId", "overall", "listening", "reading",
    "writing", "speaking", "confidence", "providerUsed", "fallbackUsed", "createdAt"
FROM "Score";

DROP TABLE "Score";
ALTER TABLE "new_Score" RENAME TO "Score";

CREATE UNIQUE INDEX "Score_attemptId_key" ON "Score"("attemptId");
CREATE INDEX "Score_userId_idx" ON "Score"("userId");
CREATE INDEX "Score_providerUsed_idx" ON "Score"("providerUsed");

PRAGMA foreign_keys=ON;
