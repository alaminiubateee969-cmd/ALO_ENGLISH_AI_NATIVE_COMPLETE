-- The AI agent workforce.
--
-- The fourteen production agents (Agent 001 … Agent 014) are real workers that
-- run through a durable job pipeline, not dashboard rows. This migration adds
-- the tables that make that pipeline durable and observable:
--
--   AgentDefinition  registered identity, version, permissions, input/output
--                    contract, resource limits
--   AgentJob         one durable unit of work: queued, leased, retried,
--                    completed, failed or dead-lettered
--   AgentJobEvent    append-only execution log
--   AgentArtifact    job output plus provider/model/prompt provenance
--   AgentApproval    the human-approval gate for high-impact actions
--   AgentMetric      daily counters, so monitoring does not aggregate the job
--                    table on every page view
--   ExamBlueprint    a versioned description of an exam's structure
--   DailyQuestionRun one row per exam per day for the daily generation pipeline

-- CreateTable
CREATE TABLE "AgentDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "department" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "inputSchema" TEXT NOT NULL,
    "outputSchema" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "maxDurationSeconds" INTEGER NOT NULL DEFAULT 60,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 2,
    "maxInputBytes" INTEGER NOT NULL DEFAULT 262144,
    "preferredProvider" TEXT,
    "fallbackProvider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AgentJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "queue" TEXT NOT NULL DEFAULT 'default',
    "idempotencyKey" TEXT,
    "idempotencyScope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "errorKind" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAfter" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "leaseUntil" DATETIME,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentJob_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentJobEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "event" TEXT NOT NULL,
    "message" TEXT,
    "data" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentJobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AgentJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentJobEvent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ref" TEXT,
    "payload" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentArtifact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AgentJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentArtifact_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subject" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "requestedBy" TEXT,
    "decidedBy" TEXT,
    "decisionNote" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentApproval_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AgentJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentApproval_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "enqueued" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "retried" INTEGER NOT NULL DEFAULT 0,
    "deadLettered" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "approvalsPending" INTEGER NOT NULL DEFAULT 0,
    "durationMsTotal" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentMetric_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamBlueprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeCode" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceCheckedAt" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailyQuestionRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" TEXT NOT NULL,
    "examTypeCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "stages" TEXT NOT NULL,
    "requested" INTEGER NOT NULL DEFAULT 0,
    "generated" INTEGER NOT NULL DEFAULT 0,
    "validated" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "published" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "jobId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentDefinition_code_key" ON "AgentDefinition"("code");

-- CreateIndex
CREATE INDEX "AgentDefinition_department_idx" ON "AgentDefinition"("department");

-- CreateIndex
CREATE INDEX "AgentDefinition_enabled_idx" ON "AgentDefinition"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "AgentJob_idempotencyScope_idempotencyKey_key" ON "AgentJob"("idempotencyScope", "idempotencyKey");

-- CreateIndex
CREATE INDEX "AgentJob_status_runAfter_idx" ON "AgentJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX "AgentJob_queue_status_runAfter_idx" ON "AgentJob"("queue", "status", "runAfter");

-- CreateIndex
CREATE INDEX "AgentJob_agentId_status_idx" ON "AgentJob"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentJob_createdAt_idx" ON "AgentJob"("createdAt");

-- CreateIndex
CREATE INDEX "AgentJobEvent_jobId_createdAt_idx" ON "AgentJobEvent"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentJobEvent_agentId_createdAt_idx" ON "AgentJobEvent"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentJobEvent_level_createdAt_idx" ON "AgentJobEvent"("level", "createdAt");

-- CreateIndex
CREATE INDEX "AgentArtifact_jobId_idx" ON "AgentArtifact"("jobId");

-- CreateIndex
CREATE INDEX "AgentArtifact_agentId_kind_idx" ON "AgentArtifact"("agentId", "kind");

-- CreateIndex
CREATE INDEX "AgentArtifact_ref_idx" ON "AgentArtifact"("ref");

-- CreateIndex
CREATE INDEX "AgentApproval_status_createdAt_idx" ON "AgentApproval"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AgentApproval_agentId_status_idx" ON "AgentApproval"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AgentMetric_agentId_day_key" ON "AgentMetric"("agentId", "day");

-- CreateIndex
CREATE INDEX "AgentMetric_day_idx" ON "AgentMetric"("day");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBlueprint_examTypeCode_version_key" ON "ExamBlueprint"("examTypeCode", "version");

-- CreateIndex
CREATE INDEX "ExamBlueprint_examTypeCode_idx" ON "ExamBlueprint"("examTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionRun_day_examTypeCode_key" ON "DailyQuestionRun"("day", "examTypeCode");

-- CreateIndex
CREATE INDEX "DailyQuestionRun_day_idx" ON "DailyQuestionRun"("day");
