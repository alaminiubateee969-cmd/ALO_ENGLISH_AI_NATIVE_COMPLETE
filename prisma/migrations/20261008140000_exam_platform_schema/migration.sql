-- Exam platform, RBAC, quota, agent and session tables.
--
-- WHY THIS MIGRATION EXISTS
--   prisma/migrations only ever created 28 of the 44 tables in schema.prisma.
--   CI provisions with `prisma db push` (built from the schema) while
--   production on Hostinger provisions with `prisma migrate deploy` (replays
--   this directory), so a fresh production database had no Question, Role,
--   Permission or FreeQuota table while CI stayed green.
--
--   `scripts/check-schema-migrations.mjs` is the gate that caught it.
--
-- TABLES ADDED
--   Question, FreeQuota, Payment, DailyQuestionSet, LearningMemory,
--   AgentLearning, AgentEvolution, ExamAnalytics, AgentSpecialist,
--   StudyMaterial, ChatSession, Team, TeamMember, Role, Permission,
--   RolePermission, Session
--
-- PROVENANCE
--   DDL follows the conventions of the Prisma-generated migrations already in
--   this directory (column types, _fkey/_key/_idx naming, ON UPDATE CASCADE).
--   Verified by replaying the full migration history in SQLite: 44 tables,
--   424 columns, 0 mismatches against schema.prisma.
--
-- NOTE FOR AN EXISTING PRODUCTION DATABASE
--   If production was originally created with `prisma db push` it has no
--   _prisma_migrations history, and `migrate deploy` will try to recreate
--   existing tables. Baseline it first with
--   `npx prisma migrate resolve --applied <migration>` for each migration whose
--   tables already exist. Never run `prisma migrate reset` against production.

-- CreateTable: Question
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceSetId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "passage" TEXT,
    "audioUrl" TEXT,
    "options" TEXT,
    "correctAnswer" TEXT,
    "correctIndex" INTEGER,
    "correctIndices" TEXT,
    "wordLimit" INTEGER,
    "imageUrl" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Question_practiceSetId_idx" ON "Question"("practiceSetId");
CREATE INDEX "Question_section_idx" ON "Question"("section");

-- CreateTable: FreeQuota
CREATE TABLE "FreeQuota" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,
    "attemptsLimit" INTEGER NOT NULL DEFAULT 3,
    "isAloStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "FreeQuota_userId_key" ON "FreeQuota"("userId");
CREATE INDEX "FreeQuota_userId_idx" ON "FreeQuota"("userId");

-- CreateTable: Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'MANUAL',
    "attemptsPaid" INTEGER NOT NULL DEFAULT 1,
    "txnId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateTable: DailyQuestionSet
CREATE TABLE "DailyQuestionSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeCode" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "practiceSetId" TEXT NOT NULL,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "DailyQuestionSet_examTypeCode_date_key" ON "DailyQuestionSet"("examTypeCode", "date");
CREATE INDEX "DailyQuestionSet_examTypeCode_date_idx" ON "DailyQuestionSet"("examTypeCode", "date");

-- CreateTable: LearningMemory
CREATE TABLE "LearningMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weaknessArea" TEXT NOT NULL,
    "weaknessType" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "LearningMemory_userId_weaknessArea_key" ON "LearningMemory"("userId", "weaknessArea");
CREATE INDEX "LearningMemory_userId_idx" ON "LearningMemory"("userId");
CREATE INDEX "LearningMemory_weaknessType_idx" ON "LearningMemory"("weaknessType");

-- CreateTable: AgentLearning
CREATE TABLE "AgentLearning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "learnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examTypeCode" TEXT,
    "observation" TEXT NOT NULL,
    "insight" TEXT,
    "metricType" TEXT,
    "metricValue" REAL,
    "sampleSize" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AgentLearning_agentId_learnDate_idx" ON "AgentLearning"("agentId", "learnDate");
CREATE INDEX "AgentLearning_agentType_idx" ON "AgentLearning"("agentType");
CREATE INDEX "AgentLearning_examTypeCode_idx" ON "AgentLearning"("examTypeCode");

-- CreateTable: AgentEvolution
CREATE TABLE "AgentEvolution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "changeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggerMetric" TEXT,
    "triggerValue" REAL,
    "previousConfig" TEXT,
    "newConfig" TEXT,
    "approvedBy" TEXT,
    "deployedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AgentEvolution_agentId_version_idx" ON "AgentEvolution"("agentId", "version");
CREATE INDEX "AgentEvolution_isActive_idx" ON "AgentEvolution"("isActive");

-- CreateTable: ExamAnalytics
CREATE TABLE "ExamAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeCode" TEXT NOT NULL,
    "questionId" TEXT,
    "section" TEXT,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "avgScore" REAL NOT NULL DEFAULT 0,
    "avgDurationSec" REAL NOT NULL DEFAULT 0,
    "difficulty" REAL NOT NULL DEFAULT 0.5,
    "discrimination" REAL NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ExamAnalytics_examTypeCode_questionId_key" ON "ExamAnalytics"("examTypeCode", "questionId");
CREATE INDEX "ExamAnalytics_examTypeCode_idx" ON "ExamAnalytics"("examTypeCode");
CREATE INDEX "ExamAnalytics_section_idx" ON "ExamAnalytics"("section");

-- CreateTable: AgentSpecialist
CREATE TABLE "AgentSpecialist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "parentAgentId" TEXT,
    "examTypeCode" TEXT,
    "config" TEXT NOT NULL,
    "performance" REAL NOT NULL DEFAULT 0.5,
    "totalExams" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "AgentSpecialist_specialization_idx" ON "AgentSpecialist"("specialization");
CREATE INDEX "AgentSpecialist_examTypeCode_idx" ON "AgentSpecialist"("examTypeCode");
CREATE INDEX "AgentSpecialist_isActive_idx" ON "AgentSpecialist"("isActive");

-- CreateTable: StudyMaterial
CREATE TABLE "StudyMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "StudyMaterial_category_idx" ON "StudyMaterial"("category");
CREATE INDEX "StudyMaterial_isPublic_isActive_idx" ON "StudyMaterial"("isPublic", "isActive");

-- CreateTable: ChatSession
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "materialId" TEXT,
    "messages" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON "ChatSession"("sessionId");
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");
CREATE INDEX "ChatSession_sessionId_idx" ON "ChatSession"("sessionId");

-- CreateTable: Team
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_status_idx" ON "Team"("status");

-- CreateTable: TeamMember
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX "TeamMember_roleId_idx" ON "TeamMember"("roleId");

-- CreateTable: Role
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Role_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");
CREATE INDEX "Role_teamId_idx" ON "Role"("teamId");
CREATE INDEX "Role_slug_idx" ON "Role"("slug");

-- CreateTable: Permission
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL
);

CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "Permission_category_idx" ON "Permission"("category");
CREATE INDEX "Permission_key_idx" ON "Permission"("key");

-- CreateTable: RolePermission
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    PRIMARY KEY ("roleId", "permissionId"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateTable: Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Session_token_idx" ON "Session"("token");
