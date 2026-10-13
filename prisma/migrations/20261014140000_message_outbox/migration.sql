-- The outbound queue.
--
-- Design notes:
--   * This is a new table, so it is a plain CREATE TABLE: no existing row is
--     touched and nothing is rebuilt.
--   * sendKey is UNIQUE. That single constraint is what makes an outbound send
--     exactly-once even when a retry races a first attempt, and it is why the
--     queue stores content rather than pointing at a Message row that does not
--     exist yet.
--   * nextAttemptAt carries the schedule; a deferred message (quiet hours, daily
--     cap) and a failed message awaiting backoff are both found by the same
--     partial index on (status, nextAttemptAt).
--   * No credential column. Credentials live in host secret storage; see
--     ChannelAccount.credentialRef.
--
-- Architecture and rollout order: docs/COMMUNICATION_HUB.md

CREATE TABLE "MessageOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sendKey" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conversationId" TEXT,
    "recipientHandle" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isApprovedTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "templateLanguage" TEXT,
    "scheduledFor" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" DATETIME,
    "lastDecisionCode" TEXT,
    "lastError" TEXT,
    "messageId" TEXT,
    "providerMessageId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageOutbox_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MessageOutbox_sendKey_key" ON "MessageOutbox"("sendKey");
CREATE INDEX "MessageOutbox_status_nextAttemptAt_idx" ON "MessageOutbox"("status", "nextAttemptAt");
CREATE INDEX "MessageOutbox_studentId_channel_idx" ON "MessageOutbox"("studentId", "channel");
CREATE INDEX "MessageOutbox_status_scheduledFor_idx" ON "MessageOutbox"("status", "scheduledFor");
