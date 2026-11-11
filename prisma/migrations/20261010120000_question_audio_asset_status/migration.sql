-- Durable per-question listening-audio generation and verification state.
CREATE TABLE "QuestionAudioAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "location" TEXT,
    "mimeType" TEXT,
    "byteSize" INTEGER,
    "sha256" TEXT,
    "voice" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "generatedAt" DATETIME,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionAudioAsset_questionId_fkey"
      FOREIGN KEY ("questionId") REFERENCES "Question" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "QuestionAudioAsset_questionId_key"
  ON "QuestionAudioAsset"("questionId");
CREATE INDEX "QuestionAudioAsset_status_idx"
  ON "QuestionAudioAsset"("status");
