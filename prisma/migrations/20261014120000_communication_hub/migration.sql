-- Communication hub: identity, conversations, document versions, consent and
-- automation state.
--
-- Design notes that matter for this migration:
--   * Columns are added with ALTER TABLE ADD COLUMN rather than by rebuilding
--     tables. Student is referenced by eight other tables, and a rebuild would
--     drop and recreate the row identity those foreign keys point at. ADD COLUMN
--     is additive and cannot orphan a reference.
--   * SQLite cannot add a UNIQUE constraint via ALTER TABLE, so uniqueness is
--     enforced by a separate unique index. Multiple NULLs are permitted, which
--     is what keeps pre-existing rows valid while every newly created row gets
--     a code.
--   * No credential column exists anywhere in this migration. ChannelAccount
--     stores only a pointer (credentialRef) into the host's secret storage.
--
-- Architecture and rollout order: docs/COMMUNICATION_HUB.md

-- ─── Student: human-readable identity ──────────────────────────────────────
ALTER TABLE "Student" ADD COLUMN "studentCode" TEXT;
CREATE UNIQUE INDEX "Student_studentCode_key" ON "Student"("studentCode");
CREATE INDEX "Student_studentCode_idx" ON "Student"("studentCode");

-- ─── Document: private storage, verification, retention ────────────────────
-- Automatically received files start PENDING_REVIEW. A file is only VERIFIED
-- when a human marks it so; OCR confidence is not verification.
ALTER TABLE "Document" ADD COLUMN "storageKey" TEXT;
ALTER TABLE "Document" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW';
ALTER TABLE "Document" ADD COLUMN "verifiedBy" TEXT;
ALTER TABLE "Document" ADD COLUMN "verifiedAt" DATETIME;
ALTER TABLE "Document" ADD COLUMN "sourceChannel" TEXT;
ALTER TABLE "Document" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "Document" ADD COLUMN "currentVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Document" ADD COLUMN "retentionClass" TEXT NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "Document" ADD COLUMN "deletedAt" DATETIME;
CREATE INDEX "Document_verificationStatus_idx" ON "Document"("verificationStatus");
CREATE INDEX "Document_retentionClass_idx" ON "Document"("retentionClass");

-- ─── Message: provider identity, idempotency, delivery state ───────────────
ALTER TABLE "Message" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "Message" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "Message" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Message" ADD COLUMN "rawPayloadHash" TEXT;
ALTER TABLE "Message" ADD COLUMN "sentAt" DATETIME;
ALTER TABLE "Message" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "Message" ADD COLUMN "failedReason" TEXT;
-- A replayed webhook cannot insert a second copy of the same provider message,
-- and cannot insert a second copy of the same delivery attempt.
CREATE UNIQUE INDEX "Message_idempotencyKey_key" ON "Message"("idempotencyKey");
CREATE UNIQUE INDEX "Message_channel_providerMessageId_key" ON "Message"("channel", "providerMessageId");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- ─── Per-year student code counter ─────────────────────────────────────────
-- This row is the allocation lock. Allocation runs inside a transaction that
-- reads and increments lastValue, so two concurrent inbound messages cannot
-- receive the same code; the unique index above is the second line of defence.
CREATE TABLE "StudentIdSequence" (
    "year" INTEGER NOT NULL PRIMARY KEY,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- ─── Channel account registry ──────────────────────────────────────────────
CREATE TABLE "ChannelAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "externalId" TEXT,
    "ownerUserId" TEXT,
    "branchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "lastWebhookAt" DATETIME,
    "healthCheckedAt" DATETIME,
    "lastError" TEXT,
    "credentialRef" TEXT,
    "credentialRotatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChannelAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChannelAccount_kind_externalId_key" ON "ChannelAccount"("kind", "externalId");
CREATE INDEX "ChannelAccount_status_idx" ON "ChannelAccount"("status");
CREATE INDEX "ChannelAccount_ownerUserId_idx" ON "ChannelAccount"("ownerUserId");

-- ─── Conversations ─────────────────────────────────────────────────────────
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT,
    "leadId" TEXT,
    "channelAccountId" TEXT,
    "channel" TEXT NOT NULL,
    "externalThreadId" TEXT,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "assignedUserId" TEXT,
    "lastMessageAt" DATETIME,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_channelAccountId_fkey" FOREIGN KEY ("channelAccountId") REFERENCES "ChannelAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Conversation_channel_externalThreadId_key" ON "Conversation"("channel", "externalThreadId");
CREATE INDEX "Conversation_studentId_idx" ON "Conversation"("studentId");
CREATE INDEX "Conversation_status_idx" ON "Conversation"("status");
CREATE INDEX "Conversation_needsReview_idx" ON "Conversation"("needsReview");
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- ─── Document version history ──────────────────────────────────────────────
-- Superseding a document adds a row here. The previously verified file is not
-- overwritten; it is marked superseded and stays readable in history.
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sourceChannel" TEXT,
    "uploaderUserId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" DATETIME,
    "supersededAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");
CREATE INDEX "DocumentVersion_reviewStatus_idx" ON "DocumentVersion"("reviewStatus");

-- ─── Counsellor assignment history ─────────────────────────────────────────
-- A student's history does not move with the staff member: assignments are
-- recorded here so a handover is auditable and nothing is lost when someone
-- leaves or changes department.
CREATE TABLE "CounselorAssignmentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "assignedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CounselorAssignmentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CounselorAssignmentHistory_studentId_idx" ON "CounselorAssignmentHistory"("studentId");
CREATE INDEX "CounselorAssignmentHistory_toUserId_idx" ON "CounselorAssignmentHistory"("toUserId");
CREATE INDEX "CounselorAssignmentHistory_createdAt_idx" ON "CounselorAssignmentHistory"("createdAt");

-- ─── Central consent register ──────────────────────────────────────────────
-- One row per student/channel/purpose. Withdrawal recorded here suppresses
-- marketing on every channel that shares the register, not just the one the
-- student used to opt out.
CREATE TABLE "CommunicationConsent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "source" TEXT,
    "evidence" TEXT,
    "recordedByUserId" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommunicationConsent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CommunicationConsent_studentId_channel_purpose_key" ON "CommunicationConsent"("studentId", "channel", "purpose");
CREATE INDEX "CommunicationConsent_status_idx" ON "CommunicationConsent"("status");
CREATE INDEX "CommunicationConsent_purpose_idx" ON "CommunicationConsent"("purpose");

-- ─── Automation / webhook event log ────────────────────────────────────────
-- idempotencyKey is unique: a provider that retries the same webhook ten times
-- creates one row, and the retry is reported as DUPLICATE instead of producing
-- a second message, a second student or a second campaign send.
CREATE TABLE "AutomationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "provider" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "studentId" TEXT,
    "conversationId" TEXT,
    "payloadHash" TEXT,
    "payloadSummary" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "AutomationEvent_idempotencyKey_key" ON "AutomationEvent"("idempotencyKey");
CREATE INDEX "AutomationEvent_kind_idx" ON "AutomationEvent"("kind");
CREATE INDEX "AutomationEvent_status_idx" ON "AutomationEvent"("status");
CREATE INDEX "AutomationEvent_createdAt_idx" ON "AutomationEvent"("createdAt");
