-- Consent captured before there was a student to attach it to.
--
-- A website form is filled in by someone who has no student record yet. The
-- choice was to drop that capture, to invent a student row, or to record the
-- capture and let it find its owner later. This is the third option: the capture
-- waits, keyed by the lead's email and normalised phone, and is promoted when a
-- student with the same email or phone appears.
--
-- Design notes:
--   * CommunicationConsent is rebuilt here, and that is deliberate rather than
--     sloppy: the table was created in the same unreleased migration set as this
--     one, it holds no production data, and no other table references it. A
--     nullable column cannot be introduced in SQLite by ALTER TABLE, and the
--     alternative — a fake student row for every website visitor — would put
--     people in the student table who are not students.
--     Contrast this with Student, which is never rebuilt: eight tables point at
--     its rows, and dropping it would take their foreign keys with it.
--   * The CHECK constraint says a consent row must be attached to someone: a
--     capture with neither a student nor a lead is not a record of anything.
--   * capturedLeadId is a loose reference with no foreign key on purpose: the
--     evidence that a person agreed is not the lead's property and must survive
--     the lead being deleted or merged.
--   * No credential, no token, no message content — only references.
--
-- Architecture and rollout order: docs/COMMUNICATION_HUB.md

CREATE TABLE "new_CommunicationConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "source" TEXT,
    "evidence" TEXT,
    "recordedByUserId" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "capturedLeadId" TEXT,
    "capturedLeadEmail" TEXT,
    "capturedLeadPhone" TEXT,
    CONSTRAINT "CommunicationConsent_is_attached" CHECK ("studentId" IS NOT NULL OR "capturedLeadId" IS NOT NULL),
    CONSTRAINT "CommunicationConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_CommunicationConsent" (
    "id", "studentId", "channel", "purpose", "status", "source", "evidence", "recordedByUserId", "recordedAt", "updatedAt"
)
SELECT
    "id", "studentId", "channel", "purpose", "status", "source", "evidence", "recordedByUserId", "recordedAt", "updatedAt"
FROM "CommunicationConsent";

DROP TABLE "CommunicationConsent";
ALTER TABLE "new_CommunicationConsent" RENAME TO "CommunicationConsent";

-- One row per (student, channel, purpose) for student records.
CREATE UNIQUE INDEX "CommunicationConsent_studentId_channel_purpose_key" ON "CommunicationConsent"("studentId", "channel", "purpose");
-- And one row per (lead, channel, purpose) for captures still waiting for a
-- student. Without this, a form submitted twice would grant consent twice and
-- the register would stop being one row per decision.
CREATE UNIQUE INDEX "CommunicationConsent_capturedLeadId_channel_purpose_key" ON "CommunicationConsent"("capturedLeadId", "channel", "purpose");
CREATE INDEX "CommunicationConsent_status_idx" ON "CommunicationConsent"("status");
CREATE INDEX "CommunicationConsent_purpose_idx" ON "CommunicationConsent"("purpose");
CREATE INDEX "CommunicationConsent_capturedLeadEmail_idx" ON "CommunicationConsent"("capturedLeadEmail");
