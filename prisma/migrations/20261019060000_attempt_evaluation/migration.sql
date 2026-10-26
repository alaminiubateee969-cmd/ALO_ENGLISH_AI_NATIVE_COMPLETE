-- The platform's own evaluation of the subjective parts of an attempt.
--
-- The evaluation agent (src/lib/ai/evaluation/ai-evaluation.ts) writes one
-- row per subjective section that it assessed. The row records which engine
-- produced the result, so a reader can always tell model output apart from
-- the built-in rule engine. The payload never contains a band, a grade or a
-- score: no rubric in this repository has been calibrated against human
-- raters, so the evaluation is qualitative only.
--
-- One row per (attempt, section): a re-evaluation replaces the earlier row
-- for that section rather than accumulating duplicates.

CREATE TABLE "AttemptEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "examTypeCode" TEXT NOT NULL,
    "taskType" TEXT,
    "providerUsed" TEXT NOT NULL DEFAULT 'local_rule_engine',
    "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttemptEvaluation_attemptId_fkey"
      FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AttemptEvaluation_attemptId_section_key"
  ON "AttemptEvaluation"("attemptId", "section");
CREATE INDEX "AttemptEvaluation_attemptId_idx"
  ON "AttemptEvaluation"("attemptId");
CREATE INDEX "AttemptEvaluation_examTypeCode_idx"
  ON "AttemptEvaluation"("examTypeCode");
